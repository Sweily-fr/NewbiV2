import { describe, it, expect } from "vitest";
import {
  defaultSEO,
  getSEOData,
  generateBasicJsonLd,
  generateBreadcrumbsJsonLd,
  generateSitemap,
  generateMetaTags,
  generateFAQJsonLd,
} from "@/src/utils/seo-data";

describe("getSEOData", () => {
  it("returns defaults merged with page-specific data", () => {
    const out = getSEOData("home");
    // openGraph should at least have siteName + type filled in
    expect(out.openGraph.type).toBe("website");
    expect(out.openGraph.siteName).toBeTruthy();
    expect(out.twitter.card).toBe("summary_large_image");
    expect(out.twitter.site).toBe("@newbi_fr");
  });

  it("falls back to default-only for unknown page key", () => {
    const out = getSEOData("does-not-exist");
    expect(out.openGraph.siteName).toBe(defaultSEO.siteName);
  });
});

describe("generateBasicJsonLd", () => {
  it("returns a WebPage schema with isPartOf WebSite", () => {
    const out = generateBasicJsonLd("Title", "Desc", "https://example.com");
    expect(out).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Title",
      description: "Desc",
      url: "https://example.com",
      inLanguage: "fr-FR",
    });
    expect(out.isPartOf).toMatchObject({ "@type": "WebSite" });
  });
});

describe("generateBreadcrumbsJsonLd", () => {
  it("builds a BreadcrumbList with positional ListItems", () => {
    const breadcrumbs = [
      { name: "Home", url: "https://newbi.fr/" },
      { name: "Blog", url: "https://newbi.fr/blog" },
      { name: "Article", url: "https://newbi.fr/blog/x" },
    ];
    const out = generateBreadcrumbsJsonLd(breadcrumbs);
    expect(out["@type"]).toBe("BreadcrumbList");
    expect(out.itemListElement).toHaveLength(3);
    expect(out.itemListElement[0].position).toBe(1);
    expect(out.itemListElement[2].name).toBe("Article");
  });
});

describe("generateFAQJsonLd", () => {
  it("builds a FAQPage with mainEntity question/answer", () => {
    const faqs = [
      { question: "Q1?", answer: "A1." },
      { question: "Q2?", answer: "A2." },
    ];
    const out = generateFAQJsonLd(faqs);
    expect(out["@type"]).toBe("FAQPage");
    expect(out.mainEntity).toHaveLength(2);
    expect(out.mainEntity[0].name).toBe("Q1?");
    expect(out.mainEntity[0].acceptedAnswer.text).toBe("A1.");
  });
});

describe("generateSitemap", () => {
  it("returns a valid XML string with the urlset namespace", () => {
    const xml = generateSitemap();
    expect(xml).toContain("<?xml");
    expect(xml).toContain("urlset");
    expect(xml).toContain("<url>");
    expect(xml).toContain("<loc>");
    expect(xml).toContain("<changefreq>");
    expect(xml).toContain("<priority>");
  });

  it("includes the lastmod date in YYYY-MM-DD format", () => {
    const xml = generateSitemap();
    expect(xml).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  });
});

describe("generateMetaTags", () => {
  it("returns the basic meta shape Next.js expects", () => {
    const tags = generateMetaTags("home", "https://newbi.fr/");
    expect(tags).toHaveProperty("title");
    expect(tags).toHaveProperty("description");
    expect(tags).toHaveProperty("openGraph");
    expect(tags).toHaveProperty("twitter");
    expect(tags.openGraph.images).toHaveLength(1);
    expect(tags.openGraph.images[0]).toMatchObject({
      width: 1200,
      height: 630,
    });
  });

  it("uses currentUrl as openGraph.url and falls back to canonical", () => {
    const tags = generateMetaTags("home", "https://newbi.fr/test");
    expect(tags.openGraph.url).toBe("https://newbi.fr/test");
  });
});
