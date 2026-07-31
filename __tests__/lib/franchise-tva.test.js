import { describe, it, expect } from "vitest";
import { generateDynamicFooter } from "@/src/utils/document-suggestions";

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
