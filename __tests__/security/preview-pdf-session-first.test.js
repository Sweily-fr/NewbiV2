// @vitest-environment node
//
// POST /api/invoices/preview-pdf (aperçu PDF d'une facture non enregistrée,
// utilisé par l'application) : la session est vérifiée avant le corps de la
// requête. Sans session, 401 quel que soit le corps, et aucun navigateur
// n'est lancé.
import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({ sessionUser: null, launches: 0 }));

vi.mock("@/src/lib/security/require-session", async () => {
  const { apiError } = await import("@/src/lib/security/api-error");
  return {
    requireSession: async () => {
      if (!state.sessionUser) throw apiError(401, "Non authentifié");
      return { user: state.sessionUser };
    },
  };
});

vi.mock("@/src/lib/puppeteer", () => ({
  launchBrowser: async () => {
    state.launches += 1;
    throw new Error("navigateur non disponible en test");
  },
  securePdfPage: async () => {},
}));

const appel = async (body) => {
  const { POST } = await import("@/app/api/invoices/preview-pdf/route");
  return POST(
    new Request("http://localhost/api/invoices/preview-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
};

beforeEach(() => {
  state.sessionUser = null;
  state.launches = 0;
});

describe("POST /api/invoices/preview-pdf", () => {
  for (const [cas, body] of [
    ["sans données", {}],
    ["sans article", { invoiceData: { items: [], client: { name: "C" } } }],
    [
      "avec une facture complète",
      { invoiceData: { items: [{ description: "A" }], client: { name: "C" } } },
    ],
  ]) {
    it(`sans session : 401 ${cas}, aucun navigateur lancé`, async () => {
      const res = await appel(body);
      expect(res.status).toBe(401);
      expect(state.launches).toBe(0);
    });
  }

  it("avec une session : le corps est vérifié (400 sans article)", async () => {
    state.sessionUser = { id: "u1" };
    const res = await appel({
      invoiceData: { items: [], client: { name: "C" } },
    });
    expect(res.status).toBe(400);
  });
});
