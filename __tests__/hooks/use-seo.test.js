import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@/src/utils/seo-data", () => ({
  getSEOData: vi.fn((key) => ({
    title: `Title for ${key}`,
    description: `Description for ${key}`,
    openGraph: { title: `OG ${key}` },
    twitter: { card: "summary_large_image" },
  })),
  generateBasicJsonLd: vi.fn((title, desc, url) => ({
    "@context": "https://schema.org",
    name: title,
    description: desc,
    url,
  })),
  generateBreadcrumbsJsonLd: vi.fn((bc) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: bc,
  })),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/some/page"),
}));

import {
  useSEO,
  useProductSEO,
  useAuthSEO,
  useLegalSEO,
} from "@/src/hooks/use-seo";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL = "https://newbi.fr";
});

describe("useSEO", () => {
  it("returns the SEO data for the page key with canonical from pathname", () => {
    const { result } = renderHook(() => useSEO("home"));
    expect(result.current.title).toBe("Title for home");
    expect(result.current.canonical).toBe("https://newbi.fr/some/page");
    expect(result.current.openGraph.url).toBe("https://newbi.fr/some/page");
  });

  it("respects a custom canonical override", () => {
    const { result } = renderHook(() =>
      useSEO("home", { canonical: "https://example.com/custom" }),
    );
    expect(result.current.canonical).toBe("https://example.com/custom");
    expect(result.current.openGraph.url).toBe("https://example.com/custom");
  });

  it("merges customSEO over baseSEO", () => {
    const { result } = renderHook(() =>
      useSEO("home", {
        title: "Custom title",
        openGraph: { description: "Custom OG desc" },
      }),
    );
    expect(result.current.title).toBe("Custom title");
    expect(result.current.openGraph.title).toBe("OG home"); // base preserved
    expect(result.current.openGraph.description).toBe("Custom OG desc");
  });

  it("generates basic JSON-LD when none is provided", () => {
    const { result } = renderHook(() => useSEO("home"));
    expect(result.current.jsonLd).toMatchObject({
      "@context": "https://schema.org",
      name: "Title for home",
    });
  });

  it("preserves an explicit jsonLd from customSEO", () => {
    const customLd = { "@context": "x", name: "Manual" };
    const { result } = renderHook(() => useSEO("home", { jsonLd: customLd }));
    expect(result.current.jsonLd).toBe(customLd);
  });

  it("appends breadcrumbs JSON-LD when provided", () => {
    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "Sub", url: "/sub" },
    ];
    const { result } = renderHook(() => useSEO("home", {}, breadcrumbs));
    expect(Array.isArray(result.current.jsonLd)).toBe(true);
    expect(result.current.jsonLd).toHaveLength(2);
  });
});

describe("useProductSEO", () => {
  it("builds 3-level product breadcrumbs", () => {
    const { result } = renderHook(() => useProductSEO("Factures"));
    expect(Array.isArray(result.current.jsonLd)).toBe(true);
    const breadcrumbsLd = result.current.jsonLd[1];
    expect(breadcrumbsLd.itemListElement).toHaveLength(3);
    expect(breadcrumbsLd.itemListElement[0].name).toBe("Accueil");
    expect(breadcrumbsLd.itemListElement[2].name).toBe("Factures");
  });
});

describe("useAuthSEO", () => {
  it("uses 'Connexion' for login type", () => {
    const { result } = renderHook(() => useAuthSEO("login"));
    const breadcrumbsLd = result.current.jsonLd[1];
    expect(breadcrumbsLd.itemListElement[1].name).toBe("Connexion");
  });

  it("uses 'Inscription' for signup type", () => {
    const { result } = renderHook(() => useAuthSEO("signup"));
    const breadcrumbsLd = result.current.jsonLd[1];
    expect(breadcrumbsLd.itemListElement[1].name).toBe("Inscription");
  });
});

describe("useLegalSEO", () => {
  it("maps mentions-legales to its page key + breadcrumbs", () => {
    const { result } = renderHook(() => useLegalSEO("mentions-legales"));
    expect(result.current.title).toBe("Title for mentionsLegales");
    const breadcrumbsLd = result.current.jsonLd[1];
    expect(breadcrumbsLd.itemListElement[1].name).toBe("Mentions Légales");
  });

  it("maps politique-de-confidentialite correctly", () => {
    const { result } = renderHook(() =>
      useLegalSEO("politique-de-confidentialite"),
    );
    expect(result.current.title).toBe("Title for politiqueConfidentialite");
  });
});
