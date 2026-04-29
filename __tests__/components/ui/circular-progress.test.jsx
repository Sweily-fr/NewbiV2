import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CircularProgress from "@/src/components/ui/circular-progress";

describe("CircularProgress", () => {
  it("renders the value as label by default", () => {
    render(<CircularProgress value={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders custom renderLabel output", () => {
    render(<CircularProgress value={75} renderLabel={(v) => `${v}%`} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("hides label when showLabel=false", () => {
    render(<CircularProgress value={50} showLabel={false} />);
    expect(screen.queryByText("50")).not.toBeInTheDocument();
  });

  it("renders an svg with two circles (track + progress)", () => {
    const { container } = render(<CircularProgress value={30} />);
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });

  it("respects size prop", () => {
    const { container } = render(<CircularProgress value={50} size={200} />);
    const svg = container.querySelector("svg");
    expect(svg.getAttribute("width")).toBe("200");
    expect(svg.getAttribute("height")).toBe("200");
  });
});
