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

import { useTreasuryForecastData } from "@/src/hooks/useTreasuryForecast";
import { GET_TREASURY_FORECAST_DATA } from "@/src/graphql/queries/treasuryForecast";

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

describe("useTreasuryForecastData", () => {
  it("skips when startDate or endDate is missing", () => {
    const { result } = renderHook(() => useTreasuryForecastData(null, null), {
      wrapper: wrap([]),
    });
    expect(result.current.loading).toBe(false);
  });

  it("fetches forecast data when params are complete", async () => {
    const mocks = [
      {
        request: {
          query: GET_TREASURY_FORECAST_DATA,
          variables: {
            workspaceId: "ws-1",
            startDate: "2026-01",
            endDate: "2026-12",
            accountId: undefined,
            scenarioId: undefined,
          },
        },
        result: {
          data: {
            treasuryForecastData: {
              months: [{ month: "2026-01", net: 1000 }],
            },
          },
        },
      },
    ];

    const { result } = renderHook(
      () => useTreasuryForecastData("2026-01", "2026-12"),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.forecastData?.months).toHaveLength(1);
  });

  it("forwards accountId/scenarioId when provided", async () => {
    const mocks = [
      {
        request: {
          query: GET_TREASURY_FORECAST_DATA,
          variables: {
            workspaceId: "ws-1",
            startDate: "2026-01",
            endDate: "2026-12",
            accountId: "a-1",
            scenarioId: "s-1",
          },
        },
        result: {
          data: { treasuryForecastData: { months: [] } },
        },
      },
    ];

    const { result } = renderHook(
      () => useTreasuryForecastData("2026-01", "2026-12", "a-1", "s-1"),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.forecastData).toBeTruthy();
  });
});
