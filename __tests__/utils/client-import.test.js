import { describe, it, expect } from "vitest";
import {
  validateImportFile,
  autoDetectMapping,
  transformRowToClient,
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

  it("strips empty address entirely when only the default country would remain", () => {
    const headers = ["Nom"];
    const mapping = autoDetectMapping(headers);
    const client = transformRowToClient(["Acme"], headers, mapping);
    expect(client.address).toBeUndefined();
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
