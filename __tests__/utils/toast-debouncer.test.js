import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import toastDebouncer from "@/src/utils/toastDebouncer";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  toastDebouncer.clear();
  toastDebouncer.setDebounceTime(3000);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("toastDebouncer.shouldShow", () => {
  it("returns true on first call", () => {
    expect(toastDebouncer.shouldShow("hello")).toBe(true);
  });

  it("returns false for the same message within the debounce window", () => {
    expect(toastDebouncer.shouldShow("dup")).toBe(true);
    expect(toastDebouncer.shouldShow("dup")).toBe(false);
  });

  it("dedupes per (type, message, description) tuple", () => {
    expect(toastDebouncer.shouldShow("msg", "error", "")).toBe(true);
    expect(toastDebouncer.shouldShow("msg", "success", "")).toBe(true); // diff type
    expect(toastDebouncer.shouldShow("msg", "error", "")).toBe(false); // dup
    expect(toastDebouncer.shouldShow("msg", "error", "extra")).toBe(true); // diff desc
  });

  it("allows the same message again after the debounce window expires", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    expect(toastDebouncer.shouldShow("X")).toBe(true);
    vi.setSystemTime(2999);
    expect(toastDebouncer.shouldShow("X")).toBe(false);
    vi.setSystemTime(3001);
    expect(toastDebouncer.shouldShow("X")).toBe(true);
    vi.useRealTimers();
  });
});

describe("toastDebouncer.clear", () => {
  it("resets the debouncer so the same message is allowed again", () => {
    toastDebouncer.shouldShow("dup");
    toastDebouncer.clear();
    expect(toastDebouncer.shouldShow("dup")).toBe(true);
  });
});

describe("toastDebouncer.setDebounceTime", () => {
  it("changes the debounce window dynamically", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    toastDebouncer.setDebounceTime(100);
    expect(toastDebouncer.shouldShow("X")).toBe(true);
    vi.setSystemTime(50);
    expect(toastDebouncer.shouldShow("X")).toBe(false);
    vi.setSystemTime(101);
    expect(toastDebouncer.shouldShow("X")).toBe(true);
    vi.useRealTimers();
  });
});

describe("toastDebouncer.getStats", () => {
  it("reports active notifications", () => {
    toastDebouncer.shouldShow("a");
    toastDebouncer.shouldShow("b");
    const stats = toastDebouncer.getStats();
    expect(stats.activeNotifications).toBe(2);
    expect(stats.notifications).toHaveLength(2);
    expect(stats.debounceTime).toBe(3000);
  });
});
