// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

// Ordre des espaces dans le sélecteur : seules les adhésions de l'utilisateur
// connecté changent, et une saisie mal formée est refusée sans erreur serveur.

const m = vi.hoisted(() => ({ getSession: vi.fn(), updateOne: vi.fn() }));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => m.getSession(...args) } },
}));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: { collection: () => ({ updateOne: m.updateOne }) },
}));

const { POST } = await import("@/app/api/organization/reorder/route");

const userId = "507f1f77bcf86cd799439011";
const call = (body) =>
  POST(
    new Request("http://localhost/api/organization/reorder", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  m.getSession.mockResolvedValue({ user: { id: userId } });
  m.updateOne.mockResolvedValue({ matchedCount: 1 });
});

describe("POST /api/organization/reorder", () => {
  it("sans session : 401", async () => {
    m.getSession.mockResolvedValue(null);
    expect((await call({ organizationIds: [] })).status).toBe(401);
  });

  it.each([
    ["identifiant mal formé", ["pas-un-id"]],
    ["objet à la place d'un identifiant", [{ $ne: null }]],
    ["nombre", [42]],
  ])("%s : 400, rien d'écrit", async (_cas, organizationIds) => {
    const res = await call({ organizationIds });
    expect(res.status).toBe(400);
    expect(m.updateOne).not.toHaveBeenCalled();
  });

  it("chaque mise à jour ne vise que les adhésions de l'utilisateur connecté", async () => {
    const a = new ObjectId().toHexString();
    const b = new ObjectId().toHexString();
    const res = await call({ organizationIds: [a, b] });
    expect(res.status).toBe(200);
    expect(m.updateOne).toHaveBeenCalledTimes(2);
    for (const [filter, update] of m.updateOne.mock.calls) {
      expect(String(filter.userId)).toBe(userId);
      expect(Object.keys(update.$set)).toEqual(["order"]);
    }
  });
});
