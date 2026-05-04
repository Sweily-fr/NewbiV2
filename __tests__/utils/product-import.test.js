import { describe, it, expect } from "vitest";
import { parseCSV, parseExcel, validateFile } from "@/src/utils/product-import";

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a fake `File`-like object whose `name`, `size` are the relevant
 * metadata for `validateFile`. For parsing tests we replace FileReader
 * so we don't actually need a real File.
 */
function fakeFile({ name = "products.csv", size = 1000 } = {}) {
  return { name, size };
}

/**
 * Mock FileReader so reader.onload fires with the provided text.
 */
function mockFileReader(text, { fail = false } = {}) {
  globalThis.FileReader = class {
    constructor() {
      this.onload = null;
      this.onerror = null;
    }
    readAsText() {
      // Defer to next microtask to mimic asynchronous behavior
      Promise.resolve().then(() => {
        if (fail) {
          if (this.onerror) this.onerror(new Error("read fail"));
        } else if (this.onload) {
          this.onload({ target: { result: text } });
        }
      });
    }
  };
}

// ─── parseCSV ────────────────────────────────────────────────────────────────

describe("parseCSV", () => {
  it("parses a valid CSV with all required columns", async () => {
    const csv = [
      "Nom;Référence;Catégorie;Prix unitaire HT (€);Taux TVA (%);Unité;Description",
      "Conseil;REF-1;Services;100.00;20.00;heure;Mission de conseil",
    ].join("\n");
    mockFileReader(csv);
    const products = await parseCSV(fakeFile());
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      name: "Conseil",
      reference: "REF-1",
      category: "Services",
      unitPrice: 100,
      vatRate: 20,
      unit: "heure",
      description: "Mission de conseil",
    });
  });

  it("rejects when the file has no data rows", async () => {
    mockFileReader("Nom;Prix unitaire HT (€);Taux TVA (%);Unité");
    await expect(parseCSV(fakeFile())).rejects.toThrow(
      /vide ou ne contient pas/,
    );
  });

  it("rejects when required columns are missing", async () => {
    const csv = ["Nom;Référence", "Conseil;REF-1"].join("\n");
    mockFileReader(csv);
    await expect(parseCSV(fakeFile())).rejects.toThrow(/Colonnes manquantes/);
  });

  it("rejects when name is too short", async () => {
    const csv = [
      "Nom;Prix unitaire HT (€);Taux TVA (%);Unité",
      "A;100;20;u",
    ].join("\n");
    mockFileReader(csv);
    await expect(parseCSV(fakeFile())).rejects.toThrow(/au moins 2 caractères/);
  });

  it("rejects when unitPrice is negative or non-numeric", async () => {
    const csv = [
      "Nom;Prix unitaire HT (€);Taux TVA (%);Unité",
      "Produit;abc;20;u",
    ].join("\n");
    mockFileReader(csv);
    await expect(parseCSV(fakeFile())).rejects.toThrow(/Prix unitaire HT/);
  });

  it("rejects negative vatRate", async () => {
    const csv = [
      "Nom;Prix unitaire HT (€);Taux TVA (%);Unité",
      "Produit;10;-5;u",
    ].join("\n");
    mockFileReader(csv);
    await expect(parseCSV(fakeFile())).rejects.toThrow(/Taux TVA/);
  });

  it("rejects empty unit", async () => {
    const csv = [
      "Nom;Prix unitaire HT (€);Taux TVA (%);Unité",
      "Produit;10;20;",
    ].join("\n");
    mockFileReader(csv);
    await expect(parseCSV(fakeFile())).rejects.toThrow(
      /unité est obligatoire/i,
    );
  });

  it("converts comma decimals to dots", async () => {
    const csv = [
      "Nom;Prix unitaire HT (€);Taux TVA (%);Unité",
      "Produit;1234,56;5,5;u",
    ].join("\n");
    mockFileReader(csv);
    const products = await parseCSV(fakeFile());
    expect(products[0].unitPrice).toBe(1234.56);
    expect(products[0].vatRate).toBe(5.5);
  });

  it("rejects when the row column count doesn't match headers", async () => {
    const csv = [
      "Nom;Prix unitaire HT (€);Taux TVA (%);Unité",
      "Produit;10;20", // missing one column
    ].join("\n");
    mockFileReader(csv);
    await expect(parseCSV(fakeFile())).rejects.toThrow(/Nombre de colonnes/);
  });

  it("handles quoted values containing semicolons", async () => {
    const csv = [
      "Nom;Prix unitaire HT (€);Taux TVA (%);Unité;Description",
      'Produit;10;20;u;"Ligne avec ; dedans"',
    ].join("\n");
    mockFileReader(csv);
    const products = await parseCSV(fakeFile());
    expect(products[0].description).toBe("Ligne avec ; dedans");
  });

  it("handles escaped double quotes inside quoted fields", async () => {
    const csv = [
      "Nom;Prix unitaire HT (€);Taux TVA (%);Unité;Description",
      'Produit;10;20;u;"Il dit ""bonjour"" hier"',
    ].join("\n");
    mockFileReader(csv);
    const products = await parseCSV(fakeFile());
    // The parser converts "" → ", and the surrounding-quote stripper at the end
    // does not remove embedded ones since the value doesn't start/end with one.
    expect(products[0].description).toContain('"bonjour"');
  });

  it("ignores blank lines", async () => {
    const csv = [
      "Nom;Prix unitaire HT (€);Taux TVA (%);Unité",
      "",
      "Produit;10;20;u",
      "",
    ].join("\n");
    mockFileReader(csv);
    const products = await parseCSV(fakeFile());
    expect(products).toHaveLength(1);
  });

  it("parses multiple valid rows", async () => {
    const csv = [
      "Nom;Prix unitaire HT (€);Taux TVA (%);Unité",
      "Produit A;10;20;u",
      "Produit B;25.5;5.5;kg",
    ].join("\n");
    mockFileReader(csv);
    const products = await parseCSV(fakeFile());
    expect(products).toHaveLength(2);
    expect(products[0].name).toBe("Produit A");
    expect(products[1].name).toBe("Produit B");
  });

  it("rejects on FileReader error", async () => {
    mockFileReader("", { fail: true });
    await expect(parseCSV(fakeFile())).rejects.toThrow();
  });
});

// ─── parseExcel ──────────────────────────────────────────────────────────────

describe("parseExcel", () => {
  const buildHTMLTable = (rows, headers) => `
    <table>
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows
          .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
          .join("")}
      </tbody>
    </table>
  `;

  it("parses a valid HTML-style Excel file", async () => {
    const html = buildHTMLTable(
      [["Conseil", "REF-1", "Services", "100", "20", "h", "Mission"]],
      [
        "Nom",
        "Référence",
        "Catégorie",
        "Prix unitaire HT (€)",
        "Taux TVA (%)",
        "Unité",
        "Description",
      ],
    );
    mockFileReader(html);
    const products = await parseExcel(fakeFile({ name: "products.xls" }));
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      name: "Conseil",
      reference: "REF-1",
      unitPrice: 100,
      vatRate: 20,
      unit: "h",
    });
  });

  it("rejects when the file has no <table>", async () => {
    mockFileReader("<html><body>No table here</body></html>");
    await expect(parseExcel(fakeFile())).rejects.toThrow(/Aucun tableau/);
  });

  it("rejects when required columns are missing", async () => {
    const html = buildHTMLTable([["Conseil"]], ["Nom"]);
    mockFileReader(html);
    await expect(parseExcel(fakeFile())).rejects.toThrow(/Colonnes manquantes/);
  });

  it("rejects rows with too-short name", async () => {
    const html = buildHTMLTable(
      [["A", "10", "20", "u"]],
      ["Nom", "Prix unitaire HT (€)", "Taux TVA (%)", "Unité"],
    );
    mockFileReader(html);
    await expect(parseExcel(fakeFile())).rejects.toThrow(
      /au moins 2 caractères/,
    );
  });

  it("rejects negative numeric values", async () => {
    const html = buildHTMLTable(
      [["Produit", "-5", "20", "u"]],
      ["Nom", "Prix unitaire HT (€)", "Taux TVA (%)", "Unité"],
    );
    mockFileReader(html);
    await expect(parseExcel(fakeFile())).rejects.toThrow(/Prix unitaire HT/);
  });

  it("converts comma decimals", async () => {
    const html = buildHTMLTable(
      [["Produit", "12,5", "5,5", "u"]],
      ["Nom", "Prix unitaire HT (€)", "Taux TVA (%)", "Unité"],
    );
    mockFileReader(html);
    const products = await parseExcel(fakeFile());
    expect(products[0].unitPrice).toBe(12.5);
    expect(products[0].vatRate).toBe(5.5);
  });

  it("parses multiple data rows", async () => {
    const html = buildHTMLTable(
      [
        ["Produit A", "10", "20", "u"],
        ["Produit B", "25", "10", "kg"],
      ],
      ["Nom", "Prix unitaire HT (€)", "Taux TVA (%)", "Unité"],
    );
    mockFileReader(html);
    const products = await parseExcel(fakeFile());
    expect(products).toHaveLength(2);
  });

  it("rejects on FileReader error", async () => {
    mockFileReader("", { fail: true });
    await expect(parseExcel(fakeFile())).rejects.toThrow();
  });
});

// ─── validateFile ────────────────────────────────────────────────────────────

describe("validateFile", () => {
  it("rejects when no file is provided", () => {
    expect(validateFile(null).valid).toBe(false);
    expect(validateFile(undefined).valid).toBe(false);
  });

  it("rejects oversized files (>5MB)", () => {
    const file = { name: "big.csv", size: 6 * 1024 * 1024 };
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/trop volumineux/);
  });

  it("accepts CSV files", () => {
    expect(validateFile({ name: "x.csv", size: 100 }).valid).toBe(true);
  });

  it("accepts xls and xlsx files", () => {
    expect(validateFile({ name: "x.xls", size: 100 }).valid).toBe(true);
    expect(validateFile({ name: "x.xlsx", size: 100 }).valid).toBe(true);
  });

  it("rejects unsupported extensions", () => {
    const result = validateFile({ name: "x.pdf", size: 100 });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/non supporté/);
  });

  it("is case-insensitive on extensions", () => {
    expect(validateFile({ name: "DATA.CSV", size: 100 }).valid).toBe(true);
    expect(validateFile({ name: "data.XLSX", size: 100 }).valid).toBe(true);
  });
});
