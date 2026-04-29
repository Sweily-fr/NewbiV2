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

import { useProducts, useProduct } from "@/src/hooks/useProducts";
import { GET_PRODUCTS, GET_PRODUCT } from "@/src/graphql/queries/products";
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
  useRequiredWorkspace.mockReturnValue({
    workspaceId: "ws-1",
    loading: false,
    error: null,
  });
});

describe("useProducts", () => {
  it("returns paginated products and computes totalPages", async () => {
    const mocks = [
      {
        request: {
          query: GET_PRODUCTS,
          variables: {
            workspaceId: "ws-1",
            page: 1,
            limit: 50,
            search: "",
            category: "",
          },
        },
        result: {
          data: {
            products: {
              products: [
                { id: "p-1", name: "Service A" },
                { id: "p-2", name: "Service B" },
              ],
              totalCount: 75,
              hasNextPage: true,
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useProducts(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.products).toHaveLength(2);
    expect(result.current.totalItems).toBe(75);
    expect(result.current.totalPages).toBe(2); // ceil(75/50)
    expect(result.current.hasNextPage).toBe(true);
  });

  it("forwards search and category filters", async () => {
    const mocks = [
      {
        request: {
          query: GET_PRODUCTS,
          variables: {
            workspaceId: "ws-1",
            page: 1,
            limit: 50,
            search: "abo",
            category: "subscription",
          },
        },
        result: {
          data: {
            products: {
              products: [{ id: "p-1", name: "Abo" }],
              totalCount: 1,
              hasNextPage: false,
            },
          },
        },
      },
    ];

    const { result } = renderHook(
      () => useProducts(1, 50, "abo", "subscription"),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.products[0].name).toBe("Abo");
  });

  it("skips the query when workspaceId is missing", () => {
    useRequiredWorkspace.mockReturnValue({
      workspaceId: null,
      loading: true,
    });
    const { result } = renderHook(() => useProducts(), {
      wrapper: wrap([]),
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);
  });
});

describe("useProduct", () => {
  it("returns a single product", async () => {
    const mocks = [
      {
        request: {
          query: GET_PRODUCT,
          variables: { id: "p-42" },
        },
        result: {
          data: { product: { id: "p-42", name: "Single" } },
        },
      },
    ];

    const { result } = renderHook(() => useProduct("p-42"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.product.name).toBe("Single");
  });

  it("skips when id is missing", () => {
    const { result } = renderHook(() => useProduct(null), {
      wrapper: wrap([]),
    });
    expect(result.current.product).toBeUndefined();
  });
});
