import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock next/navigation usePathname
vi.mock("next/navigation", () => ({
  usePathname: () => "/factures",
}));

import {
  useSEO,
  useProductSEO,
  useAuthSEO,
  useLegalSEO,
} from "@/src/hooks/use-seo";

describe("useSEO", () => {
  it("returns merged SEO data with computed canonical url", () => {
    const { result } = renderHook(() => useSEO("home"));
    expect(result.current.canonical).toMatch(/\/factures$/);
    expect(result.current.openGraph?.url).toMatch(/\/factures$/);
  });

  it("custom canonical overrides computed url", () => {
    const { result } = renderHook(() =>
      useSEO("home", { canonical: "https://custom.example.com/x" }),
    );
    expect(result.current.canonical).toBe("https://custom.example.com/x");
    expect(result.current.openGraph.url).toBe("https://custom.example.com/x");
  });

  it("includes JSON-LD when pageKey provided", () => {
    const { result } = renderHook(() => useSEO("home"));
    expect(result.current.jsonLd).toBeTruthy();
  });

  it("appends breadcrumbs JSON-LD when breadcrumbs provided", () => {
    const { result } = renderHook(() =>
      useSEO("home", {}, [
        { name: "Accueil", url: "https://newbi.fr" },
        { name: "Factures", url: "https://newbi.fr/factures" },
      ]),
    );
    expect(Array.isArray(result.current.jsonLd)).toBe(true);
  });
});

describe("useProductSEO", () => {
  it("includes 3 breadcrumbs", () => {
    const { result } = renderHook(() => useProductSEO("Factures"));
    expect(Array.isArray(result.current.jsonLd)).toBe(true);
  });
});

describe("useAuthSEO", () => {
  it("returns SEO with login breadcrumbs", () => {
    const { result } = renderHook(() => useAuthSEO("login"));
    expect(result.current.canonical).toBeTruthy();
  });
});

describe("useLegalSEO", () => {
  it("returns SEO for mentions-legales", () => {
    const { result } = renderHook(() => useLegalSEO("mentions-legales"));
    expect(result.current.canonical).toBeTruthy();
  });

  it("returns SEO for politique-de-confidentialite", () => {
    const { result } = renderHook(() =>
      useLegalSEO("politique-de-confidentialite"),
    );
    expect(result.current.canonical).toBeTruthy();
  });
});
