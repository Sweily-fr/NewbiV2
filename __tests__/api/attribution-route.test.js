// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * POST /api/attribution : une inscription venue du référencement naturel n'a
 * ni UTM ni gclid, seulement une page d'arrivée, un site d'origine et une
 * dernière page. Elle doit être enregistrée, pas refusée.
 */

const updateOne = vi.fn(async () => ({ modifiedCount: 1 }));
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: { collection: () => ({ updateOne }) },
}));

const USER_ID = "507f1f77bcf86cd799439011";
vi.mock("@/src/lib/security", () => ({
  requireSession: vi.fn(async () => ({
    user: { id: USER_ID, email: "a@b.fr" },
  })),
  toObjectId: (id) => `oid(${id})`,
  withErrorHandler: (h) => h,
  apiError: (status, message) =>
    new Response(JSON.stringify({ error: message }), { status }),
}));

const { POST } = await import("@/app/api/attribution/route");

const post = (body) =>
  POST(
    new Request("http://localhost/api/attribution", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("POST /api/attribution", () => {
  it("enregistre une inscription venue de Google naturel", async () => {
    const res = await post({
      landingPage: "/blog/facturer-en-sous-traitance-regles",
      referrer: "https://www.google.com/",
      lastPage: "/blog/facturer-en-sous-traitance-regles",
      capturedAt: 1761900000000,
      lastPageAt: 1761900100000,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ recorded: true });
    const [filter, update] = updateOne.mock.calls[0];
    expect(filter).toEqual({
      _id: `oid(${USER_ID})`,
      acquisition: { $exists: false },
    });
    expect(update.$set.acquisition).toMatchObject({
      landingPage: "/blog/facturer-en-sous-traitance-regles",
      referrer: "https://www.google.com/",
      lastPage: "/blog/facturer-en-sous-traitance-regles",
    });
    expect(update.$set.acquisition.lastPageAt).toBeInstanceOf(Date);
    expect(update.$set.acquisition.capturedAt).toBeInstanceOf(Date);
  });

  it("enregistre un accès direct réduit à la dernière page", async () => {
    const res = await post({ lastPage: "/tarifs", capturedAt: 1761900000000 });
    expect(res.status).toBe(200);
    expect(updateOne).toHaveBeenCalledTimes(1);
  });

  it("refuse un envoi sans aucune donnée", async () => {
    const res = await post({ capturedAt: 1761900000000, lastPageAt: 1 });
    expect(res.status).toBe(400);
    expect(updateOne).not.toHaveBeenCalled();
  });

  it("refuse un champ inconnu", async () => {
    const res = await post({ lastPage: "/tarifs", email: "a@b.fr" });
    expect(res.status).toBe(400);
  });
});
