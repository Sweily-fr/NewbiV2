import { describe, it, expect } from "vitest";
import {
  PLAN_LIMITS,
  SEAT_PRICE,
  getSeatPrice,
  getPlanLimits,
  canInviteUsers,
  canAddPaidSeats,
} from "@/src/lib/plan-limits";

describe("PLAN_LIMITS constants", () => {
  it("should define three plans: freelance, pme, entreprise", () => {
    expect(Object.keys(PLAN_LIMITS)).toEqual([
      "freelance",
      "pme",
      "entreprise",
    ]);
  });

  it("freelance plan has correct limits", () => {
    const plan = PLAN_LIMITS.freelance;
    expect(plan.invitableUsers).toBe(0);
    expect(plan.accountants).toBe(1);
    expect(plan.totalUsers).toBe(1);
    expect(plan.canAddPaidUsers).toBe(true);
    expect(plan.workspaces).toBe(1);
    expect(plan.bankAccounts).toBe(1);
    expect(plan.storage).toBe(50);
    expect(plan.fileTransferMaxGB).toBe(5);
    expect(plan.availableRoles).toEqual(["accountant"]);
    expect(plan.exports).toEqual(["csv", "excel"]);
    expect(plan.esignature).toBe("ses");
    expect(plan.documentAutomations).toBe(5);
    expect(plan.clientAutomations).toBe(true);
    expect(plan.crmEmailAutomations).toBe(false);
    expect(plan.advancedAnalytics).toBe(true);
    expect(plan.forecastMonths).toBe(24);
    expect(plan.customFields).toBe(5);
    expect(plan.clientSegments).toBe(false);
    expect(plan.calendarConnections).toBe(1);
    expect(plan.documentTemplates).toBe(10);
    expect(plan.customSmtp).toBe(false);
    expect(plan.eInvoicing).toBe(true);
  });

  it("pme plan has correct limits", () => {
    const plan = PLAN_LIMITS.pme;
    expect(plan.invitableUsers).toBe(10);
    expect(plan.accountants).toBe(3);
    expect(plan.totalUsers).toBe(11);
    expect(plan.canAddPaidUsers).toBe(true);
    expect(plan.workspaces).toBe(1);
    expect(plan.bankAccounts).toBe(3);
    expect(plan.storage).toBe(200);
    expect(plan.fileTransferMaxGB).toBe(15);
    expect(plan.availableRoles).toEqual(["member", "accountant", "admin"]);
    expect(plan.exports).toEqual(["csv", "excel", "fec"]);
    expect(plan.esignature).toBe("ses");
    expect(plan.documentAutomations).toBe(-1);
    expect(plan.clientAutomations).toBe(true);
    expect(plan.crmEmailAutomations).toBe(true);
    expect(plan.advancedAnalytics).toBe(true);
    expect(plan.forecastMonths).toBe(24);
    expect(plan.customFields).toBe(-1);
    expect(plan.clientSegments).toBe(true);
    expect(plan.calendarConnections).toBe(3);
    expect(plan.documentTemplates).toBe(-1);
    expect(plan.customSmtp).toBe(false);
    expect(plan.eInvoicing).toBe(true);
  });

  it("entreprise plan has correct limits", () => {
    const plan = PLAN_LIMITS.entreprise;
    expect(plan.invitableUsers).toBe(25);
    expect(plan.accountants).toBe(5);
    expect(plan.totalUsers).toBe(26);
    expect(plan.canAddPaidUsers).toBe(true);
    expect(plan.workspaces).toBe(1);
    expect(plan.bankAccounts).toBe(5);
    expect(plan.storage).toBe(500);
    expect(plan.fileTransferMaxGB).toBe(50);
    expect(plan.availableRoles).toEqual([
      "member",
      "accountant",
      "admin",
      "viewer",
    ]);
    expect(plan.exports).toEqual(["csv", "excel", "fec", "sage", "cegid"]);
    expect(plan.esignature).toBe("qes");
    expect(plan.documentAutomations).toBe(-1);
    expect(plan.clientAutomations).toBe(true);
    expect(plan.crmEmailAutomations).toBe(true);
    expect(plan.advancedAnalytics).toBe(true);
    expect(plan.forecastMonths).toBe(24);
    expect(plan.customFields).toBe(-1);
    expect(plan.clientSegments).toBe(true);
    expect(plan.calendarConnections).toBe(-1);
    expect(plan.documentTemplates).toBe(-1);
    expect(plan.customSmtp).toBe(true);
    expect(plan.eInvoicing).toBe(true);
    expect(plan.eInvoicingArchival).toBe(true);
  });

  it("SEAT_PRICE should be 7.49", () => {
    expect(SEAT_PRICE).toBe(7.49);
  });
});

describe("getSeatPrice", () => {
  it("returns 7.49 for pme plan", () => {
    expect(getSeatPrice("pme")).toBe(7.49);
  });

  it("returns 5.99 for entreprise plan", () => {
    expect(getSeatPrice("entreprise")).toBe(5.99);
  });

  it("falls back to SEAT_PRICE for freelance (no seatPrice defined)", () => {
    expect(getSeatPrice("freelance")).toBe(SEAT_PRICE);
  });
});

describe("getPlanLimits", () => {
  it('returns freelance limits for "freelance"', () => {
    expect(getPlanLimits("freelance")).toEqual(PLAN_LIMITS.freelance);
  });

  it('returns pme limits for "pme"', () => {
    expect(getPlanLimits("pme")).toEqual(PLAN_LIMITS.pme);
  });

  it('returns entreprise limits for "entreprise"', () => {
    expect(getPlanLimits("entreprise")).toEqual(PLAN_LIMITS.entreprise);
  });

  it("is case-insensitive", () => {
    expect(getPlanLimits("FREELANCE")).toEqual(PLAN_LIMITS.freelance);
    expect(getPlanLimits("PME")).toEqual(PLAN_LIMITS.pme);
    expect(getPlanLimits("Entreprise")).toEqual(PLAN_LIMITS.entreprise);
  });

  it("falls back to freelance for unknown plan", () => {
    expect(getPlanLimits("unknown")).toEqual(PLAN_LIMITS.freelance);
  });

  it("falls back to freelance for null/undefined", () => {
    expect(getPlanLimits(null)).toEqual(PLAN_LIMITS.freelance);
    expect(getPlanLimits(undefined)).toEqual(PLAN_LIMITS.freelance);
  });
});

describe("canInviteUsers", () => {
  it("returns true for freelance (can add paid seats)", () => {
    expect(canInviteUsers("freelance")).toBe(true);
  });

  it("returns true for pme (has invitable users and paid seats)", () => {
    expect(canInviteUsers("pme")).toBe(true);
  });

  it("returns true for entreprise (has invitable users and paid seats)", () => {
    expect(canInviteUsers("entreprise")).toBe(true);
  });

  it("returns true for unknown plan (falls back to freelance with paid seats)", () => {
    expect(canInviteUsers("nonexistent")).toBe(true);
  });
});

describe("canAddPaidSeats", () => {
  it("returns true for freelance", () => {
    expect(canAddPaidSeats("freelance")).toBe(true);
  });

  it("returns true for pme", () => {
    expect(canAddPaidSeats("pme")).toBe(true);
  });

  it("returns true for entreprise", () => {
    expect(canAddPaidSeats("entreprise")).toBe(true);
  });

  it("returns true for unknown plan (falls back to freelance)", () => {
    expect(canAddPaidSeats(null)).toBe(true);
  });
});
