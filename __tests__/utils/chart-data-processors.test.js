import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  processInvoicesForCharts,
  processExpensesForCharts,
  getIncomeChartConfig,
  getExpenseChartConfig,
} from "@/src/utils/chartDataProcessors";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-15T12:00:00Z"));
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
});

const localDateKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

describe("processInvoicesForCharts", () => {
  it("returns 90 buckets — one per day for the last 90 days", () => {
    const out = processInvoicesForCharts([]);
    expect(out).toHaveLength(90);
  });

  it("places income in the bucket matching the invoice issue date", () => {
    // The processor parses string issueDate via parseInt — treat dates as
    // numeric timestamps (the way the GraphQL layer actually serializes them).
    const today = new Date();
    const todayKey = localDateKey(today);
    const out = processInvoicesForCharts([
      { id: "i-1", issueDate: String(today.getTime()), finalTotalTTC: 100 },
      { id: "i-2", issueDate: String(today.getTime()), finalTotalTTC: 50 },
    ]);
    const todayBucket = out.find((b) => b.date === todayKey);
    expect(todayBucket.desktop).toBe(150);
    expect(todayBucket.mobile).toBe(2);
  });

  it("ignores invoices without issueDate", () => {
    const out = processInvoicesForCharts([{ id: "i-1", finalTotalTTC: 999 }]);
    const totals = out.reduce((s, b) => s + b.desktop, 0);
    expect(totals).toBe(0);
  });

  it("handles invoices whose issueDate is a numeric timestamp", () => {
    const today = new Date();
    const todayKey = localDateKey(today);
    const out = processInvoicesForCharts([
      { id: "i-1", issueDate: today.getTime(), finalTotalTTC: 42 },
    ]);
    const todayBucket = out.find((b) => b.date === todayKey);
    expect(todayBucket.desktop).toBe(42);
  });

  it("ignores invoices outside the 90-day window", () => {
    const old = new Date();
    old.setFullYear(old.getFullYear() - 1);
    const out = processInvoicesForCharts([
      { id: "i-1", issueDate: String(old.getTime()), finalTotalTTC: 999 },
    ]);
    const totals = out.reduce((s, b) => s + b.desktop, 0);
    expect(totals).toBe(0);
  });
});

describe("processExpensesForCharts", () => {
  it("returns 90 buckets", () => {
    expect(processExpensesForCharts([])).toHaveLength(90);
  });

  it("buckets expenses by their date", () => {
    const today = new Date();
    const todayKey = localDateKey(today);
    const out = processExpensesForCharts([
      { id: "e-1", date: String(today.getTime()), amount: 30 },
      { id: "e-2", date: String(today.getTime()), amount: 70 },
    ]);
    const todayBucket = out.find((b) => b.date === todayKey);
    expect(todayBucket.desktop).toBe(100);
    expect(todayBucket.mobile).toBe(2);
  });

  it("ignores expenses without a date", () => {
    const out = processExpensesForCharts([{ amount: 100 }]);
    const totals = out.reduce((s, b) => s + b.desktop, 0);
    expect(totals).toBe(0);
  });
});

describe("getIncomeChartConfig / getExpenseChartConfig", () => {
  it("provide standard chart config keys", () => {
    const cfg = getIncomeChartConfig();
    expect(cfg).toHaveProperty("desktop");
    expect(cfg).toHaveProperty("mobile");
    expect(cfg.desktop).toHaveProperty("color");
    expect(cfg.mobile).toHaveProperty("color");
  });

  it("apply the remap function to colors when provided", () => {
    const remap = () => "REMAPPED";
    const cfg = getIncomeChartConfig(remap);
    expect(cfg.desktop.color).toBe("REMAPPED");
    expect(cfg.mobile.color).toBe("REMAPPED");

    const expCfg = getExpenseChartConfig(remap);
    expect(expCfg.desktop.color).toBe("REMAPPED");
  });
});
