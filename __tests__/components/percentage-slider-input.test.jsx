import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PercentageSliderInput from "@/src/components/percentage-slider-input";

describe("PercentageSliderInput", () => {
  it("renders the label with the percentage value", () => {
    render(
      <PercentageSliderInput label="Volume" value={42} onChange={vi.fn()} />,
    );
    expect(screen.getByText(/Volume: 42%/)).toBeInTheDocument();
  });

  it("renders without label prefix when showLabelInValue is false", () => {
    render(
      <PercentageSliderInput
        label="Volume"
        value={50}
        onChange={vi.fn()}
        showLabelInValue={false}
      />,
    );
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.queryByText(/Volume:/)).not.toBeInTheDocument();
  });

  it("calls onChange when increase button clicked", () => {
    const onChange = vi.fn();
    render(
      <PercentageSliderInput
        label="X"
        value={10}
        onChange={onChange}
        step={5}
      />,
    );
    const inc = screen.getByLabelText(/Augmenter la valeur/i);
    fireEvent.click(inc);
    expect(onChange).toHaveBeenCalledWith(15);
  });

  it("calls onChange when decrease button clicked", () => {
    const onChange = vi.fn();
    render(
      <PercentageSliderInput
        label="X"
        value={20}
        onChange={onChange}
        step={5}
      />,
    );
    const dec = screen.getByLabelText(/Diminuer la valeur/i);
    fireEvent.click(dec);
    expect(onChange).toHaveBeenCalledWith(15);
  });

  it("disables decrease button at minValue", () => {
    render(
      <PercentageSliderInput
        label="X"
        value={0}
        onChange={vi.fn()}
        minValue={0}
      />,
    );
    const dec = screen.getByLabelText(/Diminuer la valeur/i);
    expect(dec).toBeDisabled();
  });

  it("disables increase button at maxValue", () => {
    render(
      <PercentageSliderInput
        label="X"
        value={100}
        onChange={vi.fn()}
        maxValue={100}
      />,
    );
    const inc = screen.getByLabelText(/Augmenter la valeur/i);
    expect(inc).toBeDisabled();
  });

  it("disables both buttons when disabled prop is true", () => {
    render(
      <PercentageSliderInput
        label="X"
        value={50}
        onChange={vi.fn()}
        disabled={true}
      />,
    );
    expect(screen.getByLabelText(/Augmenter la valeur/i)).toBeDisabled();
    expect(screen.getByLabelText(/Diminuer la valeur/i)).toBeDisabled();
  });

  it("syncs internal state when value prop changes", () => {
    const { rerender } = render(
      <PercentageSliderInput label="X" value={10} onChange={vi.fn()} />,
    );
    expect(screen.getByText(/X: 10%/)).toBeInTheDocument();
    rerender(<PercentageSliderInput label="X" value={75} onChange={vi.fn()} />);
    expect(screen.getByText(/X: 75%/)).toBeInTheDocument();
  });

  it("does not exceed maxValue when increasing", () => {
    const onChange = vi.fn();
    render(
      <PercentageSliderInput
        label="X"
        value={98}
        onChange={onChange}
        step={5}
        maxValue={100}
      />,
    );
    fireEvent.click(screen.getByLabelText(/Augmenter la valeur/i));
    expect(onChange).toHaveBeenCalledWith(100);
  });
});
