import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/webhooks/stripe/route";

function makeReq({ body = "", headers = {} } = {}) {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers,
    body,
  });
}

describe("POST /api/webhooks/stripe", () => {
  it("returns 200 with redirect message", async () => {
    const res = await POST(makeReq());
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("/api/auth/stripe/webhook");
  });

  it("works with body", async () => {
    const res = await POST(makeReq({ body: "anything" }));
    expect(res.status).toBe(200);
  });

  it("works with stripe-signature header", async () => {
    const res = await POST(
      makeReq({ headers: { "stripe-signature": "sig_xxx" } }),
    );
    expect(res.status).toBe(200);
  });

  it("returns text body", async () => {
    const res = await POST(makeReq());
    const text = await res.text();
    expect(text).toBeTruthy();
    expect(typeof text).toBe("string");
  });
});
