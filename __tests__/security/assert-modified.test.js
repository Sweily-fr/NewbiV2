// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { assertModified } from "@/src/lib/security/assert-modified";

describe("assertModified", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing when modifiedCount > 0", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    assertModified({ matchedCount: 1, modifiedCount: 1 }, "test op");

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("logs console.warn with [DB] tag when matchedCount === 0 and modifiedCount === 0", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    assertModified(
      { matchedCount: 0, modifiedCount: 0 },
      "session.updateMany for userId abc",
    );

    expect(spy).toHaveBeenCalledWith(
      "⚠️ [DB] session.updateMany for userId abc: 0 documents matched",
    );
    spy.mockRestore();
  });

  it("includes context string in the warning message", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    assertModified(
      { matchedCount: 0, modifiedCount: 0 },
      "my custom context here",
    );

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("my custom context here"),
    );
    spy.mockRestore();
  });

  it("does not throw (informational only)", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    // Should not throw even with 0 matched
    expect(() =>
      assertModified({ matchedCount: 0, modifiedCount: 0 }, "test"),
    ).not.toThrow();

    console.warn.mockRestore();
  });

  it("does NOT warn when matchedCount > 0 but modifiedCount === 0 (idempotent update)", () => {
    // Decision B (2026-04-27): tolerant option. Idempotent updates (same value already in place)
    // are legitimate, especially for retry patterns. Warning only when matchedCount === 0.
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    assertModified({ matchedCount: 1, modifiedCount: 0 }, "idempotent update");

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
