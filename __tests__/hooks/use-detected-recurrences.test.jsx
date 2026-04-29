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

import { useDetectedRecurrences } from "@/src/hooks/useDetectedRecurrences";
import { GET_DETECTED_RECURRENCES } from "@/src/graphql/queries/treasuryForecast";

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

describe("useDetectedRecurrences", () => {
  it("returns the list from the query", async () => {
    const mocks = [
      {
        request: {
          query: GET_DETECTED_RECURRENCES,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            detectedRecurrences: [
              { id: "r-1", supplier: "Free Mobile" },
              { id: "r-2", supplier: "Netflix" },
            ],
          },
        },
      },
    ];
    const { result } = renderHook(() => useDetectedRecurrences(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.recurrences).toHaveLength(2);
  });

  it("returns [] when no data", () => {
    const { result } = renderHook(() => useDetectedRecurrences(), {
      wrapper: wrap([]),
    });
    expect(result.current.recurrences).toEqual([]);
  });
});
