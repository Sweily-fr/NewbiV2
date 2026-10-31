// @vitest-environment node
//
// Un seul abonnement en cours par espace. Un paiement Stripe Checkout crée
// toujours un nouvel abonnement Stripe : sur un espace qui en a déjà un en
// cours (actif, essai, paiement en retard ou impayé), les deux routes de
// souscription d'un espace existant refusent (409) sans créer de Checkout.
// Un abonnement résilié ou dont le premier paiement n'a pas abouti laisse
// souscrire. Un seul Checkout reste ouvert par espace.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";
import { createMemoryMongo } from "../helpers/memory-mongo";

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  checkoutCreate: vi.fn(),
  checkoutList: vi.fn(),
  checkoutExpire: vi.fn(),
  subscriptionsList: vi.fn(),
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
      subscriptions: { list: (...args) => m.subscriptionsList(...args) },
      checkout: {
        sessions: {
          create: (...args) => m.checkoutCreate(...args),
          list: (...args) => m.checkoutList(...args),
          expire: (...args) => m.checkoutExpire(...args),
        },
      },
    };
  }
  return { default: Stripe };
});

const userId = new ObjectId();
const orgId = new ObjectId();
const otherOrgId = new ObjectId();

async function seed({ status } = {}) {
  m.db = createMemoryMongo();
  await m.db
    .collection("member")
    .insertOne({ organizationId: orgId, userId, role: "owner" });
  await m.db
    .collection("organization")
    .insertOne({ _id: orgId, name: "Boulangerie Martin", hasUsedTrial: true });
  if (status) {
    await m.db.collection("subscription").insertOne({
      referenceId: String(orgId),
      stripeSubscriptionId: "sub_actuel",
      stripeCustomerId: "cus_client",
      status,
      plan: "pme",
      periodEnd: new Date(Date.now() + 10 * 86_400_000),
    });
  }
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
    id: "cs_nouveau",
    url: "https://checkout.stripe.com/c/cs_nouveau",
  }));
  m.checkoutList.mockReset();
  m.checkoutList.mockResolvedValue({ data: [] });
  m.checkoutExpire.mockReset();
  m.checkoutExpire.mockResolvedValue({});
  m.subscriptionsList.mockReset();
  m.subscriptionsList.mockResolvedValue({ data: [] });
});

const createOrgSubscription = async (type = "existing") => {
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
          type,
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

const ROUTES = [
  ["create-org-subscription", () => createOrgSubscription()],
  ["billing/subscribe", () => billingSubscribe()],
];

describe.each(ROUTES)("%s sur un espace existant", (_name, subscribe) => {
  it.each(["active", "trialing", "past_due", "unpaid"])(
    "abonnement %s en cours : refus sans Checkout",
    async (status) => {
      await seed({ status });
      const res = await subscribe();
      expect(res.status).toBe(409);
      expect(m.checkoutCreate).not.toHaveBeenCalled();
    },
  );

  it("paiement en retard : le message renvoie vers le moyen de paiement", async () => {
    await seed({ status: "past_due" });
    const body = await (await subscribe()).json();
    expect(body.error).toMatch(/moyen de paiement/);
    expect(body.error).not.toContain(String.fromCharCode(0x2014));
  });

  it.each(["canceled", "incomplete", "incomplete_expired", undefined])(
    "abonnement %s : souscription possible",
    async (status) => {
      await seed({ status });
      const res = await subscribe();
      expect(res.status).toBe(200);
      expect(m.checkoutCreate).toHaveBeenCalledTimes(1);
    },
  );

  it("paiement déjà fait chez Stripe, webhook pas encore reçu : refus", async () => {
    await seed();
    m.subscriptionsList.mockResolvedValue({
      data: [
        {
          id: "sub_tout_juste_paye",
          status: "active",
          metadata: {
            organizationId: String(orgId),
            isNewOrganization: "false",
          },
        },
      ],
    });
    const res = await subscribe();
    expect(res.status).toBe(409);
    expect(m.checkoutCreate).not.toHaveBeenCalled();
  });

  it("abonnement Stripe d'un autre espace du même payeur : souscription possible", async () => {
    await seed();
    m.subscriptionsList.mockResolvedValue({
      data: [
        {
          id: "sub_autre_espace",
          status: "active",
          metadata: {
            organizationId: String(otherOrgId),
            referenceId: String(otherOrgId),
          },
        },
        {
          // Nouvel espace créé depuis cet espace actif, pas encore rattaché
          id: "sub_nouvel_espace",
          status: "active",
          metadata: {
            organizationId: String(orgId),
            isNewOrganization: "true",
          },
        },
      ],
    });
    const res = await subscribe();
    expect(res.status).toBe(200);
  });

  it("ferme les Checkout encore ouverts de cet espace seulement", async () => {
    await seed();
    m.checkoutList.mockResolvedValue({
      data: [
        {
          id: "cs_autre_onglet",
          metadata: {
            organizationId: String(orgId),
            isNewOrganization: "false",
          },
        },
        {
          id: "cs_autre_espace",
          metadata: {
            organizationId: String(otherOrgId),
            isNewOrganization: "false",
          },
        },
        {
          id: "cs_creation_espace",
          metadata: {
            organizationId: String(orgId),
            isNewOrganization: "true",
          },
        },
      ],
    });
    const res = await subscribe();
    expect(res.status).toBe(200);
    expect(m.checkoutExpire).toHaveBeenCalledTimes(1);
    expect(m.checkoutExpire).toHaveBeenCalledWith("cs_autre_onglet");
  });

  it("Stripe indisponible pour la relecture : le contrôle de l'espace suffit", async () => {
    await seed();
    m.subscriptionsList.mockRejectedValue(new Error("Stripe indisponible"));
    m.checkoutList.mockRejectedValue(new Error("Stripe indisponible"));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await subscribe();
    expect(res.status).toBe(200);
  });
});

describe("création d'un nouvel espace", () => {
  it("l'abonnement de l'espace actif n'empêche pas d'en créer un autre", async () => {
    await seed({ status: "active" });
    const res = await createOrgSubscription("new");
    expect(res.status).toBe(200);
    expect(m.checkoutCreate).toHaveBeenCalledTimes(1);
    expect(m.checkoutExpire).not.toHaveBeenCalled();
  });
});
