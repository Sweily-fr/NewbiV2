import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { useProductCustomFields } from "@/src/hooks/useProductCustomFields";
import { GET_PRODUCT_CUSTOM_FIELDS } from "@/src/graphql/queries/productCustomFields";

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

describe("useProductCustomFields", () => {
  it("returns custom fields for the workspace", async () => {
    const mocks = [
      {
        request: {
          query: GET_PRODUCT_CUSTOM_FIELDS,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            productCustomFields: [{ id: "pf-1", name: "Brand", type: "TEXT" }],
          },
        },
      },
    ];

    const { result } = renderHook(() => useProductCustomFields("ws-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.fields).toHaveLength(1);
  });

  it("returns [] when no data", () => {
    const { result } = renderHook(() => useProductCustomFields("ws-1"), {
      wrapper: wrap([]),
    });
    expect(result.current.fields).toEqual([]);
  });

  it("skips query when no workspaceId", () => {
    const { result } = renderHook(() => useProductCustomFields(null), {
      wrapper: wrap([]),
    });
    expect(result.current.fields).toEqual([]);
  });
});
