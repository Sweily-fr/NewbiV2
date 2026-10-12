// @vitest-environment node
//
// Abonnements payés par un cabinet (compte gestionnaire) pour les espaces de
// ses clients : un abonnement Stripe par espace, sur le client Stripe du
// cabinet, avec sa remise, sans prélèvement avant la fin de l'essai.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObjectId } from "mongodb";

// Base simulée : égalité, $in, $ne ; updateOne avec $set
function makeDb() {
  const data = {};
  const same = (a, b) => String(a) === String(b);
  const test = (value, cond) => {
    if (
      cond &&
      typeof cond === "object" &&
      !(cond instanceof ObjectId) &&
      !(cond instanceof Date)
    ) {
      if ("$in" in cond) {
        return cond.$in.some((c) =>
          c === null ? value === null || value === undefined : same(c, value),
        );
      }
      if ("$ne" in cond) return !same(value, cond.$ne);
    }
    return same(value, cond);
  };
  const matches = (doc, filter = {}) =>
    Object.entries(filter).every(([key, cond]) => test(doc[key], cond));
  const collection = (name) => {
    data[name] ||= [];
    const rows = data[name];
    return {
      async findOne(filter) {
        return rows.find((d) => matches(d, filter)) || null;
      },
      async insertOne(doc) {
        const row = { _id: doc._id || new ObjectId(), ...doc };
        rows.push(row);
        return { insertedId: row._id };
      },
      async updateOne(filter, update) {
        const row = rows.find((d) => matches(d, filter));
        if (!row) return { matchedCount: 0, modifiedCount: 0 };
        Object.assign(row, update.$set);
        return { matchedCount: 1, modifiedCount: 1 };
      },
      find(filter) {
        const result = rows.filter((d) => matches(d, filter));
        return { toArray: async () => result };
      },
    };
  };
  return { collection, data };
}

// Stripe simulé : enregistre les appels, renvoie des objets plausibles
function makeStripe({
  savedCard = null,
  subscriptionStatus = "trialing",
} = {}) {
  const coupons = new Set();
  const calls = {};
  const record = (name, args) => {
    calls[name] ||= [];
    calls[name].push(args);
  };
  const stripe = {
    calls,
    customers: {
      create: vi.fn(async (params, options) => {
        record("customers.create", [params, options]);
        return { id: "cus_cabinet" };
      }),
      retrieve: vi.fn(async () => ({
        id: "cus_cabinet",
        invoice_settings: { default_payment_method: savedCard },
      })),
    },
    coupons: {
      retrieve: vi.fn(async (id) => {
        if (!coupons.has(id)) {
          throw Object.assign(new Error("No such coupon"), {
            code: "resource_missing",
          });
        }
        return { id };
      }),
      create: vi.fn(async (params) => {
        coupons.add(params.id);
        return params;
      }),
    },
    paymentMethods: {
      list: vi.fn(async () => ({ data: [] })),
    },
    subscriptions: {
      create: vi.fn(async (params) => ({
        id: "sub_1",
        customer: params.customer,
        status: subscriptionStatus,
        metadata: params.metadata,
        trial_end: params.trial_end || null,
        cancel_at_period_end: false,
        items: {
          data: [
            {
              price: {
                id: params.items[0].price,
                recurring: { interval: "month" },
              },
              current_period_start: 1_800_000_000,
              current_period_end: 1_802_600_000,
            },
          ],
        },
        latest_invoice: {
          hosted_invoice_url: "https://invoice.stripe.com/i/1",
        },
      })),
      list: vi.fn(async () => ({ data: [] })),
      retrieve: vi.fn(),
    },
    checkout: {
      sessions: {
        create: vi.fn(async () => ({ url: "https://checkout.stripe.com/c/1" })),
        retrieve: vi.fn(),
      },
    },
    invoices: { list: vi.fn(async () => ({ data: [] })) },
  };
  return stripe;
}

const {
  startManagedSubscription,
  confirmManagedCheckout,
  getManagerBillingSummary,
  findManagerPaidSubscription,
  withoutManagerCustomers,
} = await import("@/src/lib/manager-billing");

let db;
const managerUserId = new ObjectId();
const managerId = new ObjectId();
const orgId = new ObjectId();
const linkId = new ObjectId();
const trialEnd = new Date(Date.now() + 20 * 86_400_000);
let manager;

const start = (stripe, over = {}) =>
  startManagedSubscription({
    mongoDb: db,
    stripe,
    manager,
    linkId: String(linkId),
    plan: "pme",
    isAnnual: false,
    baseUrl: "https://www.newbi.fr/",
    ...over,
  });

beforeEach(async () => {
  process.env.ENABLE_APP_TRIAL = "true";
  process.env.STRIPE_PME_MONTHLY_PRICE_ID = "price_pme_m";
  process.env.STRIPE_PME_YEARLY_PRICE_ID = "price_pme_y";
  db = makeDb();
  manager = {
    _id: managerId,
    userId: managerUserId,
    name: "Compta Dupont",
    status: "active",
    discountPercent: 20,
  };
  await db.collection("accountmanagers").insertOne({ ...manager });
  await db
    .collection("user")
    .insertOne({ _id: managerUserId, email: "sophie@dupont.fr" });
  await db.collection("organization").insertOne({
    _id: orgId,
    name: "Boulangerie Martin",
    isTrialActive: true,
    trialEndDate: trialEnd.toISOString(),
  });
  await db.collection("managedclients").insertOne({
    _id: linkId,
    managerId,
    organizationId: orgId,
    status: "active",
    payer: "manager",
  });
});

afterEach(() => {
  delete process.env.ENABLE_APP_TRIAL;
});

describe("startManagedSubscription", () => {
  it("première fois : client Stripe du cabinet, coupon de remise, Checkout sans prélèvement avant la fin de l'essai", async () => {
    const stripe = makeStripe();
    const result = await start(stripe);
    expect(result).toEqual({
      status: "redirect",
      url: "https://checkout.stripe.com/c/1",
    });

    // Client Stripe propre au cabinet, enregistré une fois
    const [customer, options] = stripe.calls["customers.create"][0];
    expect(customer).toMatchObject({
      name: "Compta Dupont",
      email: "sophie@dupont.fr",
      metadata: { accountManagerId: String(managerId) },
    });
    expect(options.idempotencyKey).toContain(String(managerId));
    expect(db.data.accountmanagers[0].stripeCustomerId).toBe("cus_cabinet");

    expect(stripe.coupons.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "NEWBI_CABINET_20",
        percent_off: 20,
        duration: "forever",
      }),
    );

    const session = stripe.checkout.sessions.create.mock.calls[0][0];
    expect(session).toMatchObject({
      customer: "cus_cabinet",
      mode: "subscription",
      line_items: [{ price: "price_pme_m", quantity: 1 }],
      discounts: [{ coupon: "NEWBI_CABINET_20" }],
      success_url:
        "https://www.newbi.fr/dashboard/gestionnaire?abonnement={CHECKOUT_SESSION_ID}",
    });
    expect(session.subscription_data.trial_end).toBe(
      Math.floor(trialEnd.getTime() / 1000),
    );
    expect(session.subscription_data.metadata).toMatchObject({
      referenceId: String(orgId),
      planName: "pme",
      paidByAccountManagerId: String(managerId),
      discountPercent: "20",
      convertedFromAppTrial: "true",
    });
    // Rien n'est écrit avant le retour de Stripe
    expect(db.data.subscription || []).toHaveLength(0);
  });

  it("carte enregistrée : abonnement créé directement, visible tout de suite, essai Newbi converti", async () => {
    manager.stripeCustomerId = "cus_cabinet";
    const stripe = makeStripe({ savedCard: "pm_card" });
    expect(await start(stripe, { isAnnual: true })).toEqual({
      status: "active",
    });

    const params = stripe.subscriptions.create.mock.calls[0][0];
    expect(params).toMatchObject({
      customer: "cus_cabinet",
      items: [{ price: "price_pme_y" }],
      default_payment_method: "pm_card",
      discounts: [{ coupon: "NEWBI_CABINET_20" }],
      trial_end: Math.floor(trialEnd.getTime() / 1000),
    });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
    expect(stripe.customers.create).not.toHaveBeenCalled();

    const [sub] = db.data.subscription;
    expect(sub).toMatchObject({
      referenceId: String(orgId),
      plan: "pme",
      status: "trialing",
      stripeCustomerId: "cus_cabinet",
      stripeSubscriptionId: "sub_1",
    });
    expect(String(sub.paidByAccountManagerId)).toBe(String(managerId));
    expect(db.data.organization[0]).toMatchObject({
      isTrialActive: false,
      hasUsedTrial: true,
    });
  });

  it("validation demandée par la banque : renvoie la page de facture Stripe", async () => {
    manager.stripeCustomerId = "cus_cabinet";
    db.data.organization[0].isTrialActive = false;
    const stripe = makeStripe({
      savedCard: "pm_card",
      subscriptionStatus: "incomplete",
    });
    expect(await start(stripe)).toEqual({
      status: "redirect",
      url: "https://invoice.stripe.com/i/1",
    });
    // Essai terminé : pas de trial_end, prélèvement immédiat
    expect(
      stripe.subscriptions.create.mock.calls[0][0].trial_end,
    ).toBeUndefined();
  });

  it("sans remise : aucun coupon", async () => {
    manager.discountPercent = 0;
    const stripe = makeStripe();
    await start(stripe);
    expect(stripe.coupons.create).not.toHaveBeenCalled();
    expect(
      stripe.checkout.sessions.create.mock.calls[0][0].discounts,
    ).toBeUndefined();
  });

  it("refuse une offre inconnue, un client qui paie lui-même, le client d'un autre cabinet et un espace déjà abonné", async () => {
    const stripe = makeStripe();
    await expect(start(stripe, { plan: "gratuit" })).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      start(stripe, { manager: { ...manager, _id: new ObjectId() } }),
    ).rejects.toMatchObject({ status: 404 });

    db.data.managedclients[0].payer = "client";
    await expect(start(stripe)).rejects.toMatchObject({ status: 409 });
    db.data.managedclients[0].payer = "manager";

    await db.collection("subscription").insertOne({
      referenceId: String(orgId),
      status: "active",
    });
    await expect(start(stripe)).rejects.toMatchObject({ status: 409 });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
    expect(stripe.subscriptions.create).not.toHaveBeenCalled();
  });
});

describe("confirmManagedCheckout", () => {
  const session = (over = {}) => ({
    status: "complete",
    customer: "cus_cabinet",
    metadata: {
      paidByAccountManagerId: String(managerId),
      referenceId: String(orgId),
      planName: "freelance",
    },
    subscription: {
      id: "sub_2",
      customer: "cus_cabinet",
      status: "trialing",
      metadata: {
        referenceId: String(orgId),
        planName: "freelance",
        paidByAccountManagerId: String(managerId),
      },
      items: { data: [{ price: { recurring: { interval: "month" } } }] },
    },
    ...over,
  });

  it("enregistre l'abonnement au retour de Stripe", async () => {
    manager.stripeCustomerId = "cus_cabinet";
    const stripe = makeStripe();
    stripe.checkout.sessions.retrieve.mockResolvedValue(session());
    const result = await confirmManagedCheckout({
      mongoDb: db,
      stripe,
      manager,
      sessionId: "cs_test_123",
    });
    expect(result).toEqual({ status: "active", organizationId: String(orgId) });
    expect(db.data.subscription[0]).toMatchObject({
      plan: "freelance",
      stripeSubscriptionId: "sub_2",
    });
  });

  it("refuse la session d'un autre cabinet ou un identifiant invalide", async () => {
    manager.stripeCustomerId = "cus_cabinet";
    const stripe = makeStripe();
    stripe.checkout.sessions.retrieve.mockResolvedValue(
      session({ customer: "cus_autre" }),
    );
    await expect(
      confirmManagedCheckout({
        mongoDb: db,
        stripe,
        manager,
        sessionId: "cs_test_123",
      }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      confirmManagedCheckout({
        mongoDb: db,
        stripe,
        manager,
        sessionId: { $ne: null },
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(db.data.subscription || []).toHaveLength(0);
  });
});

describe("getManagerBillingSummary", () => {
  it("total mensuel remisé, annuel ramené au mois, essais à part, offres à choisir", async () => {
    manager.stripeCustomerId = "cus_cabinet";
    const otherOrg = new ObjectId();
    await db
      .collection("organization")
      .insertOne({ _id: otherOrg, name: "Garage Leroy" });
    await db.collection("managedclients").insertOne({
      managerId,
      organizationId: otherOrg,
      status: "active",
      payer: "manager",
    });
    const thirdOrg = new ObjectId();
    await db
      .collection("organization")
      .insertOne({ _id: thirdOrg, name: "SCI Martin" });
    await db.collection("managedclients").insertOne({
      managerId,
      organizationId: thirdOrg,
      status: "active",
      payer: "manager",
    });

    const stripe = makeStripe();
    const sub = (referenceId, status, amount, interval) => ({
      id: `sub_${referenceId}`,
      status,
      metadata: {
        referenceId: String(referenceId),
        planName: "pme",
        discountPercent: "20",
      },
      items: {
        data: [
          {
            price: { unit_amount: amount, recurring: { interval } },
            current_period_end: 1_802_600_000,
          },
        ],
      },
      trial_end: 1_801_000_000,
    });
    stripe.subscriptions.list.mockResolvedValue({
      data: [
        sub(otherOrg, "active", 4899, "month"),
        sub(thirdOrg, "active", 52908, "year"),
        sub(orgId, "trialing", 4899, "month"),
        { ...sub(new ObjectId(), "canceled", 4899, "month") },
      ],
    });

    const summary = await getManagerBillingSummary({
      mongoDb: db,
      stripe,
      manager,
    });
    // 48,99 − 20 % = 39,19 ; 529,08 − 20 % = 423,26 / an = 35,27 / mois
    expect(summary.monthlyTotal).toBe(3919 + 3527);
    expect(summary.upcomingMonthlyTotal).toBe(3919);
    expect(summary.subscriptions).toHaveLength(3);
    expect(summary.subscriptions.map((s) => s.name)).toEqual([
      "Boulangerie Martin",
      "Garage Leroy",
      "SCI Martin",
    ]);
    expect(summary.toChoose).toEqual([]);
    expect(summary.discountPercent).toBe(20);

    stripe.subscriptions.list.mockResolvedValue({ data: [] });
    const empty = await getManagerBillingSummary({
      mongoDb: db,
      stripe,
      manager,
    });
    expect(empty.toChoose.map((t) => t.name).sort()).toEqual([
      "Boulangerie Martin",
      "Garage Leroy",
      "SCI Martin",
    ]);
    expect(empty.monthlyTotal).toBe(0);
  });

  it("sans client Stripe : rien à facturer, pas d'appel à Stripe", async () => {
    const stripe = makeStripe();
    const summary = await getManagerBillingSummary({
      mongoDb: db,
      stripe,
      manager,
    });
    expect(summary).toMatchObject({ hasCustomer: false, monthlyTotal: 0 });
    expect(summary.toChoose).toHaveLength(1);
    expect(stripe.subscriptions.list).not.toHaveBeenCalled();
  });
});

describe("protections côté client", () => {
  it("reconnaît l'abonnement payé par un cabinet et retire son client Stripe des listes", async () => {
    db.data.accountmanagers[0].stripeCustomerId = "cus_cabinet";
    await db.collection("subscription").insertOne({
      referenceId: String(orgId),
      status: "trialing",
      stripeCustomerId: "cus_cabinet",
    });
    const paid = await findManagerPaidSubscription(db, String(orgId));
    expect(paid.manager.name).toBe("Compta Dupont");
    expect(await findManagerPaidSubscription(db, String(new ObjectId()))).toBe(
      null,
    );
    expect(await findManagerPaidSubscription(db, { $ne: null })).toBe(null);

    expect(
      await withoutManagerCustomers(db, ["cus_client", "cus_cabinet"]),
    ).toEqual(["cus_client"]);
  });
});
