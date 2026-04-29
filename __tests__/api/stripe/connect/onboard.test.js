import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAccountsCreate = vi.fn();
const mockAccountLinksCreate = vi.fn();

vi.mock("stripe", () => ({
  default: vi.fn(function MockStripe() {
    return {
      accounts: {
        create: (...args) => mockAccountsCreate(...args),
        retrieve: vi.fn(),
      },
      accountLinks: { create: (...args) => mockAccountLinksCreate(...args) },
      customers: { list: vi.fn() },
      invoices: { list: vi.fn() },
      billingPortal: { sessions: { create: vi.fn() } },
    };
  }),
}));

function makeReq({
  method = "POST",
  url = "http://localhost/api/stripe/connect/onboard",
  body,
  headers = {},
} = {}) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const { POST } = await import("@/app/api/stripe/connect/onboard/route");

beforeEach(() => {
  mockAccountsCreate.mockReset();
  mockAccountLinksCreate.mockReset();
});

describe("POST /api/stripe/connect/onboard", () => {
  it("returns 400 when userId missing", async () => {
    const res = await POST(makeReq({ body: { email: "a@b.c" } }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when email missing", async () => {
    const res = await POST(makeReq({ body: { userId: "u1" } }));
    expect(res.status).toBe(400);
  });

  it("returns 200 with account link URL on success", async () => {
    mockAccountsCreate.mockResolvedValue({ id: "acct_new" });
    mockAccountLinksCreate.mockResolvedValue({
      url: "https://stripe/onboarding",
    });
    const res = await POST(makeReq({ body: { userId: "u1", email: "a@b.c" } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accountId).toBe("acct_new");
    expect(body.url).toBe("https://stripe/onboarding");
    expect(mockAccountsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "express",
        email: "a@b.c",
        metadata: { userId: "u1" },
      }),
    );
    expect(mockAccountLinksCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        account: "acct_new",
        type: "account_onboarding",
      }),
    );
  });

  it("returns 500 when Stripe throws on account creation", async () => {
    mockAccountsCreate.mockRejectedValue(new Error("api err"));
    const res = await POST(makeReq({ body: { userId: "u1", email: "a@b.c" } }));
    expect(res.status).toBe(500);
  });

  it("returns 500 when account link creation fails", async () => {
    mockAccountsCreate.mockResolvedValue({ id: "acct_new" });
    mockAccountLinksCreate.mockRejectedValue(new Error("link err"));
    const res = await POST(makeReq({ body: { userId: "u1", email: "a@b.c" } }));
    expect(res.status).toBe(500);
  });
});
