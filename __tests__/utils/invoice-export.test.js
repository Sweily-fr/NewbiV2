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
