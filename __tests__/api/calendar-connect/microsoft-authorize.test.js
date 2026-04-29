import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ authorization: "Bearer xyz" })),
}));

import { GET } from "@/app/api/calendar-connect/microsoft/authorize/route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn());
});

describe("GET /api/calendar-connect/microsoft/authorize", () => {
  it("returns auth URL on success", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authUrl: "https://login.microsoftonline.com/auth" }),
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.authUrl).toContain("microsoftonline");
  });

  it("forwards backend error", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("forwards 400 status", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "Bad" }),
    });
    const res = await GET();
    expect(res.status).toBe(400);
  });

  it("returns 500 on fetch failure", async () => {
    fetch.mockRejectedValueOnce(new Error("Network"));
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("Microsoft Calendar");
  });
});
