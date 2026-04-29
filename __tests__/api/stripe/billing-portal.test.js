import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSession = vi.fn();
const mockPortalCreate = vi.fn();

vi.mock("@/src/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args) => mockGetSession(...args),
    },
  },
}));

vi.mock("stripe", () => ({
  default: vi.fn(function MockStripe() {
    return {
      billingPortal: {
        sessions: { create: (...args) => mockPortalCreate(...args) },
      },
      customers: { list: vi.fn(), retrieve: vi.fn() },
      invoices: { list: vi.fn() },
      accounts: { create: vi.fn(), retrieve: vi.fn() },
      accountLinks: { create: vi.fn() },
    };
  }),
}));

function makeReq({
  method = "POST",
  url = "http://localhost/api/stripe/billing-portal",
  body,
  headers = {},
} = {}) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const { POST } = await import("@/app/api/stripe/billing-portal/route");

beforeEach(() => {
  mockGetSession.mockReset();
  mockPortalCreate.mockReset();
});

describe("POST /api/stripe/billing-portal", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await POST(makeReq({ body: { customerId: "cus_1" } }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when customerId missing", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    const res = await POST(makeReq({ body: {} }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Customer/);
  });

  it("returns 200 with portal session URL", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    mockPortalCreate.mockResolvedValue({ url: "https://stripe/portal/abc" });
    const res = await POST(
      makeReq({
        body: { customerId: "cus_1" },
        headers: { origin: "http://localhost" },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://stripe/portal/abc");
    expect(mockPortalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_1",
        return_url: expect.stringContaining("/dashboard"),
      }),
    );
  });

  it("returns 500 when Stripe throws", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    mockPortalCreate.mockRejectedValue(new Error("upstream"));
    const res = await POST(makeReq({ body: { customerId: "cus_1" } }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
