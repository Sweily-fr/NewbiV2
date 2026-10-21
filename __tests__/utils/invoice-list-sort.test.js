import { describe, it, expect } from "vitest";
import {
  clientSortingFn,
  displayedTotalTTC,
  totalTTCSortingFn,
} from "@/src/utils/invoice-list-sort";
import { amountSearchTexts } from "@/src/utils/search-amount";

const ligne = (original) => ({ original });

describe("Liste des factures : tri", () => {
  it("par client à la française : « à » avec « a », majuscules ignorées", () => {
    const noms = [
      "client importé rejeté",
      "Client importé à valider",
      "zoé dupré",
      "Cabinet Dumas",
      "client importé archivé",
    ];
    const tries = noms
      .map((name) => ligne({ client: { name } }))
      .sort(clientSortingFn)
      .map((r) => r.original.client.name);
    expect(tries).toEqual([
      "Cabinet Dumas",
      "Client importé à valider",
      "client importé archivé",
      "client importé rejeté",
      "zoé dupré",
    ]);
  });

  it("par montant TTC : les factures importées rangées à leur montant", () => {
    const factures = [
      { id: "a", finalTotalTTC: 1440 },
      { id: "i1", _type: "imported", totalTTC: 768 },
      { id: "b", finalTotalTTC: 36 },
      { id: "i2", _type: "imported", totalTTC: 60 },
    ];
    const tries = factures
      .map(ligne)
      .sort(totalTTCSortingFn)
      .map((r) => r.original.id);
    expect(tries).toEqual(["b", "i2", "i1", "a"]);
  });

  it("montant TTC affiché : escompte déduit, importée à son total", () => {
    expect(
      displayedTotalTTC({
        finalTotalHT: 1000,
        finalTotalVAT: 200,
        finalTotalTTC: 1200,
        escompte: 2,
      }),
    ).toBeCloseTo(1176, 6);
    expect(displayedTotalTTC({ _type: "imported", totalTTC: 61.2 })).toBe(61.2);
    expect(displayedTotalTTC({ finalTotalTTC: null })).toBeNull();
  });
});

describe("Recherche par montant", () => {
  it("reconnaît le montant tel qu'affiché, avec un point ou sans décimales", () => {
    const textes = amountSearchTexts(840);
    for (const saisie of ["840,00", "840.00", "840"]) {
      expect(
        textes.some((t) => t.includes(saisie)),
        saisie,
      ).toBe(true);
    }
  });

  it("milliers séparés d'une espace, comme dans la liste", () => {
    const textes = amountSearchTexts(1080);
    expect(textes).toContain("1 080,00");
    expect(textes).toContain("1080,00");
    expect(textes.some((t) => t.includes("840,00"))).toBe(false);
  });

  it("montant inconnu : rien à chercher", () => {
    expect(amountSearchTexts(null)).toEqual([]);
    expect(amountSearchTexts(undefined)).toEqual([]);
    expect(amountSearchTexts("abc")).toEqual([]);
    expect(amountSearchTexts("12.5")).toContain("12,5");
  });
});
