import { describe, it, expect } from "vitest";
import {
  buildLinkedItems,
  computeLinkedQuantity,
  linkedItemExplanation,
  linkedQuantityUpdates,
  linkedRuleError,
} from "@/src/utils/linked-products";

// « 1 pour 10 » sur 23 m² du produit principal
const rule = (rounding) => ({
  linkedQuantity: 1,
  linkedPer: 10,
  linkedRounding: rounding,
});

describe("Produits liés dans un document", () => {
  it("23 m², « 1 pour 10 » : 3 (supérieur), 2 (inférieur), 2,3 (sans arrondi)", () => {
    expect(computeLinkedQuantity(23, rule("UP"))).toBe(3);
    expect(computeLinkedQuantity(23, rule("DOWN"))).toBe(2);
    expect(computeLinkedQuantity(23, rule("NONE"))).toBe(2.3);
  });

  it("lignes créées et recalculées quand la quantité principale change", () => {
    const product = {
      linkedProducts: [
        {
          quantity: 1,
          per: 10,
          rounding: "NONE",
          product: { id: "p2", name: "Lessivage", unitPrice: 12, vatRate: 20 },
        },
      ],
    };
    const [line] = buildLinkedItems(product, {
      mainQuantity: 23,
      parentKey: "main",
    });
    expect(line).toMatchObject({
      description: "Lessivage",
      quantity: 2.3,
      unitPrice: 12,
      linkedFromKey: "main",
    });
    // Totaux de la ligne : 2,3 × 12 = 27,60 HT, 33,12 TTC
    expect(Math.round(line.quantity * line.unitPrice * 100) / 100).toBe(27.6);
    expect(Math.round(line.quantity * line.unitPrice * 1.2 * 100) / 100).toBe(
      33.12,
    );

    expect(linkedQuantityUpdates([{}, line], "main", 40)).toEqual([
      { index: 1, quantity: 4 },
    ]);
    expect(
      linkedQuantityUpdates([line], "main", 40, { negative: true }),
    ).toEqual([{ index: 0, quantity: -4 }]);
  });

  it("explication lisible de la ligne liée", () => {
    expect(
      linkedItemExplanation(
        { ...rule("UP"), unit: "unité" },
        { unit: "m²", description: "Peinture" },
      ),
    ).toBe("Calculée automatiquement : 1 unité pour 10 m² de Peinture");
  });
});

describe("Règle saisie dans la fiche produit", () => {
  const link = (quantity, per) => ({
    quantity,
    per,
    product: { name: "Enduit" },
  });

  it("valide de 0,01 à 1 000 000", () => {
    expect(linkedRuleError(link("1", "20"))).toBeNull();
    expect(linkedRuleError(link(0.01, 1000000))).toBeNull();
  });

  it("refuse 0, une base de 0,0001 et une valeur démesurée", () => {
    expect(linkedRuleError(link(0, 1))).toMatch(/supérieures à 0/);
    expect(linkedRuleError(link(1, 0.0001))).toMatch(/vont de 0,01 à 1/);
    expect(linkedRuleError(link(2e6, 1))).toMatch(/vont de 0,01 à 1/);
    expect(linkedRuleError(link("abc", 1))).toMatch(/supérieures à 0/);
  });
});
