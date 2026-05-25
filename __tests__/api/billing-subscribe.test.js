// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObjectId } from "mongodb";

// ─── Mocks (must precede the import of the route under test) ────────────────

const mockGetSession = vi.fn();
vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: (...args) => mockGetSession(...args) } },
}));

const mockMongoFindOne = vi.fn();
const mockMongoUpdateOne = vi.fn();
vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: () => ({
      findOne: mockMongoFindOne,
      updateOne: mockMongoUpdateOne,
    }),
  },
}));

const mockStripeCreateCustomer = vi.fn();
const mockStripeCreateCheckout = vi.fn();
vi.mock("stripe", () => {
  function Stripe() {
    return {
      customers: { create: mockStripeCreateCustomer },
      checkout: { sessions: { create: mockStripeCreateCheckout } },
    };
  }
  return { default: Stripe };
});

const userId = "507f1f77bcf86cd799439011";
const orgId = "507f1f77bcf86cd799439022";

function buildRequest({
  body = { plan: "freelance", isAnnual: true },
  origin = "https://newbi.fr",
} = {}) {
  return {
    headers: new Headers({ origin }),
    json: async () => body,
  };
}

beforeEach(() => {
  mockGetSession.mockReset();
  mockMongoFindOne.mockReset();
  mockMongoUpdateOne.mockReset();
  mockStripeCreateCustomer.mockReset();
  mockStripeCreateCheckout.mockReset();

  process.env.STRIPE_FREELANCE_YEARLY_PRICE_ID = "price_test_freelance_y";
  process.env.STRIPE_FREELANCE_MONTHLY_PRICE_ID = "price_test_freelance_m";
  process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
});

afterEach(() => {
  delete process.env.ENABLE_APP_TRIAL;
});

describe("POST /api/billing/subscribe", () => {
  it("returns 404 when ENABLE_APP_TRIAL is OFF (legacy path active)", async () => {
    process.env.ENABLE_APP_TRIAL = "false";
    const { POST } = await import("@/app/api/billing/subscribe/route");
    const res = await POST(buildRequest());
    expect(res.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    process.env.ENABLE_APP_TRIAL = "true";
    mockGetSession.mockResolvedValue(null);
    const { POST } = await import("@/app/api/billing/subscribe/route");
    const res = await POST(buildRequest());
    expect(res.status).toBe(401);
  });

  it("returns 400 when no active organization", async () => {
    process.env.ENABLE_APP_TRIAL = "true";
    mockGetSession.mockResolvedValue({
      user: { id: userId, email: "u@x.fr" },
      session: { activeOrganizationId: null },
    });
    const { POST } = await import("@/app/api/billing/subscribe/route");
    const res = await POST(buildRequest());
    expect(res.status).toBe(400);
  });

  it("returns 400 when body is invalid", async () => {
    process.env.ENABLE_APP_TRIAL = "true";
    mockGetSession.mockResolvedValue({
      user: { id: userId, email: "u@x.fr" },
      session: { activeOrganizationId: orgId },
    });
    const { POST } = await import("@/app/api/billing/subscribe/route");
    const res = await POST(
      buildRequest({ body: { plan: "bogus", isAnnual: true } }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 403 when user is not member of the active org", async () => {
    process.env.ENABLE_APP_TRIAL = "true";
    mockGetSession.mockResolvedValue({
      user: { id: userId, email: "u@x.fr" },
      session: { activeOrganizationId: orgId },
    });
    mockMongoFindOne.mockResolvedValue(null);
    const { POST } = await import("@/app/api/billing/subscribe/route");
    const res = await POST(buildRequest());
    expect(res.status).toBe(403);
  });

  it("returns 403 when user is a regular member (not owner/admin)", async () => {
    process.env.ENABLE_APP_TRIAL = "true";
    mockGetSession.mockResolvedValue({
      user: { id: userId, email: "u@x.fr" },
      session: { activeOrganizationId: orgId },
    });
    mockMongoFindOne.mockResolvedValue({
      userId: new ObjectId(userId),
      organizationId: new ObjectId(orgId),
      role: "member",
    });
    const { POST } = await import("@/app/api/billing/subscribe/route");
    const res = await POST(buildRequest());
    expect(res.status).toBe(403);
  });

  it("returns 200 with checkout URL for owner — no Stripe trial, no pending_org_data", async () => {
    process.env.ENABLE_APP_TRIAL = "true";
    mockGetSession.mockResolvedValue({
      user: { id: userId, email: "u@x.fr", stripeCustomerId: "cus_xxx" },
      session: { activeOrganizationId: orgId },
    });
    mockMongoFindOne.mockResolvedValue({
      userId: new ObjectId(userId),
      organizationId: new ObjectId(orgId),
      role: "owner",
    });
    mockStripeCreateCheckout.mockResolvedValue({
      url: "https://checkout.stripe.com/c/xyz",
    });

    const { POST } = await import("@/app/api/billing/subscribe/route");
    const res = await POST(buildRequest());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.url).toBe("https://checkout.stripe.com/c/xyz");

    // Verify no Stripe trial requested + no isNewOrganization=true.
    // Stripe minimum is 1 day, so "no trial" means the field is OMITTED.
    const callArgs = mockStripeCreateCheckout.mock.calls[0][0];
    expect(callArgs.subscription_data.trial_period_days).toBeUndefined();
    expect(callArgs.metadata.isNewOrganization).toBe("false");
    expect(callArgs.metadata.organizationId).toBe(orgId);
  });

  it("creates Stripe customer when user has no stripeCustomerId yet", async () => {
    process.env.ENABLE_APP_TRIAL = "true";
    mockGetSession.mockResolvedValue({
      user: { id: userId, email: "u@x.fr", stripeCustomerId: null },
      session: { activeOrganizationId: orgId },
    });
    mockMongoFindOne.mockResolvedValue({
      userId: new ObjectId(userId),
      organizationId: new ObjectId(orgId),
      role: "admin",
    });
    mockStripeCreateCustomer.mockResolvedValue({ id: "cus_new" });
    mockStripeCreateCheckout.mockResolvedValue({
      url: "https://checkout.stripe.com/c/abc",
    });

    const { POST } = await import("@/app/api/billing/subscribe/route");
    const res = await POST(buildRequest());
    expect(res.status).toBe(200);
    expect(mockStripeCreateCustomer).toHaveBeenCalledTimes(1);
    expect(mockMongoUpdateOne).toHaveBeenCalled();
  });
});
