import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/src/hooks/useWorkspace", () => ({
  useRequiredWorkspace: () => ({ workspaceId: "ws-1", loading: false }),
  useWorkspace: () => ({ workspaceId: "ws-1", loading: false }),
}));

// useReconciliationGraphQL is re-exported. Mock the underlying suggestions hook
// so useReconciliationToast gets deterministic data without a real Apollo query.
vi.mock("@/src/hooks/useReconciliationGraphQL", async () => {
  const actual = await vi.importActual("@/src/hooks/useReconciliationGraphQL");
  return {
    ...actual,
    useReconciliationGraphQL: () => ({
      suggestions: [
        {
          transaction: { id: "t-1" },
          matchingInvoices: [{ id: "i-1" }],
          confidence: "high",
        },
        {
          transaction: { id: "t-2" },
          matchingInvoices: [{ id: "i-2" }],
          confidence: "medium",
        },
      ],
      linkTransaction: vi.fn().mockResolvedValue({ success: true }),
    }),
  };
});

import { useReconciliationToast } from "@/src/hooks/useReconciliation";

const wrap = (mocks = []) =>
  function Wrapper({ children }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );
  };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useReconciliationToast", () => {
  it("getNewSuggestions returns only high-confidence not-yet-shown suggestions", () => {
    const { result } = renderHook(() => useReconciliationToast(), {
      wrapper: wrap(),
    });

    const out = result.current.getNewSuggestions();
    // Only the 'high' confidence suggestion is returned
    expect(out).toHaveLength(1);
    expect(out[0].confidence).toBe("high");
    expect(out[0].transaction.id).toBe("t-1");
  });

  it("markAsShown filters out already-shown suggestions", () => {
    const { result, rerender } = renderHook(() => useReconciliationToast(), {
      wrapper: wrap(),
    });

    expect(result.current.getNewSuggestions()).toHaveLength(1);

    act(() => {
      result.current.markAsShown("t-1");
    });

    rerender();
    expect(result.current.getNewSuggestions()).toHaveLength(0);
  });

  it("exposes linkTransaction callback", () => {
    const { result } = renderHook(() => useReconciliationToast(), {
      wrapper: wrap(),
    });
    expect(typeof result.current.linkTransaction).toBe("function");
  });
});
