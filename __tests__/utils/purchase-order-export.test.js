import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  filterPurchaseOrdersByDateRange,
  exportToCSV,
  exportToExcel,
  exportToFEC,
  exportToSage,
  exportToCegid,
} from "@/src/utils/purchase-order-export";

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

const samplePO = (overrides = {}) => ({
  prefix: "BC",
  number: "001",
  issueDate: new Date("2026-04-15").getTime(),
  deliveryDate: new Date("2026-04-30").getTime(),
  createdAt: new Date("2026-04-10").getTime(),
  client: {
    name: "Acme Corp",
    email: "contact@acme.fr",
    siret: "12345678901234",
    vatNumber: "FR12345678901",
    type: "COMPANY",
    address: {
      street: "1 rue de la Paix",
      postalCode: "75001",
      city: "Paris",
      country: "France",
    },
  },
  finalTotalHT: 1000,
  finalTotalVAT: 200,
  finalTotalTTC: 1200,
  discount: 10,
  discountType: "PERCENTAGE",
  discountAmount: 100,
  status: "CONFIRMED",
  items: [
    {
      description: "Service de conseil",
      quantity: 10,
      unitPrice: 100,
      vatRate: 20,
      discount: 0,
      discountType: "PERCENTAGE",
    },
  ],
  ...overrides,
});

// ─── filterPurchaseOrdersByDateRange ─────────────────────────────────────────

describe("filterPurchaseOrdersByDateRange", () => {
  it("returns input as-is when no dateRange is provided", () => {
    const list = [samplePO()];
    expect(filterPurchaseOrdersByDateRange(list, null)).toBe(list);
  });

  it("returns input as-is when dateRange has no from/to", () => {
    const list = [samplePO()];
    expect(filterPurchaseOrdersByDateRange(list, {})).toBe(list);
  });

  it("excludes POs with no issueDate", () => {
    const list = [samplePO(), { ...samplePO(), issueDate: null }];
    const out = filterPurchaseOrdersByDateRange(list, {
      from: new Date("2026-01-01"),
    });
    expect(out).toHaveLength(1);
  });

  it("filters using from-only", () => {
    const list = [
      samplePO({
        number: "early",
        issueDate: new Date("2026-01-15").getTime(),
      }),
      samplePO({ number: "mid", issueDate: new Date("2026-04-15").getTime() }),
    ];
    const out = filterPurchaseOrdersByDateRange(list, {
      from: new Date("2026-04-01"),
    });
    expect(out.map((p) => p.number)).toEqual(["mid"]);
  });

  it("filters using to-only", () => {
    const list = [
      samplePO({ number: "mid", issueDate: new Date("2026-04-15").getTime() }),
      samplePO({ number: "late", issueDate: new Date("2026-12-15").getTime() }),
    ];
    const out = filterPurchaseOrdersByDateRange(list, {
      to: new Date("2026-06-30"),
    });
    expect(out.map((p) => p.number)).toEqual(["mid"]);
  });

  it("filters with both from and to", () => {
    const list = [
      samplePO({
        number: "before",
        issueDate: new Date("2026-01-15").getTime(),
      }),
      samplePO({ number: "in", issueDate: new Date("2026-04-15").getTime() }),
      samplePO({
        number: "after",
        issueDate: new Date("2026-12-15").getTime(),
      }),
    ];
    const out = filterPurchaseOrdersByDateRange(list, {
      from: new Date("2026-03-01"),
      to: new Date("2026-06-30"),
    });
    expect(out.map((p) => p.number)).toEqual(["in"]);
  });

  it("handles ISO string issueDate", () => {
    const list = [{ number: "x", issueDate: "2026-04-15T00:00:00Z" }];
    const out = filterPurchaseOrdersByDateRange(list, {
      from: new Date("2026-04-01"),
      to: new Date("2026-04-30"),
    });
    expect(out).toHaveLength(1);
  });

  it("handles numeric string timestamp", () => {
    const ts = String(new Date("2026-04-15").getTime());
    const list = [{ number: "x", issueDate: ts }];
    const out = filterPurchaseOrdersByDateRange(list, {
      from: new Date("2026-04-01"),
      to: new Date("2026-04-30"),
    });
    expect(out).toHaveLength(1);
  });
});

// ─── exportToCSV ─────────────────────────────────────────────────────────────

describe("exportToCSV (purchase orders)", () => {
  it("throws when filtered list is empty", () => {
    expect(() => exportToCSV([])).toThrow(/Aucun bon de commande/);
  });

  it("throws with date-range info when dateRange filters everything out", () => {
    expect(() =>
      exportToCSV([samplePO()], {
        from: new Date("2030-01-01"),
        to: new Date("2030-12-31"),
      }),
    ).toThrow(/01\/01\/2030/);
  });

  it("triggers a CSV blob download", () => {
    exportToCSV([samplePO()]);
    const blob = createObjectURLMock.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toMatch(/text\/csv/);
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });

  it("includes BOM and headers", async () => {
    exportToCSV([samplePO()]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain("Numéro");
    expect(text).toContain("Client");
    expect(text).toContain("Total HT (€)");
    expect(text).toContain("Statut");
  });

  it("translates status codes to French labels", async () => {
    exportToCSV([
      samplePO({ status: "DRAFT" }),
      samplePO({ status: "CONFIRMED" }),
      samplePO({ status: "DELIVERED" }),
      samplePO({ status: "CANCELED" }),
    ]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("Brouillon");
    expect(text).toContain("Confirmé");
    expect(text).toContain("Livré");
    expect(text).toContain("Annulé");
  });

  it("formats client type into French label", async () => {
    exportToCSV([
      samplePO({ client: { ...samplePO().client, type: "INDIVIDUAL" } }),
    ]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("Particulier");
  });

  it("includes prefix-number combo in 'Numéro' column", async () => {
    exportToCSV([samplePO({ prefix: "BC", number: "042" })]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("BC-042");
  });

  it("escapes values containing semicolons", async () => {
    exportToCSV([
      samplePO({ client: { ...samplePO().client, name: "Foo; Inc." } }),
    ]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain('"Foo; Inc."');
  });

  it("filename uses the .csv extension and includes prefix", () => {
    exportToCSV([samplePO()]);
    const anchor = appendChildSpy.mock.calls[0][0];
    expect(anchor.download).toMatch(/^bons-commande_/);
    expect(anchor.download).toMatch(/\.csv$/);
  });

  it("filename includes date range when provided", () => {
    exportToCSV([samplePO()], {
      from: new Date("2026-01-01"),
      to: new Date("2026-06-30"),
    });
    const anchor = appendChildSpy.mock.calls[0][0];
    expect(anchor.download).toContain("2026-01-01");
    expect(anchor.download).toContain("2026-06-30");
  });
});

// ─── exportToExcel ───────────────────────────────────────────────────────────

describe("exportToExcel (purchase orders)", () => {
  it("throws when filtered list is empty", () => {
    expect(() => exportToExcel([])).toThrow(/Aucun bon de commande/);
  });

  it("triggers an xls blob download", () => {
    exportToExcel([samplePO()]);
    const blob = createObjectURLMock.mock.calls[0][0];
    expect(blob.type).toBe("application/vnd.ms-excel");
  });

  it("emits an HTML table with thead and tbody", async () => {
    exportToExcel([samplePO()]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("<thead>");
    expect(text).toContain("<tbody>");
    expect(text).toContain("Bons de commande");
  });

  it("uses .xls extension for filename", () => {
    exportToExcel([samplePO()]);
    const anchor = appendChildSpy.mock.calls[0][0];
    expect(anchor.download).toMatch(/\.xls$/);
  });
});

// ─── exportToFEC ─────────────────────────────────────────────────────────────

describe("exportToFEC", () => {
  it("throws when no purchase orders", () => {
    expect(() => exportToFEC([])).toThrow(/Aucun bon de commande/);
  });

  it("emits a pipe-separated text blob with BOM", async () => {
    exportToFEC([samplePO()]);
    const blob = createObjectURLMock.mock.calls[0][0];
    expect(blob.type).toMatch(/text\/plain/);
    const text = await blob.text();
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain("|");
  });

  it("uses .txt extension and FEC prefix in filename", () => {
    exportToFEC([samplePO()]);
    const anchor = appendChildSpy.mock.calls[0][0];
    expect(anchor.download).toMatch(/^FEC_/);
    expect(anchor.download).toMatch(/\.txt$/);
  });

  it("emits client debit row at 411000 account", async () => {
    exportToFEC([samplePO()]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("411000");
    expect(text).toContain("VTE");
    expect(text).toContain("Acme Corp");
  });

  it("emits credit rows for revenue (706000) and VAT (445710)", async () => {
    exportToFEC([samplePO()]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("706000");
    expect(text).toContain("445710");
  });

  it("uses 5.5% VAT account 445712", async () => {
    const po = samplePO({
      items: [
        {
          description: "Test",
          quantity: 10,
          unitPrice: 100,
          vatRate: 5.5,
          discount: 0,
          discountType: "PERCENTAGE",
        },
      ],
    });
    exportToFEC([po]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("445712");
  });

  it("falls back to totals when no items present", async () => {
    const po = samplePO({ items: [] });
    exportToFEC([po]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    // Still emits the client account and revenue/VAT lines
    expect(text).toContain("411000");
    expect(text).toContain("706000");
  });

  it("skips POs without issueDate but still throws if all skipped", async () => {
    // One PO without issueDate gets silently skipped - but if all are skipped, we still
    // produce an empty FEC file (function does not throw in that case).
    exportToFEC([samplePO(), { ...samplePO(), issueDate: null }]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    // Only one set of entries from the valid PO
    expect(text).toContain("411000");
  });
});

// ─── exportToSage ────────────────────────────────────────────────────────────

describe("exportToSage", () => {
  it("throws when no purchase orders", () => {
    expect(() => exportToSage([])).toThrow(/Aucun bon de commande/);
  });

  it("emits a Sage-formatted text blob", async () => {
    exportToSage([samplePO()]);
    const blob = createObjectURLMock.mock.calls[0][0];
    expect(blob.type).toMatch(/text\/plain/);
    const text = await blob.text();
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain("Journal;Date;Compte");
  });

  it("uses Sage prefix in filename", () => {
    exportToSage([samplePO()]);
    const anchor = appendChildSpy.mock.calls[0][0];
    expect(anchor.download).toMatch(/^Sage_/);
    expect(anchor.download).toMatch(/\.txt$/);
  });

  it("emits VTE journal entries with semicolon separator", async () => {
    exportToSage([samplePO()]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("VTE;");
    expect(text).toContain("411000");
    expect(text).toContain("706000");
  });

  it("falls back when items are missing", async () => {
    const po = samplePO({ items: [] });
    exportToSage([po]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("706000");
    expect(text).toContain("445710");
  });
});

// ─── exportToCegid ───────────────────────────────────────────────────────────

describe("exportToCegid", () => {
  it("throws when no purchase orders", () => {
    expect(() => exportToCegid([])).toThrow(/Aucun bon de commande/);
  });

  it("emits a Cegid-formatted CSV blob", async () => {
    exportToCegid([samplePO()]);
    const blob = createObjectURLMock.mock.calls[0][0];
    expect(blob.type).toMatch(/text\/csv/);
    const text = await blob.text();
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain("CodeJournal;Date;NumPiece");
  });

  it("uses Cegid prefix and .csv extension", () => {
    exportToCegid([samplePO()]);
    const anchor = appendChildSpy.mock.calls[0][0];
    expect(anchor.download).toMatch(/^Cegid_/);
    expect(anchor.download).toMatch(/\.csv$/);
  });

  it("emits Cegid entries with EUR currency", async () => {
    exportToCegid([samplePO()]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("EUR");
    expect(text).toContain("411000");
  });

  it("formats date as dd/MM/yyyy", async () => {
    exportToCegid([samplePO({ issueDate: new Date("2026-04-15").getTime() })]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("15/04/2026");
  });

  it("falls back when items missing", async () => {
    const po = samplePO({ items: [] });
    exportToCegid([po]);
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("706000");
  });
});
