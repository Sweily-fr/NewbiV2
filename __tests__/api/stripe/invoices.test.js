import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks must be declared before importing the route
const mockGetSession = vi.fn();
const mockInvoicesList = vi.fn();

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
      invoices: { list: (...args) => mockInvoicesList(...args) },
      customers: { list: vi.fn(), retrieve: vi.fn() },
      billingPortal: { sessions: { create: vi.fn() } },
      accounts: { create: vi.fn(), retrieve: vi.fn() },
      accountLinks: { create: vi.fn() },
    };
  }),
}));

function makeReq({
  method = "GET",
  url = "http://localhost/api/stripe/invoices",
  body,
  headers = {},
} = {}) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const { GET } = await import("@/app/api/stripe/invoices/route");

beforeEach(() => {
  mockGetSession.mockReset();
  mockInvoicesList.mockReset();
});

describe("GET /api/stripe/invoices", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await GET(
      makeReq({ url: "http://localhost/api/stripe/invoices?customerId=cus_1" }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 when customerId missing", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    const res = await GET(
      makeReq({ url: "http://localhost/api/stripe/invoices" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/Customer ID/);
  });

  it("returns 200 with formatted, sorted invoices excluding drafts", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    mockInvoicesList.mockResolvedValue({
      data: [
        {
          id: "in_1",
          number: "F-1",
          status: "paid",
          created: 100,
          due_date: null,
          amount_due: 0,
          amount_paid: 1000,
          amount_remaining: 0,
          subtotal: 1000,
          tax: 0,
          total: 1000,
          currency: "eur",
          description: "x",
          hosted_invoice_url: "u1",
          invoice_pdf: "p1",
          period_start: 1,
          period_end: 2,
          subscription: "sub_1",
          customer_email: "a@b.c",
          customer_name: "A",
          lines: {
            data: [
              {
                id: "li_1",
                description: "L",
                amount: 100,
                currency: "eur",
                quantity: 1,
                period: {},
              },
            ],
          },
        },
        {
          id: "in_2",
          number: "F-2",
          status: "draft",
          created: 200,
          lines: { data: [] },
        },
        {
          id: "in_3",
          number: "F-3",
          status: "open",
          created: 300,
          lines: { data: [] },
        },
      ],
    });
    const res = await GET(
      makeReq({ url: "http://localhost/api/stripe/invoices?customerId=cus_1" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.count).toBe(2);
    expect(body.invoices.map((i) => i.id)).toEqual(["in_3", "in_1"]);
    expect(body.customer_id).toBe("cus_1");
  });

  it("maps StripeInvalidRequestError to 400", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    const err = new Error("nope");
    err.type = "StripeInvalidRequestError";
    mockInvoicesList.mockRejectedValue(err);
    const res = await GET(
      makeReq({ url: "http://localhost/api/stripe/invoices?customerId=cus_1" }),
    );
    expect(res.status).toBe(400);
  });

  it("maps StripeRateLimitError to 429", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    const err = new Error("slow down");
    err.type = "StripeRateLimitError";
    mockInvoicesList.mockRejectedValue(err);
    const res = await GET(
      makeReq({ url: "http://localhost/api/stripe/invoices?customerId=cus_1" }),
    );
    expect(res.status).toBe(429);
  });

  it("returns 500 on generic upstream errors", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    mockInvoicesList.mockRejectedValue(new Error("boom"));
    const res = await GET(
      makeReq({ url: "http://localhost/api/stripe/invoices?customerId=cus_1" }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
