import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/hooks/useWorkspace", () => ({
  useRequiredWorkspace: () => ({ workspaceId: "ws-1" }),
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import {
  usePurchaseInvoices,
  usePurchaseInvoice,
  usePurchaseInvoiceStats,
} from "@/src/hooks/usePurchaseInvoices";
import {
  GET_PURCHASE_INVOICES,
  GET_PURCHASE_INVOICE,
  GET_PURCHASE_INVOICE_STATS,
} from "@/src/graphql/queries/purchaseInvoices";

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

describe("usePurchaseInvoices", () => {
  it("returns the paginated list", async () => {
    const mocks = [
      {
        request: {
          query: GET_PURCHASE_INVOICES,
          variables: { workspaceId: "ws-1", page: 1, limit: 50 },
        },
        result: {
          data: {
            purchaseInvoices: {
              items: [{ id: "p-1" }, { id: "p-2" }],
              totalCount: 2,
              currentPage: 1,
              totalPages: 1,
              hasNextPage: false,
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => usePurchaseInvoices(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.invoices).toHaveLength(2);
    expect(result.current.totalCount).toBe(2);
  });

  it("returns empty defaults when no data", () => {
    const { result } = renderHook(() => usePurchaseInvoices(), {
      wrapper: wrap([]),
    });
    expect(result.current.invoices).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.totalPages).toBe(1);
  });

  it("forwards filters to the query variables", async () => {
    const mocks = [
      {
        request: {
          query: GET_PURCHASE_INVOICES,
          variables: {
            workspaceId: "ws-1",
            page: 2,
            limit: 50,
            status: "PAID",
          },
        },
        result: {
          data: {
            purchaseInvoices: {
              items: [{ id: "p-9" }],
              totalCount: 1,
              currentPage: 2,
              totalPages: 1,
              hasNextPage: false,
            },
          },
        },
      },
    ];
    const { result } = renderHook(
      () => usePurchaseInvoices({ page: 2, status: "PAID" }),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.invoices[0].id).toBe("p-9");
  });
});

describe("usePurchaseInvoice", () => {
  it("returns one purchase invoice by id", async () => {
    const mocks = [
      {
        request: { query: GET_PURCHASE_INVOICE, variables: { id: "p-42" } },
        result: {
          data: { purchaseInvoice: { id: "p-42", supplierName: "Supplier" } },
        },
      },
    ];
    const { result } = renderHook(() => usePurchaseInvoice("p-42"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.invoice?.supplierName).toBe("Supplier");
  });

  it("returns null when id is missing", () => {
    const { result } = renderHook(() => usePurchaseInvoice(null), {
      wrapper: wrap([]),
    });
    expect(result.current.invoice).toBeNull();
  });
});

describe("usePurchaseInvoiceStats", () => {
  it("returns the stats from the query", async () => {
    const mocks = [
      {
        request: {
          query: GET_PURCHASE_INVOICE_STATS,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            purchaseInvoiceStats: {
              totalAmount: 1234.5,
              count: 12,
              paidCount: 10,
              pendingCount: 2,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => usePurchaseInvoiceStats(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats?.totalAmount).toBe(1234.5);
  });
});
