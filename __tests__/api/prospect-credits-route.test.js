// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * Achat de crédits de prospection à l'unité : prix lu chez Stripe, de 25 à
 * 1 000 crédits, réservé à l'offre Entreprise payée et à qui gère la
 * facturation ; au retour de Checkout, un paiement n'ajoute ses crédits
 * qu'une seule fois.
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  memberFindOne: vi.fn(),
  subscriptions: [],
  purchaseUpdateOne: vi.fn(),
  priceRetrieve: vi.fn(),
  sessionCreate: vi.fn(),
  sessionRetrieve: vi.fn(),
  customerIds: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => m.getSession(...args) } },
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "member") return { findOne: m.memberFindOne };
      if (name === "organizationRole") {
        return { find: () => ({ toArray: async () => [] }) };
      }
      if (name === "subscription") {
        return { find: () => ({ toArray: async () => m.subscriptions }) };
      }
      if (name === "prospect_credit_purchases") {
        return { updateOne: m.purchaseUpdateOne };
      }
      return {
        findOne: async () => null,
        updateOne: async () => ({}),
        find: () => ({ toArray: async () => [] }),
      };
    },
  },
}));

vi.mock("@/src/lib/security/org-stripe-customer", () => ({
  getOrgStripeCustomerIds: (...args) => m.customerIds(...args),
}));

vi.mock("stripe", () => ({
  default: function Stripe() {
    return {
      prices: { retrieve: m.priceRetrieve },
      checkout: {
        sessions: { create: m.sessionCreate, retrieve: m.sessionRetrieve },
      },
      customers: { create: vi.fn() },
    };
  },
}));

const userId = "507f1f77bcf86cd799439011";
const orgId = "507f1f77bcf86cd799439022";
const autreOrgId = "507f1f77bcf86cd799439033";

function connecte(role = "owner") {
  m.getSession.mockResolvedValue({
    user: { id: userId, email: "u@x.fr", name: "U" },
    session: { activeOrganizationId: orgId },
  });
  // Membre de son espace seulement
  m.memberFindOne.mockImplementation(async (filtre) =>
    JSON.stringify(filtre).includes(orgId)
      ? {
          userId: new ObjectId(userId),
          organizationId: new ObjectId(orgId),
          role,
        }
      : null,
  );
}

const offre = (plan, status = "active", extra = {}) => {
  m.subscriptions = [{ plan, status, ...extra }];
};

const appel = async (methode, chemin, { body, query = "" } = {}) => {
  const mod =
    chemin === "/confirm"
      ? await import("@/app/api/billing/prospect-credits/confirm/route")
      : await import("@/app/api/billing/prospect-credits/route");
  return mod[methode](
    new Request(`http://localhost/api/billing/prospect-credits${chemin}${query}`, {
      method: methode,
      ...(body !== undefined && {
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    }),
  );
};

const lire = () => appel("GET", "", { query: `?organizationId=${orgId}` });
const acheter = (credits) =>
  appel("POST", "", { body: { organizationId: orgId, credits } });
const confirmer = (sessionId) =>
  appel("POST", "/confirm", { body: { sessionId } });

const paiement = (extra = {}) => ({
  id: "cs_test_abc123",
  mode: "payment",
  payment_status: "paid",
  amount_total: 750,
  currency: "eur",
  payment_intent: "pi_test_1",
  metadata: {
    purpose: "prospect_credits",
    organizationId: orgId,
    credits: "25",
    userId,
  },
  ...extra,
});

beforeEach(() => {
  // Module neuf à chaque test : le prix d'un crédit est gardé 10 minutes
  vi.resetModules();
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
  vi.stubEnv("STRIPE_PROSPECT_CREDIT_PRICE_ID", "price_credit");
  m.priceRetrieve.mockResolvedValue({
    active: true,
    type: "one_time",
    unit_amount: 30,
    currency: "eur",
    tax_behavior: "inclusive",
  });
  m.sessionCreate.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_test_abc123" });
  m.customerIds.mockResolvedValue(["cus_espace"]);
  m.purchaseUpdateOne.mockResolvedValue({ upsertedCount: 1 });
  connecte();
  offre("entreprise");
});

afterEach(() => vi.unstubAllEnvs());

describe("GET /api/billing/prospect-credits", () => {
  it("donne le prix d'un crédit et les bornes de 25 à 1 000 crédits", async () => {
    const res = await lire();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      available: true,
      unitAmount: 30,
      currency: "eur",
      min: 25,
      max: 1000,
      planAllowsPurchase: true,
      canManageBilling: true,
    });
  });

  it("achat fermé en Premium et pendant l'essai, ouvert en Entreprise résiliée encore payée", async () => {
    offre("pme");
    expect((await (await lire()).json()).planAllowsPurchase).toBe(false);
    offre("entreprise", "trialing");
    expect((await (await lire()).json()).planAllowsPurchase).toBe(false);
    offre("entreprise", "canceled", {
      periodEnd: new Date(Date.now() + 86_400_000),
    });
    expect((await (await lire()).json()).planAllowsPurchase).toBe(true);
  });

  it("sans prix Stripe configuré, l'achat n'est pas proposé", async () => {
    vi.stubEnv("STRIPE_PROSPECT_CREDIT_PRICE_ID", "");
    expect((await (await lire()).json()).available).toBe(false);
  });

  it("un administrateur voit l'offre mais ne peut pas payer", async () => {
    connecte("admin");
    expect((await (await lire()).json()).canManageBilling).toBe(false);
  });
});

describe("POST /api/billing/prospect-credits", () => {
  it("crée un paiement unique de N crédits au prix d'un crédit, rattaché à l'espace", async () => {
    const res = await acheter(25);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      url: "https://checkout.stripe.com/c/pay/cs_test_abc123",
    });
    const params = m.sessionCreate.mock.calls[0][0];
    expect(params).toMatchObject({
      customer: "cus_espace",
      mode: "payment",
      line_items: [{ price: "price_credit", quantity: 25 }],
      metadata: {
        purpose: "prospect_credits",
        organizationId: orgId,
        credits: "25",
        userId,
      },
    });
    expect(params.success_url).toContain("session_id={CHECKOUT_SESSION_ID}");
  });

  it.each([24, 1001, 25.5, "abc", null])(
    "refuse %s crédit(s) : de 25 à 1 000, nombre entier",
    async (credits) => {
      expect((await acheter(credits)).status).toBe(400);
      expect(m.sessionCreate).not.toHaveBeenCalled();
    },
  );

  it("refuse l'achat hors offre Entreprise payée", async () => {
    offre("pme");
    expect((await acheter(25)).status).toBe(409);
    offre("entreprise", "trialing");
    expect((await acheter(25)).status).toBe(409);
    expect(m.sessionCreate).not.toHaveBeenCalled();
  });

  it("refuse qui ne gère pas la facturation", async () => {
    connecte("admin");
    expect((await acheter(25)).status).toBe(403);
    expect(m.sessionCreate).not.toHaveBeenCalled();
  });

  it("sans prix Stripe configuré : indisponible, aucun paiement créé", async () => {
    vi.stubEnv("STRIPE_PROSPECT_CREDIT_PRICE_ID", "");
    expect((await acheter(25)).status).toBe(503);
    expect(m.sessionCreate).not.toHaveBeenCalled();
  });
});

describe("POST /api/billing/prospect-credits/confirm", () => {
  it("ajoute les crédits d'un paiement réussi, une seule fois par paiement", async () => {
    m.sessionRetrieve.mockResolvedValue(paiement());
    m.purchaseUpdateOne
      .mockResolvedValueOnce({ upsertedCount: 1 })
      .mockResolvedValueOnce({ upsertedCount: 0 });

    for (let i = 0; i < 2; i += 1) {
      const res = await confirmer("cs_test_abc123");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ paid: true, credits: 25 });
    }
    // Clé = la session de paiement, écrite seulement à la création :
    // un second passage (webhook, rechargement) ne rajoute rien
    for (const [filtre, maj, options] of m.purchaseUpdateOne.mock.calls) {
      expect(filtre).toEqual({ stripeCheckoutSessionId: "cs_test_abc123" });
      expect(Object.keys(maj)).toEqual(["$setOnInsert"]);
      expect(maj.$setOnInsert).toMatchObject({
        credits: 25,
        amountTotal: 750,
        status: "paid",
        stripePaymentIntentId: "pi_test_1",
      });
      expect(String(maj.$setOnInsert.workspaceId)).toBe(orgId);
      expect(options).toEqual({ upsert: true });
    }
  });

  it("refuse un identifiant de paiement mal formé sans interroger Stripe", async () => {
    expect((await confirmer("abc")).status).toBe(400);
    expect(m.sessionRetrieve).not.toHaveBeenCalled();
  });

  it("ignore un paiement qui n'est pas un achat de crédits", async () => {
    m.sessionRetrieve.mockResolvedValue(
      paiement({ metadata: { purpose: "subscription", organizationId: orgId } }),
    );
    expect((await confirmer("cs_test_abc123")).status).toBe(404);
    expect(m.purchaseUpdateOne).not.toHaveBeenCalled();
  });

  it("refuse le paiement d'un autre espace", async () => {
    m.sessionRetrieve.mockResolvedValue(
      paiement({
        metadata: {
          purpose: "prospect_credits",
          organizationId: autreOrgId,
          credits: "1000",
          userId,
        },
      }),
    );
    const res = await confirmer("cs_test_abc123");
    expect(res.status).toBeGreaterThanOrEqual(403);
    expect(res.status).toBeLessThanOrEqual(404);
    expect(m.purchaseUpdateOne).not.toHaveBeenCalled();
  });

  it("paiement pas encore réglé : rien n'est ajouté", async () => {
    m.sessionRetrieve.mockResolvedValue(paiement({ payment_status: "unpaid" }));
    expect(await (await confirmer("cs_test_abc123")).json()).toEqual({
      paid: false,
      credits: 0,
    });
    expect(m.purchaseUpdateOne).not.toHaveBeenCalled();
  });
});
