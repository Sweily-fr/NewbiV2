import { describe, it, expect } from "vitest";
import {
  applyVatLinesToForm,
  formatVatRate,
  invoiceVatLines,
  parseVatLines,
  sameVatLines,
  splitVatIntoLines,
  vatInputFromForm,
  vatLinesOf,
  vatLinesFromOcr,
} from "@/src/utils/purchase-invoice-vat";

// Note de restaurant : plats à 10 %, boissons alcoolisées à 20 %
const RESTAURANT = [
  { rate: 20, baseHT: 35.36, amountTVA: 7.07 },
  { rate: 10, baseHT: 80, amountTVA: 8 },
];

describe("invoiceVatLines", () => {
  it("ne retient le détail qu'à partir de deux taux", () => {
    expect(invoiceVatLines({ vatBreakdown: RESTAURANT })).toEqual(RESTAURANT);
    expect(invoiceVatLines({ vatBreakdown: [RESTAURANT[0]] })).toEqual([]);
    expect(invoiceVatLines({ vatBreakdown: null })).toEqual([]);
    expect(invoiceVatLines(null)).toEqual([]);
  });
});

describe("parseVatLines", () => {
  it("convertit la saisie (virgule admise) et déduit la TVA vide", () => {
    expect(
      parseVatLines([
        { rate: "5.5", baseHT: "10,00", amountTVA: "" },
        { rate: "20", baseHT: "35.36", amountTVA: "7.07" },
        { rate: "10", baseHT: "", amountTVA: "" },
      ]),
    ).toEqual([
      { rate: 5.5, baseHT: 10, amountTVA: 0.55 },
      { rate: 20, baseHT: 35.36, amountTVA: 7.07 },
    ]);
  });
});

describe("applyVatLinesToForm", () => {
  const form = {
    amountHT: "100",
    amountTVA: "20",
    vatRate: "20",
    amountTTC: "120",
    vatLines: [],
  };

  it("plusieurs lignes : HT / TVA / taux = résumé, TTC = HT + TVA", () => {
    const next = applyVatLinesToForm(form, [
      { rate: "20", baseHT: "35.36", amountTVA: "7.07" },
      { rate: "10", baseHT: "80", amountTVA: "8" },
    ]);
    expect(next).toMatchObject({
      amountHT: "115.36",
      amountTVA: "15.07",
      vatRate: "10",
      amountTTC: "130.43",
    });
    expect(next.vatLines).toHaveLength(2);
  });

  it("facture rapprochée : le TTC reste le débit bancaire", () => {
    const next = applyVatLinesToForm(
      form,
      [
        { rate: "20", baseHT: "35.36", amountTVA: "7.07" },
        { rate: "10", baseHT: "80", amountTVA: "8" },
      ],
      { keepTTC: true },
    );
    expect(next.amountTTC).toBe("120");
  });

  it("revenu à une ligne : forme habituelle, sans détail", () => {
    const next = applyVatLinesToForm(form, [
      { rate: "5.5", baseHT: "50", amountTVA: "2.75" },
    ]);
    expect(next).toMatchObject({
      vatLines: [],
      amountHT: "50.00",
      amountTVA: "2.75",
      vatRate: "5.5",
      amountTTC: "52.75",
    });
  });

  it("passer à plusieurs taux garde la TVA saisie en première ligne", () => {
    const lines = splitVatIntoLines(form);
    expect(lines).toEqual([
      { rate: "20", baseHT: "100", amountTVA: "20" },
      { rate: "10", baseHT: "", amountTVA: "" },
    ]);
    // La ligne vide ne change rien aux montants
    expect(applyVatLinesToForm(form, lines)).toMatchObject({
      amountHT: "100.00",
      amountTVA: "20.00",
      amountTTC: "120.00",
    });
  });
});

describe("vatInputFromForm", () => {
  it("plusieurs taux : détail envoyé avec son résumé", () => {
    expect(
      vatInputFromForm({
        amountHT: "0",
        amountTVA: "0",
        vatRate: "20",
        vatLines: [
          { rate: "20", baseHT: "35.36", amountTVA: "7.07" },
          { rate: "10", baseHT: "80", amountTVA: "8" },
        ],
      }),
    ).toEqual({
      amountHT: 115.36,
      amountTVA: 15.07,
      vatRate: 10,
      vatBreakdown: RESTAURANT,
    });
  });

  it("un seul taux : 0 % reste 0 % (plus de repli à 20 %)", () => {
    expect(
      vatInputFromForm({
        amountHT: "40",
        amountTVA: "0",
        vatRate: "0",
        vatLines: [],
      }),
    ).toEqual({ amountHT: 40, amountTVA: 0, vatRate: 0, vatBreakdown: [] });
  });
});

describe("vatLinesFromOcr", () => {
  const financial = (taxDetails) => ({
    extracted_fields: { tax_details: taxDetails },
  });

  it("lit les formats Claude et Mistral, sans les taxes hors TVA", () => {
    expect(
      vatLinesFromOcr(
        financial([
          { rate: 10, base: 80, amount: 8 },
          { type: "TVA", rate: 20, base_amount: 35.36, tax_amount: 7.07 },
          { type: "DEEE", rate: 0, base_amount: 0.02, tax_amount: 0.02 },
        ]),
        15.07,
      ),
    ).toEqual(RESTAURANT);
  });

  it("détail incohérent avec le total lu, ou un seul taux : rien", () => {
    expect(
      vatLinesFromOcr(
        financial([
          { rate: 10, base: 80, amount: 8 },
          { rate: 20, base: 35.36, amount: 7.07 },
        ]),
        30,
      ),
    ).toEqual([]);
    expect(
      vatLinesFromOcr(financial([{ rate: 20, base: 100, amount: 20 }])),
    ).toEqual([]);
  });
});

describe("formatVatRate / sameVatLines", () => {
  it("affiche le taux à la française", () => {
    expect(formatVatRate(5.5)).toBe("5,5 %");
    expect(formatVatRate(20)).toBe("20 %");
    expect(formatVatRate(0)).toBe("0 %");
  });

  it("compare deux détails sans tenir compte de l'ordre", () => {
    expect(sameVatLines(RESTAURANT, [...RESTAURANT].reverse())).toBe(true);
    expect(
      sameVatLines(RESTAURANT, [
        RESTAURANT[0],
        { rate: 10, baseHT: 80, amountTVA: 8.01 },
      ]),
    ).toBe(false);
  });
});

describe("vatLinesOf (tableau, export)", () => {
  it("facture à plusieurs taux : son détail", () => {
    expect(vatLinesOf({ vatBreakdown: RESTAURANT, vatRate: 10 })).toEqual(
      RESTAURANT,
    );
  });

  it("taux unique : une ligne depuis les champs historiques, 0 % compris", () => {
    expect(
      vatLinesOf({ vatRate: 0, amountHT: 40, amountTVA: 0, vatBreakdown: [] }),
    ).toEqual([{ rate: 0, baseHT: 40, amountTVA: 0 }]);
  });

  it("TVA non renseignée : rien", () => {
    expect(vatLinesOf({ vatRate: 20, amountTVA: null })).toEqual([]);
  });
});
