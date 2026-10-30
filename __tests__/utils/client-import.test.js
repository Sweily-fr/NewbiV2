import { describe, it, expect } from "vitest";
import {
  validateImportFile,
  autoDetectMapping,
  transformRowToClient,
  validateClientRow,
  decodeCSVBytes,
  parseCSVRaw,
  CLIENT_FIELD_DEFINITIONS,
  FIELD_GROUPS,
} from "@/src/utils/client-import";

describe("validateImportFile", () => {
  it("rejects null/undefined file", () => {
    expect(validateImportFile(null).valid).toBe(false);
    expect(validateImportFile(undefined).valid).toBe(false);
  });

  it("rejects unsupported extension", () => {
    const file = new File(["x"], "test.pdf");
    expect(validateImportFile(file).valid).toBe(false);
    expect(validateImportFile(file).error).toMatch(/non supporté/i);
  });

  it("accepts CSV", () => {
    const file = new File(["x"], "test.csv");
    expect(validateImportFile(file).valid).toBe(true);
  });

  it("accepts XLSX", () => {
    const file = new File(["x"], "test.xlsx");
    expect(validateImportFile(file).valid).toBe(true);
  });

  it("accepts XLS", () => {
    const file = new File(["x"], "test.xls");
    expect(validateImportFile(file).valid).toBe(true);
  });

  it("rejects file > 5MB", () => {
    const big = new File([new Uint8Array(6 * 1024 * 1024)], "test.csv");
    expect(validateImportFile(big).valid).toBe(false);
    expect(validateImportFile(big).error).toMatch(/taille/i);
  });
});

describe("CLIENT_FIELD_DEFINITIONS / FIELD_GROUPS", () => {
  it("has expected core fields", () => {
    const keys = CLIENT_FIELD_DEFINITIONS.map((f) => f.key);
    expect(keys).toContain("name");
    expect(keys).toContain("email");
    expect(keys).toContain("siret");
    expect(keys).toContain("street");
    expect(keys).toContain("city");
    expect(keys).toContain("postalCode");
  });

  it("each field has aliases array", () => {
    for (const f of CLIENT_FIELD_DEFINITIONS) {
      expect(Array.isArray(f.aliases)).toBe(true);
      expect(f.aliases.length).toBeGreaterThan(0);
    }
  });

  it("FIELD_GROUPS is an array", () => {
    expect(Array.isArray(FIELD_GROUPS)).toBe(true);
    expect(FIELD_GROUPS.length).toBeGreaterThan(0);
  });
});

describe("autoDetectMapping", () => {
  it("maps headers to field keys (case-insensitive)", () => {
    const headers = ["Nom", "Email", "SIRET", "Adresse", "Ville"];
    const mapping = autoDetectMapping(headers);
    expect(mapping.name).toBe(0);
    expect(mapping.email).toBe(1);
    expect(mapping.siret).toBe(2);
  });

  it("strips French accents during matching", () => {
    const headers = ["Numéro SIRET"];
    const mapping = autoDetectMapping(headers);
    expect(mapping.siret).toBe(0);
  });

  it("never maps the same column twice", () => {
    const headers = ["Email", "Email"];
    const mapping = autoDetectMapping(headers);
    // Only one mapped index for email
    const indicesUsed = Object.values(mapping).filter((v) => v !== null);
    expect(new Set(indicesUsed).size).toBe(indicesUsed.length);
  });

  it("returns null for unmapped fields", () => {
    const mapping = autoDetectMapping(["random-column"]);
    expect(mapping.name).toBeNull();
  });
});

describe("transformRowToClient", () => {
  it("builds a client object from a mapped row", () => {
    const headers = ["Nom", "Email", "SIRET"];
    const row = ["Acme Corp", "contact@acme.fr", "12345678901234"];
    const mapping = autoDetectMapping(headers);

    const client = transformRowToClient(row, headers, mapping);
    expect(client.name).toBe("Acme Corp");
    expect(client.email).toBe("contact@acme.fr");
    expect(client.siret).toBe("12345678901234");
  });

  it("defaults country to France when at least one address field is set", () => {
    const headers = ["Nom", "Ville"];
    const row = ["Acme", "Paris"];
    const mapping = autoDetectMapping(headers);
    const client = transformRowToClient(row, headers, mapping);
    expect(client.address.country).toBe("France");
    expect(client.address.city).toBe("Paris");
  });

  it("garde une adresse vide (pays France) quand le fichier n'a pas d'adresse : l'API l'exige", () => {
    const headers = ["Nom"];
    const mapping = autoDetectMapping(headers);
    const client = transformRowToClient(["Acme"], headers, mapping);
    expect(client.address).toEqual({
      street: "",
      city: "",
      postalCode: "",
      country: "France",
    });
  });

  it("le téléphone du fichier est celui du contact", () => {
    const headers = ["Type", "Nom", "Email", "Téléphone", "SIRET"];
    const row = [
      "Entreprise",
      "Sans Adresse SARL",
      "sans-adresse@e2e.test",
      "0601020304",
      "12345678900011",
    ];
    const client = transformRowToClient(
      row,
      headers,
      autoDetectMapping(headers),
    );
    expect(client.phone).toBe("0601020304");
    expect(client.contacts[0].phone).toBe("0601020304");
  });

  it("parses INDIVIDUAL type", () => {
    const headers = ["Nom", "Type"];
    const row = ["John", "particulier"];
    const mapping = autoDetectMapping(headers);
    const client = transformRowToClient(row, headers, mapping);
    expect(client.type).toBe("INDIVIDUAL");
  });

  it("defaults type to COMPANY when missing", () => {
    const headers = ["Nom"];
    const mapping = autoDetectMapping(headers);
    const client = transformRowToClient(["Acme"], headers, mapping);
    expect(client.type).toBe("COMPANY");
  });

  it("returns empty string when mapped index is out of range", () => {
    const headers = ["Nom"];
    const mapping = { name: 5 }; // out of range
    const client = transformRowToClient(["Acme"], headers, mapping);
    expect(client.name).toBe("");
  });
});

describe("decodeCSVBytes / parseCSVRaw", () => {
  const latin1 = (text) => Uint8Array.from(text, (c) => c.charCodeAt(0));

  it("lit l'UTF-8, BOM compris", () => {
    const bytes = new TextEncoder().encode("\uFEFFNom;Ville\nHélène;Évry");
    expect(decodeCSVBytes(bytes).replace(/^\uFEFF/, "")).toBe(
      "Nom;Ville\nHélène;Évry",
    );
  });

  it("lit un fichier Windows-1252 (CSV d'Excel) sans abîmer les accents", () => {
    expect(decodeCSVBytes(latin1("Société Générale de Façades;Évry"))).toBe(
      "Société Générale de Façades;Évry",
    );
  });

  it("parseCSVRaw : en-têtes et lignes d'un CSV Windows-1252", async () => {
    const file = new File(
      [latin1("Nom;Ville\r\nPâté en croûte;Évry")],
      "contacts.csv",
    );
    const { headers, rows } = await parseCSVRaw(file);
    expect(headers).toEqual(["Nom", "Ville"]);
    expect(rows).toEqual([["Pâté en croûte", "Évry"]]);
  });

  it("parseCSVRaw : un fichier sans ligne de données est refusé avec un message", async () => {
    const file = new File([new TextEncoder().encode("Nom;Ville")], "vide.csv");
    await expect(parseCSVRaw(file)).rejects.toThrow(
      "Le fichier doit contenir au moins un en-tête et une ligne de données.",
    );
  });
});

describe("validateClientRow", () => {
  it("explique pourquoi une ligne est écartée", () => {
    expect(
      validateClientRow(
        { name: "Email faux SARL", email: "pas-un-email", type: "INDIVIDUAL" },
        1,
      ).errors,
    ).toEqual(['Ligne 2 : Email invalide "pas-un-email".']);
    expect(
      validateClientRow({ name: "Sans SIRET SARL", type: "COMPANY" }, 2).errors,
    ).toEqual([
      "Ligne 3 : Le SIREN/SIRET est obligatoire pour une entreprise.",
    ]);
  });
});
