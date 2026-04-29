import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, badgeVariants } from "@/src/components/ui/badge";

describe("Badge component", () => {
  it("renders children", () => {
    render(<Badge>Hello</Badge>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("uses default variant when none provided", () => {
    render(<Badge data-testid="b">X</Badge>);
    const el = screen.getByTestId("b");
    expect(el).toHaveAttribute("data-slot", "badge");
  });

  it("applies the requested variant class", () => {
    render(
      <Badge data-testid="b" variant="success">
        OK
      </Badge>,
    );
    const el = screen.getByTestId("b");
    expect(el.className).toMatch(/green/i);
  });

  it("applies destructive variant", () => {
    render(
      <Badge data-testid="b" variant="destructive">
        ERROR
      </Badge>,
    );
    expect(screen.getByTestId("b").className).toMatch(/destructive/);
  });

  it("renders as a Slot when asChild=true", () => {
    render(
      <Badge asChild>
        <a href="/x">Link</a>
      </Badge>,
    );
    const link = screen.getByRole("link", { name: "Link" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("data-slot", "badge");
  });

  it("merges className", () => {
    render(
      <Badge data-testid="b" className="custom-class">
        X
      </Badge>,
    );
    expect(screen.getByTestId("b").className).toMatch(/custom-class/);
  });

  it("forwards extra props (data-*)", () => {
    render(
      <Badge data-testid="b" data-track="badge-1">
        X
      </Badge>,
    );
    expect(screen.getByTestId("b")).toHaveAttribute("data-track", "badge-1");
  });
});

describe("badgeVariants", () => {
  it("returns a string of classes", () => {
    const out = badgeVariants({ variant: "success" });
    expect(typeof out).toBe("string");
    expect(out).toMatch(/green/);
  });

  it("uses default variant when none specified", () => {
    const out = badgeVariants({});
    expect(out).toMatch(/primary/);
  });
});
