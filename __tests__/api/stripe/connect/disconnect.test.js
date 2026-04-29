import { describe, it, expect, vi } from "vitest";

vi.mock("stripe", () => ({
  default: vi.fn(function MockStripe() {
    return {
      accounts: { create: vi.fn(), retrieve: vi.fn(), del: vi.fn() },
      accountLinks: { create: vi.fn() },
      customers: { list: vi.fn() },
      invoices: { list: vi.fn() },
      billingPortal: { sessions: { create: vi.fn() } },
    };
  }),
}));

function makeReq({
  method = "POST",
  url = "http://localhost/api/stripe/connect/disconnect",
  body,
  headers = {},
} = {}) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const { POST } = await import("@/app/api/stripe/connect/disconnect/route");

describe("POST /api/stripe/connect/disconnect", () => {
  it("returns 400 when userId missing", async () => {
    const res = await POST(makeReq({ body: {} }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/userId/);
  });

  it("returns 200 success when userId provided", async () => {
    const res = await POST(makeReq({ body: { userId: "u1" } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toMatch(/déconnecté/);
  });

  it("returns 500 when JSON parsing fails", async () => {
    const req = new Request("http://localhost/api/stripe/connect/disconnect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 when body is empty object", async () => {
    const res = await POST(makeReq({ body: { foo: "bar" } }));
    expect(res.status).toBe(400);
  });
});
