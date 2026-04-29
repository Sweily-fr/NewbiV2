import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/hooks/useWorkspace", () => ({
  useRequiredWorkspace: () => ({ workspaceId: "ws-1" }),
}));

import { useFinancialAnalytics } from "@/src/hooks/useFinancialAnalytics";
import { GET_FINANCIAL_ANALYTICS } from "@/src/graphql/queries/financialAnalytics";

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

describe("useFinancialAnalytics", () => {
  it("skips when startDate or endDate is missing", () => {
    const { result } = renderHook(() => useFinancialAnalytics(null, null), {
      wrapper: wrap([]),
    });
    expect(result.current.analyticsData).toBeNull();
  });

  it("returns analyticsData with filled missing months", async () => {
    const mocks = [
      {
        request: {
          query: GET_FINANCIAL_ANALYTICS,
          variables: {
            workspaceId: "ws-1",
            startDate: "2026-01-01",
            endDate: "2026-03-31",
            clientId: undefined,
            clientIds: undefined,
            status: undefined,
          },
        },
        result: {
          data: {
            financialAnalytics: {
              monthlyRevenue: [
                {
                  month: "2026-02",
                  revenueHT: 100,
                  revenueTTC: 120,
                  revenueVAT: 20,
                  expenseAmount: 0,
                  expenseAmountHT: 0,
                  expenseVAT: 0,
                  invoiceCount: 1,
                  expenseCount: 0,
                  netResult: 100,
                  creditNoteHT: 0,
                  netRevenueHT: 100,
                  grossMargin: 100,
                  grossMarginRate: 100,
                },
              ],
              collection: null,
            },
          },
        },
      },
    ];

    const { result } = renderHook(
      () => useFinancialAnalytics("2026-01-01", "2026-03-31"),
      { wrapper: wrap(mocks) },
    );

    await waitFor(() => expect(result.current.analyticsData).not.toBeNull());

    // The hook fills 3 months (Jan, Feb, Mar) — Jan and Mar should be empty
    expect(result.current.analyticsData.monthlyRevenue).toHaveLength(3);
    const months = result.current.analyticsData.monthlyRevenue.map(
      (m) => m.month,
    );
    expect(months).toEqual(["2026-01", "2026-02", "2026-03"]);
    const feb = result.current.analyticsData.monthlyRevenue.find(
      (m) => m.month === "2026-02",
    );
    expect(feb.revenueHT).toBe(100);
    const jan = result.current.analyticsData.monthlyRevenue.find(
      (m) => m.month === "2026-01",
    );
    expect(jan.revenueHT).toBe(0);
  });

  it("returns analyticsData=null when no data", async () => {
    const { result } = renderHook(
      () => useFinancialAnalytics("2026-01-01", "2026-03-31"),
      { wrapper: wrap([]) },
    );
    expect(result.current.analyticsData).toBeNull();
  });

  it("forwards clientIds and status filters", async () => {
    const mocks = [
      {
        request: {
          query: GET_FINANCIAL_ANALYTICS,
          variables: {
            workspaceId: "ws-1",
            startDate: "2026-01-01",
            endDate: "2026-01-31",
            clientId: undefined,
            clientIds: ["c-1", "c-2"],
            status: ["PAID"],
          },
        },
        result: {
          data: {
            financialAnalytics: {
              monthlyRevenue: [],
              collection: null,
            },
          },
        },
      },
    ];

    const { result } = renderHook(
      () =>
        useFinancialAnalytics("2026-01-01", "2026-01-31", {
          clientIds: ["c-1", "c-2"],
          status: ["PAID"],
        }),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.analyticsData).not.toBeNull());
  });
});
