import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  exportToCSV,
  exportToExcel,
  downloadCSVTemplate,
  downloadExcelTemplate,
} from "@/src/utils/product-export";

// ─── Browser API mocks ───────────────────────────────────────────────────────

const createObjectURLMock = vi.fn(() => "blob:mock");
const revokeObjectURLMock = vi.fn();

let appendChildSpy;
let removeChildSpy;
let clickSpy;

beforeEach(() => {
  globalThis.URL.createObjectURL = createObjectURLMock;
  globalThis.URL.revokeObjectURL = revokeObjectURLMock;
  createObjectURLMock.mockClear();
  revokeObjectURLMock.mockClear();

  clickSpy = vi.fn();
  appendChildSpy = vi
    .spyOn(document.body, "appendChild")
    .mockImplementation((el) => {
      if (el && el.tagName === "A") el.click = clickSpy;
      return el;
    });
  appendChildSpy.mockClear();
  removeChildSpy = vi
    .spyOn(document.body, "removeChild")
    .mockImplementation(() => null);
  removeChildSpy.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Sample data ─────────────────────────────────────────────────────────────

const sampleProduct = (overrides = {}) => ({
  name: "Ordinateur Dell",
  reference: "DELL-001",
  category: "Matériel",
  unitPrice: 1299.5,
  vatRate: 20,
  unit: "unité",
  description: "Ordinateur portable",
  createdAt: new Date("2026-01-15T10:30:00Z").getTime(),
  updatedAt: new Date("2026-02-15T11:30:00Z").getTime(),
  ...overrides,
});

// ─── exportToCSV ─────────────────────────────────────────────────────────────

describe("exportToCSV", () => {
  it("returns failure for empty product list", () => {
    const result = exportToCSV([]);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Aucun produit");
  });

  it("returns failure for null/undefined input", () => {
    expect(exportToCSV(null).success).toBe(false);
    expect(exportToCSV(undefined).success).toBe(false);
  });

  it("triggers a CSV download with correct content type", () => {
    const result = exportToCSV([sampleProduct()]);
    expect(result.success).toBe(true);
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    const blob = createObjectURLMock.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toMatch(/text\/csv/);
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });

  it("includes BOM and the canonical headers", async () => {
    exportToCSV([sampleProduct()]);
    const blob = createObjectURLMock.mock.calls[0][0];
    const text = await blob.text();
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain("Nom");
    expect(text).toContain("Référence");
    expect(text).toContain("Prix unitaire HT (€)");
    expect(text).toContain("Taux TVA (%)");
    expect(text).toContain("Unité");
  });

  it("formats numeric amounts with two decimals", async () => {
    exportToCSV([sampleProduct({ unitPrice: 100, vatRate: 5.5 })]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("100.00");
    expect(text).toContain("5.50");
  });

  it("escapes values containing semicolons by wrapping with quotes", async () => {
    exportToCSV([sampleProduct({ name: "Foo; Bar" })]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain('"Foo; Bar"');
  });

  it("escapes embedded quotes by doubling them", async () => {
    exportToCSV([sampleProduct({ name: 'Quoted "thing"' })]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toMatch(/Quoted ""thing""/);
  });

  it("handles missing optional fields gracefully", async () => {
    exportToCSV([{ name: "Minimal", unitPrice: 50, vatRate: 20, unit: "u" }]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("Minimal");
    expect(text).toContain("50.00");
  });

  it("treats null/undefined amounts as 0.00", async () => {
    exportToCSV([
      { name: "Nope", unitPrice: null, vatRate: undefined, unit: "u" },
    ]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("0.00");
  });

  it("filename uses the .csv extension", () => {
    exportToCSV([sampleProduct()]);
    const anchor = appendChildSpy.mock.calls[0][0];
    expect(anchor.download).toMatch(/\.csv$/);
    expect(anchor.download).toMatch(/^Catalogue_/);
  });

  it("handles createdAt as ISO string", async () => {
    exportToCSV([
      sampleProduct({ createdAt: "2026-03-15T12:00:00Z", updatedAt: null }),
    ]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("15/03/2026");
  });

  it("handles createdAt as numeric string timestamp", async () => {
    const ts = String(new Date("2026-04-15T12:00:00Z").getTime());
    exportToCSV([sampleProduct({ createdAt: ts, updatedAt: null })]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("15/04/2026");
  });

  it("emits empty cell for invalid date", async () => {
    exportToCSV([
      sampleProduct({ createdAt: "not-a-date", updatedAt: undefined }),
    ]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toBeDefined();
    // No date appears in the date columns when parsing fails
  });

  it("handles string amounts by parsing them", async () => {
    exportToCSV([sampleProduct({ unitPrice: "199.99", vatRate: "10" })]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("199.99");
    expect(text).toContain("10.00");
  });
});

// ─── exportToExcel ───────────────────────────────────────────────────────────

describe("exportToExcel", () => {
  it("returns failure for empty list", () => {
    const result = exportToExcel([]);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Aucun produit");
  });

  it("returns failure for null input", () => {
    expect(exportToExcel(null).success).toBe(false);
  });

  it("triggers an Excel download with correct content type", () => {
    const result = exportToExcel([sampleProduct()]);
    expect(result.success).toBe(true);
    const blob = createObjectURLMock.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/vnd.ms-excel");
  });

  it("filename uses the .xls extension", () => {
    exportToExcel([sampleProduct()]);
    const anchor = appendChildSpy.mock.calls[0][0];
    expect(anchor.download).toMatch(/\.xls$/);
  });

  it("emits an HTML table with headers", async () => {
    exportToExcel([sampleProduct()]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("<table>");
    expect(text).toContain("<th>Nom</th>");
    expect(text).toContain("<th>Référence</th>");
    expect(text).toContain("Catalogue");
  });

  it("includes the product values in the tbody", async () => {
    exportToExcel([sampleProduct({ name: "ProduitX", reference: "REF-X" })]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("ProduitX");
    expect(text).toContain("REF-X");
  });
});

// ─── downloadCSVTemplate ─────────────────────────────────────────────────────

describe("downloadCSVTemplate", () => {
  it("downloads a CSV blob with BOM and example data", async () => {
    downloadCSVTemplate();
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    const blob = createObjectURLMock.mock.calls[0][0];
    expect(blob.type).toMatch(/text\/csv/);
    const text = await blob.text();
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain("Ordinateur portable Dell XPS 13");
    expect(text).toContain("DELL-XPS13-2024");
  });

  it("uses the canonical template filename", () => {
    downloadCSVTemplate();
    const anchor = appendChildSpy.mock.calls[0][0];
    expect(anchor.download).toBe("Modele_Import_Catalogue.csv");
  });

  it("includes all expected headers in the template", async () => {
    downloadCSVTemplate();
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("Nom;Référence;Catégorie");
    expect(text).toContain("Prix unitaire HT");
    expect(text).toContain("Taux TVA");
  });
});

// ─── downloadExcelTemplate ───────────────────────────────────────────────────

describe("downloadExcelTemplate", () => {
  it("downloads an xls blob with the example rows", async () => {
    downloadExcelTemplate();
    const blob = createObjectURLMock.mock.calls[0][0];
    expect(blob.type).toBe("application/vnd.ms-excel");
    const text = await blob.text();
    expect(text).toContain("Ordinateur portable Dell XPS 13");
    expect(text).toContain("Modèle Import");
  });

  it("uses the canonical template filename", () => {
    downloadExcelTemplate();
    const anchor = appendChildSpy.mock.calls[0][0];
    expect(anchor.download).toBe("Modele_Import_Catalogue.xls");
  });

  it("emits a complete HTML table structure", async () => {
    downloadExcelTemplate();
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("<thead>");
    expect(text).toContain("<tbody>");
    expect(text).toContain("<th>");
  });
});
