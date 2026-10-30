// @vitest-environment node
//
// POST /api/gestionnaire/clients/:id/payeur : la session est vérifiée avant
// le corps de la requête (401 sans session, quel que soit le corps), et un
// cabinet suspendu peut arrêter de payer mais pas prendre en charge.
import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => {
  process.env.RESEND_API_KEY ||= "re_dummy";
  return { sessionUser: null, manager: null, calls: [] };
});

vi.mock("stripe", () => ({
  default: function StripeMock() {
    return {};
  },
}));

vi.mock("@/src/lib/mongodb", () => ({ mongoDb: {} }));

vi.mock("@/src/lib/managed-clients", async (importOriginal) => ({
  ...(await importOriginal()),
  findAccountManagerByUserId: async () => state.manager,
}));

vi.mock("@/src/lib/payer-switch", () => ({
  getPayerSwitchPreview: async () => ({}),
  takeOverSubscription: async () => {
    state.calls.push("takeOver");
    return { status: "active" };
  },
  handBackSubscription: async () => {
    state.calls.push("handBack");
    return { status: "done" };
  },
}));

vi.mock("@/src/lib/security/require-session", async () => {
  const { apiError } = await import("@/src/lib/security/api-error");
  return {
    requireSession: async () => {
      if (!state.sessionUser) throw apiError(401, "Non authentifié");
      return { user: state.sessionUser };
    },
  };
});

const appel = async (payload) => {
  const { POST } =
    await import("@/app/api/gestionnaire/clients/[id]/payeur/route");
  return POST(
    new Request("http://localhost/api/gestionnaire/clients/l1/payeur", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
    }),
    { params: Promise.resolve({ id: "l1" }) },
  );
};

beforeEach(() => {
  state.sessionUser = { id: "u1", email: "cabinet@x.fr" };
  state.manager = { _id: "m1", status: "active" };
  state.calls = [];
});

describe("POST /api/gestionnaire/clients/:id/payeur", () => {
  it("sans session : 401, même avec un corps invalide", async () => {
    state.sessionUser = null;
    expect((await appel("pas du json")).status).toBe(401);
    expect((await appel({ payer: "inconnu" })).status).toBe(401);
    expect(state.calls).toEqual([]);
  });

  it("connecté : un corps invalide ou un payeur inconnu répond 400", async () => {
    expect((await appel("pas du json")).status).toBe(400);
    expect((await appel({ payer: "inconnu" })).status).toBe(400);
    expect(state.calls).toEqual([]);
  });

  it("cabinet suspendu : il ne peut pas prendre en charge un abonnement", async () => {
    state.manager = { _id: "m1", status: "suspended" };
    expect((await appel({ payer: "manager", plan: "pme" })).status).toBe(403);
    expect(state.calls).toEqual([]);
  });

  it("cabinet suspendu : il peut encore arrêter de payer", async () => {
    state.manager = { _id: "m1", status: "suspended" };
    const res = await appel({ payer: "client" });
    expect(res.status).toBe(200);
    expect(state.calls).toEqual(["handBack"]);
  });

  it("cabinet actif : la prise en charge est lancée", async () => {
    const res = await appel({ payer: "manager", plan: "pme" });
    expect(res.status).toBe(200);
    expect(state.calls).toEqual(["takeOver"]);
  });
});
