"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const COLORBLIND_STORAGE_KEY = "newbi-colorblind-mode";

const initialState = {
  theme: "system",
  setTheme: () => null,
  colorblindMode: false,
  setColorblindMode: () => null,
};

const ThemeProviderContext = createContext(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}) {
  const pathname = usePathname();
  const isDarkAllowed =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/create-workspace");

  const [theme, setTheme] = useState(defaultTheme);
  const [colorblindMode, setColorblindModeState] = useState(false);

  // Sync with localStorage on mount (client-side only)
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setTheme(stored);
    }
    const storedColorblind = localStorage.getItem(COLORBLIND_STORAGE_KEY);
    if (storedColorblind === "true") {
      setColorblindModeState(true);
    }
  }, [storageKey]);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    // Si on n'est pas sur une route autorisée, forcer le thème light
    if (!isDarkAllowed) {
      root.classList.add("light");
      return;
    }

    // Si on est sur une route autorisée, appliquer le thème choisi
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme, isDarkAllowed]);

  const value = {
    theme,
    setTheme: (theme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, theme);
      }
      setTheme(theme);
    },
    colorblindMode,
    setColorblindMode: (enabled) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          COLORBLIND_STORAGE_KEY,
          enabled ? "true" : "false",
        );
        window.dispatchEvent(new Event("colorblind-mode-change"));
      }
      setColorblindModeState(enabled);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
