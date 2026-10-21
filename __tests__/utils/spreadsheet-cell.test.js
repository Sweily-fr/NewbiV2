import { describe, it, expect } from "vitest";
import {
  neutralizeFormula,
  toCsvCell,
  toQuotedCsvCell,
  toHtmlCell,
} from "@/src/utils/spreadsheet-cell";

describe("neutralizeFormula", () => {
  it.each(["=1+1", "+SOMME(A1)", "-2+3", "@MOI", "\tTexte", "\rTexte"])(
    "« %s » reste du texte (apostrophe)",
    (value) => {
      expect(neutralizeFormula(value)).toBe(`'${value}`);
    },
  );

  it.each(["-12,50", "-1 234,56 €", "+5 %", "+33 6 12 34 56 78", "-0.5"])(
    "le nombre « %s » n'est pas touché",
    (value) => {
      expect(neutralizeFormula(value)).toBe(value);
    },
  );

  it("texte ordinaire et valeurs non textuelles inchangés", () => {
    expect(neutralizeFormula("Dupont & Fils")).toBe("Dupont & Fils");
    expect(neutralizeFormula("Prix = 5")).toBe("Prix = 5");
    expect(neutralizeFormula(-12.5)).toBe(-12.5);
    expect(neutralizeFormula(null)).toBe(null);
  });
});

describe("toCsvCell", () => {
  it("neutralise puis échappe", () => {
    expect(toCsvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(toCsvCell("Dupont;Fils")).toBe('"Dupont;Fils"');
    expect(toCsvCell("simple")).toBe("simple");
    expect(toCsvCell(-12.5)).toBe("-12.5");
    expect(toCsvCell(undefined)).toBe("");
  });

  it("un saut de ligne reste dans la cellule (pas de ligne qui commence par une formule)", () => {
    expect(toCsvCell("Nom\n=1+1")).toBe('"Nom\n=1+1"');
  });
});

describe("toQuotedCsvCell", () => {
  it("toujours entre guillemets", () => {
    expect(toQuotedCsvCell("@cmd")).toBe(`"'@cmd"`);
    expect(toQuotedCsvCell('a "b"')).toBe('"a ""b"""');
    expect(toQuotedCsvCell("")).toBe('""');
  });
});

describe("toHtmlCell", () => {
  it("échappe le HTML et neutralise les formules", () => {
    expect(toHtmlCell('<img src=x onerror="y">')).toBe(
      '&lt;img src=x onerror="y"&gt;',
    );
    expect(toHtmlCell("=1+1")).toBe("'=1+1");
    expect(toHtmlCell("A & B")).toBe("A &amp; B");
  });
});
