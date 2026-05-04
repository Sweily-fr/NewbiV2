import { describe, it, expect } from "vitest";
import {
  generateQuotePrefix,
  parseQuotePrefix,
  formatQuotePrefix,
  getCurrentMonthYear,
  validateQuoteNumber,
  formatQuoteNumber,
  getQuoteDisplayNumber,
  parseFullQuoteNumber,
  generatePurchaseOrderPrefix,
  parsePurchaseOrderPrefix,
  formatPurchaseOrderPrefix,
} from "@/src/utils/quoteUtils";

describe("generateQuotePrefix", () => {
  it("generates D-MMYYYY for the given date", () => {
    expect(generateQuotePrefix(new Date(2026, 1, 15))).toBe("D-022026"); // Feb
    expect(generateQuotePrefix(new Date(2026, 11, 1))).toBe("D-122026"); // Dec
  });

  it("uses current date by default", () => {
    const out = generateQuotePrefix();
    expect(out).toMatch(/^D-\d{6}$/);
  });
});

describe("parseQuotePrefix", () => {
  it("parses D-MMYYYY", () => {
    expect(parseQuotePrefix("D-022026")).toEqual({ month: "02", year: "2026" });
  });

  it("parses D-MM-YYYY", () => {
    expect(parseQuotePrefix("D-02-2026")).toEqual({
      month: "02",
      year: "2026",
    });
  });

  it("expands 2-digit year to 20XX", () => {
    expect(parseQuotePrefix("D-0226")).toEqual({ month: "02", year: "2026" });
  });

  it("returns null for invalid format", () => {
    expect(parseQuotePrefix("not a prefix")).toBeNull();
    expect(parseQuotePrefix("")).toBeNull();
    expect(parseQuotePrefix(null)).toBeNull();
  });
});

describe("formatQuotePrefix", () => {
  it("formats month and year (4-digit year)", () => {
    expect(formatQuotePrefix("2", "2026")).toBe("D-022026");
  });

  it("expands 2-digit year to 20XX", () => {
    expect(formatQuotePrefix("12", "26")).toBe("D-122026");
  });
});

describe("getCurrentMonthYear", () => {
  it("returns current month and year strings", () => {
    const out = getCurrentMonthYear();
    expect(out.month).toMatch(/^\d{2}$/);
    expect(out.year).toMatch(/^\d{4}$/);
  });
});

describe("validateQuoteNumber", () => {
  it.each([["1"], ["123456"], ["000001"]])("accepts valid number: %s", (n) =>
    expect(validateQuoteNumber(n)).toBe(true),
  );

  it.each([[""], [null], ["abc"], ["1234567"], ["12-34"]])(
    "rejects invalid number: %s",
    (n) => expect(validateQuoteNumber(n)).toBe(false),
  );
});

describe("formatQuoteNumber", () => {
  it("pads to 6 digits by default", () => {
    expect(formatQuoteNumber(1)).toBe("000001");
    expect(formatQuoteNumber("42")).toBe("000042");
  });

  it("respects custom length", () => {
    expect(formatQuoteNumber(1, 4)).toBe("0001");
  });

  it("returns empty string for falsy input", () => {
    expect(formatQuoteNumber(null)).toBe("");
    expect(formatQuoteNumber("")).toBe("");
  });
});

describe("getQuoteDisplayNumber", () => {
  it("joins prefix and number with dash", () => {
    expect(getQuoteDisplayNumber("D-022026", "000001")).toBe("D-022026-000001");
  });

  it("returns empty string when missing prefix or number", () => {
    expect(getQuoteDisplayNumber(null, "000001")).toBe("");
    expect(getQuoteDisplayNumber("D-022026", null)).toBe("");
  });
});

describe("parseFullQuoteNumber", () => {
  it("parses D-MMYYYY-NNNNNN", () => {
    expect(parseFullQuoteNumber("D-022026-000001")).toEqual({
      prefix: "D-022026",
      number: "000001",
      month: "02",
      year: "2026",
    });
  });

  it("returns null for malformed input", () => {
    expect(parseFullQuoteNumber("D-022026")).toBeNull();
    expect(parseFullQuoteNumber("BC-022026-000001")).toBeNull();
    expect(parseFullQuoteNumber(null)).toBeNull();
  });
});

describe("Purchase order prefix utilities", () => {
  it("generatePurchaseOrderPrefix produces BC-MMYYYY", () => {
    expect(generatePurchaseOrderPrefix(new Date(2026, 1, 15))).toBe(
      "BC-022026",
    );
  });

  it("parsePurchaseOrderPrefix parses BC-MMYYYY", () => {
    expect(parsePurchaseOrderPrefix("BC-022026")).toEqual({
      month: "02",
      year: "2026",
    });
  });

  it("parsePurchaseOrderPrefix returns null for non-BC prefix", () => {
    expect(parsePurchaseOrderPrefix("D-022026")).toBeNull();
  });

  it("formatPurchaseOrderPrefix expands 2-digit year", () => {
    expect(formatPurchaseOrderPrefix("2", "26")).toBe("BC-022026");
  });
});
