import { describe, it, expect } from "vitest";
import {
  PLANS_DISPLAY,
  planLabel,
  upgradePlanNameFor,
} from "@/src/lib/plans-display";
import { PLAN_LIMITS } from "@/src/lib/plan-limits";

/**
 * Noms affichés depuis le 22/11/2026 : Standard (clé freelance), Premium
 * (clé pme), Entreprise. Les clés techniques ne changent pas.
 */
describe("noms des offres", () => {
  it("affiche Standard, Premium et Entreprise sans toucher aux clés", () => {
    expect(PLANS_DISPLAY.map((p) => [p.key, p.displayName])).toEqual([
      ["freelance", "Standard"],
      ["pme", "Premium"],
      ["entreprise", "Entreprise"],
    ]);
  });

  it("planLabel traduit une clé, quelle que soit sa casse", () => {
    expect(planLabel("freelance")).toBe("Standard");
    expect(planLabel("FREELANCE")).toBe("Standard");
    expect(planLabel("pme")).toBe("Premium");
    expect(planLabel("PME")).toBe("Premium");
    expect(planLabel("entreprise")).toBe("Entreprise");
    expect(planLabel("ENTREPRISE")).toBe("Entreprise");
  });

  it("planLabel reconnaît les anciennes clés et ne casse pas sur l'inconnu", () => {
    expect(planLabel("pro")).toBe("Premium");
    expect(planLabel("enterprise")).toBe("Entreprise");
    expect(planLabel("gratuit")).toBe("Gratuit");
    expect(planLabel("")).toBe("");
    expect(planLabel(undefined)).toBe("");
  });
});

describe("upgradePlanNameFor", () => {
  it("champs personnalisés de l'offre Standard (5) : Premium les lève déjà", () => {
    expect(PLAN_LIMITS.freelance.customFields).toBe(5);
    expect(upgradePlanNameFor("customFields", 5)).toBe("Premium");
  });

  it("aucune offre ne lève une limite inconnue : null", () => {
    expect(upgradePlanNameFor("limiteInconnue", 3)).toBeNull();
  });
});
