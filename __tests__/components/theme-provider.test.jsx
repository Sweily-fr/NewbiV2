import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";

import { ThemeProvider, useTheme } from "@/src/components/theme-provider";

function ThemeReader() {
  const { theme, colorblindMode } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="colorblind">{String(colorblindMode)}</span>
    </div>
  );
}

function ThemeSetter() {
  const { setTheme, setColorblindMode } = useTheme();
  return (
    <div>
      <button data-testid="set-dark" onClick={() => setTheme("dark")}>
        dark
      </button>
      <button data-testid="set-cb-on" onClick={() => setColorblindMode(true)}>
        cb on
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
      document.documentElement.classList.remove("light", "dark");
    }
  });

  it("provides default theme 'system'", () => {
    render(
      <ThemeProvider>
        <ThemeReader />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("system");
  });

  it("uses defaultTheme prop", () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeReader />
      </ThemeProvider>,
    );
    // On non-dashboard route, theme is dark in state but documentElement is forced light
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("loads theme from localStorage", () => {
    window.localStorage.setItem("vite-ui-theme", "light");
    render(
      <ThemeProvider>
        <ThemeReader />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("loads colorblind mode from localStorage", () => {
    window.localStorage.setItem("newbi-colorblind-mode", "true");
    render(
      <ThemeProvider>
        <ThemeReader />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("colorblind").textContent).toBe("true");
  });

  it("setTheme persists to localStorage", () => {
    render(
      <ThemeProvider>
        <ThemeReader />
        <ThemeSetter />
      </ThemeProvider>,
    );
    act(() => {
      screen.getByTestId("set-dark").click();
    });
    expect(window.localStorage.getItem("vite-ui-theme")).toBe("dark");
  });

  it("setColorblindMode persists and dispatches event", () => {
    const eventListener = vi.fn();
    window.addEventListener("colorblind-mode-change", eventListener);
    render(
      <ThemeProvider>
        <ThemeReader />
        <ThemeSetter />
      </ThemeProvider>,
    );
    act(() => {
      screen.getByTestId("set-cb-on").click();
    });
    expect(window.localStorage.getItem("newbi-colorblind-mode")).toBe("true");
    expect(eventListener).toHaveBeenCalled();
    window.removeEventListener("colorblind-mode-change", eventListener);
  });

  it("useTheme throws when used outside provider — fallback initialState", () => {
    // The default initialState should still be returned when no provider
    function Reader() {
      const { theme } = useTheme();
      return <span data-testid="t">{theme}</span>;
    }
    render(<Reader />);
    expect(screen.getByTestId("t").textContent).toBe("system");
  });
});
