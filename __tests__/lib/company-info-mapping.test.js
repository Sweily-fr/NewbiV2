import { describe, it, expect } from "vitest";
import { mapOrganizationToCompanyInfo } from "@/src/utils/organizationCompanyInfo";
import { generateDynamicFooter } from "@/src/utils/document-suggestions";

const org = {
  companyName: "Ma Boite",
  companyEmail: "a@b.fr",
  addressStreet: "1 rue A",
  addressCity: "Paris",
  addressZipCode: "75001",
  siret: "12345678901234",
  legalForm: "SARL",
  capitalSocial: "10000",
};

describe("mapOrganizationToCompanyInfo", () => {
  it("traduit les clés de l'organisation vers celles du document", () => {
    const ci = mapOrganizationToCompanyInfo(org);
    expect(ci.name).toBe("Ma Boite");
    expect(ci.email).toBe("a@b.fr");
    expect(ci.address.street).toBe("1 rue A");
    expect(ci.address.postalCode).toBe("75001");
  });

  it("pose la forme juridique sous les deux clés attendues", () => {
    const ci = mapOrganizationToCompanyInfo(org);
    expect(ci.legalForm).toBe("SARL");
    expect(ci.companyStatus).toBe("SARL");
  });

  it("ne pose aucun régime de TVA si l'organisation n'est pas assujettie", () => {
    expect(
      mapOrganizationToCompanyInfo({
        ...org,
        isVatSubject: false,
        vatMode: "debits",
        fiscalRegime: "reel-normal",
      }).vatPaymentCondition,
    ).toBe("");
  });

  it("conserve le régime de TVA si assujettie", () => {
    expect(
      mapOrganizationToCompanyInfo({
        ...org,
        isVatSubject: true,
        vatMode: "encaissements",
      }).vatPaymentCondition,
    ).toBe("encaissements");
  });
});

describe("pied de page — forme juridique", () => {
  it("lit companyStatus quand legalForm est absent (document rouvert)", () => {
    const footer = generateDynamicFooter({
      name: "Ma Boite",
      companyStatus: "SARL",
      capitalSocial: "10000",
      address: { street: "1 rue A", city: "Paris", postalCode: "75001" },
    });
    expect(footer).toContain("SARL");
    expect(footer).toContain("10000");
  });
});
