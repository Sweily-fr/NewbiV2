// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * Lecture de l'abonnement par les membres d'un espace : tous reçoivent le
 * statut, le plan et les limites (l'interface en a besoin partout, l'app
 * mobile appelle check-user-limit avant d'inviter), seul un rôle qui a
 * « Voir l'abonnement » reçoit les identifiants Stripe, les montants et les
 * détails de facturation.
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  memberFindOne: vi.fn(),
  memberFind: vi.fn(async () => []),
  storedRoles: vi.fn(async () => []),
  subscriptionFindOne: vi.fn(),
  organizationFindOne: vi.fn(),
  canInviteMember: vi.fn(),
  getBillingInfo: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: {
    api: { getSession: (...args) => m.getSession(...args) },
    options: { database: {} },
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "member") {
        return {
          findOne: m.memberFindOne,
          find: () => ({ toArray: m.memberFind }),
        };
      }
      if (name === "organizationRole") {
        return { find: () => ({ toArray: m.storedRoles }) };
      }
      if (name === "subscription") {
        return { findOne: m.subscriptionFindOne };
      }
      if (name === "organization") {
        return { findOne: m.organizationFindOne };
      }
      throw new Error(`Collection inattendue : ${name}`);
    },
  },
}));

vi.mock("@/src/services/seatSyncService", () => ({
  seatSyncService: {
    canInviteMember: (...args) => m.canInviteMember(...args),
    getBillingInfo: (...args) => m.getBillingInfo(...args),
  },
}));

const userId = "507f1f77bcf86cd799439011";
const orgId = "507f1f77bcf86cd799439022";

function signIn() {
  m.getSession.mockResolvedValue({
    user: { id: userId, email: "u@x.fr" },
    session: { activeOrganizationId: orgId },
  });
}

function asRole(role, storedRoles = []) {
  m.memberFindOne.mockResolvedValue({
    userId: new ObjectId(userId),
    organizationId: new ObjectId(orgId),
    role,
  });
  m.storedRoles.mockResolvedValue(storedRoles);
}

const periodEnd = new Date("2026-12-01T00:00:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  m.storedRoles.mockResolvedValue([]);
  m.memberFind.mockResolvedValue([]);
  m.organizationFindOne.mockResolvedValue({
    isTrialActive: false,
    hasUsedTrial: true,
  });
  m.subscriptionFindOne.mockResolvedValue({
    plan: "pme",
    status: "active",
    stripeSubscriptionId: "sub_123",
    stripeCustomerId: "cus_123",
    periodStart: new Date("2026-11-01T00:00:00.000Z"),
    periodEnd,
    cancelAtPeriodEnd: true,
  });
});

describe("GET /api/organizations/[organizationId]/subscription", () => {
  const call = async () => {
    const { GET } =
      await import("@/app/api/organizations/[organizationId]/subscription/route.js");
    return GET(
      new Request(`http://localhost/api/organizations/${orgId}/subscription`),
      { params: Promise.resolve({ organizationId: orgId }) },
    );
  };

  it("sans « Voir l'abonnement » : statut, plan, fin de période et essai, sans Stripe", async () => {
    signIn();
    asRole("member"); // Éditeur : pas de droit sur l'abonnement
    const res = await call();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      plan: "pme",
      status: "active",
      periodEnd: periodEnd.toISOString(),
      isDefault: false,
      appTrialEnabled: false,
      isTrialActive: false,
      trialStartDate: null,
      trialEndDate: null,
      stripeTrialActive: false,
      hasUsedTrial: true,
    });
  });

  it("abonnement expiré : le statut suffit, l'identifiant Stripe n'est pas servi", async () => {
    signIn();
    asRole("viewer");
    m.subscriptionFindOne.mockResolvedValue({
      plan: "pme",
      status: "canceled",
      stripeSubscriptionId: "sub_123",
      periodEnd: new Date("2020-01-01T00:00:00.000Z"),
    });
    const body = await (await call()).json();
    expect(body.status).toBe("expired");
    expect(body.isExpired).toBe(true);
    expect(body.stripeSubscriptionId).toBeUndefined();
  });

  it("avec « Voir l'abonnement » : réponse complète inchangée", async () => {
    for (const role of ["owner", "admin", "accountant"]) {
      signIn();
      asRole(role);
      const body = await (await call()).json();
      expect(body, role).toMatchObject({
        plan: "pme",
        status: "active",
        stripeSubscriptionId: "sub_123",
        stripeCustomerId: "cus_123",
        periodStart: "2026-11-01T00:00:00.000Z",
        periodEnd: periodEnd.toISOString(),
        cancelAtPeriodEnd: true,
        isDefault: false,
      });
    }
  });

  it("suit un rôle personnalisé qui a « Voir l'abonnement »", async () => {
    signIn();
    asRole("role_gestion", [
      { role: "role_gestion", actions: { billing: ["view"] } },
    ]);
    const body = await (await call()).json();
    expect(body.stripeCustomerId).toBe("cus_123");
  });

  it("refuse un utilisateur d'un autre espace", async () => {
    signIn();
    m.memberFindOne.mockResolvedValue(null);
    expect((await call()).status).toBe(403);
  });
});

describe("GET /api/organizations/[organizationId]/seats-info", () => {
  const call = async () => {
    const { GET } =
      await import("@/app/api/organizations/[organizationId]/seats-info/route.js");
    return GET(
      new Request(`http://localhost/api/organizations/${orgId}/seats-info`),
      { params: Promise.resolve({ organizationId: orgId }) },
    );
  };

  beforeEach(() => {
    m.memberFind.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => ({
        role: i === 0 ? "owner" : "member",
        status: "active",
      })),
    );
  });

  it("sans « Voir l'abonnement » : plan et limites, pas les sièges payants", async () => {
    signIn();
    asRole("viewer");
    const body = await (await call()).json();
    expect(body).toEqual({
      plan: "pme",
      includedSeats: 10,
      currentMembers: 12,
      availableSeats: 0,
    });
  });

  it("avec « Voir l'abonnement » : sièges payants et prix", async () => {
    signIn();
    asRole("admin");
    const body = await (await call()).json();
    expect(body).toEqual({
      plan: "pme",
      includedSeats: 10,
      currentMembers: 12,
      availableSeats: 0,
      additionalSeats: 2,
      seatCost: 7.49,
    });
  });
});

describe("GET /api/billing/sync-seats", () => {
  const call = async () => {
    const { GET } = await import("@/app/api/billing/sync-seats/route.js");
    return GET(
      new Request(
        `http://localhost/api/billing/sync-seats?organizationId=${orgId}`,
      ),
    );
  };

  beforeEach(() => {
    m.getBillingInfo.mockResolvedValue({
      hasSubscription: true,
      baseCost: 39,
      additionalSeats: 2,
      seatCost: 14.98,
      totalCost: 53.98,
      currency: "eur",
    });
  });

  it("refuse un membre sans « Voir l'abonnement » (montants seulement)", async () => {
    signIn();
    asRole("member");
    const res = await call();
    expect(res.status).toBe(403);
    expect(m.getBillingInfo).not.toHaveBeenCalled();
  });

  it("sert les montants à un rôle qui voit l'abonnement", async () => {
    signIn();
    asRole("accountant");
    const res = await call();
    expect(res.status).toBe(200);
    expect((await res.json()).totalCost).toBe(53.98);
  });

  it("refuse un utilisateur d'un autre espace", async () => {
    signIn();
    m.memberFindOne.mockResolvedValue(null);
    expect((await call()).status).toBe(403);
    expect(m.getBillingInfo).not.toHaveBeenCalled();
  });
});

describe("POST /api/billing/check-user-limit", () => {
  const call = async (body = { organizationId: orgId, role: "member" }) => {
    const { POST } =
      await import("@/app/api/billing/check-user-limit/route.js");
    return POST(
      new Request("http://localhost/api/billing/check-user-limit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  };

  beforeEach(() => {
    m.canInviteMember.mockResolvedValue({
      canInvite: true,
      reason: "OK - Siège supplémentaire payant",
      planName: "pme",
      currentUsers: 10,
      pendingUsers: 0,
      totalUsers: 10,
      limitUsers: 10,
      availableUsers: 0,
      isPaid: true,
      additionalCost: 7.49,
      totalAdditionalSeats: 1,
      totalAdditionalCost: 7.49,
    });
  });

  it("sans « Voir l'abonnement » : de quoi décider l'invitation, sans montants", async () => {
    signIn();
    asRole("role_rh", [
      { role: "role_rh", actions: { team: ["view", "invite"] } },
    ]);
    const res = await call();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      canInvite: true,
      canAdd: true,
      reason: "OK - Siège supplémentaire payant",
      planName: "pme",
      isPaid: true,
      currentUsers: 10,
      pendingUsers: 0,
      totalUsers: 10,
      limitUsers: 10,
      availableUsers: 0,
    });
  });

  it("garde les champs lus par l'app mobile pour un refus", async () => {
    signIn();
    asRole("viewer");
    m.canInviteMember.mockResolvedValue({
      canInvite: false,
      reason: "Aucun abonnement actif. Veuillez souscrire à un plan.",
      planName: "none",
    });
    const body = await (await call()).json();
    expect(body).toEqual({
      canInvite: false,
      canAdd: false,
      reason: "Aucun abonnement actif. Veuillez souscrire à un plan.",
      planName: "none",
    });
  });

  it("avec « Voir l'abonnement » : coûts et recommandation de plan", async () => {
    signIn();
    asRole("owner");
    const body = await (await call()).json();
    expect(body.isPaid).toBe(true);
    expect(body.additionalCost).toBeGreaterThan(0);
    expect(body.totalAdditionalCost).toBeGreaterThan(0);
    expect(body).toHaveProperty("recommendation");
  });

  it("refuse un utilisateur d'un autre espace", async () => {
    signIn();
    m.memberFindOne.mockResolvedValue(null);
    const res = await call();
    expect(res.status).toBe(403);
    expect(m.canInviteMember).not.toHaveBeenCalled();
  });
});
