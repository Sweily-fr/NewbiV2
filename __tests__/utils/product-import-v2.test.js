import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PRODUCT_FIELD_DEFINITIONS,
  PRODUCT_FIELD_GROUPS,
  autoDetectProductMapping,
  transformRowToProduct,
  validateProductRow,
  generateProductTemplate,
  downloadProductErrorsCSV,
} from "@/src/utils/product-import-v2";

// ─── PRODUCT_FIELD_DEFINITIONS ───────────────────────────────────────────────

describe("PRODUCT_FIELD_DEFINITIONS", () => {
  it("exposes the canonical field set", () => {
    const keys = PRODUCT_FIELD_DEFINITIONS.map((f) => f.key).sort();
    expect(keys).toEqual(
      [
        "category",
        "description",
        "name",
        "reference",
        "unit",
        "unitPrice",
        "vatRate",
      ].sort(),
    );
  });

  it("flags the right fields as required", () => {
    const required = PRODUCT_FIELD_DEFINITIONS.filter((f) => f.required).map(
      (f) => f.key,
    );
    expect(required.sort()).toEqual(
      ["name", "unit", "unitPrice", "vatRate"].sort(),
    );
  });

  it("groups fields under the declared groups", () => {
    const groupKeys = PRODUCT_FIELD_GROUPS.map((g) => g.key);
    PRODUCT_FIELD_DEFINITIONS.forEach((f) => {
      expect(groupKeys).toContain(f.group);
    });
  });
});

// ─── autoDetectProductMapping ────────────────────────────────────────────────

describe("autoDetectProductMapping", () => {
  it("matches exact French headers", () => {
    const headers = [
      "Nom",
      "Référence",
      "Prix unitaire HT",
      "Taux TVA",
      "Unité",
    ];
    const mapping = autoDetectProductMapping(headers);
    expect(mapping.name).toBe(0);
    expect(mapping.reference).toBe(1);
    expect(mapping.unitPrice).toBe(2);
    expect(mapping.vatRate).toBe(3);
    expect(mapping.unit).toBe(4);
  });

  it("matches accent-insensitive and case-insensitive aliases", () => {
    const headers = [
      "NOM",
      "designation",
      "tva (%)",
      "Unite",
      "PU HT",
      "categorie",
    ];
    const mapping = autoDetectProductMapping(headers);
    // First exact match for "name" wins
    expect(mapping.name).toBe(0);
    expect(mapping.unit).toBe(3);
    expect(mapping.unitPrice).toBe(4);
    expect(mapping.vatRate).toBe(2);
    expect(mapping.category).toBe(5);
  });

  it("returns null for fields with no header match", () => {
    const headers = ["Foo", "Bar"];
    const mapping = autoDetectProductMapping(headers);
    PRODUCT_FIELD_DEFINITIONS.forEach((f) => {
      expect(mapping[f.key]).toBeNull();
    });
  });

  it("doesn't reuse an index across two fields", () => {
    const headers = ["Nom du produit", "Désignation"];
    const mapping = autoDetectProductMapping(headers);
    const used = Object.values(mapping).filter((v) => v !== null);
    const dedup = new Set(used);
    expect(dedup.size).toBe(used.length);
  });

  it("avoids the 'Code barre' → reference false positive", () => {
    // The fuzzy second-pass requires a 60% length similarity, so 'Code barre'
    // (10 chars) shouldn't match 'code' (4) nor 'sku'.
    const headers = ["Nom", "Code barre"];
    const mapping = autoDetectProductMapping(headers);
    expect(mapping.name).toBe(0);
    expect(mapping.reference).toBeNull();
  });
});

// ─── transformRowToProduct ───────────────────────────────────────────────────

describe("transformRowToProduct", () => {
  const headers = [
    "Nom",
    "Référence",
    "Prix HT",
    "TVA",
    "Unité",
    "Description",
  ];
  const mapping = {
    name: 0,
    reference: 1,
    unitPrice: 2,
    vatRate: 3,
    unit: 4,
    description: 5,
    category: null,
  };

  it("parses a typical row", () => {
    const row = ["Conseil", "REF-1", "100,00", "20", "h", "Mission de conseil"];
    const product = transformRowToProduct(row, headers, mapping);
    expect(product).toEqual({
      name: "Conseil",
      reference: "REF-1",
      unitPrice: 100,
      vatRate: 20,
      unit: "h",
      description: "Mission de conseil",
    });
  });

  it("falls back to default unit when missing", () => {
    const row = ["Conseil", "", "10", "20", "", ""];
    const product = transformRowToProduct(row, headers, mapping);
    expect(product.unit).toBe("unité");
  });

  it("converts comma decimal to dot", () => {
    const row = ["A", "", "1234,56", "5,5", "u", ""];
    const product = transformRowToProduct(row, headers, mapping);
    expect(product.unitPrice).toBe(1234.56);
    expect(product.vatRate).toBe(5.5);
  });

  it("omits optional fields when empty", () => {
    const row = ["A", "", "10", "20", "u", ""];
    const product = transformRowToProduct(row, headers, mapping);
    expect(product).not.toHaveProperty("reference");
    expect(product).not.toHaveProperty("description");
  });

  it("omits unitPrice / vatRate when not numeric", () => {
    const row = ["A", "", "abc", "xx", "u", ""];
    const product = transformRowToProduct(row, headers, mapping);
    expect(product).not.toHaveProperty("unitPrice");
    expect(product).not.toHaveProperty("vatRate");
  });

  it("includes mapped custom fields", () => {
    const customMappings = [
      { fieldId: "cf-1", headerIndex: 5 },
      { fieldId: "cf-2", headerIndex: 999 }, // out of range, ignored
    ];
    const row = ["A", "", "10", "20", "u", "Couleur=rouge"];
    const product = transformRowToProduct(
      row,
      headers,
      mapping,
      customMappings,
    );
    expect(product.customFields).toEqual([
      { fieldId: "cf-1", value: "Couleur=rouge" },
    ]);
  });

  it("does not set customFields when no values are present", () => {
    const customMappings = [{ fieldId: "cf-1", headerIndex: 5 }];
    const row = ["A", "", "10", "20", "u", ""];
    const product = transformRowToProduct(
      row,
      headers,
      mapping,
      customMappings,
    );
    expect(product).not.toHaveProperty("customFields");
  });
});

// ─── validateProductRow ──────────────────────────────────────────────────────

describe("validateProductRow", () => {
  const valid = { name: "Conseil", unitPrice: 100, vatRate: 20, unit: "h" };

  it("accepts a valid product", () => {
    expect(validateProductRow(valid, 0)).toEqual({ valid: true, errors: [] });
  });

  it("rejects an empty / too-short name", () => {
    const r = validateProductRow({ ...valid, name: " " }, 5);
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("Ligne 6");
    expect(r.errors[0]).toContain("nom");
  });

  it("rejects negative or non-numeric unitPrice", () => {
    expect(validateProductRow({ ...valid, unitPrice: -1 }, 0).valid).toBe(
      false,
    );
    expect(validateProductRow({ ...valid, unitPrice: NaN }, 0).valid).toBe(
      false,
    );
    expect(
      validateProductRow({ ...valid, unitPrice: undefined }, 0).valid,
    ).toBe(false);
  });

  it("accepts unitPrice = 0 (free products are allowed)", () => {
    expect(validateProductRow({ ...valid, unitPrice: 0 }, 0).valid).toBe(true);
  });

  it("rejects vatRate outside [0, 100]", () => {
    expect(validateProductRow({ ...valid, vatRate: -1 }, 0).valid).toBe(false);
    expect(validateProductRow({ ...valid, vatRate: 101 }, 0).valid).toBe(false);
    expect(validateProductRow({ ...valid, vatRate: 0 }, 0).valid).toBe(true);
    expect(validateProductRow({ ...valid, vatRate: 100 }, 0).valid).toBe(true);
  });

  it("rejects empty unit", () => {
    expect(validateProductRow({ ...valid, unit: "" }, 0).valid).toBe(false);
    expect(validateProductRow({ ...valid, unit: "   " }, 0).valid).toBe(false);
  });

  it("collects multiple errors per row", () => {
    const r = validateProductRow(
      { name: "", unitPrice: -1, vatRate: 999, unit: "" },
      0,
    );
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBe(4);
  });
});

// ─── Browser-side helpers (template + error CSV) ─────────────────────────────

describe("generateProductTemplate / downloadProductErrorsCSV", () => {
  let createObjectURLMock;
  let revokeObjectURLMock;
  let clickSpy;

  beforeEach(() => {
    createObjectURLMock = vi.fn(() => "blob:mock");
    revokeObjectURLMock = vi.fn();
    globalThis.URL.createObjectURL = createObjectURLMock;
    globalThis.URL.revokeObjectURL = revokeObjectURLMock;

    clickSpy = vi.fn();
    // The implementation does NOT append the link to the body; it just calls .click()
    // on the link object directly. So we patch createElement to give us a controlled link.
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "a") {
        return { href: "", download: "", click: clickSpy };
      }
      return document.implementation.createHTMLDocument().createElement(tag);
    });
  });

  it("generateProductTemplate creates a CSV blob with BOM and headers", async () => {
    generateProductTemplate();
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    const blob = createObjectURLMock.mock.calls[0][0];
    const text = await blob.text();
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain("Nom;Référence;Catégorie");
    expect(text).toContain("Développement web");
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });

  it("downloadProductErrorsCSV writes one row per error", async () => {
    downloadProductErrorsCSV([
      { row: 2, message: "Erreur foo" },
      { row: 5, message: "Erreur 'bar'" },
    ]);
    const blob = createObjectURLMock.mock.calls[0][0];
    const text = await blob.text();
    expect(text).toContain("Ligne;Erreur");
    expect(text).toContain('"2";"Erreur foo"');
    expect(text).toContain("Erreur 'bar'");
  });

  it("accepts string-only errors as fallback", async () => {
    downloadProductErrorsCSV(["just a string"]);
    const blob = createObjectURLMock.mock.calls[0][0];
    const text = await blob.text();
    expect(text).toContain("just a string");
  });
});
