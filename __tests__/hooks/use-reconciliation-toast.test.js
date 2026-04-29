import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { reconciliationMock } = vi.hoisted(() => ({
  reconciliationMock: {
    suggestions: [],
    linkTransaction: vi.fn(),
  },
}));

vi.mock("@/src/hooks/useReconciliationGraphQL", () => ({
  useReconciliationGraphQL: () => reconciliationMock,
}));

import { useReconciliationToast } from "@/src/hooks/useReconciliation";

beforeEach(() => {
  vi.clearAllMocks();
  reconciliationMock.suggestions = [];
});

const buildSuggestion = (id, confidence = "high") => ({
  transaction: { id },
  confidence,
});

describe("useReconciliationToast.getNewSuggestions", () => {
  it("returns only high-confidence suggestions", () => {
    reconciliationMock.suggestions = [
      buildSuggestion("t-1", "high"),
      buildSuggestion("t-2", "low"),
      buildSuggestion("t-3", "medium"),
    ];
    const { result } = renderHook(() => useReconciliationToast());
    const news = result.current.getNewSuggestions();
    expect(news).toHaveLength(1);
    expect(news[0].transaction.id).toBe("t-1");
  });

  it("filters out already-shown suggestions", () => {
    reconciliationMock.suggestions = [
      buildSuggestion("t-1"),
      buildSuggestion("t-2"),
    ];
    const { result } = renderHook(() => useReconciliationToast());

    act(() => result.current.markAsShown("t-1"));

    const news = result.current.getNewSuggestions();
    expect(news.map((s) => s.transaction.id)).toEqual(["t-2"]);
  });

  it("returns an empty array when there are no suggestions", () => {
    const { result } = renderHook(() => useReconciliationToast());
    expect(result.current.getNewSuggestions()).toEqual([]);
  });
});

describe("useReconciliationToast.markAsShown", () => {
  it("accumulates ids across multiple calls", () => {
    reconciliationMock.suggestions = [
      buildSuggestion("t-1"),
      buildSuggestion("t-2"),
      buildSuggestion("t-3"),
    ];
    const { result } = renderHook(() => useReconciliationToast());

    act(() => result.current.markAsShown("t-1"));
    act(() => result.current.markAsShown("t-2"));

    const news = result.current.getNewSuggestions();
    expect(news.map((s) => s.transaction.id)).toEqual(["t-3"]);
  });

  it("ignores duplicate marks (Set semantics)", () => {
    reconciliationMock.suggestions = [buildSuggestion("t-1")];
    const { result } = renderHook(() => useReconciliationToast());

    act(() => result.current.markAsShown("t-1"));
    act(() => result.current.markAsShown("t-1"));

    expect(result.current.getNewSuggestions()).toEqual([]);
  });
});

describe("useReconciliationToast.linkTransaction", () => {
  it("forwards the linkTransaction reference from the underlying hook", () => {
    const { result } = renderHook(() => useReconciliationToast());
    expect(result.current.linkTransaction).toBe(
      reconciliationMock.linkTransaction,
    );
  });
});
