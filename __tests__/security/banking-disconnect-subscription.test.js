// @vitest-environment node
//
// Déconnexion bancaire sans abonnement actif : le propriétaire d'un espace
// dont l'abonnement a pris fin peut toujours couper sa banque depuis le site
// (l'API le permet, comme pour Qonto). Connecter ou reconnecter une banque
// exige toujours l'abonnement.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const ORG_ID = "507f1f77bcf86cd799439022";

vi.hoisted(() => {
  process.env.RESEND_API_KEY ||= "re_dummy";
  process.env.STRIPE_SECRET_KEY ||= "sk_test_dummy";
});
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "member")
        return { findOne: async () => ({ role: "owner" }) };
      if (name === "organizationRole") {
        return { find: () => ({ toArray: async () => [] }) };
      }
      return { findOne: async () => null };
    },
  },
}));

const abonnement = vi.hoisted(() => ({ calls: 0 }));
vi.mock("@/src/lib/security", async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    requireSession: vi.fn(async () => ({
      user: { id: "507f1f77bcf86cd799439011" },
      cookieHeader: "session=x",
    })),
    requireActiveSubscription: vi.fn(async () => {
      abonnement.calls += 1;
      throw original.apiError(402, "Aucun abonnement actif");
    }),
  };
});

const backend = vi.fn(
  async () => new Response(JSON.stringify({ success: true }), { status: 200 }),
);

beforeEach(() => {
  backend.mockClear();
  abonnement.calls = 0;
  vi.stubGlobal("fetch", backend);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const requete = (url, method) =>
  new NextRequest(`http://localhost${url}`, {
    method,
    headers: { "x-workspace-id": ORG_ID },
    body: method === "POST" ? JSON.stringify({ accountId: "a1" }) : undefined,
  });

describe("Banque sans abonnement actif", () => {
  it("le propriétaire peut déconnecter sa banque : la demande part à l'API", async () => {
    const { POST } = await import("@/app/api/banking-connect/disconnect/route");
    const res = await POST(requete("/api/banking-connect/disconnect", "POST"));
    expect(res.status).toBe(200);
    expect(backend).toHaveBeenCalledTimes(1);
    expect(JSON.parse(backend.mock.calls[0][1].body)).toEqual({
      accountId: "a1",
    });
  });

  it("connecter une nouvelle banque reste refusé", async () => {
    const { GET } =
      await import("@/app/api/banking-connect/bridge/connect/route");
    const res = await GET(
      requete("/api/banking-connect/bridge/connect", "GET"),
    );
    expect(res.status).toBe(402);
    expect(backend).not.toHaveBeenCalled();
  });
});
