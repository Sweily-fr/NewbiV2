// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { ObjectId } from "mongodb";

// Mock MongoDB
const mockFindOne = vi.fn();
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: () => ({ findOne: mockFindOne }),
  },
}));

const { requireOrgMembership } =
  await import("@/src/lib/security/require-org-membership");

describe("requireOrgMembership", () => {
  afterEach(() => {
    mockFindOne.mockReset();
  });

  it("returns { role, organizationId } when user is a member", async () => {
    const orgId = new ObjectId();
    mockFindOne.mockResolvedValue({
      userId: new ObjectId(),
      organizationId: orgId,
      role: "admin",
    });

    const result = await requireOrgMembership(
      "aabbccddeeff00112233aabb",
      orgId.toHexString(),
    );
    expect(result.role).toBe("admin");
    expect(result.organizationId).toBeInstanceOf(ObjectId);
  });

  it("throws 403 when user is not a member of the organization", async () => {
    mockFindOne.mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      await requireOrgMembership(
        "aabbccddeeff00112233aabb",
        "aabbccddeeff00112233aabb",
      );
      expect.fail("Should have thrown");
    } catch (response) {
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe("Non autorisé");
    }

    console.error.mockRestore();
  });

  it("throws 403 when user has insufficient role (e.g., viewer for owner-only action)", async () => {
    mockFindOne.mockResolvedValue({ role: "viewer" });
    vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      await requireOrgMembership(
        "aabbccddeeff00112233aabb",
        "aabbccddeeff00112233aabb",
        ["owner", "admin"],
      );
      expect.fail("Should have thrown");
    } catch (response) {
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe("Rôle insuffisant");
    }

    console.error.mockRestore();
  });

  it("accepts requiredRole as a single string", async () => {
    mockFindOne.mockResolvedValue({ role: "owner" });

    const result = await requireOrgMembership(
      "aabbccddeeff00112233aabb",
      "aabbccddeeff00112233aabb",
      "owner",
    );
    expect(result.role).toBe("owner");
  });

  it("accepts requiredRole as an array of strings (any match passes)", async () => {
    mockFindOne.mockResolvedValue({ role: "admin" });

    const result = await requireOrgMembership(
      "aabbccddeeff00112233aabb",
      "aabbccddeeff00112233aabb",
      ["owner", "admin"],
    );
    expect(result.role).toBe("admin");
  });

  it("accepts string userId and converts to ObjectId internally", async () => {
    mockFindOne.mockResolvedValue({ role: "member" });

    const result = await requireOrgMembership(
      "aabbccddeeff00112233aabb",
      "aabbccddeeff00112233aabb",
    );
    expect(result.role).toBe("member");

    // Verify findOne was called with ObjectId, not string
    const callArgs = mockFindOne.mock.calls[0][0];
    expect(callArgs.userId).toBeInstanceOf(ObjectId);
  });

  it("accepts ObjectId userId as pass-through", async () => {
    const userId = new ObjectId();
    mockFindOne.mockResolvedValue({ role: "member" });

    await requireOrgMembership(userId, "aabbccddeeff00112233aabb");

    const callArgs = mockFindOne.mock.calls[0][0];
    expect(callArgs.userId).toBe(userId); // Same reference
  });

  it("accepts string orgId and converts to ObjectId internally", async () => {
    mockFindOne.mockResolvedValue({ role: "member" });

    await requireOrgMembership(
      "aabbccddeeff00112233aabb",
      "aabbccddeeff00112233aabb",
    );

    const callArgs = mockFindOne.mock.calls[0][0];
    expect(callArgs.organizationId).toBeInstanceOf(ObjectId);
  });

  it("accepts ObjectId orgId as pass-through", async () => {
    const orgId = new ObjectId();
    mockFindOne.mockResolvedValue({ role: "member" });

    const result = await requireOrgMembership(
      "aabbccddeeff00112233aabb",
      orgId,
    );
    expect(result.organizationId).toBe(orgId); // Same reference
  });

  it("normalizes role to lowercase before comparison", async () => {
    mockFindOne.mockResolvedValue({ role: "Owner" }); // DB might store capitalized

    const result = await requireOrgMembership(
      "aabbccddeeff00112233aabb",
      "aabbccddeeff00112233aabb",
      "owner",
    );
    expect(result.role).toBe("owner");
  });
});
