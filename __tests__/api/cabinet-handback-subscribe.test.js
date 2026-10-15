// @vitest-environment node
//
// Le cabinet a arrêté de payer l'abonnement de son client et sa dernière
// période court encore : le client souscrit tout de suite (Paramètres >
// Abonnement), premier prélèvement à la fin de cette période, sans double
// paiement. Tant que le cabinet paie, le client ne peut pas souscrire.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";
import { createMemoryMongo } from "../helpers/memory-mongo";

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  checkoutCreate: vi.fn(),
  db: null,
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => m.getSession(...args) } },
}));
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: { collection: (name) => m.db.collection(name) },
}));
vi.mock("stripe", () => {
  function Stripe() {
    return {
      customers: { create: vi.fn(async () => ({ id: "cus_new" })) },
      checkout: {
        sessions: { create: (...args) => m.checkoutCreate(...args) },
      },
    };
  }
  return { default: Stripe };
});

const userId = new ObjectId();
const orgId = new ObjectId();
const managerId = new ObjectId();
const DAY_MS = 86_400_000;

async function seed({
  payer = "client",
  cancelAtPeriodEnd = true,
  endsInDays = 12,
} = {}) {
  m.db = createMemoryMongo();
  const periodEnd = new Date(Date.now() + endsInDays * DAY_MS);
  await m.db
    .collection("member")
    .insertOne({ organizationId: orgId, userId, role: "owner" });
  await m.db
    .collection("organization")
    .insertOne({ _id: orgId, name: "Boulangerie Martin" });
  await m.db.collection("accountmanagers").insertOne({
    _id: managerId,
    name: "Compta Dupont",
    status: "active",
    stripeCustomerId: "cus_cabinet",
  });
  await m.db.collection("managedclients").insertOne({
    managerId,
    organizationId: orgId,
    payer,
    status: "active",
  });
  await m.db.collection("subscription").insertOne({
    referenceId: String(orgId),
    stripeSubscriptionId: "sub_cabinet",
    stripeCustomerId: "cus_cabinet",
    status: "active",
    plan: "pme",
    cancelAtPeriodEnd,
    currentPeriodEnd: periodEnd,
    periodEnd,
  });
  return periodEnd;
}

beforeEach(() => {
  vi.stubEnv("ENABLE_APP_TRIAL", "true");
  vi.stubEnv("STRIPE_PME_MONTHLY_PRICE_ID", "price_pme_m");
  vi.stubEnv("STRIPE_PME_YEARLY_PRICE_ID", "price_pme_y");
  m.getSession.mockResolvedValue({
    user: {
      id: String(userId),
      email: "paul@boulangerie.fr",
      stripeCustomerId: "cus_client",
    },
    session: { activeOrganizationId: String(orgId) },
  });
  m.checkoutCreate.mockReset();
  m.checkoutCreate.mockImplementation(async () => ({
    id: "cs_1",
    url: "https://checkout.stripe.com/c/cs_1",
  }));
});

const createOrgSubscription = async () => {
  const { POST } = await import("@/app/api/create-org-subscription/route.js");
  return POST(
    new Request("http://localhost/api/create-org-subscription", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://www.newbi.fr",
      },
      body: JSON.stringify({
        organizationData: {
          type: "existing",
          name: "Existing Organization",
          planName: "pme",
          isAnnual: false,
        },
      }),
    }),
  );
};

const billingSubscribe = async () => {
  const { POST } = await import("@/app/api/billing/subscribe/route");
  return POST({
    headers: new Headers({ origin: "https://www.newbi.fr" }),
    json: async () => ({ plan: "pme", isAnnual: false }),
  });
};

describe("fin de prise en charge par le cabinet : le client souscrit", () => {
  it("Paramètres > Abonnement : premier prélèvement à la fin de la période payée par le cabinet", async () => {
    const periodEnd = await seed();
    const res = await createOrgSubscription();
    expect(res.status).toBe(200);

    const params = m.checkoutCreate.mock.calls[0][0];
    expect(params.customer).toBe("cus_client");
    expect(params.subscription_data.trial_end).toBe(
      Math.floor(periodEnd.getTime() / 1000),
    );
    expect(params.subscription_data.metadata).toMatchObject({
      payerHandover: "from_manager",
      replacesCabinetSubscription: "sub_cabinet",
    });
    expect(params.metadata.payerHandover).toBe("from_manager");
    expect(params.custom_text.submit.message).toContain(
      "votre cabinet paie votre abonnement jusqu'à cette date",
    );
  });

  it("route d'abonnement après essai : même report du premier prélèvement", async () => {
    const periodEnd = await seed();
    const res = await billingSubscribe();
    expect(res.status).toBe(200);
    const params = m.checkoutCreate.mock.calls[0][0];
    expect(params.subscription_data.trial_end).toBe(
      Math.floor(periodEnd.getTime() / 1000),
    );
    expect(params.subscription_data.metadata.payerHandover).toBe(
      "from_manager",
    );
  });

  it("fin de période à moins de 48 h : paiement immédiat (Stripe Checkout refuse une date plus proche)", async () => {
    await seed({ endsInDays: 1 });
    const res = await createOrgSubscription();
    expect(res.status).toBe(200);
    expect(
      m.checkoutCreate.mock.calls[0][0].subscription_data.trial_end,
    ).toBeUndefined();
  });

  it("le cabinet paie encore : le client ne peut pas souscrire", async () => {
    await seed({ payer: "manager", cancelAtPeriodEnd: false });
    expect((await createOrgSubscription()).status).toBe(409);
    expect((await billingSubscribe()).status).toBe(409);
    expect(m.checkoutCreate).not.toHaveBeenCalled();
  });
});
