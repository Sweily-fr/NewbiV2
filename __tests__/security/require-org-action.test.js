// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";

// Membre (collection member) et rôles enregistrés (organizationRole)
const mockFindOne = vi.fn();
const mockStoredRoles = vi.fn(async () => []);
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: () => ({
      findOne: mockFindOne,
      find: () => ({ toArray: mockStoredRoles }),
    }),
  },
}));

const { requireOrgAction } =
  await import("@/src/lib/security/require-org-action");

const userId = "aabbccddeeff00112233aabb";
const orgId = "aabbccddeeff00112233aacc";

const expectForbidden = async (promise) => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    await promise;
    expect.fail("Doit refuser");
  } catch (response) {
    expect(response.status).toBe(403);
  } finally {
    console.error.mockRestore();
  }
};

describe("requireOrgAction", () => {
  afterEach(() => {
    mockFindOne.mockReset();
    mockStoredRoles.mockReset();
    mockStoredRoles.mockResolvedValue([]);
  });

  it("refuse un utilisateur qui n'est pas membre", async () => {
    mockFindOne.mockResolvedValue(null);
    await expectForbidden(
      requireOrgAction(userId, orgId, "integrations", "manage"),
    );
  });

  it("accepte le super admin", async () => {
    mockFindOne.mockResolvedValue({ role: "owner" });
    await expect(
      requireOrgAction(userId, orgId, "billing", "manage"),
    ).resolves.toEqual({ role: "owner" });
  });

  it("applique les droits par défaut des rôles prédéfinis", async () => {
    mockFindOne.mockResolvedValue({ role: "admin" });
    await expect(
      requireOrgAction(userId, orgId, "integrations", "manage"),
    ).resolves.toEqual({ role: "admin" });
    // L'administrateur ne fait que voir l'abonnement
    await expectForbidden(requireOrgAction(userId, orgId, "billing", "manage"));
  });

  it("refuse un rôle qui n'a que « Voir » sur la page", async () => {
    mockFindOne.mockResolvedValue({ role: "role_lecture" });
    mockStoredRoles.mockResolvedValue([
      { role: "role_lecture", actions: { integrations: ["view"] } },
    ]);
    await expectForbidden(
      requireOrgAction(userId, orgId, "integrations", "manage"),
    );
  });

  it("accepte un rôle personnalisé qui a l'action", async () => {
    mockFindOne.mockResolvedValue({ role: "role_compta" });
    mockStoredRoles.mockResolvedValue([
      { role: "role_compta", actions: { integrations: ["view", "manage"] } },
    ]);
    await expect(
      requireOrgAction(userId, orgId, "integrations", "manage"),
    ).resolves.toEqual({ role: "role_compta" });
  });
});
