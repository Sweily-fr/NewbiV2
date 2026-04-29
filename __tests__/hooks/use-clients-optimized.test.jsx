import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: () => ({ workspaceId: "ws-1" }),
}));

vi.mock("@/src/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({
    handleMutationError: vi.fn(),
  }),
}));

vi.mock("@/src/hooks/useOptimizedQuery", () => ({
  // Pass-through wrappers: just call useQuery with the same args + return
  // shape augmented with _cacheInfo so the consumer code doesn't crash.
  useOptimizedListQuery: (...args) => {
    const { useQuery } = require("@apollo/client");
    const result = useQuery(...args);
    return { ...result, _cacheInfo: { fromCache: false, policy: "test" } };
  },
  useOptimizedFormQuery: (...args) => {
    const { useQuery } = require("@apollo/client");
    const result = useQuery(...args);
    return { ...result, _cacheInfo: { fromCache: false } };
  },
}));

vi.mock("@/src/lib/cache-utils", () => ({
  optimizedMutate: vi.fn(async (client, mutation, options) => {
    // Forward to the real apollo client mutation so MockedProvider sees it
    return client.mutate({ mutation, ...options });
  }),
  invalidateCache: vi.fn(),
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import {
  useClientsOptimized,
  useClientOptimized,
  useCreateClientOptimized,
} from "@/src/hooks/useClientsOptimized";
import { CREATE_CLIENT } from "@/src/graphql/mutations/clients";
import { GET_CLIENTS, GET_CLIENT } from "@/src/graphql/queries/clients";
import { toast } from "@/src/components/ui/sonner";

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

describe("useClientsOptimized", () => {
  it("returns clients with pagination metadata", async () => {
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
    const { result } = renderHook(() => useClientsOptimized(1, 10, ""), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.clients).toHaveLength(2);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.currentPage).toBe(1);
  });

  it("returns sensible defaults without data", () => {
    const { result } = renderHook(() => useClientsOptimized(1, 10, ""), {
      wrapper: wrap([]),
    });
    expect(result.current.clients).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(1);
  });
});

describe("useClientOptimized", () => {
  it("returns the client by id", async () => {
    const mocks = [
      {
        request: {
          query: GET_CLIENT,
          variables: { workspaceId: "ws-1", id: "c-1" },
        },
        result: {
          data: {
            client: { id: "c-1", name: "Acme", email: "c@c.fr" },
          },
        },
      },
    ];
    const { result } = renderHook(() => useClientOptimized("c-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.client?.name).toBe("Acme");
  });

  it("skips query when id is missing", () => {
    const { result } = renderHook(() => useClientOptimized(null), {
      wrapper: wrap([]),
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.client).toBeUndefined();
  });
});

describe("useCreateClientOptimized", () => {
  it("creates a client and toasts success", async () => {
    const newClient = {
      __typename: "Client",
      id: "c-new",
      name: "Nouveau",
      type: "COMPANY",
      address: {
        street: "1 rue",
        city: "Paris",
        postalCode: "75001",
        country: "France",
      },
    };
    const mocks = [
      {
        request: {
          query: CREATE_CLIENT,
          variables: {
            workspaceId: "ws-1",
            input: {
              name: "Nouveau",
              type: "COMPANY",
              address: {
                street: "1 rue",
                city: "Paris",
                postalCode: "75001",
                country: "France",
              },
            },
          },
        },
        result: {
          data: { createClient: newClient },
        },
      },
    ];

    const { result } = renderHook(() => useCreateClientOptimized(), {
      wrapper: wrap(mocks),
    });

    await act(async () => {
      await result.current.createClient({
        name: "Nouveau",
        type: "COMPANY",
        address: {
          street: "1 rue",
          city: "Paris",
          postalCode: "75001",
          country: "France",
        },
      });
    });

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("rethrows on backend error", async () => {
    const mocks = [
      {
        request: {
          query: CREATE_CLIENT,
          variables: {
            workspaceId: "ws-1",
            input: { name: "Bad", type: "COMPANY" },
          },
        },
        error: new Error("Backend error"),
      },
    ];
    const { result } = renderHook(() => useCreateClientOptimized(), {
      wrapper: wrap(mocks),
    });

    await expect(
      act(async () => {
        await result.current.createClient({ name: "Bad", type: "COMPANY" });
      }),
    ).rejects.toThrow();
  });
});
