import { describe, it, expect } from "vitest";
import {
  formatUrssafCents,
  formatUrssafDay,
  formatUrssafEuros,
  formatUrssafRate,
  urssafAdjustmentFields,
  urssafAdjustmentsInput,
  urssafResultSummary,
} from "@/src/utils/urssaf-declaration";
import { MICRO_ACTIVITIES } from "@/src/components/settings/micro-entrepreneur-fields";
import { linkedItemHref } from "@/src/utils/calendar-linked-items";
import { featureForModule, moduleForPath } from "@/src/lib/route-modules";

const spaces = (text) => text.replace(/\s/g, " ");
const keys = (fields) => fields.map((field) => field.key);

describe("déclaration Urssaf : affichage", () => {
  it("chiffre d'affaires en euros entiers, cotisations au centime", () => {
    expect(spaces(formatUrssafEuros(1234))).toBe("1 234 €");
    expect(spaces(formatUrssafCents(261.5))).toBe("261,50 €");
    expect(spaces(formatUrssafRate(26.1))).toBe("26,1 %");
    expect(formatUrssafDay("2026-11-30")).toBe("30 novembre 2026");
    expect(formatUrssafDay("2026-10-01")).toBe("1er octobre 2026");
  });

  it("ajouts à la main : une case par catégorie de l'activité", () => {
    expect(keys(urssafAdjustmentFields("services-liberal"))).toEqual([
      "servicesBnc",
    ]);
    expect(keys(urssafAdjustmentFields("cipav"))).toEqual(["servicesBnc"]);
    expect(keys(urssafAdjustmentFields("sales"))).toEqual(["sales"]);
    expect(keys(urssafAdjustmentFields("mixed-artisanal"))).toEqual([
      "sales",
      "servicesBic",
    ]);
    expect(urssafAdjustmentFields(null)).toEqual([]);
    // Toutes les activités proposées dans les paramètres ont leurs cases
    for (const activity of MICRO_ACTIVITIES) {
      expect(urssafAdjustmentFields(activity.value).length).toBeGreaterThan(0);
    }
  });

  it("saisie : entiers positifs seulement", () => {
    expect(
      urssafAdjustmentsInput({
        sales: "120",
        servicesBic: "",
        servicesBnc: "0",
      }),
    ).toEqual({ sales: 120 });
  });

  it("résumé : néant, chiffre d'affaires seul ou total estimé", () => {
    const base = {
      isNil: false,
      totals: { revenue: 1000, totalToPay: 263.2 },
      situation: {},
    };
    expect(urssafResultSummary({ ...base, isNil: true }).title).toBe(
      "Chiffre d'affaires nul",
    );
    expect(urssafResultSummary(base)).toMatchObject({
      title: "Total estimé à payer",
      amount: 263.2,
      isCents: true,
    });
    expect(urssafResultSummary(base).detail).not.toMatch(/chambre/);
    const withChamber = urssafResultSummary({
      ...base,
      totals: { ...base.totals, chamberTax: 4.8 },
    });
    expect(spaces(withChamber.detail)).toMatch(
      /taxe pour frais de chambre \(4,80 €\) s'ajoute si elle est due/,
    );
    const withoutEstimate = urssafResultSummary({
      ...base,
      totals: { revenue: 1000, totalToPay: null },
      situation: { estimateUnavailableReason: "ACRE non renseignée" },
    });
    expect(withoutEstimate).toMatchObject({
      title: "Chiffre d'affaires à déclarer",
      amount: 1000,
      isCents: false,
      detail: "ACRE non renseignée",
    });
  });

  it("page en accès anticipé, rattachée à son module de droits", () => {
    expect(moduleForPath("/dashboard/outils/urssaf")).toBe("urssaf");
    expect(featureForModule("urssaf")).toBe("urssaf");
  });

  it("échéance du calendrier : TVA ou Urssaf selon la clé de période", () => {
    expect(linkedItemHref({ kind: "FISCAL", urssafPeriodKey: "2026-T4" })).toBe(
      "/dashboard/outils/urssaf?periode=2026-T4",
    );
    expect(linkedItemHref({ kind: "FISCAL", vatPeriodKey: "2026-10" })).toBe(
      "/dashboard/outils/tva?periode=2026-10",
    );
    expect(linkedItemHref({ kind: "FISCAL" })).toBeNull();
  });
});
