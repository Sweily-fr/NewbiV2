import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { state } = vi.hoisted(() => ({
  state: {
    suggestions: [],
    linkTransaction: vi.fn(),
  },
}));

vi.mock("@/src/hooks/useReconciliationGraphQL", () => ({
  useReconciliationGraphQL: () => state,
  useReconciliationSuggestions: () => state,
  useTransactionsForInvoice: vi.fn(),
  useLinkTransactionToInvoice: vi.fn(),
  useUnlinkTransactionFromInvoice: vi.fn(),
  useIgnoreTransaction: vi.fn(),
  useReconciliationCount: vi.fn(),
  useReconciliationForSidebar: vi.fn(),
}));

import { useReconciliationToast } from "@/src/hooks/useReconciliation";

beforeEach(() => {
  state.suggestions = [];
  state.linkTransaction = vi.fn();
});

describe("useReconciliationToast", () => {
  it("returns empty new suggestions when none", () => {
    const { result } = renderHook(() => useReconciliationToast());
    expect(result.current.getNewSuggestions()).toEqual([]);
  });

  it("returns only high-confidence not-yet-shown suggestions", () => {
    state.suggestions = [
      {
        transaction: { id: "tx-1" },
        confidence: "high",
      },
      {
        transaction: { id: "tx-2" },
        confidence: "low",
      },
      {
        transaction: { id: "tx-3" },
        confidence: "high",
      },
    ];
    const { result } = renderHook(() => useReconciliationToast());
    const newSuggestions = result.current.getNewSuggestions();
    expect(newSuggestions).toHaveLength(2);
    expect(newSuggestions.map((s) => s.transaction.id)).toEqual([
      "tx-1",
      "tx-3",
    ]);
  });

  it("filters out suggestions already shown", () => {
    state.suggestions = [
      {
        transaction: { id: "tx-1" },
        confidence: "high",
      },
      {
        transaction: { id: "tx-2" },
        confidence: "high",
      },
    ];
    const { result } = renderHook(() => useReconciliationToast());
    expect(result.current.getNewSuggestions()).toHaveLength(2);

    act(() => result.current.markAsShown("tx-1"));
    expect(result.current.getNewSuggestions()).toHaveLength(1);
    expect(result.current.getNewSuggestions()[0].transaction.id).toBe("tx-2");
  });

  it("exposes linkTransaction from underlying hook", () => {
    const { result } = renderHook(() => useReconciliationToast());
    expect(result.current.linkTransaction).toBe(state.linkTransaction);
  });
});
