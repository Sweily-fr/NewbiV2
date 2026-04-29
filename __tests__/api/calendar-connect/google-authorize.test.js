import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ authorization: "Bearer xyz" })),
}));

import { GET } from "@/app/api/calendar-connect/google/authorize/route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn());
});

describe("GET /api/calendar-connect/google/authorize", () => {
  it("returns auth URL on success", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authUrl: "https://google.com/auth" }),
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.authUrl).toBe("https://google.com/auth");
  });

  it("forwards backend error status", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 400 when backend returns 400", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "Bad request" }),
    });
    const res = await GET();
    expect(res.status).toBe(400);
  });

  it("returns 500 on fetch failure", async () => {
    fetch.mockRejectedValueOnce(new Error("Network down"));
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("Google Calendar");
  });
});
