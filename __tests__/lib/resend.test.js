import { describe, it, expect, vi, beforeEach } from "vitest";

const { ResendCtor } = vi.hoisted(() => {
  const ResendCtor = vi.fn(function MockResend(apiKey) {
    return {
      apiKey,
      emails: { send: vi.fn() },
    };
  });
  return { ResendCtor };
});

vi.mock("resend", () => ({ Resend: ResendCtor }));

beforeEach(() => {
  ResendCtor.mockClear();
});

describe("lib/resend", () => {
  it("instantiates Resend with the env API key and exports the instance", async () => {
    process.env.RESEND_API_KEY = "test-key-abc";
    vi.resetModules();
    const mod = await import("@/src/lib/resend");

    expect(ResendCtor).toHaveBeenCalledTimes(1);
    expect(ResendCtor).toHaveBeenCalledWith("test-key-abc");
    expect(mod.resend).toBeDefined();
    expect(mod.resend.apiKey).toBe("test-key-abc");
    expect(mod.resend.emails.send).toBeTypeOf("function");
  });

  it("passes undefined when env var is missing", async () => {
    delete process.env.RESEND_API_KEY;
    vi.resetModules();
    await import("@/src/lib/resend");
    expect(ResendCtor).toHaveBeenCalledWith(undefined);
  });

  it("module exports a `resend` named export", async () => {
    process.env.RESEND_API_KEY = "k";
    vi.resetModules();
    const mod = await import("@/src/lib/resend");
    expect(Object.keys(mod)).toContain("resend");
  });
});
