import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("sendMetaConversion", () => {
  it("returns null when env vars missing", async () => {
    vi.stubEnv("META_PIXEL_ID", "");
    vi.stubEnv("META_CAPI_TOKEN", "");
    // Re-import after env change since constants are read at module load
    vi.resetModules();
    const { sendMetaConversion } = await import("@/src/utils/metaCapiServer");
    const out = await sendMetaConversion({
      eventName: "Lead",
      email: "x@x.fr",
    });
    expect(out).toBeNull();
  });

  it("posts to Meta CAPI with hashed email/phone", async () => {
    vi.stubEnv("META_PIXEL_ID", "px-123");
    vi.stubEnv("META_CAPI_TOKEN", "tok-abc");
    vi.resetModules();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ events_received: 1 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { sendMetaConversion } = await import("@/src/utils/metaCapiServer");
    const out = await sendMetaConversion({
      eventName: "Purchase",
      email: "user@example.com",
      phone: "+33612345678",
      value: 19.99,
    });

    expect(out).toEqual({ events_received: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0];
    expect(url).toContain("px-123");
    expect(url).toContain("access_token=tok-abc");

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.data[0].event_name).toBe("Purchase");
    expect(body.data[0].user_data.em[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(body.data[0].user_data.ph[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(body.data[0].custom_data.value).toBe(19.99);
    expect(body.data[0].custom_data.currency).toBe("EUR");
  });

  it("returns null on fetch error", async () => {
    vi.stubEnv("META_PIXEL_ID", "px-123");
    vi.stubEnv("META_CAPI_TOKEN", "tok-abc");
    vi.resetModules();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const { sendMetaConversion } = await import("@/src/utils/metaCapiServer");
    const out = await sendMetaConversion({
      eventName: "Lead",
      email: "x@x.fr",
    });
    expect(out).toBeNull();
  });

  it("omits user_data fields when not provided", async () => {
    vi.stubEnv("META_PIXEL_ID", "px-123");
    vi.stubEnv("META_CAPI_TOKEN", "tok-abc");
    vi.resetModules();

    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { sendMetaConversion } = await import("@/src/utils/metaCapiServer");
    await sendMetaConversion({ eventName: "PageView" });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.data[0].user_data.em).toBeUndefined();
    expect(body.data[0].user_data.ph).toBeUndefined();
  });
});
