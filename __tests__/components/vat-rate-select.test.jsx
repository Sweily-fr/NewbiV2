import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VatRateSelect } from "@/src/components/vat-rate-select";

describe("VatRateSelect", () => {
  it("renders the select with the default value (20%)", () => {
    render(<VatRateSelect value={20} onChange={vi.fn()} />);
    // Default value 20 -> "20% - Taux normal" should be displayed in trigger
    expect(screen.getByText(/Taux normal/i)).toBeInTheDocument();
  });

  it("switches to custom input mode when value is non-predefined number", () => {
    render(<VatRateSelect value={7} onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText("Taux %");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(7);
  });

  it("calls onChange when typing a valid custom value", () => {
    const onChange = vi.fn();
    render(<VatRateSelect value={7} onChange={onChange} />);
    const input = screen.getByPlaceholderText("Taux %");
    fireEvent.change(input, { target: { value: "12.5" } });
    expect(onChange).toHaveBeenCalledWith(12.5);
  });

  it("does not call onChange for out-of-range custom value", () => {
    const onChange = vi.fn();
    render(<VatRateSelect value={7} onChange={onChange} />);
    const input = screen.getByPlaceholderText("Taux %");
    fireEvent.change(input, { target: { value: "150" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables the input when disabled is true (custom mode)", () => {
    render(<VatRateSelect value={7} onChange={vi.fn()} disabled={true} />);
    const input = screen.getByPlaceholderText("Taux %");
    expect(input).toBeDisabled();
  });

  it("clicking the X button in custom mode resets to 20%", () => {
    const onChange = vi.fn();
    render(<VatRateSelect value={7} onChange={onChange} />);
    const closeBtn = screen.getByRole("button", { name: /✕/ });
    fireEvent.click(closeBtn);
    expect(onChange).toHaveBeenCalledWith(20);
  });

  it("displays the trigger combobox in select mode", () => {
    render(<VatRateSelect value={20} onChange={vi.fn()} />);
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeInTheDocument();
  });

  it("syncs to custom mode when value changes externally to non-predefined", () => {
    const { rerender } = render(
      <VatRateSelect value={20} onChange={vi.fn()} />,
    );
    rerender(<VatRateSelect value={9.5} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("Taux %")).toBeInTheDocument();
  });
});
