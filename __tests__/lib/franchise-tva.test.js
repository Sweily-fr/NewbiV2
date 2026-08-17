import { describe, it, expect } from "vitest";
import {
  generateDynamicFooter,
  getVatPaymentMention,
  resolveVatPaymentCondition,
} from "@/src/utils/document-suggestions";

const base = {
  name: "Ma Boite",
  siret: "12345678901234",
  address: { street: "1 rue A", city: "Paris", postalCode: "75001" },
};

describe("franchise en base de TVA — mention 293 B", () => {
  it("affiche la mention quand vatFranchise est vrai (adresse structurée)", () => {
    expect(generateDynamicFooter({ ...base, vatFranchise: true })).toContain(
      "TVA non applicable, art. 293 B du CGI",
    );
  });

  it("n'affiche pas la mention quand vatFranchise est faux", () => {
    expect(
      generateDynamicFooter({ ...base, vatFranchise: false }),
    ).not.toContain("293 B");
  });

  it("vatFranchise=false l'emporte sur un régime fiscal micro", () => {
    expect(
      generateDynamicFooter({
        ...base,
        vatFranchise: false,
        fiscalRegime: "micro-bic",
      }),
    ).not.toContain("293 B");
  });

  it("repli sur le régime micro pour les documents antérieurs", () => {
    expect(
      generateDynamicFooter({ ...base, fiscalRegime: "micro-bic" }),
    ).toContain("TVA non applicable, art. 293 B du CGI");
  });
});

describe("régime de TVA — résolution document / organisation", () => {
  it("« Aucun » (chaîne vide) ne retombe pas sur le réglage de l'organisation", () => {
    // Le cas signalé : régime passé à « Aucun » mais l'aperçu continuait
    // d'imprimer « sur les débits », hérité de l'organisation.
    expect(resolveVatPaymentCondition("", "debits")).toBe("");
  });

  it("assujettissement décoché (champs vidés) n'affiche aucune mention", () => {
    expect(
      getVatPaymentMention(resolveVatPaymentCondition("", "encaissements")),
    ).toBe("");
  });

  it("un champ absent retombe sur le réglage de l'organisation", () => {
    expect(resolveVatPaymentCondition(undefined, "debits")).toBe("debits");
    expect(resolveVatPaymentCondition(null, "debits")).toBe("debits");
  });

  it("la valeur du document prime sur celle de l'organisation", () => {
    expect(resolveVatPaymentCondition("encaissements", "debits")).toBe(
      "encaissements",
    );
  });
});

describe("mention « Paiement de la TVA »", () => {
  it("couvre la valeur des paramètres et l'enum backend", () => {
    expect(getVatPaymentMention("debits")).toBe(
      "Paiement de la TVA: sur les débits",
    );
    expect(getVatPaymentMention("DEBITS")).toBe(
      "Paiement de la TVA: sur les débits",
    );
    expect(getVatPaymentMention("encaissements")).toBe(
      "Paiement de la TVA: sur les encaissements",
    );
  });

  it("n'affiche rien pour NONE, vide ou absent", () => {
    expect(getVatPaymentMention("NONE")).toBe("");
    expect(getVatPaymentMention("")).toBe("");
    expect(getVatPaymentMention(undefined)).toBe("");
  });
});
