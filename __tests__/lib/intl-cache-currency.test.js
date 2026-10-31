// Formateur de montants partagé : une devise enregistrée qui n'est pas un
// code ISO (anciennes factures d'achat en « € » ou « EURO ») ne fait plus
// tomber l'affichage (dialogue de comparaison OCR, confirmation d'un
// justificatif) : le montant s'affiche en euros.
import { describe, it, expect } from "vitest";
import { getNumberFormat } from "@/src/lib/intl-cache";

const montant = (currency, value = 12.5) =>
  getNumberFormat("fr-FR", { style: "currency", currency })
    .format(value)
    .replace(/\s/g, " ");

describe("getNumberFormat : devise invalide", () => {
  it.each(["€", "EURO", "<b>EUR</b>"])(
    "« %s » : montant affiché en euros",
    (devise) => {
      expect(montant(devise)).toBe("12,50 €");
    },
  );

  it("une devise valide garde son symbole", () => {
    expect(montant("USD")).toMatch(/\$/);
  });

  it("une autre erreur de paramètres reste signalée", () => {
    expect(() => getNumberFormat("fr-FR", { style: "inconnu" })).toThrow(
      RangeError,
    );
  });
});
