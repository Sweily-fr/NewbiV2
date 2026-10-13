// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSession = vi.fn();
vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => mockGetSession(...args) } },
}));
vi.mock("@/src/lib/mongodb", () => ({ mongoDb: {} }));
const mockFindManager = vi.fn();
vi.mock("@/src/lib/managed-clients", () => ({
  findAccountManagerByUserId: (...args) => mockFindManager(...args),
}));

import { GET } from "@/app/auth/apres-connexion/route";

const request = () =>
  new Request("https://www.newbi.fr/auth/apres-connexion", {
    headers: { cookie: "better-auth.session_token=x" },
  });
const target = (response) => new URL(response.headers.get("location")).pathname;

beforeEach(() => {
  mockGetSession.mockReset();
  mockFindManager.mockReset();
});

describe("GET /auth/apres-connexion (retour Google / Apple)", () => {
  it("envoie un cabinet sur son espace gestionnaire", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    mockFindManager.mockResolvedValue({ _id: "m1", status: "active" });
    const response = await GET(request());
    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(target(response)).toBe("/dashboard/gestionnaire");
  });

  it("envoie les autres sur le tableau de bord", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u2" } });
    mockFindManager.mockResolvedValue(null);
    expect(target(await GET(request()))).toBe("/dashboard");
  });

  it("sans session ou en cas d'erreur : tableau de bord (qui vérifie)", async () => {
    mockGetSession.mockResolvedValue(null);
    expect(target(await GET(request()))).toBe("/dashboard");
    expect(mockFindManager).not.toHaveBeenCalled();

    mockGetSession.mockRejectedValue(new Error("Mongo injoignable"));
    expect(target(await GET(request()))).toBe("/dashboard");
  });
});
