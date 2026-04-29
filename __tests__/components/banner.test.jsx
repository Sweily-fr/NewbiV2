import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Banner from "@/src/components/banner";

describe("Banner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the sale banner heading", () => {
    render(<Banner />);
    expect(screen.getByText(/Black Friday Sale!/i)).toBeInTheDocument();
  });

  it("renders the Buy now button", () => {
    render(<Banner />);
    expect(
      screen.getByRole("button", { name: /Buy now/i }),
    ).toBeInTheDocument();
  });

  it("hides the banner when close button is clicked", () => {
    render(<Banner />);
    const closeButton = screen.getByLabelText(/Close banner/i);
    fireEvent.click(closeButton);
    expect(screen.queryByText(/Black Friday Sale!/i)).not.toBeInTheDocument();
  });

  it("shows hours/minutes/seconds counter", () => {
    render(<Banner />);
    // The counter shows hours, minutes, seconds
    expect(screen.getByText("h")).toBeInTheDocument();
    expect(screen.getByText("m")).toBeInTheDocument();
    expect(screen.getByText("s")).toBeInTheDocument();
  });

  it("close button has aria-label", () => {
    render(<Banner />);
    const close = screen.getByRole("button", { name: /Close banner/i });
    expect(close).toBeInTheDocument();
  });

  it("updates the timer after 1 second", () => {
    render(<Banner />);
    const before = screen.getAllByText(/^\d{2}$/).map((el) => el.textContent);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const after = screen.getAllByText(/^\d{2}$/).map((el) => el.textContent);
    // The seconds should have decreased
    expect(after.join(",")).not.toBe(before.join(","));
  });
});
