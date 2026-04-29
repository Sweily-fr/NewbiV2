import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: vi.fn(),
}));

vi.mock("@/src/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({
    handleMutationError: vi.fn(),
    handleError: vi.fn(),
  }),
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { useClientSegments } from "@/src/hooks/useClientSegments";
import { GET_CLIENT_SEGMENTS } from "@/src/graphql/queries/clientSegments";
import { useWorkspace } from "@/src/hooks/useWorkspace";

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
  useWorkspace.mockReturnValue({ workspaceId: "ws-1", loading: false });
});

describe("useClientSegments", () => {
  it("returns segments from the query", async () => {
    const mocks = [
      {
        request: {
          query: GET_CLIENT_SEGMENTS,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            clientSegments: [
              { id: "s-1", name: "Auto" },
              { id: "s-2", name: "Manual" },
            ],
          },
        },
      },
    ];
    const { result } = renderHook(() => useClientSegments(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.segments).toHaveLength(2);
  });

  it("returns [] when no data", () => {
    const { result } = renderHook(() => useClientSegments(), {
      wrapper: wrap([]),
    });
    expect(result.current.segments).toEqual([]);
  });

  it("skips when no workspaceId", () => {
    useWorkspace.mockReturnValue({ workspaceId: null, loading: true });
    const { result } = renderHook(() => useClientSegments(), {
      wrapper: wrap([]),
    });
    expect(result.current.segments).toEqual([]);
  });
});
