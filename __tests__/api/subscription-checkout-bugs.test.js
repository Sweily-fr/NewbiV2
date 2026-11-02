// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * Deux bugs de facturation :
 * - create-org-subscription n'enregistrait jamais le client Stripe créé
 *   (filtre `{ id }` sur la collection user, qui n'a que `_id`) : un
 *   nouveau client à chaque passage au paiement ;
 * - change-subscription-plan gardait son verrou sur ses refus (paiement en
 *   retard, sièges payants, prix non configuré…) : toute nouvelle tentative
 *   recevait « déjà en cours » pendant 30 secondes.
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  customersCreate: vi.fn(),
  customersRetrieve: vi.fn(),
  checkoutCreate: vi.fn(),
  subscriptionsRetrieve: vi.fn(),
  subscriptionsUpdate: vi.fn(),
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
      customers: {
        create: (...args) => m.customersCreate(...args),
        retrieve: (...args) => m.customersRetrieve(...args),
      },
      checkout: {
        sessions: { create: (...args) => m.checkoutCreate(...args) },
      },
      subscriptions: {
        retrieve: (...args) => m.subscriptionsRetrieve(...args),
        update: (...args) => m.subscriptionsUpdate(...args),
      },
    };
  }
  return { default: Stripe };
});

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));

// Registre des entreprises simulé (pas d'appel réseau)
const registre = vi.hoisted(() => ({ result: { ok: true, company: {} } }));
vi.mock("@/src/lib/siret-verification", async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, verifySiret: vi.fn(async () => registre.result) };
});

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: { collection: (name) => m.db.collection(name) },
}));

vi.mock("@/src/services/seatSyncService", () => {
  class SeatSyncService {
    getPlanLimits(plan) {
      return {
        freelance: { users: 1, accountants: 1 },
        pme: { users: 10, accountants: 3 },
        entreprise: { users: 25, accountants: 5 },
      }[plan];
    }
    async syncSeatsAfterInvitationAccepted() {}
  }
  return { SeatSyncService, seatSyncService: new SeatSyncService() };
});

vi.mock("@/src/lib/auth-utils", () => ({
  sendSubscriptionChangedEmail: vi.fn(async () => {}),
}));

// ─── Petite base en mémoire ───────────────────────────────────────────────────

const same = (a, b) =>
  a instanceof ObjectId || b instanceof ObjectId
    ? String(a) === String(b)
    : a === b;

function matches(doc, filter) {
  return Object.entries(filter).every(([key, cond]) => {
    if (key === "$or") return cond.some((f) => matches(doc, f));
    const value = doc[key];
    if (cond && typeof cond === "object" && !(cond instanceof ObjectId)) {
      if ("$exists" in cond) return (value !== undefined) === cond.$exists;
      if ("$lt" in cond) return value !== undefined && value < cond.$lt;
      if ("$in" in cond) {
        return cond.$in.some((c) =>
          c === null ? value === null || value === undefined : same(value, c),
        );
      }
      if ("$nin" in cond) return !cond.$nin.some((c) => same(value, c));
    }
    return same(value, cond);
  });
}

function applyUpdate(doc, update) {
  Object.assign(doc, update.$set || {});
  for (const key of Object.keys(update.$unset || {})) delete doc[key];
}

function fakeDb(data) {
  const calls = [];
  const coll = (name) => {
    const docs = (data[name] ||= []);
    return {
      findOne: async (filter) => docs.find((d) => matches(d, filter)) || null,
      find: (filter) => ({
        toArray: async () => docs.filter((d) => matches(d, filter)),
      }),
      countDocuments: async (filter) =>
        docs.filter((d) => matches(d, filter)).length,
      insertOne: async (doc) => {
        const insertedId = new ObjectId();
        docs.push({ _id: insertedId, ...doc });
        return { insertedId };
      },
      updateOne: async (filter, update) => {
        calls.push({ name, op: "updateOne", filter, update });
        const doc = docs.find((d) => matches(d, filter));
        if (!doc) return { matchedCount: 0, modifiedCount: 0 };
        applyUpdate(doc, update);
        return { matchedCount: 1, modifiedCount: 1 };
      },
      findOneAndUpdate: async (filter, update) => {
        calls.push({ name, op: "findOneAndUpdate", filter, update });
        const doc = docs.find((d) => matches(d, filter));
        if (!doc) return null;
        applyUpdate(doc, update);
        return { ...doc };
      },
    };
  };
  return { data, calls, collection: coll };
}

const userId = "507f1f77bcf86cd799439011";
const orgId = "507f1f77bcf86cd799439022";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("STRIPE_FREELANCE_MONTHLY_PRICE_ID", "price_freelance_m");
  vi.stubEnv("STRIPE_PME_MONTHLY_PRICE_ID", "price_pme_m");
  vi.stubEnv("STRIPE_ENTREPRISE_MONTHLY_PRICE_ID", "price_entreprise_m");
  vi.stubEnv("STRIPE_SEAT_PRICE_ID", "price_seat");
  vi.stubEnv("BETTER_AUTH_SECRET", "secret");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/create-org-subscription : client Stripe", () => {
  let customerSeq = 0;

  beforeEach(() => {
    customerSeq = 0;
    m.customersCreate.mockImplementation(async () => ({
      id: `cus_${++customerSeq}`,
    }));
    m.checkoutCreate.mockImplementation(async () => ({
      id: "cs_1",
      url: "https://checkout.stripe.com/c/cs_1",
      metadata: {},
    }));
    // Session sans client Stripe (cache de session d'une minute)
    m.getSession.mockResolvedValue({
      user: { id: userId, email: "u@x.fr", name: "U", stripeCustomerId: "" },
      session: {},
    });
    m.db = fakeDb({
      user: [
        { _id: new ObjectId(userId), email: "u@x.fr", stripeCustomerId: "" },
      ],
    });
  });

  const call = async () => {
    const { POST } = await import("@/app/api/create-org-subscription/route.js");
    return POST(
      new Request("http://localhost/api/create-org-subscription", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationData: { type: "new", name: "Nouvel espace" },
        }),
      }),
    );
  };

  it("enregistre le client créé sur le document de l'utilisateur (par _id)", async () => {
    const res = await call();
    expect(res.status).toBe(200);
    expect(m.customersCreate).toHaveBeenCalledTimes(1);
    expect(m.db.data.user[0].stripeCustomerId).toBe("cus_1");
    expect(m.checkoutCreate.mock.calls[0][0].customer).toBe("cus_1");
  });

  it("réutilise le client enregistré au passage suivant (pas de doublon)", async () => {
    await call();
    await call();
    expect(m.customersCreate).toHaveBeenCalledTimes(1);
    expect(m.checkoutCreate.mock.calls.map(([args]) => args.customer)).toEqual([
      "cus_1",
      "cus_1",
    ]);
  });

  it("garde le client enregistré par un appel concurrent", async () => {
    // L'appel concurrent enregistre son client juste après notre lecture
    m.customersCreate.mockImplementation(async () => {
      m.db.data.user[0].stripeCustomerId = "cus_concurrent";
      return { id: "cus_orphelin" };
    });
    await call();
    expect(m.checkoutCreate.mock.calls[0][0].customer).toBe("cus_concurrent");
    expect(m.db.data.user[0].stripeCustomerId).toBe("cus_concurrent");
  });

  it("utilise directement le client porté par la session", async () => {
    m.getSession.mockResolvedValue({
      user: { id: userId, email: "u@x.fr", stripeCustomerId: "cus_session" },
      session: {},
    });
    await call();
    expect(m.customersCreate).not.toHaveBeenCalled();
    expect(m.checkoutCreate.mock.calls[0][0].customer).toBe("cus_session");
  });
});

describe("POST /api/change-subscription-plan : verrou", () => {
  const subscriptionDoc = () => ({
    _id: new ObjectId(),
    referenceId: orgId,
    plan: "pme",
    status: "active",
    stripeSubscriptionId: "sub_1",
    stripeCustomerId: "cus_1",
  });

  beforeEach(() => {
    m.getSession.mockResolvedValue({
      user: { id: userId, email: "u@x.fr" },
      session: { activeOrganizationId: orgId },
    });
    m.db = fakeDb({
      member: [
        {
          userId: new ObjectId(userId),
          organizationId: new ObjectId(orgId),
          role: "owner",
        },
      ],
      subscription: [subscriptionDoc()],
      invitation: [],
    });
    m.subscriptionsRetrieve.mockResolvedValue({
      status: "active",
      metadata: {},
      items: { data: [{ id: "si_base", price: { id: "price_pme_m" } }] },
    });
    m.subscriptionsUpdate.mockResolvedValue({});
    m.customersRetrieve.mockResolvedValue({ email: "u@x.fr", name: "U" });
  });

  const call = async (body = {}) => {
    const { POST } =
      await import("@/app/api/change-subscription-plan/route.js");
    return POST(
      new Request("http://localhost/api/change-subscription-plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          newPlan: "entreprise",
          isAnnual: false,
          organizationId: orgId,
          ...body,
        }),
      }),
    );
  };

  const lockState = () => {
    const { _lock, _lockUntil, _lockId } = m.db.data.subscription[0];
    return { _lock, _lockUntil, _lockId };
  };

  it("libère le verrou quand le paiement est en retard", async () => {
    m.subscriptionsRetrieve.mockResolvedValue({
      status: "past_due",
      items: { data: [] },
    });
    const res = await call();
    expect(res.status).toBe(400);
    expect(lockState()).toEqual({
      _lock: false,
      _lockUntil: undefined,
      _lockId: undefined,
    });

    // Une nouvelle tentative n'est plus bloquée par « déjà en cours »
    const retry = await call();
    expect(retry.status).not.toBe(409);
  });

  it("libère le verrou quand des sièges payants empêchent le downgrade", async () => {
    m.subscriptionsRetrieve.mockResolvedValue({
      status: "active",
      metadata: {},
      items: {
        data: [
          { id: "si_base", price: { id: "price_pme_m" } },
          { id: "si_seat", price: { id: "price_seat" }, quantity: 2 },
        ],
      },
    });
    const res = await call({ newPlan: "freelance" });
    expect(res.status).toBe(400);
    expect(lockState()._lock).toBe(false);
  });

  it("libère le verrou quand le downgrade dépasse la limite de membres", async () => {
    m.db.data.member.push(
      ...Array.from({ length: 3 }, () => ({
        userId: new ObjectId(),
        organizationId: new ObjectId(orgId),
        role: "member",
      })),
    );
    const res = await call({ newPlan: "freelance" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Impossible de downgrader");
    expect(lockState()._lock).toBe(false);
  });

  it("libère le verrou quand le prix du plan n'est pas configuré", async () => {
    vi.stubEnv("STRIPE_ENTREPRISE_MONTHLY_PRICE_ID", "");
    const res = await call();
    expect(res.status).toBe(500);
    expect(lockState()._lock).toBe(false);
  });

  it("libère le verrou si Stripe échoue", async () => {
    m.subscriptionsRetrieve.mockRejectedValue(new Error("Stripe indisponible"));
    const res = await call();
    expect(res.status).toBe(500);
    expect(lockState()._lock).toBe(false);
  });

  it("change le plan et rend le verrou (chemin nominal inchangé)", async () => {
    const res = await call();
    expect(res.status).toBe(200);
    expect(m.subscriptionsUpdate).toHaveBeenCalledTimes(1);
    const doc = m.db.data.subscription[0];
    expect(doc.plan).toBe("entreprise");
    expect(lockState()).toEqual({
      _lock: false,
      _lockUntil: undefined,
      _lockId: undefined,
    });
  });

  it("ne libère jamais le verrou d'une autre requête", async () => {
    // Un changement de plan est déjà en cours (verrou valide d'une autre requête)
    Object.assign(m.db.data.subscription[0], {
      _lock: true,
      _lockUntil: Date.now() + 30000,
      _lockId: "verrou-de-l-autre-requete",
    });
    const res = await call();
    expect(res.status).toBe(409);
    expect(lockState()._lock).toBe(true);
    expect(lockState()._lockId).toBe("verrou-de-l-autre-requete");
  });
});

describe("POST /api/create-org-subscription : SIRET d'un autre espace", () => {
  const otherOrgId = new ObjectId("507f1f77bcf86cd799439099");

  beforeEach(() => {
    m.customersCreate.mockImplementation(async () => ({ id: "cus_1" }));
    m.checkoutCreate.mockImplementation(async () => ({
      id: "cs_1",
      url: "https://checkout.stripe.com/c/cs_1",
      metadata: {},
    }));
    m.getSession.mockResolvedValue({
      user: { id: userId, email: "u@x.fr", stripeCustomerId: "cus_1" },
      session: {},
    });
  });

  const call = async (siret) => {
    const { POST } = await import("@/app/api/create-org-subscription/route.js");
    return POST(
      new Request("http://localhost/api/create-org-subscription", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationData: { type: "new", name: "Nouvel espace", siret },
        }),
      }),
    );
  };

  it("SIRET porté par un espace dont l'utilisateur n'est pas membre : refus 409 avant tout paiement", async () => {
    m.db = fakeDb({
      user: [{ _id: new ObjectId(userId), email: "u@x.fr" }],
      organization: [{ _id: otherOrgId, siret: "12345678900011" }],
      member: [],
    });
    const res = await call("12345678900011");
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(
      /déjà utilisé par un autre espace/,
    );
    expect(m.checkoutCreate).not.toHaveBeenCalled();
  });

  it("SIRET introuvable ou fermé au registre : refus 400 avant tout paiement", async () => {
    m.db = fakeDb({
      user: [{ _id: new ObjectId(userId), email: "u@x.fr" }],
      organization: [],
      member: [],
    });
    for (const reason of ["not_found", "inactive"]) {
      registre.result = { ok: false, reason };
      const res = await call("12345678900029");
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/registre/);
    }
    expect(m.checkoutCreate).not.toHaveBeenCalled();
    registre.result = { ok: true, company: {} };
  });

  it("registre injoignable : le paiement n'est pas bloqué", async () => {
    m.db = fakeDb({
      user: [{ _id: new ObjectId(userId), email: "u@x.fr" }],
      organization: [],
      member: [],
    });
    registre.result = { ok: false, reason: "service_unavailable" };
    const res = await call("12345678900029");
    expect(res.status).toBe(200);
    registre.result = { ok: true, company: {} };
  });

  it("SIRET d'un espace dont il est membre : paiement proposé", async () => {
    m.db = fakeDb({
      user: [{ _id: new ObjectId(userId), email: "u@x.fr" }],
      organization: [{ _id: otherOrgId, siret: "12345678900011" }],
      member: [
        {
          userId: new ObjectId(userId),
          organizationId: otherOrgId,
          role: "owner",
        },
      ],
    });
    const res = await call("12345678900011");
    expect(res.status).toBe(200);
    expect(m.checkoutCreate).toHaveBeenCalledTimes(1);
  });
});

describe("Identifiant d'espace mal formé : 400 au lieu d'une erreur serveur", () => {
  beforeEach(() => {
    m.getSession.mockResolvedValue({
      user: { id: userId, email: "u@x.fr" },
      session: {},
    });
    m.db = fakeDb({ user: [{ _id: new ObjectId(userId), email: "u@x.fr" }] });
  });

  const ROUTES = {
    "change-subscription-plan": () =>
      import("@/app/api/change-subscription-plan/route.js"),
    "preview-plan-change": () =>
      import("@/app/api/preview-plan-change/route.js"),
    "billing/sync-seats": () => import("@/app/api/billing/sync-seats/route.js"),
  };

  it.each([
    ["change-subscription-plan", { newPlan: "entreprise", isAnnual: false }],
    ["preview-plan-change", { newPlan: "entreprise", isAnnual: false }],
    ["billing/sync-seats", {}],
  ])("%s", async (route, corps) => {
    const { POST } = await ROUTES[route]();
    for (const organizationId of ["pas-un-id", { $ne: null }]) {
      const res = await POST(
        new Request(`http://localhost/api/${route}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...corps, organizationId }),
        }),
      );
      expect(res.status).toBe(400);
    }
    expect(m.subscriptionsRetrieve).not.toHaveBeenCalled();
    expect(m.subscriptionsUpdate).not.toHaveBeenCalled();
  });
});
