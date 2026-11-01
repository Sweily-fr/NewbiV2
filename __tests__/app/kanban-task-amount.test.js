/**
 * Kanban : montant d'une tâche d'après son suivi de temps (taskAmount.js),
 * affiché par la liste, les cartes et la fenêtre de la tâche. Mêmes cas que
 * le total facturable du tableau calculé par l'API (totalBillableAmount,
 * newbi-api __tests__/resolvers/kanban-billable-amount.test.js) : les deux
 * doivent donner le même montant, au centime près.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  calculateTaskAmount,
  formatTaskAmount,
  getEffectiveSeconds,
} from "@/app/dashboard/outils/kanban/[id]/components/taskAmount.js";

const NOW = new Date("2026-11-01T10:00:00Z");
const HOUR_30 = 90 * 60;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});
afterEach(() => {
  vi.useRealTimers();
});

describe("calculateTaskAmount", () => {
  it.each([
    ["up", 100],
    ["down", 50],
    ["none", 75],
    [undefined, 75],
  ])("1 h 30 à 50 €/h, arrondi %s : %s €", (roundingOption, expected) => {
    expect(
      calculateTaskAmount({
        totalSeconds: HOUR_30,
        hourlyRate: 50,
        roundingOption,
      }),
    ).toBe(expected);
  });

  it("minuteur en cours depuis 30 min ajouté au temps passé", () => {
    const timeTracking = {
      totalSeconds: 3600,
      hourlyRate: 40,
      isRunning: true,
      currentStartTime: new Date(NOW.getTime() - 30 * 60_000).toISOString(),
    };
    expect(getEffectiveSeconds(timeTracking)).toBe(5400);
    expect(calculateTaskAmount(timeTracking)).toBe(60);
  });

  it("taux nul ou négatif, temps nul : non facturable", () => {
    expect(calculateTaskAmount({ totalSeconds: 3600, hourlyRate: 0 })).toBe(
      null,
    );
    expect(calculateTaskAmount({ totalSeconds: 3600, hourlyRate: -5 })).toBe(
      null,
    );
    expect(calculateTaskAmount({ totalSeconds: 0, hourlyRate: 50 })).toBe(null);
    expect(calculateTaskAmount(null)).toBe(null);
  });

  it("arrondi inférieur sous l'heure : non facturable (0 €)", () => {
    expect(
      calculateTaskAmount({
        totalSeconds: 1800,
        hourlyRate: 50,
        roundingOption: "down",
      }),
    ).toBe(null);
  });

  it("quelques minutes : montant exact au centime", () => {
    // 7 min à 65 €/h = 7,583… €
    const amount = calculateTaskAmount({ totalSeconds: 420, hourlyRate: 65 });
    expect(amount).toBeCloseTo(7.5833, 4);
    expect(formatTaskAmount(amount)).toBe("7,58 €");
  });

  it("somme de plusieurs tâches : même total que l'API (227,50 €)", () => {
    const tasks = [
      { totalSeconds: HOUR_30, hourlyRate: 50, roundingOption: "up" }, // 100
      { totalSeconds: HOUR_30, hourlyRate: 50, roundingOption: "down" }, // 50
      { totalSeconds: HOUR_30, hourlyRate: 50 }, // 75
      { totalSeconds: 180, hourlyRate: 50 }, // 2,50
      { totalSeconds: 7200, hourlyRate: 0 }, // exclue
    ];
    const total = tasks
      .map(calculateTaskAmount)
      .filter((a) => a !== null)
      .reduce((sum, a) => sum + a, 0);
    expect(total).toBeCloseTo(227.5, 2);
  });
});
