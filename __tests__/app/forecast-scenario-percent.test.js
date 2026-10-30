import { describe, it, expect } from "vitest";
import { scenarioPercentError } from "@/app/dashboard/outils/prevision/components/scenario-selector";

describe("scenarioPercentError (nouveau scénario de prévision)", () => {
  it("+500 % d'entrées (multiplicateur 6, maximum 5) : refusé avec un message", () => {
    expect(scenarioPercentError("500", "0")).toBe(
      "La variation des entrées doit être comprise entre -100 % et +400 %.",
    );
  });

  it("sorties sous -100 % : refusées", () => {
    expect(scenarioPercentError("0", "-150")).toMatch(/sorties/);
  });

  it("dans les bornes (y compris les extrêmes) : accepté", () => {
    expect(scenarioPercentError("10", "-5")).toBeNull();
    expect(scenarioPercentError("400", "-100")).toBeNull();
    expect(scenarioPercentError("", "")).toBeNull();
  });
});
