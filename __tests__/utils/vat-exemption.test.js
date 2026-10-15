import { describe, it, expect } from "vitest";
import { normalizeVatExemptionText } from "@/src/utils/vat-exemption";

describe("mention de franchise en base — reprise des brouillons", () => {
  it("remplace l'option « Article L. 223-3 du CIBS » par la référence en vigueur", () => {
    expect(normalizeVatExemptionText("Article L. 223-3 du CIBS")).toBe(
      "Article 293 B du CGI",
    );
  });

  it("remplace la mention complète des factures liées", () => {
    expect(
      normalizeVatExemptionText("TVA non applicable, art. L. 223-3 du CIBS"),
    ).toBe("TVA non applicable, art. 293 B du CGI");
  });

  it("laisse les autres mentions et les valeurs vides telles quelles", () => {
    expect(normalizeVatExemptionText("Article 261 D du CGI")).toBe(
      "Article 261 D du CGI",
    );
    expect(normalizeVatExemptionText("Auto-liquidation")).toBe(
      "Auto-liquidation",
    );
    expect(normalizeVatExemptionText("")).toBe("");
    expect(normalizeVatExemptionText(undefined)).toBeUndefined();
  });
});
