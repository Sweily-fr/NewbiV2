import { describe, it, expect } from "vitest";
import { hasChartValues } from "@/app/dashboard/outils/analytiques/components/analytics-chart-utils";

describe("hasChartValues", () => {
  it("est faux pour un tableau vide ou absent", () => {
    expect(hasChartValues([], ["a"])).toBe(false);
    expect(hasChartValues(null, ["a"])).toBe(false);
  });

  it("est faux quand toutes les valeurs des clés sont nulles ou à zéro", () => {
    const rows = [
      { month: "2026-01", revenueHT: 0, expenseAmount: null },
      { month: "2026-02", revenueHT: 0, expenseAmount: undefined },
    ];
    expect(hasChartValues(rows, ["revenueHT", "expenseAmount"])).toBe(false);
  });

  it("est vrai dès qu'une valeur non nulle existe (y compris négative)", () => {
    expect(hasChartValues([{ a: 0 }, { a: -12.5 }], ["a"])).toBe(true);
    expect(hasChartValues([{ a: 0, b: 3 }], ["a", "b"])).toBe(true);
  });

  it("ignore les clés non numériques", () => {
    expect(hasChartValues([{ label: "Janvier" }], ["label"])).toBe(false);
  });
});
