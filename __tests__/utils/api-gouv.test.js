import { describe, it, expect } from "vitest";
import { parseAddress, convertCompanyToClient } from "@/src/utils/api-gouv";

describe("parseAddress", () => {
  it("returns defaults when fullAddress is empty", () => {
    expect(parseAddress("")).toEqual({
      street: "",
      postalCode: "",
      city: "",
      country: "France",
    });
  });

  it("preserves provided postalCode/city when fullAddress is empty", () => {
    expect(parseAddress("", "75001", "Paris")).toMatchObject({
      postalCode: "75001",
      city: "Paris",
    });
  });

  it("strips postalCode+city from the end when explicitly provided", () => {
    const out = parseAddress("1 Rue de la Paix 75001 Paris", "75001", "Paris");
    expect(out.street).toBe("1 Rue de la Paix");
    expect(out.postalCode).toBe("75001");
    expect(out.city).toBe("Paris");
  });

  it("extracts postalCode and city from the address when not provided", () => {
    const out = parseAddress("12 avenue des Champs 69001 Lyon");
    expect(out.street).toBe("12 avenue des Champs");
    expect(out.postalCode).toBe("69001");
    expect(out.city).toBe("Lyon");
  });

  it("always returns France as country", () => {
    expect(parseAddress("anywhere").country).toBe("France");
  });
});

describe("convertCompanyToClient", () => {
  it("converts a typical API Gouv company to a client shape", () => {
    const company = {
      name: "Acme",
      siret: "12345678901234",
      siren: "123456789",
      vatNumber: "FR12345678901",
      address: "1 rue Test 75001 Paris",
      postalCode: "75001",
      city: "Paris",
      activityLabel: "Conseil",
      employees: "10",
      id: "abc",
      activityCode: "62.02A",
      status: "active",
      creationDate: "2020-01-01",
    };
    const out = convertCompanyToClient(company);
    expect(out).toMatchObject({
      type: "COMPANY",
      name: "Acme",
      siret: "12345678901234",
      vatNumber: "FR12345678901",
      address: { street: "1 rue Test", postalCode: "75001", city: "Paris" },
      hasDifferentShippingAddress: false,
    });
    expect(out.shippingAddress).toEqual(out.address);
    expect(out.notes).toContain("Conseil");
    expect(out._apiGouv.siren).toBe("123456789");
  });

  it("falls back to SIREN when SIRET is missing", () => {
    const out = convertCompanyToClient({
      name: "Acme",
      siren: "123456789",
      address: "",
    });
    expect(out.siret).toBe("123456789");
  });

  it("falls back to id when both SIRET and SIREN are missing", () => {
    const out = convertCompanyToClient({
      name: "Acme",
      id: "raw-id",
      address: "",
    });
    expect(out.siret).toBe("raw-id");
  });

  it("returns empty siret when nothing is available", () => {
    const out = convertCompanyToClient({ name: "Acme", address: "" });
    expect(out.siret).toBe("");
  });
});
