import { describe, it, expect } from "vitest";
import {
  hasReachedCreditNoteLimit,
  getRemainingCreditNoteAmount,
} from "@/src/utils/creditNoteUtils";

describe("hasReachedCreditNoteLimit", () => {
  it("returns false when invoice or creditNotes is missing", () => {
    expect(hasReachedCreditNoteLimit(null, [])).toBe(false);
    expect(hasReachedCreditNoteLimit({ finalTotalTTC: 100 }, null)).toBe(false);
  });

  it("returns false when invoice amount is 0 or negative", () => {
    expect(
      hasReachedCreditNoteLimit({ finalTotalTTC: 0 }, [{ finalTotalTTC: -50 }]),
    ).toBe(false);
    expect(hasReachedCreditNoteLimit({ finalTotalTTC: -100 }, [])).toBe(false);
  });

  it("returns false when no credit notes exist", () => {
    expect(hasReachedCreditNoteLimit({ finalTotalTTC: 100 }, [])).toBe(false);
  });

  it("returns false when credit notes total is below invoice amount", () => {
    expect(
      hasReachedCreditNoteLimit({ finalTotalTTC: 100 }, [
        { finalTotalTTC: -30 },
        { finalTotalTTC: -20 },
      ]),
    ).toBe(false);
  });

  it("returns true when credit notes total exactly equals invoice amount", () => {
    expect(
      hasReachedCreditNoteLimit({ finalTotalTTC: 100 }, [
        { finalTotalTTC: -100 },
      ]),
    ).toBe(true);
  });

  it("returns true when credit notes total exceeds invoice amount", () => {
    expect(
      hasReachedCreditNoteLimit({ finalTotalTTC: 100 }, [
        { finalTotalTTC: -60 },
        { finalTotalTTC: -50 },
      ]),
    ).toBe(true);
  });

  it("uses absolute value of credit note amounts (negative or positive)", () => {
    expect(
      hasReachedCreditNoteLimit({ finalTotalTTC: 100 }, [
        { finalTotalTTC: 50 }, // positive
        { finalTotalTTC: -50 }, // negative
      ]),
    ).toBe(true);
  });

  it("treats undefined finalTotalTTC as 0", () => {
    expect(hasReachedCreditNoteLimit({ finalTotalTTC: 100 }, [{}])).toBe(false);
  });
});

describe("getRemainingCreditNoteAmount", () => {
  it("returns 0 when invoice or creditNotes is missing", () => {
    expect(getRemainingCreditNoteAmount(null, [])).toBe(0);
    expect(getRemainingCreditNoteAmount({ finalTotalTTC: 100 }, null)).toBe(0);
  });

  it("returns the full amount when no credit notes exist", () => {
    expect(getRemainingCreditNoteAmount({ finalTotalTTC: 100 }, [])).toBe(100);
  });

  it("subtracts credit notes from the invoice amount", () => {
    expect(
      getRemainingCreditNoteAmount({ finalTotalTTC: 100 }, [
        { finalTotalTTC: -30 },
      ]),
    ).toBe(70);
  });

  it("clamps to 0 when credit notes exceed invoice amount", () => {
    expect(
      getRemainingCreditNoteAmount({ finalTotalTTC: 100 }, [
        { finalTotalTTC: -60 },
        { finalTotalTTC: -60 },
      ]),
    ).toBe(0);
  });

  it("uses absolute values for credit notes", () => {
    expect(
      getRemainingCreditNoteAmount({ finalTotalTTC: 100 }, [
        { finalTotalTTC: 40 },
      ]),
    ).toBe(60);
  });
});
