import { describe, it, expect } from "vitest";
import {
  clampIssueDate,
  issueDateShiftMessage,
} from "@/app/dashboard/outils/factures/utils/issue-date-clamp";

describe("Numérotation chronologique : date d'émission reportée", () => {
  it("rien à faire quand la date suit la dernière facture émise", () => {
    const input = { issueDate: "2026-10-21", dueDate: "2026-11-20" };
    expect(clampIssueDate(input, "2026-10-21")).toEqual({
      input,
      shiftedFrom: null,
    });
    expect(clampIssueDate(input, null).shiftedFrom).toBeNull();
  });

  it("date antérieure : reportée, et l'échéance garde le délai de paiement", () => {
    // Émise le 06/09 à 30 jours (échéance 06/10), dernière facture le 21/10
    const { input, shiftedFrom } = clampIssueDate(
      { issueDate: "2026-09-06", dueDate: "2026-10-06", items: [1] },
      "2026-10-21",
    );
    expect(shiftedFrom).toBe("2026-09-06");
    expect(input).toEqual({
      issueDate: "2026-10-21",
      dueDate: "2026-11-20",
      items: [1],
    });
  });

  it("échéance déjà après la nouvelle date d'émission : gardée", () => {
    const { input } = clampIssueDate(
      { issueDate: "2026-10-01", dueDate: "2026-12-31" },
      "2026-10-21",
    );
    expect(input.dueDate).toBe("2026-12-31");
  });

  it("le message parle de la date d'émission reportée", () => {
    expect(issueDateShiftMessage("2026-10-21")).toBe(
      "Date d'émission reportée au 21/10/2026 : une facture ne peut pas être datée avant la dernière facture émise.",
    );
  });
});
