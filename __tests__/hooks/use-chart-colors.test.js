import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@/src/components/theme-provider", () => ({
  useTheme: vi.fn(),
}));

import { useChartColors } from "@/src/hooks/useChartColors";
import { useTheme } from "@/src/components/theme-provider";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useChartColors — standard mode", () => {
  beforeEach(() => {
    useTheme.mockReturnValue({ colorblindMode: false });
  });

  it("returns green/red default colors", () => {
    const { result } = renderHook(() => useChartColors());
    expect(result.current.success).toBe("#10b981");
    expect(result.current.danger).toBe("#ef4444");
    expect(result.current.colorblindMode).toBe(false);
  });

  it("remaps brand violet to green", () => {
    const { result } = renderHook(() => useChartColors());
    expect(result.current.remap("#5b50ff")).toBe("#10b981");
    expect(result.current.remap("#5B50FF")).toBe("#10b981");
  });

  it("remaps black to red", () => {
    const { result } = renderHook(() => useChartColors());
    expect(result.current.remap("#000000")).toBe("#ef4444");
  });

  it("returns the original color for unmapped values", () => {
    const { result } = renderHook(() => useChartColors());
    expect(result.current.remap("#abcdef")).toBe("#abcdef");
  });

  it("getIncomeColor wraps around the palette length", () => {
    const { result } = renderHook(() => useChartColors());
    const len = result.current.incomePalette.length;
    expect(result.current.getIncomeColor(0)).toBe(
      result.current.incomePalette[0],
    );
    expect(result.current.getIncomeColor(len)).toBe(
      result.current.incomePalette[0],
    );
  });

  it("remapList remaps every color in the array", () => {
    const { result } = renderHook(() => useChartColors());
    const out = result.current.remapList(["#5b50ff", "#000000", "#ABCDEF"]);
    expect(out).toEqual(["#10b981", "#ef4444", "#ABCDEF"]);
  });
});

describe("useChartColors — colorblind mode", () => {
  beforeEach(() => {
    useTheme.mockReturnValue({ colorblindMode: true });
  });

  it("returns brand-blue/black colors", () => {
    const { result } = renderHook(() => useChartColors());
    expect(result.current.success).toBe("#5b50ff");
    expect(result.current.danger).toBe("#000000");
    expect(result.current.colorblindMode).toBe(true);
  });

  it("remaps green to brand-blue", () => {
    const { result } = renderHook(() => useChartColors());
    expect(result.current.remap("#10b981")).toBe("#5b50ff");
    expect(result.current.remap("#16a34a")).toBe("#5b50ff");
  });

  it("remaps red to black/gray", () => {
    const { result } = renderHook(() => useChartColors());
    expect(result.current.remap("#ef4444")).toBe("#000000");
    expect(result.current.remap("#dc2626")).toBe("#000000");
  });

  it("remaps oranges/yellows to grays", () => {
    const { result } = renderHook(() => useChartColors());
    expect(result.current.remap("#f97316")).toBe("#4b5563");
    expect(result.current.remap("#fbbf24")).toBe("#9ca3af");
  });

  it("uses the colorblind income palette", () => {
    const { result } = renderHook(() => useChartColors());
    expect(result.current.incomePalette[0]).toBe("#a5a0ff");
  });

  it("uses the colorblind expense palette (grays)", () => {
    const { result } = renderHook(() => useChartColors());
    expect(result.current.expensePalette[0]).toBe("#9ca3af");
  });
});

describe("useChartColors — null/undefined input", () => {
  beforeEach(() => {
    useTheme.mockReturnValue({ colorblindMode: false });
  });

  it("returns null/undefined unchanged from remap()", () => {
    const { result } = renderHook(() => useChartColors());
    expect(result.current.remap(null)).toBeNull();
    expect(result.current.remap(undefined)).toBeUndefined();
  });
});
