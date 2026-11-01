// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * Réglages de session de l'espace (durée, inactivité, nombre de sessions) :
 * réservés au rôle qui « Modifie » l'entreprise, valeurs de la liste
 * seulement, rien d'enregistré sur un refus.
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  getAccountActions: vi.fn(),
  orgUpdateOne: vi.fn(async () => ({ modifiedCount: 1 })),
  orgFindOne: vi.fn(async () => ({ sessionSettings: {} })),
  enforceSessionLimit: vi.fn(async () => ({ revokedCount: 0 })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...a) => m.getSession(...a) } },
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/src/lib/organization-roles", () => ({
  getAccountActions: (...a) => m.getAccountActions(...a),
}));
vi.mock("@/src/lib/enforce-session-limit", () => ({
  enforceSessionLimit: (...a) => m.enforceSessionLimit(...a),
}));
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "organization")
        return { updateOne: m.orgUpdateOne, findOne: m.orgFindOne };
      throw new Error(`Collection inattendue : ${name}`);
    },
  },
}));

const userId = new ObjectId().toString();
const orgId = new ObjectId().toString();

const put = async (body, { brut = false } = {}) => {
  const { PUT } = await import("@/app/api/session-settings/route");
  return PUT(
    new Request("http://localhost/api/session-settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: brut ? body : JSON.stringify(body),
    }),
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  m.getSession.mockResolvedValue({
    user: { id: userId },
    session: { token: "tok", activeOrganizationId: orgId },
  });
  m.getAccountActions.mockResolvedValue({
    role: "owner",
    actions: ["view", "edit"],
  });
});

describe("PUT /api/session-settings : qui peut modifier", () => {
  it("sans session : 401, rien d'enregistré", async () => {
    m.getSession.mockResolvedValue(null);
    expect((await put({ maxSessions: 2 })).status).toBe(401);
    expect(m.orgUpdateOne).not.toHaveBeenCalled();
  });

  it("sans espace actif : 400", async () => {
    m.getSession.mockResolvedValue({ user: { id: userId }, session: {} });
    expect((await put({ maxSessions: 2 })).status).toBe(400);
    expect(m.orgUpdateOne).not.toHaveBeenCalled();
  });

  it("Membre (lecture seule) : 403, rien d'enregistré", async () => {
    m.getAccountActions.mockResolvedValue({
      role: "viewer",
      actions: ["view"],
    });
    expect((await put({ sessionDuration: 7 })).status).toBe(403);
    expect(m.orgUpdateOne).not.toHaveBeenCalled();
  });

  it("rôle personnalisé sans « Modifier » l'entreprise : 403", async () => {
    m.getAccountActions.mockResolvedValue({ role: "role_perso", actions: [] });
    expect((await put({ inactivityTimeout: 1 })).status).toBe(403);
    expect(m.orgUpdateOne).not.toHaveBeenCalled();
  });

  it("personne qui n'est pas membre de l'espace : 403", async () => {
    m.getAccountActions.mockResolvedValue({ role: null, actions: [] });
    expect((await put({ maxSessions: 1 })).status).toBe(403);
    expect(m.orgUpdateOne).not.toHaveBeenCalled();
  });

  it("droits lus sur l'espace actif de la session", async () => {
    await put({ maxSessions: 2 });
    expect(m.getAccountActions.mock.calls[0][1]).toMatchObject({
      userId,
      organizationId: orgId,
      moduleKey: "orgSettings",
    });
  });
});

describe("PUT /api/session-settings : valeurs", () => {
  for (const [cas, body] of [
    ["durée de 365 jours", { sessionDuration: 365 }],
    ["aucune limite de sessions (0)", { maxSessions: 0 }],
    ["texte après un nombre (« 1; x »)", { inactivityTimeout: "1; x" }],
    ["nombre suivi de lettres (« 7jours »)", { sessionDuration: "7jours" }],
    ["objet à la place d'un nombre", { maxSessions: { $gt: 0 } }],
    ["tableau", { maxSessions: [1] }],
    [
      "valeur valide accompagnée d'une valeur refusée",
      { maxSessions: 2, sessionDuration: 365 },
    ],
  ]) {
    it(`${cas} : 400, rien d'enregistré`, async () => {
      expect((await put(body)).status).toBe(400);
      expect(m.orgUpdateOne).not.toHaveBeenCalled();
    });
  }

  it("JSON invalide : 400 (pas d'erreur serveur)", async () => {
    expect((await put("{pas du json", { brut: true })).status).toBe(400);
    expect(m.orgUpdateOne).not.toHaveBeenCalled();
  });

  it("corps vide : 400", async () => {
    expect((await put({})).status).toBe(400);
  });

  it("champ inconnu ignoré, jamais enregistré", async () => {
    const res = await put({
      maxSessions: 2,
      "sessionSettings.$where": "x",
      role: "owner",
    });
    expect(res.status).toBe(200);
    expect(m.orgUpdateOne.mock.calls[0][1]).toEqual({
      $set: { "sessionSettings.maxSessions": 2 },
    });
  });

  it("valeurs de la liste : enregistrées sur l'espace actif seulement", async () => {
    const res = await put({
      sessionDuration: 90,
      inactivityTimeout: 0.25,
      maxSessions: 1,
    });
    expect(res.status).toBe(200);
    const [filtre, maj] = m.orgUpdateOne.mock.calls[0];
    expect(String(filtre._id)).toBe(orgId);
    expect(maj).toEqual({
      $set: {
        "sessionSettings.sessionDuration": 90,
        "sessionSettings.inactivityTimeout": 0.25,
        "sessionSettings.maxSessions": 1,
      },
    });
    // Nouvelle limite appliquée aux sessions de l'utilisateur
    expect(m.enforceSessionLimit).toHaveBeenCalledWith(
      expect.objectContaining({ maxSessions: 1 }),
    );
  });

  it("nombre écrit en texte (« 30 ») : accepté comme 30", async () => {
    expect((await put({ sessionDuration: "30" })).status).toBe(200);
    expect(m.orgUpdateOne.mock.calls[0][1]).toEqual({
      $set: { "sessionSettings.sessionDuration": 30 },
    });
  });
});
