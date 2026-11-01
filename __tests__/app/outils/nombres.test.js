import { describe, it, expect } from "vitest";
import { parseNombre } from "@/app/outils/_components/nombres";

// Montants saisis dans le calculateur de pénalités (outil public)
describe("parseNombre : saisies à la française", () => {
  it.each([
    ["1 200", 1200],
    ["1 200,50", 1200.5],
    ["1200,50", 1200.5],
    ["1.200,50", 1200.5],
    ["1.200.000", 1200000],
    ["12.5", 12.5],
    ["12,5", 12.5],
    ["-5", -5],
    ["", 0],
    ["abc", 0],
  ])("« %s » vaut %s", (saisie, attendu) => {
    expect(parseNombre(saisie)).toBe(attendu);
  });
});
