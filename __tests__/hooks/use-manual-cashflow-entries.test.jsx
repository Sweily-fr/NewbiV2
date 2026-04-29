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

import { useManualCashflowEntries } from "@/src/hooks/useManualCashflowEntries";
import { GET_MANUAL_CASHFLOW_ENTRIES } from "@/src/graphql/queries/treasuryForecast";

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

describe("useManualCashflowEntries", () => {
  it("returns entries from the query", async () => {
    const mocks = [
      {
        request: {
          query: GET_MANUAL_CASHFLOW_ENTRIES,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            manualCashflowEntries: [
              { id: "e-1", label: "Loyer", amount: -1000 },
            ],
          },
        },
      },
    ];
    const { result } = renderHook(() => useManualCashflowEntries(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toHaveLength(1);
  });

  it("returns [] when no data", () => {
    const { result } = renderHook(() => useManualCashflowEntries(), {
      wrapper: wrap([]),
    });
    expect(result.current.entries).toEqual([]);
  });
});
