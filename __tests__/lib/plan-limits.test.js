import { describe, it, expect } from "vitest";
import {
  PLAN_LIMITS,
  SEAT_PRICE,
  getSeatPrice,
  getPlanLimits,
  canInviteUsers,
  canAddPaidSeats,
} from "@/src/lib/plan-limits";

describe("PLAN_LIMITS structure", () => {
  it("defines the three plans freelance/pme/entreprise", () => {
    expect(PLAN_LIMITS).toHaveProperty("freelance");
    expect(PLAN_LIMITS).toHaveProperty("pme");
    expect(PLAN_LIMITS).toHaveProperty("entreprise");
  });

  it("each plan has the canonical fields", () => {
    for (const plan of Object.values(PLAN_LIMITS)) {
      expect(plan).toHaveProperty("invitableUsers");
      expect(plan).toHaveProperty("accountants");
      expect(plan).toHaveProperty("totalUsers");
      expect(plan).toHaveProperty("canAddPaidUsers");
      expect(plan).toHaveProperty("workspaces");
      expect(plan).toHaveProperty("bankAccounts");
      expect(plan).toHaveProperty("storage");
      expect(plan).toHaveProperty("availableRoles");
      expect(plan).toHaveProperty("exports");
      expect(plan).toHaveProperty("esignature");
    }
  });

  it("freelance has only 1 user (owner) and 1 invitable accountant", () => {
    const f = PLAN_LIMITS.freelance;
    expect(f.invitableUsers).toBe(0);
    expect(f.accountants).toBe(1);
    expect(f.totalUsers).toBe(1);
  });

  it("pme has 10 invitable users + 3 accountants", () => {
    const p = PLAN_LIMITS.pme;
    expect(p.invitableUsers).toBe(10);
    expect(p.accountants).toBe(3);
  });

  it("availableRoles grows with plan tier", () => {
    expect(PLAN_LIMITS.freelance.availableRoles).toEqual(["accountant"]);
    expect(PLAN_LIMITS.pme.availableRoles).toContain("admin");
  });
});

describe("SEAT_PRICE", () => {
  it("is the documented €7.49", () => {
    expect(SEAT_PRICE).toBe(7.49);
  });
});

describe("getPlanLimits", () => {
  it("returns the requested plan", () => {
    expect(getPlanLimits("pme").totalUsers).toBe(11);
  });

  it("normalizes case", () => {
    expect(getPlanLimits("PME").totalUsers).toBe(11);
    expect(getPlanLimits("Freelance").invitableUsers).toBe(0);
  });

  it("falls back to freelance on null/unknown", () => {
    expect(getPlanLimits(null)).toBe(PLAN_LIMITS.freelance);
    expect(getPlanLimits(undefined)).toBe(PLAN_LIMITS.freelance);
    expect(getPlanLimits("custom")).toBe(PLAN_LIMITS.freelance);
  });
});

describe("getSeatPrice", () => {
  it("returns plan-specific seatPrice when defined", () => {
    expect(getSeatPrice("freelance")).toBe(7.49);
    expect(getSeatPrice("pme")).toBe(7.49);
  });

  it("falls back to SEAT_PRICE constant on missing plan", () => {
    expect(getSeatPrice("anything")).toBe(SEAT_PRICE);
  });
});

describe("canInviteUsers", () => {
  it("returns true when invitableUsers > 0", () => {
    expect(canInviteUsers("pme")).toBe(true);
  });

  it("returns true when canAddPaidUsers (even with 0 invitable)", () => {
    expect(canInviteUsers("freelance")).toBe(true);
  });
});

describe("canAddPaidSeats", () => {
  it("returns the canAddPaidUsers flag", () => {
    expect(canAddPaidSeats("freelance")).toBe(
      PLAN_LIMITS.freelance.canAddPaidUsers,
    );
    expect(canAddPaidSeats("pme")).toBe(PLAN_LIMITS.pme.canAddPaidUsers);
  });

  it("falls back to freelance for unknown plan", () => {
    expect(canAddPaidSeats("nope")).toBe(PLAN_LIMITS.freelance.canAddPaidUsers);
  });
});
