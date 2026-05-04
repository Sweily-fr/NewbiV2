import { describe, it, expect, vi, beforeEach } from "vitest";

const { toastFn, shouldShowMock } = vi.hoisted(() => {
  const toastFn = vi.fn();
  toastFn.success = vi.fn();
  toastFn.info = vi.fn();
  toastFn.error = vi.fn();
  toastFn.warning = vi.fn();
  toastFn.dismiss = vi.fn();
  toastFn.promise = vi.fn();
  toastFn.custom = vi.fn();
  return { toastFn, shouldShowMock: vi.fn() };
});

vi.mock("@/src/components/ui/sonner", () => ({
  toast: toastFn,
}));

vi.mock("@/src/utils/toastDebouncer", () => ({
  default: { shouldShow: shouldShowMock },
}));

import debouncedToast from "@/src/utils/debouncedToast";

beforeEach(() => {
  shouldShowMock.mockReset();
  toastFn.success.mockClear();
  toastFn.info.mockClear();
  toastFn.error.mockClear();
  toastFn.warning.mockClear();
  toastFn.mockClear?.();
});

describe("debouncedToast.success", () => {
  it("calls underlying toast when debouncer allows", () => {
    shouldShowMock.mockReturnValue(true);
    debouncedToast.success("Hello");
    expect(toastFn.success).toHaveBeenCalledWith("Hello", {});
  });

  it("returns null and skips toast when debouncer denies", () => {
    shouldShowMock.mockReturnValue(false);
    const out = debouncedToast.success("Hello");
    expect(out).toBeNull();
    expect(toastFn.success).not.toHaveBeenCalled();
  });

  it("forwards options to underlying toast", () => {
    shouldShowMock.mockReturnValue(true);
    debouncedToast.success("Hi", { description: "desc" });
    expect(toastFn.success).toHaveBeenCalledWith("Hi", { description: "desc" });
  });
});

describe("debouncedToast.info / error / warning", () => {
  it("info delegates correctly", () => {
    shouldShowMock.mockReturnValue(true);
    debouncedToast.info("X");
    expect(toastFn.info).toHaveBeenCalledWith("X", {});
  });

  it("error delegates correctly", () => {
    shouldShowMock.mockReturnValue(true);
    debouncedToast.error("err", { description: "d" });
    expect(toastFn.error).toHaveBeenCalledWith("err", { description: "d" });
  });

  it("warning delegates correctly", () => {
    shouldShowMock.mockReturnValue(true);
    debouncedToast.warning("w");
    expect(toastFn.warning).toHaveBeenCalledWith("w", {});
  });

  it("returns null when debouncer denies for any type", () => {
    shouldShowMock.mockReturnValue(false);
    expect(debouncedToast.info("x")).toBeNull();
    expect(debouncedToast.error("x")).toBeNull();
    expect(debouncedToast.warning("x")).toBeNull();
  });
});

describe("debouncedToast.default", () => {
  it("calls the bare toast function", () => {
    shouldShowMock.mockReturnValue(true);
    debouncedToast.default("Plain");
    expect(toastFn).toHaveBeenCalledWith("Plain", {});
  });

  it("returns null when debouncer denies", () => {
    shouldShowMock.mockReturnValue(false);
    expect(debouncedToast.default("x")).toBeNull();
  });
});

describe("debouncedToast pass-throughs", () => {
  it("re-exports dismiss/promise/custom", () => {
    expect(debouncedToast.dismiss).toBe(toastFn.dismiss);
    expect(debouncedToast.promise).toBe(toastFn.promise);
    expect(debouncedToast.custom).toBe(toastFn.custom);
  });

  it("exposes the debouncer for debug", () => {
    expect(debouncedToast.debouncer).toBeDefined();
    expect(typeof debouncedToast.debouncer.shouldShow).toBe("function");
  });
});
