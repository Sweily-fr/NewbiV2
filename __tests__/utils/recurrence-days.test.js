import { describe, it, expect } from "vitest";
import {
  addMonthsToDay,
  nextRecurrenceDay,
  occurrenceDay,
} from "@/src/utils/recurrenceDays";
import {
  formatRecurrenceFrequency,
  formatRecurrenceDay,
} from "@/src/graphql/invoiceRecurrenceQueries";

describe("jours des factures récurrentes (miroir du cron API)", () => {
  it("garde le jour d'ancrage des mensualités", () => {
    expect(addMonthsToDay("2026-01-31", 1)).toBe("2026-02-28");
    expect(
      occurrenceDay({ startDate: "2026-01-31", frequency: "MONTHLY" }, 2),
    ).toBe("2026-03-31");
  });

  it("calcule la prochaine facture à partir d'aujourd'hui", () => {
    const rec = { startDate: "2026-01-15", frequency: "MONTHLY", interval: 1 };
    expect(nextRecurrenceDay(rec, "2026-10-08")).toBe("2026-10-15");
    expect(nextRecurrenceDay(rec, "2026-10-15")).toBe("2026-10-15");
    // Échéance du jour déjà traitée aujourd'hui : on passe à la suivante
    expect(
      nextRecurrenceDay({ ...rec, lastRunDate: "2026-10-15" }, "2026-10-15"),
    ).toBe("2026-11-15");
    expect(
      nextRecurrenceDay({ ...rec, endDate: "2026-10-10" }, "2026-10-11"),
    ).toBeNull();
  });

  it("formate le rythme en français", () => {
    expect(formatRecurrenceFrequency("MONTHLY", 1)).toBe("tous les mois");
    expect(formatRecurrenceFrequency("WEEKLY", 2)).toBe(
      "toutes les 2 semaines",
    );
    expect(formatRecurrenceFrequency("DAILY", 1)).toBe("tous les jours");
    expect(formatRecurrenceDay("2026-11-03")).toBe("3 novembre 2026");
  });
});
