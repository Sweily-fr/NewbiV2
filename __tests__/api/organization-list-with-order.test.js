// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObjectId } from "mongodb";

// ─── Mocks ──────────────────────────────────────────────────────────────────
const mockGetSession = vi.fn();
vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => mockGetSession(...args) } },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Map()),
}));

const mockMembers = vi.fn();
const mockOrganizations = vi.fn();
const mockSubscriptions = vi.fn();

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: (name) => {
      const findChain = (data) => ({
        toArray: vi.fn().mockResolvedValue(data),
      });
      if (name === "member") return { find: () => findChain(mockMembers()) };
      if (name === "organization")
        return { find: () => findChain(mockOrganizations()) };
      if (name === "subscription")
        return { find: () => findChain(mockSubscriptions()) };
      return { find: () => findChain([]) };
    },
  },
}));

const { GET } = await import("@/app/api/organization/list-with-order/route");

const userId = "507f1f77bcf86cd799439011";
const orgIdA = new ObjectId();

function setupSession() {
  mockGetSession.mockResolvedValue({ user: { id: userId } });
}

const inFuture = (days) =>
  new Date(Date.now() + days * 86_400_000).toISOString();

beforeEach(() => {
  setupSession();
  mockMembers.mockReturnValue([
    {
      userId: new ObjectId(userId),
      organizationId: orgIdA,
      order: 0,
      role: "owner",
    },
  ]);
  mockSubscriptions.mockReturnValue([]);
});

afterEach(() => {
  delete process.env.ENABLE_APP_TRIAL;
  vi.clearAllMocks();
});

describe("/api/organization/list-with-order — app trial recognition", () => {
  it("returns 'none' when flag OFF and no Stripe sub (legacy behaviour)", async () => {
    process.env.ENABLE_APP_TRIAL = "false";
    mockOrganizations.mockReturnValue([
      {
        _id: orgIdA,
        name: "Acme",
        isTrialActive: true,
        trialEndDate: inFuture(30),
      },
    ]);
    const res = await GET();
    const body = await res.json();
    expect(body.organizations[0].subscriptionStatus).toBe("none");
    expect(body.organizations[0].trialEndDate).toBeNull();
  });

  it("returns 'trialing' when flag ON and org has active app trial", async () => {
    process.env.ENABLE_APP_TRIAL = "true";
    const trialEnd = inFuture(30);
    mockOrganizations.mockReturnValue([
      {
        _id: orgIdA,
        name: "Acme",
        isTrialActive: true,
        trialEndDate: trialEnd,
      },
    ]);
    const res = await GET();
    const body = await res.json();
    expect(body.organizations[0].subscriptionStatus).toBe("trialing");
    expect(body.organizations[0].trialEndDate).toBe(trialEnd);
  });

  it("returns 'none' when flag ON but trial expired", async () => {
    process.env.ENABLE_APP_TRIAL = "true";
    mockOrganizations.mockReturnValue([
      {
        _id: orgIdA,
        name: "Acme",
        isTrialActive: true,
        trialEndDate: new Date(Date.now() - 86_400_000).toISOString(),
      },
    ]);
    const res = await GET();
    const body = await res.json();
    expect(body.organizations[0].subscriptionStatus).toBe("none");
  });

  it("returns 'active' (Stripe wins) even when org has active app trial", async () => {
    process.env.ENABLE_APP_TRIAL = "true";
    mockOrganizations.mockReturnValue([
      {
        _id: orgIdA,
        name: "Acme",
        isTrialActive: true,
        trialEndDate: inFuture(30),
      },
    ]);
    mockSubscriptions.mockReturnValue([
      { referenceId: orgIdA.toString(), status: "active" },
    ]);
    const res = await GET();
    const body = await res.json();
    expect(body.organizations[0].subscriptionStatus).toBe("active");
    // trialEndDate suppressed when Stripe sub wins
    expect(body.organizations[0].trialEndDate).toBeNull();
  });

  it("returns 'expired' for Stripe sub canceled+expired even when flag ON (no app trial)", async () => {
    process.env.ENABLE_APP_TRIAL = "true";
    mockOrganizations.mockReturnValue([
      { _id: orgIdA, name: "Acme", isTrialActive: false, trialEndDate: null },
    ]);
    mockSubscriptions.mockReturnValue([
      {
        referenceId: orgIdA.toString(),
        status: "canceled",
        periodEnd: new Date(Date.now() - 86_400_000),
      },
    ]);
    const res = await GET();
    const body = await res.json();
    expect(body.organizations[0].subscriptionStatus).toBe("expired");
  });
});
