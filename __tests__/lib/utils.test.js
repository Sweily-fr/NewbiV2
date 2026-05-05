import { describe, it, expect } from "vitest";
import { cn } from "@/src/lib/utils";

describe("cn (className merge)", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("filters falsy values", () => {
    expect(cn("a", null, undefined, false, "b")).toBe("a b");
  });

  it("supports object syntax", () => {
    expect(cn({ a: true, b: false, c: true })).toBe("a c");
  });

  it("supports arrays", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });

  it("merges conflicting tailwind classes (last wins)", () => {
    // tailwind-merge picks last conflicting utility
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("preserves non-conflicting classes", () => {
    expect(cn("p-2 m-1", "rounded")).toBe("p-2 m-1 rounded");
  });

  it("returns '' for no args", () => {
    expect(cn()).toBe("");
  });
});
