// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";
import { NextRequest } from "next/server";

/**
 * Achat et fin de l'inscription : une session de paiement Stripe n'est lue
 * que par le compte qui l'a ouverte, et seule la direction de l'espace
 * (propriétaire, Administrateur) le déclare prêt.
 */

const m = vi.hoisted(() => {
  process.env.STRIPE_SECRET_KEY ||= "sk_test_dummy";
  process.env.RESEND_API_KEY ||= "re_dummy";
  return {
    getSession: vi.fn(),
    retrieve: vi.fn(),
    member: null,
    subscription: { status: "active" },
    ecritures: [],
  };
});

vi.mock("stripe", () => {
  function Stripe() {
    return {
      checkout: { sessions: { retrieve: (...a) => m.retrieve(...a) } },
      subscriptions: { retrieve: vi.fn() },
    };
  }
  return { default: Stripe };
});

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...a) => m.getSession(...a) } },
}));

const ecrire =
  (collection, op) =>
  async (...args) => {
    m.ecritures.push([collection, op, args]);
    return { acknowledged: true, modifiedCount: 1, upsertedCount: 0 };
  };
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => ({
      findOne: async () => {
        if (name === "member") return m.member;
        if (name === "subscription") return m.subscription;
        return null;
      },
      find: () => ({ toArray: async () => [] }),
      updateOne: ecrire(name, "updateOne"),
      updateMany: ecrire(name, "updateMany"),
      insertOne: ecrire(name, "insertOne"),
      deleteOne: ecrire(name, "deleteOne"),
      findOneAndUpdate: ecrire(name, "findOneAndUpdate"),
    }),
  },
}));

const userId = new ObjectId().toString();
const autreId = new ObjectId().toString();
const orgId = new ObjectId().toString();

beforeEach(() => {
  vi.clearAllMocks();
  m.ecritures = [];
  m.member = { role: "owner" };
  m.subscription = { status: "active" };
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  m.getSession.mockResolvedValue({
    user: { id: userId, email: "moi@exemple.fr" },
    session: { activeOrganizationId: orgId },
  });
});

describe("GET /api/verify-checkout-session", () => {
  const appel = async (query = "?session_id=cs_test_123") => {
    const { GET } = await import("@/app/api/verify-checkout-session/route");
    return GET(
      new NextRequest(`http://localhost/api/verify-checkout-session${query}`),
    );
  };

  it("sans session : 401, Stripe non interrogé", async () => {
    m.getSession.mockResolvedValue(null);
    expect((await appel()).status).toBe(401);
    expect(m.retrieve).not.toHaveBeenCalled();
  });

  it("sans session_id : 400", async () => {
    expect((await appel("")).status).toBe(400);
    expect(m.retrieve).not.toHaveBeenCalled();
  });

  it("session de paiement ouverte par un autre compte : 403, rien d'écrit", async () => {
    m.retrieve.mockResolvedValue({
      id: "cs_test_123",
      payment_status: "paid",
      metadata: { userId: autreId, organizationId: orgId },
      subscription: { id: "sub_autre", status: "active" },
      customer: { id: "cus_autre", metadata: { userId: autreId } },
    });
    const res = await appel();
    expect(res.status).toBe(403);
    expect(m.ecritures).toEqual([]);
    const corps = JSON.stringify(await res.json());
    expect(corps).not.toContain("sub_autre");
    expect(corps).not.toContain("cus_autre");
  });

  it("session sans compte d'origine : 400 (pas de repli sur l'adresse e-mail), rien d'écrit", async () => {
    m.retrieve.mockResolvedValue({
      id: "cs_test_123",
      payment_status: "paid",
      metadata: {},
      customer_email: "moi@exemple.fr",
      customer: { id: "cus_x", email: "moi@exemple.fr", metadata: {} },
    });
    expect((await appel()).status).toBe(400);
    expect(m.ecritures).toEqual([]);
  });
});

describe("POST /api/organizations/[organizationId]/complete-onboarding", () => {
  const appel = async (organizationId = orgId) => {
    const { POST } =
      await import("@/app/api/organizations/[organizationId]/complete-onboarding/route");
    return POST(
      new NextRequest(
        `http://localhost/api/organizations/${organizationId}/complete-onboarding`,
        {
          method: "POST",
          headers: { cookie: "better-auth.session_token=x" },
        },
      ),
      { params: Promise.resolve({ organizationId }) },
    );
  };

  for (const [libelle, role] of [
    ["Éditeur", "member"],
    ["Membre (lecture seule)", "viewer"],
    ["Comptable", "accountant"],
    ["rôle personnalisé", "role_perso_x"],
  ]) {
    it(`${libelle} : 403, espace inchangé`, async () => {
      m.member = { role };
      expect((await appel()).status).toBe(403);
      expect(m.ecritures).toEqual([]);
    });
  }

  it("personne extérieure à l'espace : 403, espace inchangé", async () => {
    m.member = null;
    expect((await appel()).status).toBe(403);
    expect(m.ecritures).toEqual([]);
  });

  it("identifiant d'espace mal formé : 400 (pas d'erreur serveur)", async () => {
    expect((await appel("pas-un-id")).status).toBe(400);
    expect(m.ecritures).toEqual([]);
  });

  it("propriétaire sans abonnement actif : 400, espace inchangé", async () => {
    m.subscription = null;
    expect((await appel()).status).toBe(400);
    expect(m.ecritures).toEqual([]);
  });

  for (const [libelle, role] of [
    ["propriétaire", "owner"],
    ["Administrateur", "admin"],
  ]) {
    it(`${libelle} avec un abonnement actif : inscription terminée sur cet espace`, async () => {
      m.member = { role };
      expect((await appel()).status).toBe(200);
      const org = m.ecritures.find(([c]) => c === "organization");
      expect(String(org[2][0]._id)).toBe(orgId);
      expect(org[2][1].$set.onboardingCompleted).toBe(true);
    });
  }
});
