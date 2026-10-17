import { describe, it, expect } from "vitest";
import {
  applyVatLinesToForm,
  completeVatAmounts,
  deriveVatRate,
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

  it("taux vide : déduit des montants, plus de repli à 20 %", () => {
    // Ticket sans TVA : 0 %, pas « TVA 0 € à 20 % »
    expect(
      vatInputFromForm({
        amountHT: "10",
        amountTVA: "",
        amountTTC: "10",
        vatRate: "",
        vatLines: [],
      }),
    ).toEqual({ amountHT: 10, amountTVA: 0, vatRate: 0, vatBreakdown: [] });
    expect(
      vatInputFromForm({
        amountHT: "100",
        amountTVA: "20",
        amountTTC: "120",
        vatRate: "",
        vatLines: [],
      }).vatRate,
    ).toBe(20);
  });

  it("HT vide : envoyé tel qu'affiché (0), le taux vide est déduit sur TTC - TVA", () => {
    expect(
      vatInputFromForm({
        amountHT: "",
        amountTVA: "1,76",
        amountTTC: "10,59",
        vatRate: "",
        vatLines: [],
      }),
    ).toEqual({
      amountHT: 0,
      amountTVA: 1.76,
      vatRate: 20,
      vatBreakdown: [],
    });
  });
});

describe("deriveVatRate", () => {
  it("sans TVA : 0 %", () => {
    expect(deriveVatRate({ amountHT: 10, amountTVA: 0 })).toBe(0);
    expect(deriveVatRate({ amountTTC: 10 })).toBe(0);
    expect(deriveVatRate()).toBe(0);
  });

  it("taux légal qui redonne la TVA au centime, sinon quotient arrondi", () => {
    expect(deriveVatRate({ amountHT: 8.33, amountTVA: 1.67 })).toBe(20);
    expect(deriveVatRate({ amountHT: 100, amountTVA: 5.5 })).toBe(5.5);
    expect(deriveVatRate({ amountTVA: 1.76, amountTTC: 10.59 })).toBe(20);
    expect(deriveVatRate({ amountHT: 100, amountTVA: 12.34 })).toBe(12.34);
  });

  it("TVA connue sans aucune base : 20 % en dernier recours", () => {
    expect(deriveVatRate({ amountTVA: 5 })).toBe(20);
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

// Mêmes cas que l'API (newbi-api __tests__/utils/purchase-invoice-vat.test.js)
describe("completeVatAmounts", () => {
  const fill = { fillMissingVat: true };

  it("TTC seul : sans TVA seulement si demandé", () => {
    expect(completeVatAmounts({ amountTTC: 10 }, fill)).toEqual({
      amountHT: 10,
      amountTVA: 0,
      amountTTC: 10,
      vatRate: 0,
    });
    expect(completeVatAmounts({ amountTTC: "10" })).toEqual({
      amountHT: null,
      amountTVA: null,
      amountTTC: 10,
      vatRate: null,
    });
  });

  it("TTC et TVA, TTC et HT, TTC et taux", () => {
    expect(
      completeVatAmounts({ amountTTC: "10,59", amountTVA: "1,76" }),
    ).toMatchObject({ amountHT: 8.83, amountTVA: 1.76, vatRate: 20 });
    expect(
      completeVatAmounts({ amountTTC: 120, amountHT: 100, amountTVA: 0 }),
    ).toMatchObject({ amountHT: 100, amountTVA: 20, vatRate: 20 });
    expect(
      completeVatAmounts({ amountTTC: 120, vatRate: 20 }, fill),
    ).toMatchObject({ amountHT: 100, amountTVA: 20, vatRate: 20 });
  });

  it("taux fabriqué ou « TVA 0 € à 20 % » : le taux suit les montants", () => {
    expect(
      completeVatAmounts({
        amountHT: 100,
        amountTVA: 5.5,
        amountTTC: 105.5,
        vatRate: 6,
      }).vatRate,
    ).toBe(5.5);
    expect(
      completeVatAmounts({ amountTVA: 0, amountTTC: 120.5, vatRate: 20 }, fill),
    ).toMatchObject({ amountHT: 120.5, amountTVA: 0, vatRate: 0 });
  });

  it("taux cohérent gardé", () => {
    expect(
      completeVatAmounts({
        amountHT: 100,
        amountTVA: 12.34,
        amountTTC: 112.34,
        vatRate: 12.34,
      }).vatRate,
    ).toBe(12.34);
  });
  it("part hors TVA dans le TTC : HT, TVA et taux cohérents gardés", () => {
    // Hôtel avec taxe de séjour (10 %), garage avec débours de carte grise
    expect(
      completeVatAmounts({
        amountHT: 90.91,
        amountTVA: 9.09,
        amountTTC: 101.65,
        vatRate: 10,
      }),
    ).toEqual({
      amountHT: 90.91,
      amountTVA: 9.09,
      amountTTC: 101.65,
      vatRate: 10,
    });
    expect(
      completeVatAmounts({
        amountHT: 90.91,
        amountTVA: 9.09,
        amountTTC: 101.65,
      }).vatRate,
    ).toBe(10);
    expect(
      completeVatAmounts({
        amountHT: 500,
        amountTVA: 100,
        amountTTC: 900,
        vatRate: 20,
      }),
    ).toMatchObject({ amountHT: 500, amountTVA: 100, vatRate: 20 });
    // Facture de solde : acompte déduit du TTC
    expect(
      completeVatAmounts({
        amountHT: 1000,
        amountTVA: 200,
        amountTTC: 600,
        vatRate: 20,
      }),
    ).toMatchObject({ amountHT: 1000, amountTVA: 200, vatRate: 20 });
  });

  it("TVA non lue sur une assurance : pas de TVA inventée", () => {
    // 9 € de taxe d'assurance sur 100 € : 9 % n'est pas un taux légal
    expect(
      completeVatAmounts(
        { amountHT: 100, amountTVA: null, amountTTC: 109 },
        { fillMissingVat: true },
      ),
    ).toMatchObject({ amountHT: 100, amountTVA: 0, vatRate: 0 });
  });

  it("TVA connue et taux légal fourni : HT = TVA / taux, le reste est hors TVA", () => {
    expect(
      completeVatAmounts({ amountTVA: 9.09, amountTTC: 101.65, vatRate: 10 }),
    ).toMatchObject({ amountHT: 90.9, amountTVA: 9.09, vatRate: 10 });
  });

  it("HT connu et taux légal fourni : TVA = HT x taux", () => {
    expect(
      completeVatAmounts({ amountHT: 90.91, amountTTC: 101.65, vatRate: 10 }),
    ).toMatchObject({ amountHT: 90.91, amountTVA: 9.09, vatRate: 10 });
  });

  it("anciennes propositions « TVA 0 € à 20 % »", () => {
    // TVA non lue (0) avec un TTC qui la contient : TVA rétablie
    expect(
      completeVatAmounts(
        { amountHT: 100, amountTVA: 0, amountTTC: 120, vatRate: 20 },
        { fillMissingVat: true },
      ),
    ).toMatchObject({ amountHT: 100, amountTVA: 20, vatRate: 20 });
    // Assurance : pas de TVA, le taux suit (0 %)
    expect(
      completeVatAmounts(
        { amountHT: 100, amountTVA: 0, amountTTC: 109, vatRate: 20 },
        { fillMissingVat: true },
      ),
    ).toMatchObject({ amountHT: 100, amountTVA: 0, vatRate: 0 });
  });
});
