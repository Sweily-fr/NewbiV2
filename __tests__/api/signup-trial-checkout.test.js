// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * Inscription avec carte (décision du 18/11/2026) : le paiement d'inscription
 * ouvre un essai Stripe de 7 jours, même sous ENABLE_APP_TRIAL (qui ne sert
 * plus qu'aux essais sans carte déjà en cours). Un espace supplémentaire
 * reste payé immédiatement. Un inscrit n'obtient qu'un seul abonnement.
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  checkoutCreate: vi.fn(),
  checkoutList: vi.fn(),
  checkoutExpire: vi.fn(),
  subscriptionsList: vi.fn(),
  db: null,
}));

vi.mock("@/src/lib/auth", () => ({
  auth: {
    api: { getSession: (...args) => m.getSession(...args) },
    options: { database: {} },
  },
}));

vi.mock("stripe", () => {
  function Stripe() {
    return {
      customers: { create: vi.fn(async () => ({ id: "cus_new" })) },
      checkout: {
        sessions: {
          create: (...args) => m.checkoutCreate(...args),
          list: (...args) => m.checkoutList(...args),
          expire: (...args) => m.checkoutExpire(...args),
        },
      },
      subscriptions: { list: (...args) => m.subscriptionsList(...args) },
    };
  }
  return { default: Stripe };
});

vi.mock("@/src/lib/feature-flags", () => ({ isAppTrialEnabled: () => true }));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: { collection: (name) => m.db.collection(name) },
}));

const same = (a, b) => String(a) === String(b);
function matches(doc, filter) {
  return Object.entries(filter).every(([key, cond]) => {
    if (key === "$or") return cond.some((f) => matches(doc, f));
    const value = doc[key];
    if (cond && typeof cond === "object" && !(cond instanceof ObjectId)) {
      if ("$in" in cond) return cond.$in.some((c) => same(value, c));
    }
    return same(value, cond);
  });
}
function fakeDb(data) {
  return {
    collection: (name) => {
      const docs = (data[name] ||= []);
      return {
        findOne: async (filter) => docs.find((d) => matches(d, filter)) || null,
        insertOne: async (doc) => {
          const insertedId = new ObjectId();
          docs.push({ _id: insertedId, ...doc });
          return { insertedId };
        },
        updateOne: async () => ({ matchedCount: 1, modifiedCount: 1 }),
      };
    },
  };
}

const userId = "507f1f77bcf86cd799439011";
const signupOrgId = "507f1f77bcf86cd799439022";

const call = async (organizationData) => {
  const { POST } = await import("@/app/api/create-org-subscription/route.js");
  return POST(
    new Request("http://localhost/api/create-org-subscription", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ organizationData }),
    }),
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("STRIPE_FREELANCE_MONTHLY_PRICE_ID", "price_freelance_m");
  vi.stubEnv("STRIPE_FREELANCE_YEARLY_PRICE_ID", "price_freelance_y");
  m.getSession.mockResolvedValue({
    user: { id: userId, email: "u@x.fr", stripeCustomerId: "cus_1" },
    session: { activeOrganizationId: signupOrgId },
  });
  m.checkoutCreate.mockResolvedValue({
    id: "cs_1",
    url: "https://stripe/cs_1",
  });
  m.checkoutList.mockResolvedValue({ data: [] });
  m.subscriptionsList.mockResolvedValue({ data: [] });
  m.db = fakeDb({
    organization: [{ _id: new ObjectId(signupOrgId), hasUsedTrial: false }],
    subscription: [],
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const signup = {
  type: "onboarding",
  name: "Studio Dupont",
  companyName: "Studio Dupont",
  planName: "freelance",
  isAnnual: false,
};

describe("POST /api/create-org-subscription : inscription avec carte", () => {
  it("ouvre un essai Stripe de 7 jours, carte obligatoire", async () => {
    const res = await call(signup);

    expect(res.status).toBe(200);
    const [params] = m.checkoutCreate.mock.calls[0];
    expect(params.subscription_data.trial_period_days).toBe(7);
    expect(params.payment_method_collection).toBe("always");
    expect(params.subscription_data.metadata.isOnboarding).toBe("true");
    expect(params.custom_text.submit.message).toMatch(
      /^7 jours d'essai gratuit : aucun prélèvement avant le /,
    );
  });

  it("espace supplémentaire : paiement immédiat, sans essai", async () => {
    const res = await call({ ...signup, type: "new", name: "Second espace" });

    expect(res.status).toBe(200);
    const [params] = m.checkoutCreate.mock.calls[0];
    expect(params.subscription_data).not.toHaveProperty("trial_period_days");
    expect(params.subscription_data).not.toHaveProperty("trial_end");
  });

  it("refuse un second abonnement quand l'essai est déjà en place chez Stripe", async () => {
    m.subscriptionsList.mockResolvedValue({
      data: [
        { id: "sub_1", status: "trialing", metadata: { isOnboarding: "true" } },
      ],
    });

    const res = await call(signup);

    expect(res.status).toBe(409);
    expect(m.checkoutCreate).not.toHaveBeenCalled();
  });

  it("refuse un second abonnement quand l'espace en a déjà un", async () => {
    m.db = fakeDb({
      organization: [{ _id: new ObjectId(signupOrgId) }],
      subscription: [{ referenceId: signupOrgId, status: "trialing" }],
    });

    const res = await call(signup);

    expect(res.status).toBe(409);
    expect(m.checkoutCreate).not.toHaveBeenCalled();
  });

  it("ferme les paiements d'inscription restés ouverts (deux onglets)", async () => {
    m.checkoutList.mockResolvedValue({
      data: [
        { id: "cs_old", metadata: { isOnboarding: "true" } },
        { id: "cs_other", metadata: { isOnboarding: "false" } },
      ],
    });

    await call(signup);

    expect(m.checkoutExpire).toHaveBeenCalledTimes(1);
    expect(m.checkoutExpire).toHaveBeenCalledWith("cs_old");
  });
});
