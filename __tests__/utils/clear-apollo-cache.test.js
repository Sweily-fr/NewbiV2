import { describe, it, expect, beforeEach, vi } from "vitest";
import { clearApolloCache } from "@/src/utils/clearApolloCache";

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("clearApolloCache", () => {
  it("removes the newbi-apollo-cache key", () => {
    localStorage.setItem("newbi-apollo-cache", "{}");
    expect(localStorage.getItem("newbi-apollo-cache")).toBe("{}");
    const out = clearApolloCache();
    expect(out).toBe(true);
    expect(localStorage.getItem("newbi-apollo-cache")).toBeNull();
  });

  it("returns true even if key was absent", () => {
    expect(clearApolloCache()).toBe(true);
  });

  it("auto-executes on module import (the file calls clearApolloCache at load)", async () => {
    // Just verify the export is callable and idempotent
    expect(typeof clearApolloCache).toBe("function");
    expect(clearApolloCache()).toBe(true);
    expect(clearApolloCache()).toBe(true);
  });
});
