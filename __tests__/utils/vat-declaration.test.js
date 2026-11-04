import { describe, it, expect } from "vitest";
import {
  formatVatDay,
  formatVatEuros,
  franchiseGauge,
  vatAdjustmentFields,
  vatAdjustmentsInput,
  vatResultSummary,
} from "@/src/utils/vat-declaration";
import { linkedItemHref } from "@/src/utils/calendar-linked-items";
import { moduleForPath } from "@/src/lib/route-modules";

const keys = (fields) => fields.map((field) => field.key);

describe("déclaration de TVA : affichage", () => {
  it("formate les montants en euros entiers et les jours sans décalage", () => {
    expect(formatVatEuros(1234).replace(/\s/g, " ")).toBe("1 234 €");
    expect(formatVatDay("2026-11-01")).toBe("1 novembre 2026");
  });

  it("CA3 : le crédit précédent n'est demandé que sans déclaration confirmée", () => {
    expect(
      keys(
        vatAdjustmentFields({ form: "CA3", carriedCredit: null, credit: 0 }),
      ),
    ).toContain("previousCredit");
    expect(
      keys(vatAdjustmentFields({ form: "CA3", carriedCredit: 0, credit: 0 })),
    ).not.toContain("previousCredit");
  });

  it("CA3 : le remboursement n'est proposé qu'avec un crédit", () => {
    expect(
      keys(vatAdjustmentFields({ form: "CA3", carriedCredit: 0, credit: 10 })),
    ).toContain("refundRequested");
    expect(
      keys(vatAdjustmentFields({ form: "CA3", carriedCredit: 0, credit: 0 })),
    ).not.toContain("refundRequested");
  });

  it("CA12 : acomptes, sans ligne d'autoliquidation ni numéro de ligne", () => {
    const fields = vatAdjustmentFields({
      form: "CA12",
      carriedCredit: 0,
      credit: 10,
    });
    expect(keys(fields)).toContain("installmentsPaid");
    expect(keys(fields)).not.toContain("reverseChargeServicesBase");
    expect(keys(fields)).not.toContain("refundRequested");
    expect(fields.every((field) => field.code === null)).toBe(true);
  });

  it("n'envoie à l'API que des entiers positifs", () => {
    expect(
      vatAdjustmentsInput({
        fixedAssetsVat: "120",
        vatToRepay: "",
        other: "0",
      }),
    ).toEqual({ fixedAssetsVat: 120 });
  });

  it("résume le résultat : néant, à payer, crédit, rien", () => {
    const base = {
      period: { form: "CA3" },
      isNil: false,
      totals: { totalToPay: 0, creditToCarry: 0 },
    };
    expect(vatResultSummary({ ...base, isNil: true }).title).toBe(
      "Déclaration néant",
    );
    expect(
      vatResultSummary({
        ...base,
        totals: { totalToPay: 50, creditToCarry: 0 },
      }).title,
    ).toBe("Total à payer");
    expect(
      vatResultSummary({
        ...base,
        period: { form: "CA12" },
        totals: { totalToPay: 50, creditToCarry: 0 },
      }).title,
    ).toBe("Solde à payer");
    expect(
      vatResultSummary({ ...base, totals: { totalToPay: 0, creditToCarry: 8 } })
        .title,
    ).toBe("Crédit de TVA");
    expect(vatResultSummary(base).title).toBe("Rien à payer");
  });

  it("jauge de la franchise : sous le seuil, entre les seuils, au-delà", () => {
    expect(franchiseGauge(10000, 37500, 41250)).toMatchObject({
      tone: "ok",
      percent: 27,
    });
    expect(franchiseGauge(40000, 37500, 41250).tone).toBe("warning");
    expect(franchiseGauge(50000, 37500, 41250)).toMatchObject({
      tone: "over",
      percent: 100,
    });
  });

  it("le calendrier ouvre la période, seulement pour une déclaration", () => {
    expect(linkedItemHref({ kind: "FISCAL", vatPeriodKey: "2026-10" })).toBe(
      "/dashboard/outils/tva?periode=2026-10",
    );
    expect(linkedItemHref({ kind: "FISCAL", vatPeriodKey: null })).toBeNull();
  });

  it("la page est rattachée au module de la grille des rôles", () => {
    expect(moduleForPath("/dashboard/outils/tva")).toBe("vat");
  });
});
