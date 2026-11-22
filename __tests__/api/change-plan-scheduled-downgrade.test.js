// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * Baisse d'offre en fin de période payée (22/11/2026) : l'offre payée reste
 * active jusqu'à la fin de sa période, un calendrier Stripe passe ensuite à
 * la nouvelle offre, sans prorata ni remboursement. Pendant l'essai la
 * baisse reste immédiate ; une montée d'offre ou une annulation retire le
 * calendrier. L'aperçu annonce la date, sans prorata.
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  customersRetrieve: vi.fn(),
  subscriptionsRetrieve: vi.fn(),
  subscriptionsUpdate: vi.fn(),
  schedulesCreate: vi.fn(),
  schedulesRetrieve: vi.fn(),
  schedulesUpdate: vi.fn(),
  schedulesRelease: vi.fn(),
  sendEmail: vi.fn(async () => {}),
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
      customers: { retrieve: (...args) => m.customersRetrieve(...args) },
      subscriptions: {
        retrieve: (...args) => m.subscriptionsRetrieve(...args),
        update: (...args) => m.subscriptionsUpdate(...args),
      },
      subscriptionSchedules: {
        create: (...args) => m.schedulesCreate(...args),
        retrieve: (...args) => m.schedulesRetrieve(...args),
        update: (...args) => m.schedulesUpdate(...args),
        release: (...args) => m.schedulesRelease(...args),
      },
    };
  }
  return { default: Stripe };
});

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));

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
  sendSubscriptionChangedEmail: (...args) => m.sendEmail(...args),
}));

// ─── Petite base en mémoire (même principe que subscription-checkout-bugs) ───

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
  const coll = (name) => {
    const docs = (data[name] ||= []);
    return {
      findOne: async (filter) => docs.find((d) => matches(d, filter)) || null,
      find: (filter) => ({
        toArray: async () => docs.filter((d) => matches(d, filter)),
      }),
      countDocuments: async (filter) =>
        docs.filter((d) => matches(d, filter)).length,
      updateOne: async (filter, update) => {
        const doc = docs.find((d) => matches(d, filter));
        if (!doc) return { matchedCount: 0, modifiedCount: 0 };
        applyUpdate(doc, update);
        return { matchedCount: 1, modifiedCount: 1 };
      },
      findOneAndUpdate: async (filter, update) => {
        const doc = docs.find((d) => matches(d, filter));
        if (!doc) return null;
        applyUpdate(doc, update);
        return { ...doc };
      },
    };
  };
  return { data, collection: coll };
}

const userId = "507f1f77bcf86cd799439011";
const orgId = "507f1f77bcf86cd799439022";
// Période payée en cours : du 15/11/2026 au 15/12/2026 (secondes Unix)
const DEBUT = Math.floor(Date.UTC(2026, 10, 15, 9) / 1000);
const FIN = Math.floor(Date.UTC(2026, 11, 15, 9) / 1000);

const doc = (extra = {}) => ({
  _id: new ObjectId(),
  referenceId: orgId,
  plan: "entreprise",
  status: "active",
  stripeSubscriptionId: "sub_1",
  stripeCustomerId: "cus_1",
  ...extra,
});

// Abonnement Stripe au format de l'API basil : dates de période sur les lignes
const abonnementStripe = (extra = {}) => ({
  id: "sub_1",
  status: "active",
  schedule: null,
  cancel_at_period_end: false,
  metadata: { planName: "entreprise", isAnnual: "false" },
  items: {
    data: [
      {
        id: "si_base",
        price: { id: "price_entreprise_m", recurring: { interval: "month" } },
        quantity: 1,
        current_period_start: DEBUT,
        current_period_end: FIN,
      },
    ],
  },
  ...extra,
});

const sub = () => m.db.data.subscription[0];

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
    subscription: [doc()],
    invitation: [],
  });
  m.subscriptionsRetrieve.mockResolvedValue(abonnementStripe());
  m.subscriptionsUpdate.mockResolvedValue({});
  m.customersRetrieve.mockResolvedValue({ email: "u@x.fr", name: "U" });
  m.schedulesCreate.mockResolvedValue({
    id: "sub_sched_1",
    current_phase: { start_date: DEBUT, end_date: FIN },
    phases: [{ start_date: DEBUT, end_date: FIN }],
  });
  m.schedulesRetrieve.mockResolvedValue({
    id: "sub_sched_1",
    current_phase: { start_date: DEBUT, end_date: FIN },
    phases: [{ start_date: DEBUT, end_date: FIN }, {}],
  });
  m.schedulesUpdate.mockResolvedValue({});
  m.schedulesRelease.mockResolvedValue({});
});

afterEach(() => vi.unstubAllEnvs());

const changer = async (body) => {
  const { POST } = await import("@/app/api/change-subscription-plan/route.js");
  return POST(
    new Request("http://localhost/api/change-subscription-plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ organizationId: orgId, ...body }),
    }),
  );
};

describe("POST /api/change-subscription-plan : baisse d'offre", () => {
  it("programmée en fin de période : offre actuelle gardée, aucun prorata", async () => {
    const res = await changer({ newPlan: "pme", isAnnual: false });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      success: true,
      scheduled: true,
      effectiveDate: new Date(FIN * 1000).toISOString(),
      newPlan: "pme",
    });
    expect(body.message).toMatch(/passera à Premium le 15 décembre 2026/);

    // Rien de changé tout de suite chez Stripe
    expect(m.subscriptionsUpdate).not.toHaveBeenCalled();
    expect(m.schedulesCreate).toHaveBeenCalledWith({
      from_subscription: "sub_1",
    });
    const [scheduleId, params] = m.schedulesUpdate.mock.calls[0];
    expect(scheduleId).toBe("sub_sched_1");
    expect(params.end_behavior).toBe("release");
    expect(params.phases).toEqual([
      {
        items: [{ price: "price_entreprise_m", quantity: 1 }],
        start_date: DEBUT,
        end_date: FIN,
        metadata: { planName: "entreprise", isAnnual: "false" },
        proration_behavior: "none",
      },
      {
        items: [{ price: "price_pme_m", quantity: 1 }],
        iterations: 1,
        metadata: { planName: "pme", isAnnual: "false" },
        proration_behavior: "none",
      },
    ]);

    // L'espace garde son offre ; le changement est noté pour l'écran
    expect(sub()).toMatchObject({
      plan: "entreprise",
      scheduledPlan: "pme",
      scheduledIsAnnual: false,
      stripeScheduleId: "sub_sched_1",
      _lock: false,
    });
    expect(sub().scheduledPlanAt).toEqual(new Date(FIN * 1000));
    expect(m.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduled: true,
        oldPlan: "Entreprise",
        newPlan: "Premium",
        effectiveDate: "15 décembre 2026",
      }),
    );
  });

  it("pendant l'essai, la baisse reste immédiate (rien n'a été payé)", async () => {
    m.subscriptionsRetrieve.mockResolvedValue(
      abonnementStripe({ status: "trialing" }),
    );
    const res = await changer({ newPlan: "pme", isAnnual: false });
    expect(res.status).toBe(200);
    expect(m.schedulesCreate).not.toHaveBeenCalled();
    expect(m.subscriptionsUpdate).toHaveBeenCalledTimes(1);
    expect(m.subscriptionsUpdate.mock.calls[0][1].items[0]).toEqual({
      id: "si_base",
      price: "price_pme_m",
    });
    expect(sub().plan).toBe("pme");
  });

  it("refusée si l'abonnement s'arrête déjà en fin de période", async () => {
    m.subscriptionsRetrieve.mockResolvedValue(
      abonnementStripe({ cancel_at_period_end: true }),
    );
    const res = await changer({ newPlan: "pme", isAnnual: false });
    expect(res.status).toBe(409);
    expect(m.schedulesCreate).not.toHaveBeenCalled();
    expect(sub().scheduledPlan).toBeUndefined();
    expect(sub()._lock).toBe(false);
  });

  it("Stripe refuse le calendrier : erreur, rien d'enregistré, verrou rendu", async () => {
    m.schedulesUpdate.mockRejectedValue(new Error("stripe"));
    const res = await changer({ newPlan: "pme", isAnnual: false });
    expect(res.status).toBe(500);
    expect(sub()).toMatchObject({ plan: "entreprise", _lock: false });
    expect(sub().scheduledPlan).toBeUndefined();
  });

  it("une nouvelle baisse remplace la baisse déjà programmée", async () => {
    m.db.data.subscription = [
      doc({ scheduledPlan: "pme", stripeScheduleId: "sub_sched_1" }),
    ];
    m.subscriptionsRetrieve.mockResolvedValue(
      abonnementStripe({ schedule: "sub_sched_1" }),
    );
    m.schedulesCreate.mockResolvedValue({
      id: "sub_sched_2",
      current_phase: { start_date: DEBUT, end_date: FIN },
    });
    const res = await changer({ newPlan: "freelance", isAnnual: false });
    expect(res.status).toBe(200);
    expect(m.schedulesRelease).toHaveBeenCalledWith("sub_sched_1");
    expect(m.schedulesCreate).toHaveBeenCalledWith({
      from_subscription: "sub_1",
    });
    expect(m.schedulesUpdate.mock.calls[0][1].phases[1].items).toEqual([
      { price: "price_freelance_m", quantity: 1 },
    ]);
    expect(sub()).toMatchObject({
      plan: "entreprise",
      scheduledPlan: "freelance",
      stripeScheduleId: "sub_sched_2",
    });
  });
});

describe("POST /api/change-subscription-plan : baisse programmée annulée", () => {
  beforeEach(() => {
    m.db.data.subscription = [
      doc({
        plan: "pme",
        scheduledPlan: "freelance",
        scheduledPlanAt: new Date(FIN * 1000),
        stripeScheduleId: "sub_sched_1",
      }),
    ];
    m.subscriptionsRetrieve.mockResolvedValue(
      abonnementStripe({
        schedule: "sub_sched_1",
        metadata: { planName: "pme" },
        items: {
          data: [
            {
              id: "si_base",
              price: { id: "price_pme_m", recurring: { interval: "month" } },
              quantity: 1,
              current_period_start: DEBUT,
              current_period_end: FIN,
            },
          ],
        },
      }),
    );
  });

  it("sur demande : calendrier retiré, offre et périodicité gardées", async () => {
    const res = await changer({ cancelScheduledChange: true });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      success: true,
      cancelledScheduledChange: true,
    });
    expect(m.schedulesRelease).toHaveBeenCalledWith("sub_sched_1");
    expect(m.subscriptionsUpdate).not.toHaveBeenCalled();
    expect(sub().plan).toBe("pme");
    expect(sub().scheduledPlan).toBeUndefined();
    expect(sub().stripeScheduleId).toBeUndefined();
    expect(sub()._lock).toBe(false);
  });

  it("une montée d'offre annule la baisse puis s'applique tout de suite", async () => {
    const res = await changer({ newPlan: "entreprise", isAnnual: false });
    expect(res.status).toBe(200);
    expect(m.schedulesRelease).toHaveBeenCalledWith("sub_sched_1");
    expect(m.subscriptionsUpdate).toHaveBeenCalledTimes(1);
    expect(m.subscriptionsUpdate.mock.calls[0][1]).toMatchObject({
      items: [{ id: "si_base", price: "price_entreprise_m" }],
      proration_behavior: "create_prorations",
    });
    expect(sub().plan).toBe("entreprise");
    expect(sub().scheduledPlan).toBeUndefined();
  });

  it("sans changement programmé, l'annulation ne touche à rien", async () => {
    m.db.data.subscription = [doc({ plan: "pme" })];
    m.subscriptionsRetrieve.mockResolvedValue(abonnementStripe());
    const res = await changer({ cancelScheduledChange: true });
    expect(await res.json()).toMatchObject({
      success: true,
      cancelledScheduledChange: false,
    });
    expect(m.schedulesRelease).not.toHaveBeenCalled();
    expect(m.subscriptionsUpdate).not.toHaveBeenCalled();
  });
});

describe("POST /api/preview-plan-change", () => {
  const apercu = async (body) => {
    const { POST } = await import("@/app/api/preview-plan-change/route.js");
    const res = await POST(
      new Request("http://localhost/api/preview-plan-change", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizationId: orgId, isAnnual: false, ...body }),
      }),
    );
    return { status: res.status, body: await res.json() };
  };

  it("baisse : prise d'effet en fin de période payée, sans prorata", async () => {
    const { status, body } = await apercu({ newPlan: "pme" });
    expect(status).toBe(200);
    expect(body.preview.proration).toBeNull();
    expect(body.preview.change).toMatchObject({
      isDowngrade: true,
      scheduled: true,
      effectiveDate: "Le 15 décembre 2026",
    });
    expect(body.preview.change.scheduledMessage).toMatch(
      /gardez l'offre Entreprise jusqu'au 15 décembre 2026/,
    );
  });

  it("montée : prorata calculé sur la vraie période (dates portées par les lignes)", async () => {
    m.db.data.subscription = [doc({ plan: "pme" })];
    m.subscriptionsRetrieve.mockResolvedValue(
      abonnementStripe({
        metadata: { planName: "pme" },
        items: {
          data: [
            {
              id: "si_base",
              price: { id: "price_pme_m", recurring: { interval: "month" } },
              quantity: 1,
              current_period_start: DEBUT,
              current_period_end: FIN,
            },
          ],
        },
      }),
    );
    vi.useFakeTimers({ toFake: ["Date"] });
    // Moitié de la période écoulée
    vi.setSystemTime(new Date(((DEBUT + FIN) / 2) * 1000));
    try {
      const { body } = await apercu({ newPlan: "entreprise" });
      expect(body.preview.change).toMatchObject({
        isUpgrade: true,
        scheduled: false,
        effectiveDate: "Immédiat",
      });
      expect(body.preview.proration.ratio).toBeCloseTo(0.5, 2);
      expect(body.preview.billing.currentPeriodEnd).toBe(
        new Date(FIN * 1000).toISOString(),
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
