import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/hooks/useWorkspace", () => ({
  useRequiredWorkspace: () => ({ workspaceId: "ws-1" }),
  useWorkspace: () => ({ workspaceId: "ws-1" }),
}));

const useInvoicesMock = vi.fn();
vi.mock("@/src/graphql/invoiceQueries", async () => {
  const actual = await vi.importActual("@/src/graphql/invoiceQueries");
  return {
    ...actual,
    useInvoices: () => useInvoicesMock(),
  };
});

import { useDashboardData } from "@/src/hooks/useDashboardData";
import {
  GET_BANKING_ACCOUNTS,
  GET_TRANSACTIONS,
} from "@/src/graphql/queries/banking";
import { GET_DASHBOARD_SUMMARY } from "@/src/graphql/queries/dashboardAggregation";

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
  useInvoicesMock.mockReturnValue({
    invoices: [],
    loading: false,
    refetch: vi.fn(),
  });
  if (typeof localStorage !== "undefined") {
    localStorage.clear();
  }
});

describe("useDashboardData (default mode)", () => {
  it("returns aggregated bank/invoice data", async () => {
    useInvoicesMock.mockReturnValue({
      invoices: [
        { id: "i-1", status: "COMPLETED", finalTotalTTC: 100 },
        { id: "i-2", status: "PENDING", finalTotalTTC: 50 },
      ],
      loading: false,
      refetch: vi.fn(),
    });

    const mocks = [
      {
        request: {
          query: GET_BANKING_ACCOUNTS,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            bankingAccounts: [
              { id: "a-1", balance: { current: 1000 } },
              { id: "a-2", balance: { current: 500 } },
            ],
          },
        },
      },
      {
        request: {
          query: GET_TRANSACTIONS,
          variables: { workspaceId: "ws-1", limit: 0 },
        },
        result: {
          data: {
            transactions: [
              { id: "t-1", amount: 200 },
              { id: "t-2", amount: -50 },
            ],
          },
        },
      },
    ];

    const { result } = renderHook(() => useDashboardData(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.bankBalance).toBe(1500);
    expect(result.current.bankIncome).toHaveLength(1);
    expect(result.current.bankExpenses).toHaveLength(1);
    expect(result.current.totalIncome).toBe(200);
    expect(result.current.totalExpenses).toBe(50);
    expect(result.current.paidInvoices).toHaveLength(1);
    expect(result.current.hasBankData).toBe(true);
  });
});

describe("useDashboardData (skipTransactions=true)", () => {
  it("uses summary backend stats", async () => {
    const mocks = [
      {
        request: {
          query: GET_BANKING_ACCOUNTS,
          variables: { workspaceId: "ws-1" },
        },
        result: { data: { bankingAccounts: [] } },
      },
      {
        request: {
          query: GET_DASHBOARD_SUMMARY,
          variables: { workspaceId: "ws-1", accountId: null },
        },
        result: {
          data: {
            dashboardSummary: {
              bankBalance: 9999,
              totalIncome: 1234,
              totalExpenses: 567,
              transactionCount: 5,
            },
          },
        },
      },
    ];

    const { result } = renderHook(
      () => useDashboardData({ skipTransactions: true }),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.bankBalance).toBe(9999);
    expect(result.current.totalIncome).toBe(1234);
    expect(result.current.totalExpenses).toBe(567);
    expect(result.current.hasBankData).toBe(true);
    expect(result.current.bankTransactions).toEqual([]);
  });

  it("skips transactions when skipTransactions=true", async () => {
    // No GET_TRANSACTIONS mock should be needed (and absence shouldn't fail)
    const mocks = [
      {
        request: {
          query: GET_BANKING_ACCOUNTS,
          variables: { workspaceId: "ws-1" },
        },
        result: { data: { bankingAccounts: [] } },
      },
      {
        request: {
          query: GET_DASHBOARD_SUMMARY,
          variables: { workspaceId: "ws-1", accountId: null },
        },
        result: {
          data: {
            dashboardSummary: {
              bankBalance: 0,
              totalIncome: 0,
              totalExpenses: 0,
              transactionCount: 0,
            },
          },
        },
      },
    ];

    const { result } = renderHook(
      () => useDashboardData({ skipTransactions: true }),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasBankData).toBe(false);
  });
});

describe("useDashboardData utilities", () => {
  it("formatCurrency formats EUR correctly", async () => {
    const mocks = [
      {
        request: {
          query: GET_BANKING_ACCOUNTS,
          variables: { workspaceId: "ws-1" },
        },
        result: { data: { bankingAccounts: [] } },
      },
      {
        request: {
          query: GET_TRANSACTIONS,
          variables: { workspaceId: "ws-1", limit: 0 },
        },
        result: { data: { transactions: [] } },
      },
    ];
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.formatCurrency(1234.5)).toContain("1");
    expect(result.current.formatCurrency(1234.5)).toContain("€");
  });

  it("invalidateCache clears localStorage timestamp", async () => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("dashboard_last_fetch_ws-1", "12345");
    }
    const mocks = [
      {
        request: {
          query: GET_BANKING_ACCOUNTS,
          variables: { workspaceId: "ws-1" },
        },
        result: { data: { bankingAccounts: [] } },
      },
      {
        request: {
          query: GET_TRANSACTIONS,
          variables: { workspaceId: "ws-1", limit: 0 },
        },
        result: { data: { transactions: [] } },
      },
    ];
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.invalidateCache();
    });
    if (typeof localStorage !== "undefined") {
      expect(localStorage.getItem("dashboard_last_fetch_ws-1")).toBeNull();
    }
  });
});
