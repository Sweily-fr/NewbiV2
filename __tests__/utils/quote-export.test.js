import { describe, it, expect, vi, beforeEach } from "vitest";
import { filterQuotesByDateRange } from "@/src/utils/quote-export";

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

const q = (overrides) => ({
  number: "001",
  issueDate: new Date("2026-04-15").getTime(),
  ...overrides,
});

describe("filterQuotesByDateRange", () => {
  it("returns all when no dateRange", () => {
    const list = [q(), q({ number: "002" })];
    expect(filterQuotesByDateRange(list, null)).toBe(list);
  });

  it("returns all when dateRange has no from/to", () => {
    const list = [q()];
    expect(filterQuotesByDateRange(list, {})).toBe(list);
  });

  it("excludes quotes without issueDate", () => {
    const list = [q(), { number: "no-date" }];
    const out = filterQuotesByDateRange(list, {
      from: new Date("2026-01-01"),
    });
    expect(out).toHaveLength(1);
  });

  it("filters with from-only", () => {
    const list = [
      q({ number: "early", issueDate: new Date("2026-01-01").getTime() }),
      q({ number: "mid", issueDate: new Date("2026-06-01").getTime() }),
    ];
    const out = filterQuotesByDateRange(list, {
      from: new Date("2026-04-01"),
    });
    expect(out.map((x) => x.number)).toEqual(["mid"]);
  });

  it("filters with to-only", () => {
    const list = [
      q({ number: "early", issueDate: new Date("2026-01-01").getTime() }),
      q({ number: "late", issueDate: new Date("2026-12-01").getTime() }),
    ];
    const out = filterQuotesByDateRange(list, {
      to: new Date("2026-06-30"),
    });
    expect(out.map((x) => x.number)).toEqual(["early"]);
  });

  it("filters with both from+to", () => {
    const list = [
      q({ number: "before", issueDate: new Date("2025-12-01").getTime() }),
      q({ number: "in-range", issueDate: new Date("2026-04-15").getTime() }),
      q({ number: "after", issueDate: new Date("2026-12-01").getTime() }),
    ];
    const out = filterQuotesByDateRange(list, {
      from: new Date("2026-01-01"),
      to: new Date("2026-06-30"),
    });
    expect(out.map((x) => x.number)).toEqual(["in-range"]);
  });
});
