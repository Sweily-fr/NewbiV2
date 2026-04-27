// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";

// Mock MongoDB
const mockFindOne = vi.fn();
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: () => ({ findOne: mockFindOne }),
  },
}));

const { requireActiveSubscription } =
  await import("@/src/lib/security/require-active-subscription");

describe("requireActiveSubscription", () => {
  afterEach(() => {
    mockFindOne.mockReset();
  });

  it("returns subscription details when status is 'active'", async () => {
    mockFindOne.mockResolvedValue({
      status: "active",
      plan: "pme",
      periodEnd: new Date("2027-01-01"),
    });

    const result = await requireActiveSubscription("user1", "org1");
    expect(result.active).toBe(true);
    expect(result.plan).toBe("pme");
    expect(result.status).toBe("active");
  });

  it("returns subscription details when status is 'trialing'", async () => {
    mockFindOne.mockResolvedValue({
      status: "trialing",
      plan: "freelance",
      periodEnd: new Date("2027-06-01"),
    });

    const result = await requireActiveSubscription("user1", "org1");
    expect(result.active).toBe(true);
    expect(result.status).toBe("trialing");
  });

  it("returns subscription details when status is 'canceled' but periodEnd is in the future", async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    mockFindOne.mockResolvedValue({
      status: "canceled",
      plan: "entreprise",
      periodEnd: futureDate,
    });

    const result = await requireActiveSubscription("user1", "org1");
    expect(result.active).toBe(true);
    expect(result.status).toBe("canceled");
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("throws 402 when no subscription exists for the organization", async () => {
    mockFindOne.mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      await requireActiveSubscription("user1", "org1");
      expect.fail("Should have thrown");
    } catch (response) {
      expect(response.status).toBe(402);
      const body = await response.json();
      expect(body.error).toBe("Aucun abonnement actif");
    }

    console.error.mockRestore();
  });

  it("throws 402 when subscription status is 'canceled' and periodEnd is in the past", async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    mockFindOne.mockResolvedValue({
      status: "canceled",
      plan: "freelance",
      periodEnd: pastDate,
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      await requireActiveSubscription("user1", "org1");
      expect.fail("Should have thrown");
    } catch (response) {
      expect(response.status).toBe(402);
    }

    console.error.mockRestore();
  });

  it("throws 402 when subscription status is 'past_due'", async () => {
    mockFindOne.mockResolvedValue({
      status: "past_due",
      plan: "pme",
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      await requireActiveSubscription("user1", "org1");
      expect.fail("Should have thrown");
    } catch (response) {
      expect(response.status).toBe(402);
    }

    console.error.mockRestore();
  });

  it("throws 402 when subscription status is 'incomplete'", async () => {
    mockFindOne.mockResolvedValue({
      status: "incomplete",
      plan: "freelance",
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      await requireActiveSubscription("user1", "org1");
      expect.fail("Should have thrown");
    } catch (response) {
      expect(response.status).toBe(402);
    }

    console.error.mockRestore();
  });
});
