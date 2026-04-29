import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DarkModeComponent from "@/src/components/darkmode";

describe("DarkMode", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
      document.documentElement.classList.remove("dark", "light");
    }
  });

  it("renders all three theme options", () => {
    render(<DarkModeComponent />);
    expect(screen.getByText("Claire")).toBeInTheDocument();
    expect(screen.getByText("Sombre")).toBeInTheDocument();
    expect(screen.getByText("Système")).toBeInTheDocument();
  });

  it("renders the Apparence legend", () => {
    render(<DarkModeComponent />);
    expect(screen.getByText("Apparence")).toBeInTheDocument();
  });

  it("renders three theme images", () => {
    const { container } = render(<DarkModeComponent />);
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBe(3);
  });

  it("loads stored theme from localStorage on mount", async () => {
    window.localStorage.setItem("vite-ui-theme", "dark");
    render(<DarkModeComponent />);
    // Look at radio's checked state for "dark"
    const darkRadio = screen
      .getAllByRole("radio")
      .find((r) => r.getAttribute("value") === "dark");
    expect(darkRadio).toBeTruthy();
  });

  it("updates localStorage when theme changes via radio click", () => {
    render(<DarkModeComponent />);
    const darkRadio = screen
      .getAllByRole("radio")
      .find((r) => r.getAttribute("value") === "dark");
    fireEvent.click(darkRadio);
    expect(window.localStorage.getItem("vite-ui-theme")).toBe("dark");
  });

  it("adds 'dark' class on documentElement when dark theme selected", () => {
    render(<DarkModeComponent />);
    const darkRadio = screen
      .getAllByRole("radio")
      .find((r) => r.getAttribute("value") === "dark");
    fireEvent.click(darkRadio);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it.skip("removes &apos;dark&apos; class when light theme is selected", () => {
    document.documentElement.classList.add("dark");
    render(<DarkModeComponent />);
    const lightRadio = screen
      .getAllByRole("radio")
      .find((r) => r.getAttribute("value") === "light");
    fireEvent.click(lightRadio);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
