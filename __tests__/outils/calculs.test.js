// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  montantLigneHT,
  numeroSuivant,
  remiseBornee,
} from "@/app/outils/_components/calculs";

describe("numeroSuivant (générateurs publics, case « Mémoriser »)", () => {
  it("incrémente en gardant les zéros", () => {
    expect(numeroSuivant("001")).toBe("002");
    expect(numeroSuivant("009")).toBe("010");
    expect(numeroSuivant("099")).toBe("100");
  });
  it("élargit quand le nombre dépasse la longueur", () => {
    expect(numeroSuivant("999")).toBe("1000");
  });
  it("garde un préfixe non numérique", () => {
    expect(numeroSuivant("A12")).toBe("A13");
  });
  it("laisse tel quel un numéro sans chiffre final", () => {
    expect(numeroSuivant("ABC")).toBe("ABC");
    expect(numeroSuivant("")).toBe("");
    expect(numeroSuivant(undefined)).toBe("");
  });
});

describe("montantLigneHT", () => {
  it("multiplie quantité et prix", () => {
    expect(montantLigneHT({ quantity: 3, unitPrice: 60 })).toBe(180);
  });
  it("déduit la remise en pourcentage", () => {
    expect(
      montantLigneHT({ quantity: 2, unitPrice: 100, discount: 10 }),
    ).toBeCloseTo(180);
  });
  it("accepte les saisies texte du formulaire", () => {
    expect(
      montantLigneHT({ quantity: "2", unitPrice: "50.5", discount: "" }),
    ).toBeCloseTo(101);
  });
  it("borne la remise entre 0 et 100 %", () => {
    expect(remiseBornee(150)).toBe(100);
    expect(remiseBornee(-5)).toBe(0);
    expect(montantLigneHT({ quantity: 1, unitPrice: 80, discount: 150 })).toBe(
      0,
    );
  });
});
