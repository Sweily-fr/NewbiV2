import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: vi.fn(),
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/src/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({
    handleMutationError: vi.fn(),
    handleError: vi.fn(),
  }),
}));

import { useClients, useClient } from "@/src/hooks/useClients";
import { GET_CLIENTS, GET_CLIENT } from "@/src/graphql/queries/clients";
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
});

describe("useClients", () => {
  it("returns the paginated client list from the GraphQL response", async () => {
    useWorkspace.mockReturnValue({ workspaceId: "ws-1", loading: false });

    const mocks = [
      {
        request: {
          query: GET_CLIENTS,
          variables: { workspaceId: "ws-1", page: 1, limit: 10, search: "" },
        },
        result: {
          data: {
            clients: {
              items: [
                { id: "c-1", name: "Acme" },
                { id: "c-2", name: "Beta" },
              ],
              totalItems: 2,
              currentPage: 1,
              totalPages: 1,
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useClients(), { wrapper: wrap(mocks) });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.clients).toHaveLength(2);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.totalPages).toBe(1);
  });

  it("returns empty defaults when there is no data yet", async () => {
    useWorkspace.mockReturnValue({ workspaceId: "ws-1", loading: false });

    const { result } = renderHook(() => useClients(), {
      wrapper: wrap([]),
    });

    expect(result.current.clients).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(1);
  });

  it("skips the query when workspaceId is missing", async () => {
    useWorkspace.mockReturnValue({ workspaceId: null, loading: false });

    const { result } = renderHook(() => useClients(), {
      wrapper: wrap([]),
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.clients).toEqual([]);
  });

  it("forwards search and pagination variables to the query", async () => {
    useWorkspace.mockReturnValue({ workspaceId: "ws-1", loading: false });

    const mocks = [
      {
        request: {
          query: GET_CLIENTS,
          variables: {
            workspaceId: "ws-1",
            page: 2,
            limit: 25,
            search: "acme",
          },
        },
        result: {
          data: {
            clients: {
              items: [{ id: "c-1", name: "Acme" }],
              totalItems: 1,
              currentPage: 2,
              totalPages: 1,
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useClients(2, 25, "acme"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.currentPage).toBe(2);
    expect(result.current.clients[0].name).toBe("Acme");
  });
});

describe("useClient", () => {
  it("returns a single client by id", async () => {
    useWorkspace.mockReturnValue({ workspaceId: "ws-1", loading: false });

    const mocks = [
      {
        request: {
          query: GET_CLIENT,
          variables: { workspaceId: "ws-1", id: "c-42" },
        },
        result: {
          data: { client: { id: "c-42", name: "Single Co" } },
        },
      },
    ];

    const { result } = renderHook(() => useClient("c-42"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.client.name).toBe("Single Co");
  });

  it("skips the query when id is missing", async () => {
    useWorkspace.mockReturnValue({ workspaceId: "ws-1", loading: false });
    const { result } = renderHook(() => useClient(null), {
      wrapper: wrap([]),
    });
    expect(result.current.client).toBeUndefined();
  });
});
