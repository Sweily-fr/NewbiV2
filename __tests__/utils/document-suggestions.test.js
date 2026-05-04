import { describe, it, expect } from "vitest";
import {
  documentSuggestions,
  generateDynamicFooter,
  getFooterVariants,
} from "@/src/utils/document-suggestions";

const standardCompany = {
  name: "Acme",
  legalForm: "SARL",
  capitalSocial: "10000",
  siret: "12345678901234",
  rcs: "RCS Paris B 123 456 789",
  addressStreet: "1 rue de la Paix",
  addressCity: "Paris",
  addressZipCode: "75001",
  vatNumber: "FR12345678901",
  fiscalRegime: "reel-normal",
};

const microCompany = {
  name: "Marc Auto",
  legalForm: "EI",
  siret: "12345678901234",
  rcs: "RCS Paris",
  addressStreet: "5 rue Test",
  addressCity: "Paris",
  addressZipCode: "75001",
  fiscalRegime: "micro-entreprise",
};

describe("documentSuggestions", () => {
  it("contains all expected categories", () => {
    expect(documentSuggestions).toHaveProperty("headerNotes");
    expect(documentSuggestions).toHaveProperty("footerNotes");
    expect(documentSuggestions).toHaveProperty("termsAndConditions");
  });

  it("each suggestion has label and value", () => {
    for (const cat of Object.values(documentSuggestions)) {
      for (const item of cat) {
        expect(item).toHaveProperty("label");
        expect(item).toHaveProperty("value");
        expect(item.label.length).toBeGreaterThan(0);
        expect(item.value.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("generateDynamicFooter", () => {
  it("returns empty string when companyInfo is null", () => {
    expect(generateDynamicFooter(null)).toBe("");
  });

  it("includes name, legal form, capital, SIRET in standard-compact", () => {
    const out = generateDynamicFooter(standardCompany, "standard-compact");
    expect(out).toContain("Acme");
    expect(out).toContain("SARL");
    expect(out).toContain("10000");
    expect(out).toContain("12345678901234");
    expect(out).toContain("Paris B 123 456 789");
  });

  it("includes the address built from separate fields", () => {
    const out = generateDynamicFooter(standardCompany, "standard-compact");
    expect(out).toContain("1 rue de la Paix");
    expect(out).toContain("75001");
    expect(out).toContain("Paris");
  });

  it("auto-detects micro-entreprise (uses micro-lisible variant — no CGI mention by default)", () => {
    const out = generateDynamicFooter(microCompany);
    expect(out).toContain("Marc Auto");
    expect(out).toContain("EI");
    expect(out).toContain("12345678901234");
  });

  it("'micro-compact' variant includes the CGI mention", () => {
    const out = generateDynamicFooter(microCompany, "micro-compact");
    expect(out).toContain("TVA non applicable, art. 293 B du CGI");
  });

  it("'autoliquidation-compact' includes the article 283-2 mention", () => {
    const out = generateDynamicFooter(
      standardCompany,
      "autoliquidation-compact",
    );
    expect(out).toContain("Autoliquidation TVA");
    expect(out).toContain("283-2 CGI");
  });

  it("'btp' variant includes RC décennale placeholder", () => {
    const out = generateDynamicFooter(standardCompany, "btp");
    expect(out).toContain("Assurance RC décennale");
  });

  it("'b2c' variant includes médiation placeholder", () => {
    const out = generateDynamicFooter(standardCompany, "b2c");
    expect(out).toContain("Médiation à la consommation");
  });

  it("falls back to standard-lisible for unknown variant on non-micro company", () => {
    const out = generateDynamicFooter(standardCompany, "unknown-variant");
    // standard-lisible includes ' • SIRET 12345678901234'
    expect(out).toContain("12345678901234");
  });

  it("supports the legacy 'address' object shape", () => {
    const out = generateDynamicFooter({
      name: "X",
      siret: "12345678901234",
      address: { street: "1 av Test", city: "Lyon", postalCode: "69001" },
    });
    expect(out).toContain("1 av Test");
    expect(out).toContain("69001");
    expect(out).toContain("Lyon");
  });
});

describe("getFooterVariants", () => {
  it("returns a non-empty list of {label,value}", () => {
    const variants = getFooterVariants();
    expect(variants.length).toBeGreaterThan(0);
    for (const v of variants) {
      expect(v).toHaveProperty("label");
      expect(v).toHaveProperty("value");
    }
  });
});
