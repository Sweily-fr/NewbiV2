import { describe, it, expect } from "vitest";
import { otherCreditNotesTotal } from "@/app/dashboard/outils/factures/hooks/use-credit-note-editor";

describe("Avoirs : montant restant à créditer", () => {
  const avoirs = [
    { id: "av1", finalTotalTTC: -600 },
    { id: "av2", finalTotalTTC: -28.8 },
  ];

  it("à la création : tous les avoirs de la facture comptent", () => {
    expect(otherCreditNotesTotal(avoirs, null)).toBeCloseTo(628.8, 6);
  });

  it("à la modification : l'avoir modifié ne compte pas son propre montant", () => {
    expect(otherCreditNotesTotal(avoirs, "av1")).toBeCloseTo(28.8, 6);
    // Facture de 1 200 € : le seul avoir (600 €) peut passer à 840 €
    expect(1200 - otherCreditNotesTotal([avoirs[0]], "av1")).toBe(1200);
  });

  it("sans avoir : 0", () => {
    expect(otherCreditNotesTotal(undefined, null)).toBe(0);
  });
});
