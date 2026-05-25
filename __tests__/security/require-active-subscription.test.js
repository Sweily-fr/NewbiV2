// @vitest-environment node
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

// Mock MongoDB — track collection name per call so the org branch (added in
// Lot 2 of the trial refonte) can be tested independently.
const mockSubFindOne = vi.fn();
const mockOrgFindOne = vi.fn();
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      if (name === "organization") return { findOne: mockOrgFindOne };
      // default: subscription
      return { findOne: mockSubFindOne };
    },
  },
}));

const { requireActiveSubscription } =
  await import("@/src/lib/security/require-active-subscription");

const VALID_ORG_ID = "507f1f77bcf86cd799439011";

describe("requireActiveSubscription", () => {
  beforeEach(() => {
    // Default: feature flag OFF (matches production today)
    process.env.ENABLE_APP_TRIAL = "false";
  });

  afterEach(() => {
    mockSubFindOne.mockReset();
    mockOrgFindOne.mockReset();
  });

  // Legacy compatibility alias used by the original tests below.
  const mockFindOne = mockSubFindOne;

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

  it("accepts past_due as active (Lot 5 décision #12 — grace period)", async () => {
    mockFindOne.mockResolvedValue({
      status: "past_due",
      plan: "pme",
    });
    const result = await requireActiveSubscription("user1", "org1");
    expect(result.active).toBe(true);
    expect(result.status).toBe("past_due");
    expect(result.plan).toBe("pme");
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

describe("requireActiveSubscription — app-managed trial (flag ON)", () => {
  const inFuture = (days) =>
    new Date(Date.now() + days * 86_400_000).toISOString();
  const inPast = (days) =>
    new Date(Date.now() - days * 86_400_000).toISOString();

  beforeEach(() => {
    process.env.ENABLE_APP_TRIAL = "true";
  });

  afterEach(() => {
    mockSubFindOne.mockReset();
    mockOrgFindOne.mockReset();
    process.env.ENABLE_APP_TRIAL = "false";
  });

  it("returns trialing shape when app-trial is active (no Stripe sub needed)", async () => {
    mockOrgFindOne.mockResolvedValue({
      isTrialActive: true,
      trialEndDate: inFuture(14),
    });
    mockSubFindOne.mockResolvedValue(null);

    const result = await requireActiveSubscription("user1", VALID_ORG_ID);
    expect(result.active).toBe(true);
    expect(result.status).toBe("trialing");
    expect(result.plan).toBe("freelance");
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(mockSubFindOne).not.toHaveBeenCalled();
  });

  it("app-trial wins over an invalid Stripe sub", async () => {
    mockOrgFindOne.mockResolvedValue({
      isTrialActive: true,
      trialEndDate: inFuture(14),
    });
    mockSubFindOne.mockResolvedValue({ status: "unpaid" });

    const result = await requireActiveSubscription("user1", VALID_ORG_ID);
    expect(result.active).toBe(true);
    expect(result.status).toBe("trialing");
    expect(mockSubFindOne).not.toHaveBeenCalled();
  });

  it("falls through to Stripe check when trial expired (date in the past)", async () => {
    mockOrgFindOne.mockResolvedValue({
      isTrialActive: true,
      trialEndDate: inPast(1),
    });
    mockSubFindOne.mockResolvedValue({
      status: "active",
      plan: "pme",
      periodEnd: new Date(Date.now() + 30 * 86_400_000),
    });

    const result = await requireActiveSubscription("user1", VALID_ORG_ID);
    expect(result.active).toBe(true);
    expect(result.status).toBe("active");
    expect(result.plan).toBe("pme");
  });

  it("falls through to Stripe when isTrialActive=false", async () => {
    mockOrgFindOne.mockResolvedValue({
      isTrialActive: false,
      trialEndDate: inFuture(14),
    });
    mockSubFindOne.mockResolvedValue({
      status: "active",
      plan: "freelance",
    });

    const result = await requireActiveSubscription("user1", VALID_ORG_ID);
    expect(result.active).toBe(true);
    expect(result.status).toBe("active");
  });

  it("throws 402 when trial expired AND no Stripe sub", async () => {
    mockOrgFindOne.mockResolvedValue({
      isTrialActive: true,
      trialEndDate: inPast(1),
    });
    mockSubFindOne.mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      await requireActiveSubscription("user1", VALID_ORG_ID);
      expect.fail("Should have thrown");
    } catch (response) {
      expect(response.status).toBe(402);
    }
    console.error.mockRestore();
  });

  it("does not regress when org lookup throws (falls through to Stripe)", async () => {
    mockOrgFindOne.mockRejectedValue(new Error("transient mongo"));
    mockSubFindOne.mockResolvedValue({
      status: "active",
      plan: "freelance",
    });

    const result = await requireActiveSubscription("user1", VALID_ORG_ID);
    expect(result.active).toBe(true);
    expect(result.status).toBe("active");
  });
});

describe("requireActiveSubscription — flag OFF ignores trial fields", () => {
  // Critical non-regression: when the feature flag is OFF, a user with trial
  // data in the org collection but no Stripe sub should NOT be considered
  // active. The new branch must be a strict no-op.
  beforeEach(() => {
    process.env.ENABLE_APP_TRIAL = "false";
  });

  afterEach(() => {
    mockSubFindOne.mockReset();
    mockOrgFindOne.mockReset();
  });

  it("ignores active trial in org doc when flag is OFF", async () => {
    mockOrgFindOne.mockResolvedValue({
      isTrialActive: true,
      trialEndDate: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    });
    mockSubFindOne.mockResolvedValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      await requireActiveSubscription("user1", VALID_ORG_ID);
      expect.fail("Should have thrown");
    } catch (response) {
      expect(response.status).toBe(402);
    }
    // The org lookup must NOT have been performed at all when the flag is OFF.
    expect(mockOrgFindOne).not.toHaveBeenCalled();
    console.error.mockRestore();
  });
});
