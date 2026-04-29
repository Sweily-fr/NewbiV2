import { describe, it, expect } from "vitest";

function makeReq({
  method = "GET",
  url = "http://localhost/api/superpdp/authorize",
  body,
  headers = {},
} = {}) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const { GET } = await import("@/app/api/superpdp/authorize/route");

// SuperPDP feature is intentionally disabled at the route level (hardcoded 503).
// One consolidated test is enough until the feature is re-enabled.
describe("GET /api/superpdp/authorize (disabled)", () => {
  it("returns 503 with disabled=true and a French SuperPDP error", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.disabled).toBe(true);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/SuperPDP|facturation/i);
  });
});
