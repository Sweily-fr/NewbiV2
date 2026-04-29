import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PrioritySelect, PriorityBadge } from "@/src/components/PrioritySelect";

describe("PrioritySelect", () => {
  it("renders with the default low priority label when value matches", () => {
    render(<PrioritySelect value="low" onValueChange={vi.fn()} />);
    expect(screen.getByText("Basse")).toBeInTheDocument();
  });

  it("renders 'Moyenne' label when value is medium", () => {
    render(<PrioritySelect value="medium" onValueChange={vi.fn()} />);
    expect(screen.getByText("Moyenne")).toBeInTheDocument();
  });

  it("renders 'Haute' label when value is high", () => {
    render(<PrioritySelect value="high" onValueChange={vi.fn()} />);
    expect(screen.getByText("Haute")).toBeInTheDocument();
  });

  it("falls back to first priority (Basse) for unknown value", () => {
    render(<PrioritySelect value="unknown" onValueChange={vi.fn()} />);
    expect(screen.getByText("Basse")).toBeInTheDocument();
  });

  it("disables the trigger button when disabled prop is true", () => {
    render(
      <PrioritySelect value="low" onValueChange={vi.fn()} disabled={true} />,
    );
    const button = screen.getByRole("combobox");
    expect(button).toBeDisabled();
  });

  it("opens the popover and shows priority options when trigger is clicked", () => {
    render(<PrioritySelect value="low" onValueChange={vi.fn()} />);
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    // The trigger and dropdown both have the labels - find at least 2
    expect(screen.getAllByText("Basse").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Moyenne").length).toBeGreaterThan(0);
  });

  it("trigger has aria-expanded attribute", () => {
    render(<PrioritySelect value="low" onValueChange={vi.fn()} />);
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

describe("PriorityBadge", () => {
  it("renders with the priority's title (label)", () => {
    const { container } = render(<PriorityBadge priority="high" />);
    const wrapper = container.firstChild;
    expect(wrapper.getAttribute("title")).toBe("Haute");
  });

  it("renders with default low when priority is unknown", () => {
    const { container } = render(<PriorityBadge priority="unknown" />);
    const wrapper = container.firstChild;
    expect(wrapper.getAttribute("title")).toBe("Basse");
  });

  it("contains an SVG flag icon", () => {
    const { container } = render(<PriorityBadge priority="medium" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
