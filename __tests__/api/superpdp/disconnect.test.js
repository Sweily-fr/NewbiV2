import { describe, it, expect } from "vitest";

function makeReq({
  method = "POST",
  url = "http://localhost/api/superpdp/disconnect",
  body,
  headers = {},
} = {}) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const { POST } = await import("@/app/api/superpdp/disconnect/route");

// SuperPDP feature is intentionally disabled at the route level (hardcoded 503).
// One consolidated test is enough until the feature is re-enabled.
describe("POST /api/superpdp/disconnect (disabled)", () => {
  it("returns 503 with disabled=true and a French SuperPDP error", async () => {
    const res = await POST(makeReq({ body: { organizationId: "org_1" } }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.disabled).toBe(true);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/SuperPDP|facturation/i);
  });
});
