import { describe, it, expect } from "vitest";
import {
  VALIDATION_PATTERNS,
  ITEM_DESCRIPTION_PATTERN,
  getIbanError,
  getItemTextErrors,
  getPostalCodeError,
  isBlank,
  isFranceCountry,
  normalizeIban,
  validateField,
} from "@/src/lib/validation";

// Caractères invisibles écrits par leur code (un éditeur les ferait disparaître)
const ACCENT_DECOMPOSE = String.fromCharCode(0x301);
const TRAIT_CONDITIONNEL = String.fromCharCode(0xad);

describe("Noms réels (même règle que l'API)", () => {
  const { companyName, personName, fullName, bankName } = VALIDATION_PATTERNS;

  it.each([
    "Cœur de Lion SARL",
    "L’Atelier du Bois",
    "Société Générale & Fils",
    "Dalle n° 6 de 1 m²",
    `Cafe${ACCENT_DECOMPOSE} de la Gare`,
  ])("raison sociale « %s » acceptée", (nom) => {
    expect(companyName.pattern.test(nom)).toBe(true);
  });

  it.each(["A", "Atelier <b> SAS", "S".repeat(201)])(
    "raison sociale « %s » refusée",
    (nom) => {
      expect(companyName.pattern.test(nom)).toBe(false);
    },
  );

  it.each(["Lecœur", "Łukasiewicz", "Nguyễn", "D’Arcy", "Jean Lecœur", "Zoë"])(
    "nom de personne « %s » accepté",
    (nom) => {
      expect(personName.pattern.test(nom)).toBe(true);
    },
  );

  it.each(["A", "Jean2", "Jean 2", "Jean<b>", "a".repeat(51)])(
    "nom de personne « %s » refusé",
    (nom) => {
      expect(personName.pattern.test(nom)).toBe(false);
    },
  );

  it("destinataire au nom d'entreprise", () => {
    expect(fullName.pattern.test("Entrepôt n° 2")).toBe(true);
    expect(fullName.pattern.test("Dupont & Fils")).toBe(true);
    expect(fullName.pattern.test("Dupont <b>")).toBe(false);
  });

  it("nom de banque avec apostrophe typographique et accents", () => {
    expect(bankName.pattern.test("Caisse d’Épargne d’Île-de-France")).toBe(
      true,
    );
    expect(bankName.pattern.test("Crédit Agricole Île-de-France")).toBe(true);
    expect(bankName.pattern.test("B")).toBe(false);
  });
});

describe("Pays, téléphone et SIRET", () => {
  it("pays avec apostrophe typographique", () => {
    expect(VALIDATION_PATTERNS.country.pattern.test("Côte d’Ivoire")).toBe(
      true,
    );
    expect(VALIDATION_PATTERNS.country.pattern.test("Bénin")).toBe(true);
  });

  it.each([
    "+33 6 12 34 56 78",
    "06.12.34.56.78",
    "0612345678",
    "+44 20 7946 0958",
  ])("téléphone « %s » accepté", (numero) => {
    expect(VALIDATION_PATTERNS.contactPhone.pattern.test(numero)).toBe(true);
  });

  it.each(["abcdefghij", "0612", "01 23 AB CD EF"])(
    "téléphone « %s » refusé",
    (numero) => {
      expect(VALIDATION_PATTERNS.contactPhone.pattern.test(numero)).toBe(false);
    },
  );

  it("SIRET copié avec ses espaces (Kbis) accepté, 13 chiffres refusés", () => {
    expect(VALIDATION_PATTERNS.siret.pattern.test("987 654 321 00012")).toBe(
      true,
    );
    expect(VALIDATION_PATTERNS.siret.pattern.test("98765432100012")).toBe(true);
    expect(VALIDATION_PATTERNS.siret.pattern.test("9876543210001")).toBe(false);
    expect(VALIDATION_PATTERNS.siret.pattern.test("98765432100A2")).toBe(false);
  });
});

describe("Champ rempli d'espaces", () => {
  it("est vide une fois les espaces retirés", () => {
    expect(isBlank("   ")).toBe(true);
    expect(isBlank("")).toBe(false);
    expect(isBlank(" Lyon ")).toBe(false);
    expect(isBlank(undefined)).toBe(false);
  });
});

describe("Code postal selon le pays", () => {
  it("France (ou pays vide) : format français", () => {
    expect(isFranceCountry("")).toBe(true);
    expect(isFranceCountry(" France ")).toBe(true);
    expect(getPostalCodeError("69003", { country: "France" })).toBeNull();
    expect(getPostalCodeError("7500", { country: "France" })).toMatch(
      /Code postal français/,
    );
    expect(getPostalCodeError("75A01", { country: "" })).toMatch(
      /Code postal français/,
    );
  });

  it("autres pays : format libre", () => {
    expect(getPostalCodeError("1000", { country: "Belgique" })).toBeNull();
    expect(
      getPostalCodeError("SW1A 1AA", { country: "Royaume-Uni" }),
    ).toBeNull();
    expect(getPostalCodeError("NW1 6XE", { international: true })).toBeNull();
    expect(getPostalCodeError("1", { country: "Belgique" })).toMatch(
      /entre 2 et 20/,
    );
  });
});

describe("IBAN : clé de contrôle et longueur du pays", () => {
  it.each([
    "FR7630006000011234567890189",
    "FR1420041010050500013M02606",
    "BE68539007547034",
    "DE89370400440532013000",
  ])("%s accepté", (iban) => {
    expect(getIbanError(iban)).toBeNull();
    expect(validateField(iban, "iban", true).isValid).toBe(true);
  });

  it("clé de contrôle fausse refusée", () => {
    expect(getIbanError("FR7630006000011234567890188")).toMatch(
      /clé de contrôle/,
    );
  });

  it("IBAN tronqué refusé (longueur du pays)", () => {
    // « FR76-3000-6000-0112 » une fois les tirets retirés par le champ
    expect(getIbanError("FR76300060000112")).toMatch(/27 caractères/);
    expect(getIbanError("FR763000600")).toMatch(/Format IBAN invalide/);
  });

  it("mise en forme enregistrée : sans espaces, en majuscules", () => {
    expect(normalizeIban("fr76 3000 6000 0112 3456 7890 189")).toBe(
      "FR7630006000011234567890189",
    );
  });
});

describe("Désignation d'un article copiée depuis un Mac ou Word", () => {
  it.each([
    `Cafe${ACCENT_DECOMPOSE} en grains`,
    `Instal${TRAIT_CONDITIONNEL}lation électrique`,
    "Côte de bœuf maturée",
    "Formule « Sérénité » annuelle",
    "Pose de 25 m² de parquet",
    "Mission à Łódź",
  ])("« %s » acceptée", (description) => {
    expect(ITEM_DESCRIPTION_PATTERN.test(description)).toBe(true);
  });
});

describe("Article d'un document : nom et détails", () => {
  it("nom d'un seul caractère refusé, détails de 501 caractères refusés", () => {
    expect(getItemTextErrors({ description: "A" })).toEqual([
      expect.objectContaining({ field: "description" }),
    ]);
    expect(
      getItemTextErrors({
        description: "Prestation",
        details: "d".repeat(501),
      }),
    ).toEqual([expect.objectContaining({ field: "details" })]);
  });

  it("vrais noms et détails de 500 caractères acceptés", () => {
    expect(
      getItemTextErrors({
        description: "Côte de bœuf maturée",
        details: "d".repeat(500),
      }),
    ).toEqual([]);
    expect(
      getItemTextErrors({ description: "L’atelier du bois massif" }),
    ).toEqual([]);
  });

  it("symboles hors des vrais noms (« € », émojis) : toujours refusés sur une facture", () => {
    expect(
      getItemTextErrors({
        description: "Forfait 100 € (cas erreur caractère)",
      }),
    ).toEqual([expect.objectContaining({ field: "description" })]);
    expect(
      getItemTextErrors({
        description: "Lot n° 12 de pavés, 25 m², « Sérénité »",
      }),
    ).toEqual([]);
  });

  it("ligne reprise telle quelle d'un document existant : pas de nouveau refus", () => {
    const ancienne = { description: "X", details: "d".repeat(800) };
    expect(getItemTextErrors({ ...ancienne }, ancienne)).toEqual([]);
  });
});
