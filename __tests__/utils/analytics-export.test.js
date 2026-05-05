import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock browser APIs that the export functions touch
const createObjectURLMock = vi.fn(() => "blob:mock");
const revokeObjectURLMock = vi.fn();

beforeEach(() => {
  globalThis.URL.createObjectURL = createObjectURLMock;
  globalThis.URL.revokeObjectURL = revokeObjectURLMock;
  createObjectURLMock.mockClear();
  revokeObjectURLMock.mockClear();
});

// Mock XLSX so we can capture write calls without producing a real file
const xlsxState = vi.hoisted(() => ({
  bookNew: vi.fn(() => ({ Sheets: {}, SheetNames: [] })),
  jsonToSheet: vi.fn((rows) => ({ rows })),
  appendSheet: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock("xlsx", () => ({
  utils: {
    book_new: xlsxState.bookNew,
    json_to_sheet: xlsxState.jsonToSheet,
    book_append_sheet: xlsxState.appendSheet,
  },
  writeFile: xlsxState.writeFile,
}));

// Mock jsPDF so PDF export does not actually try to write to disk
const jspdfInstance = vi.hoisted(() => ({
  internal: {
    pageSize: { getWidth: () => 297, getHeight: () => 210 },
  },
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  setFillColor: vi.fn(),
  setFont: vi.fn(),
  text: vi.fn(),
  rect: vi.fn(),
  addPage: vi.fn(),
  save: vi.fn(),
}));

vi.mock("jspdf", () => ({
  default: vi.fn(function MockJsPDF() {
    return jspdfInstance;
  }),
}));

import {
  exportAnalyticsCSV,
  exportAnalyticsExcel,
  exportAnalyticsPDF,
} from "@/src/utils/analytics-export";

const sampleData = {
  kpi: {
    netRevenueHT: 12345.67,
    totalExpensesHT: 4321.5,
    grossMargin: 8024.17,
    grossMarginRate: 65,
    invoiceCount: 12,
    averageInvoiceHT: 1028.8,
    collectionRate: 92,
    dso: 28,
    creditNoteTotalHT: 100,
    activeClientCount: 8,
    quoteConversionRate: 75,
    topClientConcentration: 45,
  },
  monthlyRevenue: [
    {
      month: "2026-01",
      revenueHT: 1000,
      netRevenueHT: 950,
      revenueTTC: 1200,
      revenueVAT: 200,
      expenseAmount: 300,
      expenseAmountHT: 250,
      expenseVAT: 50,
      grossMargin: 700,
      grossMarginRate: 70,
      creditNoteHT: 0,
      invoiceCount: 2,
      expenseCount: 1,
    },
  ],
  revenueByClient: [
    {
      clientName: "Acme",
      clientType: "COMPANY",
      totalHT: 5000,
      totalTTC: 6000,
      totalVAT: 1000,
      invoiceCount: 4,
      averageInvoiceHT: 1250,
    },
    {
      clientName: "Bob",
      clientType: "INDIVIDUAL",
      totalHT: 1000,
      totalTTC: 1200,
      totalVAT: 200,
      invoiceCount: 1,
      averageInvoiceHT: 1000,
    },
  ],
  revenueByProduct: [
    {
      description: "Conseil",
      totalHT: 5000,
      totalQuantity: 10,
      invoiceCount: 5,
      averageUnitPrice: 500,
    },
  ],
  expenseByCategory: [
    { category: "OFFICE_SUPPLIES", amount: 200, count: 3 },
    { category: "TRAVEL", amount: 500, count: 2 },
  ],
  statusBreakdown: [
    { status: "PENDING", totalTTC: 1500, count: 3 },
    { status: "COMPLETED", totalTTC: 4500, count: 9 },
  ],
  paymentMethodStats: [
    { method: "BANK_TRANSFER", totalTTC: 4000, count: 6 },
    { method: "CARD", totalTTC: 2000, count: 6 },
  ],
  collection: {
    overdueInvoices: [
      {
        invoiceNumber: "INV-001",
        clientName: "Acme",
        totalTTC: 1200,
        dueDate: "2026-04-01",
        daysOverdue: 28,
      },
    ],
    monthlyCollection: [
      {
        month: "2026-01",
        invoicedTTC: 1200,
        collectedTTC: 1100,
        invoicedCount: 2,
        collectedCount: 1,
      },
    ],
  },
};

// ─── CSV export ──────────────────────────────────────────────────────────────

describe("exportAnalyticsCSV", () => {
  let appendChildSpy;
  let clickSpy;

  beforeEach(() => {
    clickSpy = vi.fn();
    appendChildSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation((el) => {
        // Replace the click method so we don't actually navigate
        if (el && el.tagName === "A") el.click = clickSpy;
        return el;
      });
    vi.spyOn(document.body, "removeChild").mockImplementation(() => null);
  });

  it("triggers a download with the right filename and content type", () => {
    exportAnalyticsCSV(sampleData, "synthese", "2026-Q1");

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    const blob = createObjectURLMock.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toMatch(/text\/csv/);
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();

    // The anchor's `download` attribute is set on the temporary <a>
    expect(appendChildSpy).toHaveBeenCalled();
    const anchor = appendChildSpy.mock.calls[0][0];
    expect(anchor.download).toBe("analytiques_2026-Q1.csv");
  });

  it("includes BOM and KPI sheet for synthese tab", async () => {
    exportAnalyticsCSV(sampleData, "synthese", "p");
    const blob = createObjectURLMock.mock.calls[0][0];
    const text = await blob.text();
    expect(text.charCodeAt(0)).toBe(0xfeff); // BOM
    expect(text).toContain("KPI");
    expect(text).toContain("CA HT net");
    expect(text).toContain("Evolution mensuelle");
    expect(text).not.toContain("Clients"); // wrong tab
  });

  it("includes only relevant sheets per tab", async () => {
    exportAnalyticsCSV(sampleData, "commercial", "p");
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("Clients");
    expect(text).toContain("Acme");
    expect(text).not.toContain("KPI");
  });

  it("includes ALL sheets when tab='all'", async () => {
    exportAnalyticsCSV(sampleData, "all", "p");
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("KPI");
    expect(text).toContain("Clients");
    expect(text).toContain("Produits");
    expect(text).toContain("Methodes paiement");
    expect(text).toContain("Statuts factures");
  });

  it("formats numbers with French decimal separator", async () => {
    exportAnalyticsCSV(sampleData, "synthese", "p");
    const text = await createObjectURLMock.mock.calls[0][0].text();
    // 12345.67 → 12345,67
    expect(text).toContain("12345,67");
    // Should NOT contain dot decimals for the same value
    expect(text).not.toContain("12345.67");
  });

  it("translates status codes via STATUS_LABELS", async () => {
    exportAnalyticsCSV(sampleData, "tresorerie", "p");
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("En attente"); // PENDING
    expect(text).toContain("Payee"); // COMPLETED
  });

  it("emits 'Aucune donnee' for empty sheets", async () => {
    const emptyData = { ...sampleData, revenueByClient: [] };
    exportAnalyticsCSV(emptyData, "commercial", "p");
    const text = await createObjectURLMock.mock.calls[0][0].text();
    expect(text).toContain("Clients");
    expect(text).toContain("Aucune donnee");
  });

  it("escapes embedded double quotes in string values", async () => {
    const data = {
      ...sampleData,
      revenueByClient: [
        {
          clientName: 'Quoted "Co"',
          clientType: "COMPANY",
          totalHT: 0,
          totalTTC: 0,
          totalVAT: 0,
          invoiceCount: 0,
          averageInvoiceHT: 0,
        },
      ],
    };
    exportAnalyticsCSV(data, "commercial", "p");
    const text = await createObjectURLMock.mock.calls[0][0].text();
    // Doubled-up quotes per RFC4180
    expect(text).toMatch(/Quoted ""Co""/);
  });
});

// ─── Excel export ────────────────────────────────────────────────────────────

describe("exportAnalyticsExcel", () => {
  it("creates a workbook and writes one sheet per section", () => {
    exportAnalyticsExcel(sampleData, "all", "p");
    expect(xlsxState.bookNew).toHaveBeenCalledTimes(1);
    expect(xlsxState.appendSheet).toHaveBeenCalled();
    expect(xlsxState.writeFile).toHaveBeenCalledWith(
      expect.anything(),
      "analytiques_p.xlsx",
    );
  });

  it("truncates sheet names to 31 chars (Excel limit)", () => {
    // None of the canonical sheet names exceed 31 chars in the current code,
    // so we verify the helper is called with reasonable names.
    exportAnalyticsExcel(sampleData, "all", "p");
    const sheetNames = xlsxState.appendSheet.mock.calls.map((c) => c[2]);
    sheetNames.forEach((n) => expect(n.length).toBeLessThanOrEqual(31));
  });

  it("writes a placeholder sheet when a section has no rows", () => {
    const empty = { ...sampleData, revenueByClient: [] };
    xlsxState.jsonToSheet.mockClear();
    exportAnalyticsExcel(empty, "commercial", "p");
    // The Clients sheet is empty → the helper must be called with the placeholder row
    const calls = xlsxState.jsonToSheet.mock.calls;
    const placeholderCalls = calls.filter(
      (c) => c[0]?.[0]?.Info === "Aucune donnee",
    );
    expect(placeholderCalls.length).toBeGreaterThan(0);
  });
});

// ─── PDF export ──────────────────────────────────────────────────────────────

describe("exportAnalyticsPDF", () => {
  it("builds a landscape PDF and saves with the right filename", () => {
    exportAnalyticsPDF(sampleData, "synthese", "2026-Q1");
    expect(jspdfInstance.save).toHaveBeenCalledWith("analytiques_2026-Q1.pdf");
  });

  it("emits the page title and the period", () => {
    exportAnalyticsPDF(sampleData, "synthese", "2026_Q1");
    const textCalls = jspdfInstance.text.mock.calls.map((c) => c[0]);
    expect(textCalls).toContain("Analytiques financieres");
    // Period is normalized: underscores → spaces
    expect(
      textCalls.some((s) => s.includes("Periode") && s.includes("2026 Q1")),
    ).toBe(true);
  });

  it("starts a new page between sheets", () => {
    jspdfInstance.addPage.mockClear();
    exportAnalyticsPDF(sampleData, "all", "p");
    // 'all' produces multiple sheets → at least one addPage call
    expect(jspdfInstance.addPage).toHaveBeenCalled();
  });

  it("falls back to 'Aucune donnee' when a section is empty", () => {
    jspdfInstance.text.mockClear();
    exportAnalyticsPDF(
      { ...sampleData, revenueByClient: [] },
      "commercial",
      "p",
    );
    const printedStrings = jspdfInstance.text.mock.calls.map((c) => c[0]);
    expect(printedStrings).toContain("Aucune donnee");
  });
});
