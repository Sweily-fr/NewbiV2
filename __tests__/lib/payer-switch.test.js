// @vitest-environment node
//
// Changement de payeur d'un espace suivi par un cabinet (compte
// gestionnaire) : reprise de l'abonnement d'un client par le cabinet
// (directe, tout de suite avec remboursement ou à l'échéance), et retour au
// client. Un seul document `subscription` par espace, qui passe d'un
// abonnement Stripe à l'autre.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";
import { createMemoryMongo } from "../helpers/memory-mongo";

const mockSendEmail = vi.fn(async () => ({ data: { id: "email_1" } }));
vi.mock("@/src/lib/auth-utils", () => ({
  sendEmail: (...args) => mockSendEmail(...args),
}));

const DAY = 86_400;
const nowUnix = () => Math.floor(Date.now() / 1000);

// Stripe simulé avec état : abonnements, sessions Checkout, factures, avoirs
function makeStripe({ savedCard = "pm_card_visa", createStatus = null } = {}) {
  const subs = new Map();
  const sessions = new Map();
  const invoices = [];
  const creditNotes = [];
  let seq = 0;
  const clone = (value) => structuredClone(value);

  const buildSubscription = ({
    id,
    customer,
    items,
    status,
    trialEnd = null,
    metadata = {},
    interval = "month",
    start = nowUnix(),
    end = null,
  }) => ({
    id,
    object: "subscription",
    customer,
    status,
    trial_end: trialEnd,
    cancel_at_period_end: false,
    metadata: { ...metadata },
    items: {
      data: items.map((item) => ({
        price: {
          id: item.price,
          unit_amount: item.unitAmount ?? 4899,
          recurring: { interval },
        },
        quantity: item.quantity ?? 1,
        current_period_start: start,
        current_period_end: end ?? trialEnd ?? start + 30 * DAY,
      })),
    },
    latest_invoice: { hosted_invoice_url: "https://invoice.stripe.com/i/1" },
  });

  const stripe = {
    subs,
    sessions,
    invoiceRows: invoices,
    creditNotes,
    previewTotal: -2500,
    customers: {
      create: vi.fn(async () => ({ id: "cus_cabinet" })),
      retrieve: vi.fn(async (id) => ({
        id,
        invoice_settings: { default_payment_method: savedCard },
      })),
    },
    coupons: {
      retrieve: vi.fn(async (id) => ({ id })),
      create: vi.fn(async (params) => params),
    },
    paymentMethods: { list: vi.fn(async () => ({ data: [] })) },
    subscriptions: {
      create: vi.fn(async (params) => {
        const id = `sub_cabinet_${++seq}`;
        const sub = buildSubscription({
          id,
          customer: params.customer,
          items: params.items,
          status: createStatus || (params.trial_end ? "trialing" : "active"),
          trialEnd: params.trial_end || null,
          metadata: params.metadata,
        });
        subs.set(id, sub);
        return clone(sub);
      }),
      retrieve: vi.fn(async (id) => {
        const sub = subs.get(id);
        if (!sub) {
          throw Object.assign(new Error("No such subscription"), {
            code: "resource_missing",
          });
        }
        return clone(sub);
      }),
      update: vi.fn(async (id, params) => {
        const sub = subs.get(id);
        for (const [key, value] of Object.entries(params.metadata || {})) {
          if (value === "") delete sub.metadata[key];
          else sub.metadata[key] = value;
        }
        if ("cancel_at_period_end" in params) {
          sub.cancel_at_period_end = params.cancel_at_period_end;
        }
        return clone(sub);
      }),
      cancel: vi.fn(async (id) => {
        const sub = subs.get(id);
        sub.status = "canceled";
        return clone(sub);
      }),
      list: vi.fn(async () => ({ data: [] })),
    },
    checkout: {
      sessions: {
        create: vi.fn(async (params) => {
          const id = `cs_test_${++seq}`;
          sessions.set(id, {
            id,
            ...params,
            status: "open",
            url: `https://checkout.stripe.com/c/${id}`,
          });
          return { id, url: `https://checkout.stripe.com/c/${id}` };
        }),
        retrieve: vi.fn(async (id) => {
          const session = sessions.get(id);
          return {
            ...clone(session),
            subscription: session.subscription
              ? clone(subs.get(session.subscription))
              : null,
          };
        }),
        list: vi.fn(async () => ({ data: [] })),
        expire: vi.fn(async (id) => ({ id, status: "expired" })),
      },
    },
    invoices: {
      list: vi.fn(async ({ subscription, status }) => ({
        data: invoices
          .filter(
            (i) =>
              i.subscription === subscription &&
              (!status || i.status === status),
          )
          .sort((a, b) => b.created - a.created),
      })),
      createPreview: vi.fn(async () => ({ total: stripe.previewTotal })),
      voidInvoice: vi.fn(async (id) => {
        const invoice = invoices.find((i) => i.id === id);
        invoice.status = "void";
        return invoice;
      }),
      del: vi.fn(async (id) => ({ id, deleted: true })),
    },
    creditNotes: {
      create: vi.fn(async (params) => {
        const note = { id: `cn_${++seq}`, ...params };
        creditNotes.push(note);
        const invoice = invoices.find((i) => i.id === params.invoice);
        invoice.post_payment_credit_notes_amount =
          (invoice.post_payment_credit_notes_amount || 0) + params.amount;
        return note;
      }),
    },
  };

  // Abonnement existant du client (son propre client Stripe)
  stripe.addClientSubscription = ({
    status = "active",
    interval = "month",
    start = nowUnix() - 10 * DAY,
    end = nowUnix() + 20 * DAY,
    trialEnd = null,
    planName = "pme",
  } = {}) => {
    const sub = buildSubscription({
      id: "sub_client",
      customer: "cus_client",
      items: [{ price: "price_pme_m" }],
      status,
      trialEnd,
      interval,
      start,
      end,
      metadata: { organizationId: String(orgId), planName },
    });
    subs.set(sub.id, sub);
    return sub;
  };

  // Paiement du cabinet sur Stripe Checkout
  stripe.completeCheckout = (sessionId) => {
    const session = sessions.get(sessionId);
    const id = `sub_cabinet_${++seq}`;
    const trialEnd = session.subscription_data?.trial_end || null;
    const sub = buildSubscription({
      id,
      customer: session.customer,
      items: session.line_items,
      status: trialEnd ? "trialing" : "active",
      trialEnd,
      metadata: session.subscription_data.metadata,
    });
    subs.set(id, sub);
    session.status = "complete";
    session.subscription = id;
    return sub;
  };
  return stripe;
}

const {
  takeOverSubscription,
  handBackSubscription,
  finalizeTakeover,
  getCabinetHandBack,
  deferredClientBilling,
  changePayerByAdmin,
  getPayerSwitchPreview,
  handleCabinetSubscriptionEvent,
} = await import("@/src/lib/payer-switch");
const { confirmManagedCheckout } = await import("@/src/lib/manager-billing");

let db;
let manager;
const managerId = new ObjectId();
const managerUserId = new ObjectId();
const ownerId = new ObjectId();
const orgId = new ObjectId();
const linkId = new ObjectId();
const actor = { type: "manager", userId: String(managerUserId) };

const subscriptionDoc = () =>
  db.data.subscription.filter((d) => d.referenceId === String(orgId));
// Traces des abonnements remplacés encore en cours
const archived = (id) =>
  (db.data.subscription || []).find(
    (d) => d.stripeSubscriptionId === id && d.replacedOrganizationId,
  );
const link = () =>
  db.data.managedclients.find((l) => String(l._id) === String(linkId));
const org = () =>
  db.data.organization.find((o) => String(o._id) === String(orgId));

async function seed({
  payer = "client",
  trialEndsInDays = null,
  clientDoc = null,
  stripeCustomerId = "cus_cabinet",
} = {}) {
  // Mêmes index uniques que src/lib/mongodb.js
  db = createMemoryMongo({
    unique: { subscription: ["referenceId", "stripeSubscriptionId"] },
  });
  manager = {
    _id: managerId,
    userId: managerUserId,
    name: "Compta Dupont",
    status: "active",
    discountPercent: 20,
    stripeCustomerId,
  };
  await db.collection("accountmanagers").insertOne({ ...manager });
  await db
    .collection("user")
    .insertOne({ _id: managerUserId, email: "sophie@dupont.fr" });
  await db
    .collection("user")
    .insertOne({ _id: ownerId, email: "paul@boulangerie.fr" });
  await db.collection("organization").insertOne({
    _id: orgId,
    name: "Boulangerie Martin",
    ...(trialEndsInDays
      ? {
          isTrialActive: true,
          trialEndDate: new Date(
            Date.now() + trialEndsInDays * DAY * 1000,
          ).toISOString(),
        }
      : { isTrialActive: false }),
  });
  await db
    .collection("member")
    .insertOne({ organizationId: orgId, userId: ownerId, role: "owner" });
  await db.collection("member").insertOne({
    organizationId: orgId,
    userId: managerUserId,
    role: "accountant",
  });
  await db.collection("managedclients").insertOne({
    _id: linkId,
    managerId,
    organizationId: orgId,
    payer,
    status: "active",
  });
  if (clientDoc) {
    await db.collection("subscription").insertOne({
      referenceId: String(orgId),
      stripeSubscriptionId: "sub_client",
      stripeCustomerId: "cus_client",
      status: clientDoc.status || "active",
      plan: "pme",
      updatedAt: new Date(Date.now() - 1000),
    });
  }
}

beforeEach(() => {
  process.env.ENABLE_APP_TRIAL = "true";
  process.env.STRIPE_PME_MONTHLY_PRICE_ID = "price_pme_m";
  process.env.STRIPE_PME_YEARLY_PRICE_ID = "price_pme_y";
  process.env.STRIPE_FREELANCE_MONTHLY_PRICE_ID = "price_free_m";
  process.env.STRIPE_FREELANCE_YEARLY_PRICE_ID = "price_free_y";
  process.env.STRIPE_ENTREPRISE_MONTHLY_PRICE_ID = "price_ent_m";
  process.env.STRIPE_ENTREPRISE_YEARLY_PRICE_ID = "price_ent_y";
  process.env.STRIPE_SEAT_PRICE_ID = "price_seat";
  mockSendEmail.mockClear();
});

const takeOver = (stripe, over = {}) =>
  takeOverSubscription({
    mongoDb: db,
    stripe,
    manager,
    linkId: String(linkId),
    plan: "pme",
    isAnnual: false,
    baseUrl: "https://www.newbi.fr",
    actor,
    ...over,
  });

describe("reprise par le cabinet", () => {
  it("client en essai : le cabinet paie à la fin de l'essai, l'espace passe sur son abonnement", async () => {
    await seed({ trialEndsInDays: 12 });
    const stripe = makeStripe();
    const result = await takeOver(stripe);

    expect(result).toMatchObject({ status: "active", mode: "trial" });
    const params = stripe.subscriptions.create.mock.calls[0][0];
    expect(params.customer).toBe("cus_cabinet");
    expect(params.discounts).toEqual([{ coupon: "NEWBI_CABINET_20" }]);
    expect(params.trial_end).toBe(
      Math.floor(new Date(org().trialEndDate).getTime() / 1000),
    );
    expect(params.metadata).toMatchObject({
      payerHandover: "from_client",
      convertedFromAppTrial: "true",
      managedClientId: String(linkId),
    });

    const docs = subscriptionDoc();
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      stripeCustomerId: "cus_cabinet",
      status: "trialing",
      plan: "pme",
    });
    expect(link()).toMatchObject({ payer: "manager" });
    expect(link().handover).toBeUndefined();
    expect(link().payerHistory).toHaveLength(1);
    expect(link().payerHistory[0]).toMatchObject({
      from: "client",
      to: "manager",
      mode: "trial",
    });
    // Essai de l'espace converti (accès complet, prélèvement à sa fin)
    expect(org().isTrialActive).toBe(false);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail.mock.calls[0][0]).toMatchObject({
      to: "paul@boulangerie.fr",
      subject: "Compta Dupont prend en charge votre abonnement Newbi",
    });
  });

  it("à l'échéance : abonnement du client non renouvelé, premier prélèvement du cabinet à la fin de sa période", async () => {
    await seed({ clientDoc: { status: "active" } });
    const stripe = makeStripe();
    const clientSub = stripe.addClientSubscription();
    const periodEnd = clientSub.items.data[0].current_period_end;

    const result = await takeOver(stripe, { timing: "renewal" });

    expect(result).toMatchObject({ status: "active", mode: "renewal" });
    expect(new Date(result.effectiveAt).getTime()).toBe(periodEnd * 1000);
    const params = stripe.subscriptions.create.mock.calls[0][0];
    expect(params.trial_end).toBe(periodEnd);
    expect(params.metadata.handoverFrom).toBe("sub_client");

    const client = stripe.subs.get("sub_client");
    expect(client.cancel_at_period_end).toBe(true);
    expect(client.status).toBe("active");
    expect(client.metadata.payerHandover).toBe("to_manager");
    expect(stripe.creditNotes.create).not.toHaveBeenCalled();

    // Un seul document, désormais sur l'abonnement du cabinet
    const docs = subscriptionDoc();
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      stripeSubscriptionId: expect.stringMatching(/^sub_cabinet_/),
      stripeCustomerId: "cus_cabinet",
      status: "trialing",
    });
    expect(link().payer).toBe("manager");
    expect(link().payerChange).toMatchObject({ to: "manager" });
    expect(mockSendEmail.mock.calls[0][0].html).toContain(
      "ne sera pas renouvelé",
    );
    // L'abonnement du client court encore : une trace le suit, hors de l'espace
    expect(archived("sub_client")).toMatchObject({
      referenceId: `replaced:${orgId}:sub_client`,
      replacedOrganizationId: String(orgId),
      stripeCustomerId: "cus_client",
    });
  });

  it("tout de suite : le client est remboursé de la période non utilisée par un avoir Stripe", async () => {
    await seed({ clientDoc: { status: "active" } });
    const stripe = makeStripe();
    stripe.addClientSubscription();
    stripe.invoiceRows.push({
      id: "in_client_1",
      subscription: "sub_client",
      status: "paid",
      amount_paid: 4899,
      created: nowUnix() - 10 * DAY,
    });
    stripe.previewTotal = -3266;

    const result = await takeOver(stripe, { timing: "now" });

    expect(result).toMatchObject({ status: "active", mode: "now" });
    expect(result.refund).toEqual({ amount: 3266, error: false });
    expect(
      stripe.subscriptions.create.mock.calls[0][0].trial_end,
    ).toBeUndefined();
    expect(stripe.subs.get("sub_client").status).toBe("canceled");
    // Le prorata est calculé avant l'arrêt
    expect(stripe.invoices.createPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription: "sub_client",
        subscription_details: expect.objectContaining({ cancel_now: true }),
      }),
    );
    expect(stripe.creditNotes.create).toHaveBeenCalledWith(
      expect.objectContaining({
        invoice: "in_client_1",
        amount: 3266,
        refund_amount: 3266,
        reason: "order_change",
      }),
      { idempotencyKey: "payer-handover-refund-sub_client-in_client_1" },
    );
    expect(link().payerHistory[0]).toMatchObject({
      mode: "now",
      refundAmount: 3266,
    });
    expect(link().payerChange).toBeNull();
    expect(mockSendEmail.mock.calls[0][0].html).toContain("32,66");
  });

  it("tout de suite : jamais plus que ce que le client a payé", async () => {
    await seed({ clientDoc: { status: "active" } });
    const stripe = makeStripe();
    stripe.addClientSubscription();
    stripe.invoiceRows.push({
      id: "in_client_1",
      subscription: "sub_client",
      status: "paid",
      amount_paid: 1000,
      post_payment_credit_notes_amount: 200,
      created: nowUnix() - 10 * DAY,
    });
    stripe.previewTotal = -3000;

    const result = await takeOver(stripe, { timing: "now" });

    expect(result.refund.amount).toBe(800);
    expect(stripe.creditNotes.create.mock.calls[0][0].amount).toBe(800);
  });

  it("offre choisie pendant l'essai (rien de prélevé) : arrêtée, le cabinet paie à la même date", async () => {
    await seed({ clientDoc: { status: "trialing" } });
    const stripe = makeStripe();
    const trialEnd = nowUnix() + 9 * DAY;
    stripe.addClientSubscription({
      status: "trialing",
      trialEnd,
      end: trialEnd,
    });

    const result = await takeOver(stripe);

    expect(result).toMatchObject({ status: "active", mode: "trial" });
    expect(stripe.subscriptions.create.mock.calls[0][0].trial_end).toBe(
      trialEnd,
    );
    expect(stripe.subs.get("sub_client").status).toBe("canceled");
    expect(stripe.subs.get("sub_client").metadata.payerHandover).toBe(
      "to_manager",
    );
    expect(mockSendEmail.mock.calls[0][0].html).toContain("est annulée");
  });

  it("paiement du client en échec : facture en attente annulée, le cabinet paie tout de suite", async () => {
    await seed({ clientDoc: { status: "past_due" } });
    const stripe = makeStripe();
    stripe.addClientSubscription({ status: "past_due" });
    stripe.invoiceRows.push({
      id: "in_open",
      subscription: "sub_client",
      status: "open",
      amount_paid: 0,
      created: nowUnix() - DAY,
    });

    const result = await takeOver(stripe);

    expect(result).toMatchObject({ status: "active", mode: "unpaid" });
    expect(stripe.invoices.voidInvoice).toHaveBeenCalledWith("in_open");
    expect(stripe.subs.get("sub_client").status).toBe("canceled");
  });

  it("période payée en cours : le cabinet doit choisir quand il prend le relais", async () => {
    await seed({ clientDoc: { status: "active" } });
    const stripe = makeStripe();
    stripe.addClientSubscription();
    await expect(takeOver(stripe)).rejects.toMatchObject({ status: 400 });
    expect(stripe.subscriptions.create).not.toHaveBeenCalled();
    expect(link().payer).toBe("client");
  });

  it("utilisateurs au-delà de l'offre : facturés au cabinet (offre mensuelle)", async () => {
    await seed({ trialEndsInDays: 10 });
    for (let i = 0; i < 3; i += 1) {
      await db.collection("member").insertOne({
        organizationId: orgId,
        userId: new ObjectId(),
        role: "member",
      });
    }
    const stripe = makeStripe();
    await takeOver(stripe, { plan: "freelance" });
    expect(stripe.subscriptions.create.mock.calls[0][0].items).toEqual([
      { price: "price_free_m" },
      { price: "price_seat", quantity: 3 },
    ]);
  });

  it("refuse : le cabinet paie déjà, abonnement offert, cabinet retiré de l'espace", async () => {
    await seed({ payer: "manager" });
    await expect(takeOver(makeStripe())).rejects.toMatchObject({ status: 409 });

    await seed();
    await db.collection("subscription").insertOne({
      referenceId: String(orgId),
      status: "active",
      plan: "freelance",
      grantedManually: true,
    });
    await expect(takeOver(makeStripe())).rejects.toMatchObject({ status: 409 });

    await seed({ trialEndsInDays: 5 });
    await db.collection("member").deleteOne({ userId: managerUserId });
    await expect(takeOver(makeStripe())).rejects.toMatchObject({ status: 409 });
  });
});

describe("reprise payée sur Stripe (Checkout, validation bancaire)", () => {
  it("première carte : rien ne change tant que le cabinet n'a pas payé, puis la reprise se termine au retour", async () => {
    await seed({ clientDoc: { status: "active" }, stripeCustomerId: null });
    const stripe = makeStripe({ savedCard: null });
    const clientSub = stripe.addClientSubscription({
      end: nowUnix() + 20 * DAY,
    });

    const result = await takeOver(stripe, { timing: "renewal" });
    expect(result.status).toBe("redirect");
    // Avant le paiement : le client paie toujours, rien n'a bougé
    expect(link()).toMatchObject({
      payer: "client",
      handover: { status: "awaiting_payment" },
    });
    expect(subscriptionDoc()[0].stripeSubscriptionId).toBe("sub_client");
    expect(stripe.subs.get("sub_client").cancel_at_period_end).toBe(false);

    const [sessionId] = [...stripe.sessions.keys()];
    const session = stripe.sessions.get(sessionId);
    expect(session.subscription_data.trial_end).toBe(
      clientSub.items.data[0].current_period_end,
    );
    stripe.completeCheckout(sessionId);
    manager = await db
      .collection("accountmanagers")
      .findOne({ _id: managerId });

    const confirmed = await confirmManagedCheckout({
      mongoDb: db,
      stripe,
      manager,
      sessionId,
    });
    expect(confirmed).toMatchObject({
      status: "active",
      takeover: { mode: "renewal" },
    });
    expect(link().payer).toBe("manager");
    expect(stripe.subs.get("sub_client").cancel_at_period_end).toBe(true);
    expect(subscriptionDoc()).toHaveLength(1);
    expect(subscriptionDoc()[0].stripeCustomerId).toBe("cus_cabinet");

    // Le webhook qui arrive ensuite ne refait rien
    const again = await handleCabinetSubscriptionEvent({
      mongoDb: db,
      stripe,
      subscription: stripe.subs.get(session.subscription),
    });
    expect(again).toMatchObject({ status: "done", alreadyDone: true });
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it("validation bancaire : la reprise se termine quand le webhook voit le paiement passé", async () => {
    await seed({ clientDoc: { status: "active" } });
    const stripe = makeStripe({ createStatus: "incomplete" });
    stripe.addClientSubscription();

    const result = await takeOver(stripe, { timing: "now" });
    expect(result).toEqual({
      status: "redirect",
      url: "https://invoice.stripe.com/i/1",
    });
    expect(link().payer).toBe("client");
    const pendingId = link().handover.toSubscriptionId;
    expect(pendingId).toMatch(/^sub_cabinet_/);
    // Pas d'accès coupé : le document reste sur l'abonnement du client
    expect(subscriptionDoc()[0]).toMatchObject({
      stripeSubscriptionId: "sub_client",
      status: "active",
    });

    stripe.subs.get(pendingId).status = "active";
    const done = await handleCabinetSubscriptionEvent({
      mongoDb: db,
      stripe,
      subscription: stripe.subs.get(pendingId),
    });
    expect(done).toMatchObject({ status: "done", mode: "now" });
    expect(link().payer).toBe("manager");
    expect(stripe.subs.get("sub_client").status).toBe("canceled");
  });

  it("un abonnement payé sans reprise en attente n'est pas rattaché", async () => {
    await seed();
    const stripe = makeStripe();
    const result = await finalizeTakeover({
      mongoDb: db,
      stripe,
      stripeSubscription: {
        id: "sub_x",
        status: "active",
        customer: "cus_cabinet",
        metadata: {
          payerHandover: "from_client",
          managedClientId: String(linkId),
          paidByAccountManagerId: String(managerId),
          referenceId: String(orgId),
        },
        items: { data: [] },
      },
    });
    expect(result.status).toBe("orphan");
    expect(link().payer).toBe("client");
  });
});

describe("retour au client", () => {
  it("période payée par le cabinet : elle va à son terme, le client est prévenu et peut déjà souscrire", async () => {
    await seed({ payer: "manager" });
    const stripe = makeStripe();
    const end = nowUnix() + 15 * DAY;
    stripe.subs.set("sub_cab", {
      id: "sub_cab",
      customer: "cus_cabinet",
      status: "active",
      cancel_at_period_end: false,
      metadata: {},
      items: {
        data: [
          {
            price: { id: "price_pme_m" },
            current_period_start: nowUnix() - 15 * DAY,
            current_period_end: end,
          },
        ],
      },
    });
    await db.collection("subscription").insertOne({
      referenceId: String(orgId),
      stripeSubscriptionId: "sub_cab",
      stripeCustomerId: "cus_cabinet",
      status: "active",
      plan: "pme",
      currentPeriodEnd: new Date(end * 1000),
    });

    const result = await handBackSubscription({
      mongoDb: db,
      stripe,
      manager,
      linkId: String(linkId),
      actor,
    });

    expect(result).toMatchObject({ status: "done", mode: "scheduled" });
    expect(stripe.subs.get("sub_cab")).toMatchObject({
      cancel_at_period_end: true,
      status: "active",
      metadata: { payerHandover: "to_client" },
    });
    expect(subscriptionDoc()[0].cancelAtPeriodEnd).toBe(true);
    expect(link()).toMatchObject({
      payer: "client",
      payerChange: { to: "client" },
    });
    expect(mockSendEmail.mock.calls[0][0].subject).toBe(
      "Compta Dupont ne prendra plus en charge votre abonnement Newbi",
    );

    // Le client peut souscrire, premier prélèvement à la fin de la période
    const handBack = await getCabinetHandBack(db, String(orgId));
    expect(handBack).toMatchObject({
      managerName: "Compta Dupont",
      subscriptionId: "sub_cab",
    });
    expect(handBack.endsAt.getTime()).toBe(end * 1000);
    expect(deferredClientBilling(handBack).getTime()).toBe(end * 1000);

    // Le cabinet change d'avis avant la fin : sa prise en charge continue
    const resumed = await takeOver(stripe);
    expect(resumed).toMatchObject({ status: "active", mode: "resumed" });
    expect(stripe.subs.get("sub_cab").cancel_at_period_end).toBe(false);
    expect(stripe.subscriptions.create).not.toHaveBeenCalled();
    expect(link().payer).toBe("manager");
    expect(await getCabinetHandBack(db, String(orgId))).toBeNull();
  });

  it("reprise à l'échéance pas encore commencée : le client retrouve son abonnement, rien n'est prélevé au cabinet", async () => {
    await seed({ clientDoc: { status: "active" } });
    const stripe = makeStripe();
    stripe.addClientSubscription();
    await takeOver(stripe, { timing: "renewal" });
    const cabinetId = subscriptionDoc()[0].stripeSubscriptionId;
    mockSendEmail.mockClear();

    const result = await handBackSubscription({
      mongoDb: db,
      stripe,
      manager,
      linkId: String(linkId),
      actor,
    });

    expect(result).toMatchObject({ mode: "restored" });
    // La trace du client s'efface, celle du cabinet prend le relais
    expect(archived("sub_client")).toBeUndefined();
    expect(archived(cabinetId)).toMatchObject({
      stripeCustomerId: "cus_cabinet",
    });
    expect(stripe.subs.get("sub_client")).toMatchObject({
      status: "active",
      cancel_at_period_end: false,
    });
    expect(
      stripe.subs.get("sub_client").metadata.payerHandover,
    ).toBeUndefined();
    expect(stripe.subs.get(cabinetId).status).toBe("canceled");
    expect(subscriptionDoc()).toHaveLength(1);
    expect(subscriptionDoc()[0]).toMatchObject({
      stripeSubscriptionId: "sub_client",
      stripeCustomerId: "cus_client",
      status: "active",
      cancelAtPeriodEnd: false,
    });
    expect(link().payer).toBe("client");
    expect(mockSendEmail.mock.calls[0][0].html).toContain("continue");
  });

  it("offre choisie par le cabinet pendant l'essai : arrêtée, le client retrouve son essai", async () => {
    await seed({ trialEndsInDays: 8 });
    const stripe = makeStripe();
    await takeOver(stripe);
    expect(org().isTrialActive).toBe(false);
    const cabinetId = subscriptionDoc()[0].stripeSubscriptionId;

    const result = await handBackSubscription({
      mongoDb: db,
      stripe,
      manager,
      linkId: String(linkId),
      actor,
    });

    expect(result).toMatchObject({ mode: "trial-restored" });
    expect(stripe.subs.get(cabinetId).status).toBe("canceled");
    expect(org().isTrialActive).toBe(true);
    expect(subscriptionDoc()[0].status).toBe("canceled");
    expect(link().payer).toBe("client");
  });

  it("sans abonnement du cabinet : le client choisira son offre, aucun appel à Stripe", async () => {
    await seed({ payer: "manager", trialEndsInDays: 6 });
    const stripe = makeStripe();
    const result = await handBackSubscription({
      mongoDb: db,
      stripe,
      manager,
      linkId: String(linkId),
      actor,
    });
    expect(result).toMatchObject({ mode: "trial-restored" });
    expect(stripe.subscriptions.update).not.toHaveBeenCalled();
    expect(link().payer).toBe("client");
  });

  it("refuse si le client paie déjà lui-même", async () => {
    await seed();
    await expect(
      handBackSubscription({
        mongoDb: db,
        stripe: makeStripe(),
        manager,
        linkId: String(linkId),
        actor,
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
});

describe("équipe Newbi (admin)", () => {
  it("vers le cabinet seulement si le client ne paie rien ; vers le client comme le cabinet", async () => {
    await seed({ clientDoc: { status: "active" } });
    const stripe = makeStripe();
    stripe.addClientSubscription();
    await expect(
      changePayerByAdmin({
        mongoDb: db,
        stripe,
        linkId: String(linkId),
        payer: "manager",
        adminEmail: "admin@newbi.fr",
      }),
    ).rejects.toMatchObject({ status: 409 });

    await seed({ trialEndsInDays: 10 });
    const result = await changePayerByAdmin({
      mongoDb: db,
      stripe: makeStripe(),
      linkId: String(linkId),
      payer: "manager",
      adminEmail: "admin@newbi.fr",
    });
    expect(result.mode).toBe("pending_offer");
    expect(link().payer).toBe("manager");
    expect(link().payerHistory[0].by).toEqual({
      type: "admin",
      email: "admin@newbi.fr",
    });

    const back = await changePayerByAdmin({
      mongoDb: db,
      stripe: makeStripe(),
      linkId: String(linkId),
      payer: "client",
      adminEmail: "admin@newbi.fr",
    });
    expect(back.status).toBe("done");
    expect(link().payer).toBe("client");
  });
});

describe("aperçu pour le cabinet", () => {
  it("période payée : remboursement si tout de suite, échéance à moins de 48 h sans carte", async () => {
    await seed({ clientDoc: { status: "active" }, stripeCustomerId: null });
    const stripe = makeStripe({ savedCard: null });
    stripe.addClientSubscription({ end: nowUnix() + 30 * 3600 });
    stripe.previewTotal = -1500;

    const preview = await getPayerSwitchPreview({
      mongoDb: db,
      stripe,
      manager,
      linkId: String(linkId),
    });

    expect(preview).toMatchObject({
      action: "takeover",
      payer: "client",
      discountPercent: 20,
      hasSavedCard: false,
      client: {
        plan: "pme",
        interval: "month",
        status: "active",
        refundNow: 1500,
        renewalChargesNow: true,
      },
    });
    expect(preview.additionalSeats).toEqual({
      freelance: 0,
      pme: 0,
      entreprise: 0,
    });
  });

  it("le cabinet paie : ce qui se passera s'il arrête", async () => {
    await seed({ payer: "manager", trialEndsInDays: 4 });
    const preview = await getPayerSwitchPreview({
      mongoDb: db,
      stripe: makeStripe(),
      manager,
      linkId: String(linkId),
    });
    expect(preview).toMatchObject({
      action: "handback",
      cabinet: null,
      outcome: "trial-restored",
    });
  });
});
