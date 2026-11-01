import { describe, it, expect } from "vitest";
import { buildForecastCsv } from "@/app/dashboard/outils/prevision/components/forecast-export-dialog";

// Les 18 catégories de sorties du tableau de la Prévision (et de l'API).
const SORTIES = [
  "RENT",
  "SUBSCRIPTIONS",
  "OFFICE_SUPPLIES",
  "SERVICES",
  "TRANSPORT",
  "MEALS",
  "TELECOMMUNICATIONS",
  "INSURANCE",
  "ENERGY",
  "SOFTWARE",
  "HARDWARE",
  "MARKETING",
  "TRAINING",
  "MAINTENANCE",
  "TAXES",
  "UTILITIES",
  "SALARIES",
  "OTHER_EXPENSE",
];

const lignes = (csv) => csv.split("\n").map((l) => l.split(";"));
const nombre = (cellule) => Number(String(cellule).replace(",", "."));

describe("Export CSV de la Prévision", () => {
  const mois = {
    month: "2027-03",
    actualIncome: 0,
    actualExpense: 0,
    forecastIncome: 0,
    // Une sortie prévue dans chacune des 18 catégories : 1 + 2 + … + 18
    forecastExpense: (18 * 19) / 2,
    closingBalance: 1000,
    categoryBreakdown: SORTIES.map((category, i) => ({
      category,
      type: "EXPENSE",
      actualAmount: 0,
      forecastAmount: i + 1,
    })),
  };

  it("chaque catégorie du tableau a sa ligne (Énergie, Repas, Télécommunications…)", () => {
    const csv = buildForecastCsv([mois], "2026-10");
    for (const libelle of [
      "Énergie",
      "Repas",
      "Matériel",
      "Formation",
      "Maintenance",
    ]) {
      expect(csv).toContain(libelle);
    }
  });

  it("la somme des lignes de sorties d'un mois égale son « Sous-total sorties »", () => {
    const t = lignes(buildForecastCsv([mois], "2026-10"));
    const debut = t.findIndex((l) => l[0] === "DECAISSEMENTS");
    const fin = t.findIndex((l) => l[0] === "Sous-total sorties");
    const somme = t.slice(debut + 1, fin).reduce((s, l) => s + nombre(l[1]), 0);
    expect(somme).toBe(nombre(t[fin][1]));
    expect(fin - debut - 1).toBe(SORTIES.length);
  });
});
