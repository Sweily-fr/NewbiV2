// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

const m = vi.hoisted(() => ({
  getSession: vi.fn(),
  orgFindOne: vi.fn(),
  memberFindOne: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => m.getSession(...args) } },
}));
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) =>
      name === "organization"
        ? { findOne: m.orgFindOne }
        : { findOne: m.memberFindOne },
  },
}));

describe("GET /api/check-siret", () => {
  it("ne révèle pas le nom de l'espace qui porte le SIRET", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    m.getSession.mockResolvedValue({
      user: { id: "507f1f77bcf86cd799439011" },
    });
    m.orgFindOne.mockResolvedValue({
      _id: "507f1f77bcf86cd799439022",
      name: "Espace secret",
      companyName: "Société X",
    });
    m.memberFindOne.mockResolvedValue(null);

    const { GET } = await import("@/app/api/check-siret/route");
    const res = await GET(
      new Request("http://localhost/api/check-siret?siret=12345678900011"),
    );
    const body = await res.json();
    expect(body.available).toBe(false);
    expect(JSON.stringify(body)).not.toContain("Espace secret");
    expect(JSON.stringify(body)).not.toContain("Société X");
  });
});
