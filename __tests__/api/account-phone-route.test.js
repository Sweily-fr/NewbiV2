// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

/**
 * PATCH /api/account/phone : numéro du profil de l'utilisateur connecté
 * seulement, valeur contrôlée, jamais présentée comme vérifiée.
 */

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  userUpdateOne: vi.fn(async () => ({ modifiedCount: 1 })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...a) => m.getSession(...a) } },
}));
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "user") return { updateOne: m.userUpdateOne };
      throw new Error(`Collection inattendue : ${name}`);
    },
  },
}));

const userId = new ObjectId().toString();
const autreId = new ObjectId().toString();

const patch = async (body, { brut = false } = {}) => {
  const { PATCH } = await import("@/app/api/account/phone/route");
  return PATCH(
    new Request("http://localhost/api/account/phone", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: brut ? body : JSON.stringify(body),
    }),
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  m.getSession.mockResolvedValue({ user: { id: userId }, session: {} });
});

describe("PATCH /api/account/phone", () => {
  it("sans session : 401, rien d'enregistré", async () => {
    m.getSession.mockResolvedValue(null);
    expect((await patch({ phoneNumber: "06 12 34 56 78" })).status).toBe(401);
    expect(m.userUpdateOne).not.toHaveBeenCalled();
  });

  for (const [cas, phoneNumber] of [
    ["balise HTML", "<img src=x onerror=1>"],
    ["40 chiffres", "1".repeat(40)],
    ["lettres", "06 AB CD EF GH"],
    ["trop court", "12 34"],
    ["objet", { $ne: "" }],
    ["vide", ""],
  ]) {
    it(`${cas} : 400 avec un message, rien d'enregistré`, async () => {
      const res = await patch({ phoneNumber });
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/téléphone invalide/i);
      expect(m.userUpdateOne).not.toHaveBeenCalled();
    });
  }

  it("JSON invalide : 400", async () => {
    expect((await patch("{x", { brut: true })).status).toBe(400);
    expect(m.userUpdateOne).not.toHaveBeenCalled();
  });

  for (const [saisi, attendu] of [
    ["+33 6 12 34 56 78", "+33 6 12 34 56 78"],
    ["  06 12 34 56 78  ", "06 12 34 56 78"],
    ["06.12.34.56.78", "06.12.34.56.78"],
  ]) {
    it(`« ${saisi.trim()} » : enregistré, non vérifié`, async () => {
      const res = await patch({ phoneNumber: saisi });
      expect(res.status).toBe(200);
      expect((await res.json()).phoneNumber).toBe(attendu);
      const [filtre, maj] = m.userUpdateOne.mock.calls[0];
      expect(maj.$set).toMatchObject({
        phoneNumber: attendu,
        phoneNumberVerified: false,
      });
      expect(Object.keys(maj.$set).sort()).toEqual([
        "phoneNumber",
        "phoneNumberVerified",
        "updatedAt",
      ]);
      expect(String(filtre._id)).toBe(userId);
    });
  }

  it("identifiant d'un autre compte dans le corps : ignoré, seul l'utilisateur connecté est modifié", async () => {
    await patch({
      phoneNumber: "06 12 34 56 78",
      userId: autreId,
      id: autreId,
      phoneNumberVerified: true,
    });
    const [filtre, maj] = m.userUpdateOne.mock.calls[0];
    expect(String(filtre._id)).toBe(userId);
    expect(maj.$set.phoneNumberVerified).toBe(false);
  });
});
