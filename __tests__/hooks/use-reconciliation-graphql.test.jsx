import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

const { toastMock } = vi.hoisted(() => ({
  toastMock: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/src/components/ui/sonner", () => ({ toast: toastMock }));

vi.mock("@/src/hooks/useWorkspace", () => ({
  useRequiredWorkspace: () => ({ workspaceId: "ws-1", loading: false }),
}));

import {
  useReconciliationSuggestions,
  useTransactionsForInvoice,
} from "@/src/hooks/useReconciliationGraphQL";
import {
  GET_RECONCILIATION_SUGGESTIONS,
  GET_TRANSACTIONS_FOR_INVOICE,
} from "@/src/graphql/queries/reconciliation";

const wrap = (mocks) =>
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

describe("useReconciliationSuggestions", () => {
  it("returns suggestions with counts", async () => {
    const mocks = [
      {
        request: {
          query: GET_RECONCILIATION_SUGGESTIONS,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            reconciliationSuggestions: {
              suggestions: [
                { transaction: { id: "tx-1" }, confidence: "high" },
              ],
              unmatchedCount: 5,
              pendingInvoicesCount: 3,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useReconciliationSuggestions(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.suggestions).toHaveLength(1);
    expect(result.current.unmatchedCount).toBe(5);
    expect(result.current.pendingInvoicesCount).toBe(3);
  });

  it("returns empty defaults when no data", () => {
    const { result } = renderHook(() => useReconciliationSuggestions(), {
      wrapper: wrap([]),
    });
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.unmatchedCount).toBe(0);
  });
});

describe("useTransactionsForInvoice", () => {
  it("returns transactions and invoiceAmount", async () => {
    const mocks = [
      {
        request: {
          query: GET_TRANSACTIONS_FOR_INVOICE,
          variables: { invoiceId: "inv-1" },
        },
        result: {
          data: {
            transactionsForInvoice: {
              transactions: [{ id: "tx-1", amount: 120 }],
              invoiceAmount: 120,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useTransactionsForInvoice("inv-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.invoiceAmount).toBe(120);
  });

  it("skips when no invoiceId", () => {
    const { result } = renderHook(() => useTransactionsForInvoice(null), {
      wrapper: wrap([]),
    });
    expect(result.current.transactions).toEqual([]);
    expect(result.current.invoiceAmount).toBe(0);
  });
});
