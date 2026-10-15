import { describe, it, expect } from "vitest";
import {
  applyOcrDrafts,
  parseOcrNumber,
} from "@/src/components/reconciliation/OcrValueInput";

describe("parseOcrNumber", () => {
  it("lit la virgule décimale, les espaces des milliers et le symbole €", () => {
    expect(parseOcrNumber("15,70")).toBe(15.7);
    expect(parseOcrNumber("1 234,56")).toBe(1234.56);
    // Espaces insécables (copier-coller depuis un PDF)
    expect(parseOcrNumber("1 234,56 €")).toBe(1234.56);
    expect(parseOcrNumber(" 85.70 € ")).toBe(85.7);
    expect(parseOcrNumber(0)).toBe(0);
  });

  it("vide ou illisible : null", () => {
    expect(parseOcrNumber("")).toBeNull();
    expect(parseOcrNumber(null)).toBeNull();
    expect(parseOcrNumber(undefined)).toBeNull();
    expect(parseOcrNumber("abc")).toBeNull();
  });
});

describe("applyOcrDrafts", () => {
  const NUMBER_KEYS = new Set(["amountTVA", "amountTTC"]);

  it("convertit les montants saisis, garde le reste de la proposition", () => {
    expect(
      applyOcrDrafts(
        { supplierName: "Meta", amountTVA: 15.7, amountTTC: 85.7 },
        { amountTVA: "1 234,56", supplierName: "Meta Platforms" },
        NUMBER_KEYS,
      ),
    ).toEqual({
      supplierName: "Meta Platforms",
      amountTVA: 1234.56,
      amountTTC: 85.7,
    });
  });

  it("un champ vidé vaut non lu (null)", () => {
    expect(
      applyOcrDrafts({ amountTVA: 15.7 }, { amountTVA: "" }, NUMBER_KEYS),
    ).toEqual({ amountTVA: null });
  });
});
