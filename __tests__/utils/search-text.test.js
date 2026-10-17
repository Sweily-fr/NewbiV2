import { describe, it, expect } from "vitest";
import {
  createSearchMatcher,
  matchesSearch,
  normalizeSearchText,
} from "@/src/utils/search-text";

const NAMES = ["Méta", "Meta", "META PLATFORMS", "Me\u0301ta", "Canva"];

describe("search-text", () => {
  it("retire accents et majuscules", () => {
    expect(normalizeSearchText("Société Générale")).toBe("societe generale");
    expect(normalizeSearchText(null)).toBe("");
    expect(normalizeSearchText(12.5)).toBe("12.5");
  });

  it("« meta » trouve « Méta », « Meta » et « META » par défaut", () => {
    const match = createSearchMatcher("meta");
    expect(NAMES.filter((n) => match(n))).toEqual([
      "Méta",
      "Meta",
      "META PLATFORMS",
      "Me\u0301ta",
    ]);
    expect(NAMES.filter((n) => matchesSearch(n, "MÉTA"))).toHaveLength(4);
  });

  it("mode exact : majuscules et accents respectés", () => {
    const match = createSearchMatcher("Méta", { exact: true });
    // « Me\u0301ta » (NFD) est le même texte que « Méta » une fois recomposé
    expect(NAMES.filter((n) => match(n))).toEqual(["Méta", "Me\u0301ta"]);
    expect(matchesSearch("Meta", "meta", { exact: true })).toBe(false);
  });

  it("plusieurs champs, valeurs absentes et saisie vide", () => {
    const match = createSearchMatcher("fbads");
    expect(match(null, "FBADS-077-1", undefined)).toBe(true);
    expect(match("Meta", 157.46)).toBe(false);
    expect(createSearchMatcher("   ")("n'importe quoi")).toBe(true);
  });
});
