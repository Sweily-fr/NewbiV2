import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/hooks/useWorkspace", () => ({
  useRequiredWorkspace: vi.fn(),
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { useExpenses, useExpenseStats } from "@/src/hooks/useExpenses";
import { GET_EXPENSES, GET_EXPENSE_STATS } from "@/src/graphql/queries/expense";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

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
  useRequiredWorkspace.mockReturnValue({ workspaceId: "ws-1", loading: false });
});

describe("useExpenses", () => {
  it("returns the expenses list with default pagination (50)", async () => {
    const mocks = [
      {
        request: {
          query: GET_EXPENSES,
          variables: { workspaceId: "ws-1", page: 1, limit: 50 },
        },
        result: {
          data: {
            expenses: {
              expenses: [
                { id: "e-1", title: "Lunch" },
                { id: "e-2", title: "Train" },
              ],
              totalCount: 2,
              hasNextPage: false,
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useExpenses(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.expenses).toHaveLength(2);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("merges custom filters into the query variables", async () => {
    const mocks = [
      {
        request: {
          query: GET_EXPENSES,
          variables: {
            workspaceId: "ws-1",
            page: 2,
            limit: 50,
            status: "PENDING",
          },
        },
        result: {
          data: {
            expenses: {
              expenses: [{ id: "e-9" }],
              totalCount: 1,
              hasNextPage: false,
            },
          },
        },
      },
    ];

    const { result } = renderHook(
      () => useExpenses({ page: 2, status: "PENDING" }),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.expenses[0].id).toBe("e-9");
  });

  it("returns empty defaults when no data", () => {
    const { result } = renderHook(() => useExpenses(), {
      wrapper: wrap([]),
    });
    expect(result.current.expenses).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it("skips the query when workspaceId is missing", () => {
    useRequiredWorkspace.mockReturnValue({ workspaceId: null, loading: true });
    const { result } = renderHook(() => useExpenses(), {
      wrapper: wrap([]),
    });
    expect(result.current.expenses).toEqual([]);
  });
});

describe("useExpenseStats", () => {
  it("returns the stats from the query", async () => {
    const mocks = [
      {
        request: {
          query: GET_EXPENSE_STATS,
          variables: { workspaceId: "ws-1", from: "2026-01-01" },
        },
        result: {
          data: {
            expenseStats: { total: 1234.5, count: 12 },
          },
        },
      },
    ];

    const { result } = renderHook(
      () => useExpenseStats({ from: "2026-01-01" }),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toEqual({ total: 1234.5, count: 12 });
  });
});
