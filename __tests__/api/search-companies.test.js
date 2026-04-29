import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/search-companies/route";

function makeReq(url = "http://localhost/api/search-companies?q=test") {
  return new Request(url);
}

describe("GET /api/search-companies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns 400 when q is missing", async () => {
    const res = await GET(makeReq("http://localhost/api/search-companies"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when q too short", async () => {
    const res = await GET(makeReq("http://localhost/api/search-companies?q=a"));
    expect(res.status).toBe(400);
  });

  it("returns data on happy path", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [{ siret: "123" }] }),
    });
    const res = await GET(
      makeReq("http://localhost/api/search-companies?q=newbi"),
    );
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.results).toBeDefined();
  });

  it("returns 500 if fetch fails", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad gateway",
    });
    const res = await GET(
      makeReq("http://localhost/api/search-companies?q=newbi"),
    );
    expect(res.status).toBe(500);
  });

  it("returns 500 if fetch throws", async () => {
    global.fetch.mockRejectedValue(new Error("network"));
    const res = await GET(
      makeReq("http://localhost/api/search-companies?q=newbi"),
    );
    expect(res.status).toBe(500);
  });
});
