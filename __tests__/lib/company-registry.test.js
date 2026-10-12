import { describe, it, expect } from "vitest";
import {
  companyFieldsFromRegistry,
  legalFormFromNatureJuridique,
  normalizeLegalForm,
} from "@/src/lib/company-registry";

describe("legalFormFromNatureJuridique", () => {
  it.each([
    ["1000", "EI"],
    ["5498", "EURL"],
    ["5499", "SARL"],
    ["5485", "SELARL"],
    ["5710", "SAS"],
    ["5720", "SASU"],
    ["5785", "SELAS"],
    ["5599", "SA"],
    ["5699", "SA"],
    ["5585", "SELAFA"],
    ["5202", "SNC"],
    ["5306", "SCS"],
    ["5308", "SCA"],
    ["5385", "SELCA"],
    ["6540", "SCI"],
    ["6589", "SCM"],
    ["6571", "SCP"],
    ["9220", "Association"],
    ["2110", "Indivision"],
  ])("%s → %s", (code, expected) => {
    expect(legalFormFromNatureJuridique(code)).toBe(expected);
  });

  it("ne devine rien pour un code absent de la liste des paramètres", () => {
    expect(legalFormFromNatureJuridique("6599")).toBe("");
    expect(legalFormFromNatureJuridique("")).toBe("");
    expect(legalFormFromNatureJuridique(undefined)).toBe("");
  });
});

describe("companyFieldsFromRegistry", () => {
  it("sépare la rue du code postal et de la ville", () => {
    const fields = companyFieldsFromRegistry({
      nom_complet: "STUDIO DUPONT",
      siren: "123456789",
      nature_juridique: "5720",
      siege: {
        siret: "12345678900011",
        adresse: "12 RUE DE LA PAIX 75002 PARIS",
        code_postal: "75002",
        libelle_commune: "PARIS",
      },
    });

    expect(fields).toEqual({
      companyName: "STUDIO DUPONT",
      siret: "12345678900011",
      siren: "123456789",
      legalForm: "SASU",
      addressStreet: "12 RUE DE LA PAIX",
      addressCity: "PARIS",
      addressZipCode: "75002",
    });
  });

  it("neutralise les champs non diffusibles", () => {
    const fields = companyFieldsFromRegistry({
      nom_complet: "[NON-DIFFUSIBLE]",
      siren: "123456789",
      nature_juridique: "1000",
      siege: {
        siret: "12345678900011",
        adresse: "[NON-DIFFUSIBLE]",
        code_postal: "[NON-DIFFUSIBLE]",
        libelle_commune: "[NON-DIFFUSIBLE]",
      },
    });

    expect(fields).toMatchObject({
      companyName: "",
      siret: "12345678900011",
      legalForm: "EI",
      addressStreet: "",
      addressCity: "",
      addressZipCode: "",
    });
  });
});

describe("normalizeLegalForm", () => {
  it.each([
    // Libellés des anciennes correspondances de l'inscription
    ["Entrepreneur individuel", "EI"],
    // Posé sur le code 5710, qui est celui des SAS (Doctolib : 5710)
    ["SAS unipersonnelle (SASU)", "SAS"],
    ["SARL à associé unique", "EURL"],
    ["SARL unipersonnelle", "SARL"],
    ["SA à conseil d'administration", "SA"],
    ["Association déclarée", "Association"],
    // Enum des documents laissé par une ancienne migration
    ["AUTO_ENTREPRENEUR", "EI"],
    // Code INSEE brut écrit par le repli serveur
    ["5485", "SELARL"],
    ["5720", "SASU"],
  ])("%s → %s", (stored, expected) => {
    expect(normalizeLegalForm(stored)).toBe(expected);
  });

  it("laisse intactes les valeurs déjà valides ou sans correspondance sûre", () => {
    expect(normalizeLegalForm("SASU")).toBe("SASU");
    expect(normalizeLegalForm("EI")).toBe("EI");
    expect(normalizeLegalForm("Auto-entrepreneur")).toBe("Auto-entrepreneur");
    expect(normalizeLegalForm("GIE")).toBe("GIE");
    expect(normalizeLegalForm("AUTRE")).toBe("AUTRE");
    expect(normalizeLegalForm("6599")).toBe("6599");
    expect(normalizeLegalForm("")).toBe("");
    expect(normalizeLegalForm(null)).toBe("");
  });
});
