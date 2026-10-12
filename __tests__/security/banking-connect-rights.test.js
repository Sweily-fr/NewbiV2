// @vitest-environment node
//
// Connexion, reconnexion et déconnexion bancaires : même droit que les
// boutons de l'interface (« Gérer » les applications).
//
// Les routes n'exigeaient que l'appartenance à l'espace. Un Membre en lecture
// seule, ou un Comptable invité, appelait POST /api/banking-connect/disconnect
// et l'API effaçait toutes les transactions et tous les comptes de l'espace.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const USER_ID = "507f1f77bcf86cd799439011";
const ORG_ID = "507f1f77bcf86cd799439022";

const member = vi.hoisted(() => {
  process.env.RESEND_API_KEY ||= "re_dummy";
  process.env.STRIPE_SECRET_KEY ||= "sk_test_dummy";
  return { role: "viewer" };
});
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "member") return { findOne: async () => member };
      if (name === "organizationRole") {
        return { find: () => ({ toArray: async () => [] }) };
      }
      return { findOne: async () => null };
    },
  },
}));

vi.mock("@/src/lib/security", async (importOriginal) => ({
  ...(await importOriginal()),
  requireSession: vi.fn(async () => ({
    user: { id: USER_ID },
    cookieHeader: "session=x",
  })),
  requireActiveSubscription: vi.fn(async () => true),
}));

const backend = vi.fn(
  async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
);

beforeEach(() => {
  backend.mockClear();
  vi.stubGlobal("fetch", backend);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const ROUTES = [
  ["disconnect", "POST", "/api/banking-connect/disconnect"],
  ["bridge/connect", "GET", "/api/banking-connect/bridge/connect?providerId=1"],
  ["bridge/reconnect", "GET", "/api/banking-connect/bridge/reconnect?itemId=1"],
];

async function call(path, method, url) {
  const mod = await import(`@/app/api/banking-connect/${path}/route`);
  return mod[method](
    new NextRequest(`http://localhost${url}`, {
      method,
      headers: { "x-workspace-id": ORG_ID },
      body: method === "POST" ? "{}" : undefined,
    }),
  );
}

describe.each(ROUTES)("/api/banking-connect/%s", (path, method, url) => {
  it("refuse un Membre (lecture seule) sans appeler l'API", async () => {
    member.role = "viewer";
    const res = await call(path, method, url);
    expect(res.status).toBe(403);
    expect(backend).not.toHaveBeenCalled();
  });

  it("refuse un Comptable sans appeler l'API", async () => {
    member.role = "accountant";
    const res = await call(path, method, url);
    expect(res.status).toBe(403);
    expect(backend).not.toHaveBeenCalled();
  });

  it("laisse passer le super admin", async () => {
    member.role = "owner";
    await call(path, method, url);
    expect(backend).toHaveBeenCalled();
  });
});
