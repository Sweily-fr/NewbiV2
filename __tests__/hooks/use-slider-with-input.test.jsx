import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSliderWithInput } from "@/src/hooks/use-slider-with-input";

describe("useSliderWithInput", () => {
  it("starts with initialValue", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({ initialValue: [50], defaultValue: [50] }),
    );
    expect(result.current.sliderValue).toEqual([50]);
    expect(result.current.inputValues).toEqual(["50"]);
    expect(result.current.showReset).toBe(false);
  });

  it("showReset becomes true after sliderChange to non-default", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({ initialValue: [50], defaultValue: [50] }),
    );
    act(() => result.current.handleSliderChange([75]));
    expect(result.current.sliderValue).toEqual([75]);
    expect(result.current.showReset).toBe(true);
  });

  it("resetToDefault restores defaultValue", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({ initialValue: [50], defaultValue: [10] }),
    );
    act(() => result.current.handleSliderChange([90]));
    act(() => result.current.resetToDefault());
    expect(result.current.sliderValue).toEqual([10]);
    expect(result.current.inputValues).toEqual(["10"]);
  });

  it("validateAndUpdateValue clamps to min/max", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({
        minValue: 0,
        maxValue: 100,
        initialValue: [50],
        defaultValue: [50],
      }),
    );
    act(() => result.current.validateAndUpdateValue("999", 0));
    expect(result.current.sliderValue[0]).toBe(100);

    act(() => result.current.validateAndUpdateValue("-5", 0));
    expect(result.current.sliderValue[0]).toBe(0);
  });

  it("validateAndUpdateValue treats empty/dash as 0", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({ initialValue: [50], defaultValue: [50] }),
    );
    act(() => result.current.validateAndUpdateValue("", 0));
    expect(result.current.sliderValue[0]).toBe(0);
  });

  it("validateAndUpdateValue rejects NaN strings (no change)", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({ initialValue: [42], defaultValue: [42] }),
    );
    act(() => result.current.validateAndUpdateValue("abc", 0));
    expect(result.current.sliderValue[0]).toBe(42);
  });

  it("two-handle slider: clamps to neighbour", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({
        minValue: 0,
        maxValue: 100,
        initialValue: [20, 80],
        defaultValue: [20, 80],
      }),
    );
    // Try to set first handle past second
    act(() => result.current.validateAndUpdateValue("90", 0));
    expect(result.current.sliderValue[0]).toBe(80);

    // Try to set second handle below first
    act(() => result.current.validateAndUpdateValue("10", 1));
    expect(result.current.sliderValue[1]).toBe(80);
  });

  it("handleInputChange filters non-numeric input", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({ initialValue: [10], defaultValue: [10] }),
    );
    act(() =>
      result.current.handleInputChange({ target: { value: "abc" } }, 0),
    );
    expect(result.current.inputValues[0]).toBe("10"); // unchanged

    act(() =>
      result.current.handleInputChange({ target: { value: "12.5" } }, 0),
    );
    expect(result.current.inputValues[0]).toBe("12.5");
  });
});
