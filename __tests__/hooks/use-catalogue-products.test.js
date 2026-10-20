import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@apollo/client", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
  gql: (strings) => strings.join(""),
}));
vi.mock("@/src/hooks/useWorkspace", () => ({
  useRequiredWorkspace: vi.fn(() => ({ workspaceId: "w1", loading: false })),
}));
vi.mock("@/src/components/ui/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useQuery } from "@apollo/client";
import { useCatalogueProducts } from "@/src/hooks/useProducts";

const products = (n) =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `Article ${i}` }));

describe("useCatalogueProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("charge tout le catalogue d'un coup, au-delà de 100 produits", () => {
    useQuery.mockReturnValue({
      data: { products: { products: products(105), totalCount: 105 } },
      loading: false,
    });
    const { result } = renderHook(() => useCatalogueProducts());

    expect(useQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: expect.objectContaining({ page: 1, limit: 1000 }),
      }),
    );
    expect(result.current.products).toHaveLength(105);
    expect(result.current.totalItems).toBe(105);
  });

  it("un catalogue plus grand que la première page relance la requête avec le total", () => {
    useQuery.mockReturnValue({
      data: { products: { products: products(1000), totalCount: 1250 } },
      loading: false,
    });
    renderHook(() => useCatalogueProducts());

    expect(useQuery).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: expect.objectContaining({ limit: 1250 }),
      }),
    );
  });
});
