import { describe, it, expect, vi, beforeEach } from "vitest";
import { filterInvoicesByDateRange } from "@/src/utils/invoice-export";

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

const inv = (overrides) => ({
  number: "001",
  issueDate: new Date("2026-04-15").getTime(),
  ...overrides,
});

describe("filterInvoicesByDateRange — edge cases", () => {
  it("returns all invoices when no dateRange given", () => {
    const list = [inv(), inv({ number: "002" })];
    expect(filterInvoicesByDateRange(list, null)).toBe(list);
    expect(filterInvoicesByDateRange(list)).toBe(list);
  });

  it("returns all invoices when dateRange has no from/to", () => {
    const list = [inv(), inv({ number: "002" })];
    expect(filterInvoicesByDateRange(list, {})).toBe(list);
  });

  it("excludes invoices without issueDate", () => {
    const list = [inv(), { number: "no-date" }];
    const out = filterInvoicesByDateRange(list, {
      from: new Date("2026-01-01"),
    });
    expect(out).toHaveLength(1);
    expect(out[0].number).toBe("001");
  });
});

describe("filterInvoicesByDateRange — date formats", () => {
  it("handles numeric timestamp", () => {
    const list = [inv({ issueDate: new Date("2026-04-15").getTime() })];
    const out = filterInvoicesByDateRange(list, {
      from: new Date("2026-04-01"),
      to: new Date("2026-04-30"),
    });
    expect(out).toHaveLength(1);
  });

  it("handles ISO string", () => {
    const list = [{ number: "x", issueDate: "2026-04-15T00:00:00Z" }];
    const out = filterInvoicesByDateRange(list, {
      from: new Date("2026-04-01"),
      to: new Date("2026-04-30"),
    });
    expect(out).toHaveLength(1);
  });

  it("handles Date object", () => {
    const list = [{ number: "x", issueDate: new Date("2026-04-15") }];
    const out = filterInvoicesByDateRange(list, {
      from: new Date("2026-04-01"),
      to: new Date("2026-04-30"),
    });
    expect(out).toHaveLength(1);
  });

  it("falls back to invoiceDate when issueDate is missing", () => {
    const list = [{ number: "imp", invoiceDate: new Date("2026-04-15") }];
    const out = filterInvoicesByDateRange(list, {
      from: new Date("2026-04-01"),
      to: new Date("2026-04-30"),
    });
    expect(out).toHaveLength(1);
  });
});

describe("filterInvoicesByDateRange — range bounds", () => {
  const list = [
    inv({ number: "early", issueDate: new Date("2026-01-15").getTime() }),
    inv({ number: "mid", issueDate: new Date("2026-04-15").getTime() }),
    inv({ number: "late", issueDate: new Date("2026-12-15").getTime() }),
  ];

  it("from-only filter keeps everything from `from` forward", () => {
    const out = filterInvoicesByDateRange(list, {
      from: new Date("2026-04-01"),
    });
    expect(out.map((i) => i.number)).toEqual(["mid", "late"]);
  });

  it("to-only filter keeps everything up to `to`", () => {
    const out = filterInvoicesByDateRange(list, {
      to: new Date("2026-04-30"),
    });
    expect(out.map((i) => i.number)).toEqual(["early", "mid"]);
  });

  it("from+to filters to the inclusive range", () => {
    const out = filterInvoicesByDateRange(list, {
      from: new Date("2026-02-01"),
      to: new Date("2026-04-30"),
    });
    expect(out.map((i) => i.number)).toEqual(["mid"]);
  });

  it("returns [] when no invoice matches", () => {
    const out = filterInvoicesByDateRange(list, {
      from: new Date("2030-01-01"),
      to: new Date("2030-12-31"),
    });
    expect(out).toEqual([]);
  });
});

describe("FEC (art. A47 A-1 du LPF)", () => {
  const facture = (overrides = {}) => ({
    prefix: "F-092026",
    number: "0024",
    status: "PENDING",
    issueDate: new Date("2026-10-20T10:00:00Z").getTime(),
    createdAt: new Date("2026-10-20T10:00:00Z").getTime(),
    finalTotalHT: 700,
    finalTotalVAT: 140,
    finalTotalTTC: 840,
    client: { name: "Boulangerie Lumière SARL", siret: "55566677700011" },
    items: [
      { description: "Conseil", quantity: 1, unitPrice: 700, vatRate: 20 },
    ],
    ...overrides,
  });

  it("première ligne : le nom des 18 champs", async () => {
    const { buildFECContent, FEC_FIELDS } =
      await import("@/src/utils/invoice-export");
    const [premiere] = buildFECContent([facture()]).split("\n");
    expect(FEC_FIELDS).toHaveLength(18);
    expect(premiere).toBe(
      "JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise",
    );
  });

  it("les brouillons ne sont pas des écritures comptables", async () => {
    const { buildFECContent } = await import("@/src/utils/invoice-export");
    const texte = buildFECContent([
      facture(),
      facture({ number: "DRAFT-0101", status: "DRAFT" }),
    ]);
    expect(texte).toContain("F-092026-0024");
    expect(texte).not.toContain("DRAFT-0101");
  });

  it("sans facture émise : refus explicite", async () => {
    const { buildFECContent } = await import("@/src/utils/invoice-export");
    expect(() =>
      buildFECContent([facture({ number: "DRAFT-1", status: "DRAFT" })]),
    ).toThrow(/Aucune facture à exporter/);
  });

  it("montants à la virgule décimale", async () => {
    const { buildFECContent } = await import("@/src/utils/invoice-export");
    const lignes = buildFECContent([facture()])
      .split("\n")
      .filter((l) => l.startsWith("VTE"));
    const montants = lignes.flatMap((l) => l.split("|").slice(11, 13));
    expect(montants).toEqual([
      "840,00",
      "0,00",
      "0,00",
      "700,00",
      "0,00",
      "140,00",
    ]);
  });

  it("nom du fichier : SirenFECAAAAMMJJ.txt", async () => {
    const { fecFilename } = await import("@/src/utils/invoice-export");
    const jour = new Date(2026, 9, 21);
    expect(fecFilename("98765432100012", null, jour)).toBe(
      "987654321FEC20261021.txt",
    );
    expect(
      fecFilename(
        "987654321",
        { from: new Date(2026, 0, 1), to: new Date(2026, 11, 31) },
        jour,
      ),
    ).toBe("987654321FEC20261231.txt");
  });
});
