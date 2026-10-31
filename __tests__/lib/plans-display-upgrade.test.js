import { describe, it, expect } from "vitest";
import { upgradePlanNameFor } from "@/src/lib/plans-display";
import { PLAN_LIMITS } from "@/src/lib/plan-limits";

describe("upgradePlanNameFor", () => {
  it("champs personnalisés de l'offre Freelance (5) : TPE les lève déjà", () => {
    expect(PLAN_LIMITS.freelance.customFields).toBe(5);
    expect(upgradePlanNameFor("customFields", 5)).toBe("TPE");
  });

  it("aucune offre ne lève une limite inconnue : null", () => {
    expect(upgradePlanNameFor("limiteInconnue", 3)).toBeNull();
  });
});
