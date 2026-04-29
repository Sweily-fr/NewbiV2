import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button, buttonVariants } from "@/src/components/ui/button";

describe("Button", () => {
  it("renders as a <button> by default", () => {
    render(<Button>Click</Button>);
    const btn = screen.getByRole("button", { name: "Click" });
    expect(btn).toBeInTheDocument();
    expect(btn.tagName).toBe("BUTTON");
  });

  it("forwards onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Hit</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("respects disabled", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        X
      </Button>,
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders as a Slot when asChild=true", () => {
    render(
      <Button asChild>
        <a href="/x">Link</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Link" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("data-slot", "button");
  });

  it.each([
    ["primary"],
    ["danger"],
    ["destructive"],
    ["secondary"],
    ["outline"],
    ["ghost"],
    ["filter"],
    ["link"],
  ])("applies variant=%s", (variant) => {
    render(
      <Button data-testid="b" variant={variant}>
        X
      </Button>,
    );
    const el = screen.getByTestId("b");
    expect(el.className).toBeTruthy();
  });

  it.each([["sm"], ["lg"], ["md"], ["icon"]])("applies size=%s", (size) => {
    render(
      <Button data-testid="b" size={size}>
        X
      </Button>,
    );
    expect(screen.getByTestId("b").className).toBeTruthy();
  });

  it("applies data-slot=button", () => {
    render(<Button data-testid="b">X</Button>);
    expect(screen.getByTestId("b")).toHaveAttribute("data-slot", "button");
  });

  it("merges custom className", () => {
    render(
      <Button data-testid="b" className="custom-cls">
        X
      </Button>,
    );
    expect(screen.getByTestId("b").className).toMatch(/custom-cls/);
  });
});

describe("buttonVariants", () => {
  it("returns class string for default", () => {
    expect(typeof buttonVariants({})).toBe("string");
  });

  it("includes destructive class for variant=destructive", () => {
    const out = buttonVariants({ variant: "destructive" });
    expect(out).toMatch(/E5484D/);
  });

  it("uses lg size class", () => {
    const out = buttonVariants({ size: "lg" });
    expect(out).toMatch(/rounded-lg/);
  });
});
