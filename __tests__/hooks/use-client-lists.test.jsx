import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

import { useClientLists, useClientList } from "@/src/hooks/useClientLists";
import {
  GET_CLIENT_LISTS,
  GET_CLIENT_LIST,
} from "@/src/graphql/queries/clientLists";

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

describe("useClientLists", () => {
  it("returns the lists for the workspace", async () => {
    const mocks = [
      {
        request: {
          query: GET_CLIENT_LISTS,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            clientLists: [
              { id: "l-1", name: "Prospects" },
              { id: "l-2", name: "VIP" },
            ],
          },
        },
      },
    ];
    const { result } = renderHook(() => useClientLists("ws-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lists).toHaveLength(2);
  });

  it("returns [] when no data", () => {
    const { result } = renderHook(() => useClientLists("ws-1"), {
      wrapper: wrap([]),
    });
    expect(result.current.lists).toEqual([]);
  });

  it("skips query when workspaceId is missing", () => {
    const { result } = renderHook(() => useClientLists(null), {
      wrapper: wrap([]),
    });
    expect(result.current.lists).toEqual([]);
  });
});

describe("useClientList", () => {
  it("returns a single list by id", async () => {
    const mocks = [
      {
        request: {
          query: GET_CLIENT_LIST,
          variables: { workspaceId: "ws-1", id: "l-42" },
        },
        result: {
          data: { clientList: { id: "l-42", name: "Single" } },
        },
      },
    ];
    const { result } = renderHook(() => useClientList("ws-1", "l-42"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    // Don't depend on exact return shape — just check we got data
    expect(result.current.list?.name || result.current.clientList?.name).toBe(
      "Single",
    );
  });

  it("skips when listId is missing", () => {
    const { result } = renderHook(() => useClientList("ws-1", null), {
      wrapper: wrap([]),
    });
    expect(result.current.loading).toBe(false);
  });
});
