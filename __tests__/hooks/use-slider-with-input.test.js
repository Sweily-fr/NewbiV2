import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSliderWithInput } from "@/src/hooks/use-slider-with-input";

describe("useSliderWithInput — initial state", () => {
  it("seeds sliderValue and inputValues from initialValue", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({ initialValue: [25] }),
    );
    expect(result.current.sliderValue).toEqual([25]);
    expect(result.current.inputValues).toEqual(["25"]);
  });

  it("showReset=false when slider matches default", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({ initialValue: [10], defaultValue: [10] }),
    );
    expect(result.current.showReset).toBe(false);
  });

  it("showReset=true when slider differs from default", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({ initialValue: [25], defaultValue: [10] }),
    );
    expect(result.current.showReset).toBe(true);
  });
});

describe("useSliderWithInput — validateAndUpdateValue", () => {
  it("clamps to maxValue", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({ maxValue: 100, initialValue: [50] }),
    );
    act(() => result.current.validateAndUpdateValue("999", 0));
    expect(result.current.sliderValue).toEqual([100]);
    expect(result.current.inputValues).toEqual(["100"]);
  });

  it("clamps to minValue", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({ minValue: 0, initialValue: [50] }),
    );
    act(() => result.current.validateAndUpdateValue("-50", 0));
    expect(result.current.sliderValue).toEqual([0]);
  });

  it("normalizes empty string to 0", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({ initialValue: [50] }),
    );
    act(() => result.current.validateAndUpdateValue("", 0));
    expect(result.current.sliderValue).toEqual([0]);
  });

  it("ignores NaN inputs and reverts to slider value", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({ initialValue: [50] }),
    );
    act(() => result.current.validateAndUpdateValue("abc", 0));
    expect(result.current.sliderValue).toEqual([50]);
    expect(result.current.inputValues).toEqual(["50"]);
  });

  it("for range sliders, the lower bound cannot exceed the upper bound", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({
        minValue: 0,
        maxValue: 100,
        initialValue: [20, 60],
      }),
    );
    act(() => result.current.validateAndUpdateValue("80", 0));
    // Lower bound clamped to upper bound (60)
    expect(result.current.sliderValue).toEqual([60, 60]);
  });

  it("for range sliders, the upper bound cannot go below the lower bound", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({
        minValue: 0,
        maxValue: 100,
        initialValue: [40, 60],
      }),
    );
    act(() => result.current.validateAndUpdateValue("10", 1));
    expect(result.current.sliderValue).toEqual([40, 40]);
  });
});

describe("useSliderWithInput — handleInputChange", () => {
  it("accepts intermediate states like empty string", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({ initialValue: [50] }),
    );
    act(() => result.current.handleInputChange({ target: { value: "" } }, 0));
    expect(result.current.inputValues).toEqual([""]);
    expect(result.current.sliderValue).toEqual([50]); // unchanged until validate
  });

  it("rejects garbage characters", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({ initialValue: [50] }),
    );
    act(() =>
      result.current.handleInputChange({ target: { value: "abc" } }, 0),
    );
    expect(result.current.inputValues).toEqual(["50"]); // unchanged
  });
});

describe("useSliderWithInput — handleSliderChange & reset", () => {
  it("handleSliderChange syncs sliderValue and inputValues", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({ initialValue: [10] }),
    );
    act(() => result.current.handleSliderChange([42]));
    expect(result.current.sliderValue).toEqual([42]);
    expect(result.current.inputValues).toEqual(["42"]);
  });

  it("resetToDefault restores defaultValue", () => {
    const { result } = renderHook(() =>
      useSliderWithInput({ initialValue: [80], defaultValue: [10] }),
    );
    act(() => result.current.resetToDefault());
    expect(result.current.sliderValue).toEqual([10]);
    expect(result.current.inputValues).toEqual(["10"]);
    expect(result.current.showReset).toBe(false);
  });
});
