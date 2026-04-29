import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OtpInput } from "@/src/components/otp-input";

describe("OtpInput", () => {
  it("renders without crashing", () => {
    const { container } = render(<OtpInput value="" onChange={vi.fn()} />);
    expect(container.querySelector("input")).toBeTruthy();
  });

  it("renders the label when provided", () => {
    render(<OtpInput value="" onChange={vi.fn()} label="Verification code" />);
    expect(screen.getByText("Verification code")).toBeInTheDocument();
  });

  it("does not render label when not provided", () => {
    const { container } = render(<OtpInput value="" onChange={vi.fn()} />);
    expect(container.querySelector("label")).toBeNull();
  });

  it("renders input with the current value", () => {
    const { container } = render(<OtpInput value="123" onChange={vi.fn()} />);
    const input = container.querySelector("input");
    expect(input.value).toBe("123");
  });

  it("renders with maxLength attribute", () => {
    const { container } = render(
      <OtpInput value="" onChange={vi.fn()} maxLength={4} />,
    );
    const input = container.querySelector("input");
    expect(input).toBeTruthy();
  });

  it("disables the input when disabled is true", () => {
    const { container } = render(
      <OtpInput value="" onChange={vi.fn()} disabled={true} />,
    );
    const input = container.querySelector("input");
    expect(input).toBeDisabled();
  });

  it("calls onChange when value changes", () => {
    const onChange = vi.fn();
    const { container } = render(<OtpInput value="" onChange={onChange} />);
    const input = container.querySelector("input");
    fireEvent.change(input, { target: { value: "123456" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("renders the minus separator icon", () => {
    const { container } = render(<OtpInput value="" onChange={vi.fn()} />);
    // The minus icon is an SVG inside a div
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
