import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
} from "@/src/components/ui/input-otp";

describe("InputOTP", () => {
  it("renders the requested number of inputs", () => {
    render(<InputOTP length={6} autoFocus={false} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);
  });

  it("default length is 6", () => {
    render(<InputOTP autoFocus={false} />);
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
  });

  it("syncs with external value", () => {
    render(<InputOTP value="123" autoFocus={false} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs[0].value).toBe("1");
    expect(inputs[1].value).toBe("2");
    expect(inputs[2].value).toBe("3");
    expect(inputs[3].value).toBe("");
  });

  it("calls onChange with concatenated value on input", () => {
    const onChange = vi.fn();
    render(<InputOTP length={4} onChange={onChange} autoFocus={false} />);
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "1" } });
    expect(onChange).toHaveBeenLastCalledWith("1");
    fireEvent.change(inputs[1], { target: { value: "2" } });
    expect(onChange).toHaveBeenLastCalledWith("12");
  });

  it("ignores non-numeric input", () => {
    const onChange = vi.fn();
    render(<InputOTP length={4} onChange={onChange} autoFocus={false} />);
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "a" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("respects disabled state", () => {
    render(<InputOTP length={4} disabled autoFocus={false} />);
    screen.getAllByRole("textbox").forEach((i) => expect(i).toBeDisabled());
  });

  it("calls onComplete when all fields filled", () => {
    const onComplete = vi.fn();
    const { rerender } = render(
      <InputOTP
        length={3}
        value=""
        onComplete={onComplete}
        autoFocus={false}
      />,
    );
    rerender(
      <InputOTP
        length={3}
        value="12"
        onComplete={onComplete}
        autoFocus={false}
      />,
    );
    // Trigger the change handler that would fire onComplete
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[2], { target: { value: "3" } });
    expect(onComplete).toHaveBeenCalledWith("123");
  });
});

describe("InputOTPGroup", () => {
  it("renders children inside a flex wrapper", () => {
    render(
      <InputOTPGroup>
        <span data-testid="x">child</span>
      </InputOTPGroup>,
    );
    expect(screen.getByTestId("x")).toBeInTheDocument();
  });
});

describe("InputOTPSeparator", () => {
  it("renders a dash", () => {
    render(<InputOTPSeparator />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });
});
