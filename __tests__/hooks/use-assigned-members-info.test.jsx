import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { gql } from "@apollo/client";
import React from "react";

import { useAssignedMembersInfo } from "@/src/hooks/useAssignedMembersInfo";

// The hook defines its query inline; we re-declare it here so MockedProvider
// can match by content.
const GET_USERS_INFO = gql`
  query GetUsersInfo($userIds: [String!]!) {
    usersInfo(userIds: $userIds) {
      id
      name
      email
      image
    }
  }
`;

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

describe("useAssignedMembersInfo", () => {
  it("filters out falsy ids and queries with the rest", async () => {
    const mocks = [
      {
        request: {
          query: GET_USERS_INFO,
          variables: { userIds: ["u-1", "u-2"] },
        },
        result: {
          data: {
            usersInfo: [
              { id: "u-1", name: "Alice", email: "alice@x.fr", image: null },
              { id: "u-2", name: "Bob", email: "bob@x.fr", image: null },
            ],
          },
        },
      },
    ];

    const { result } = renderHook(
      () => useAssignedMembersInfo(["u-1", null, undefined, "u-2", ""]),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.members).toHaveLength(2);
  });

  it("returns [] when assignedMembers is empty", async () => {
    const mocks = [
      {
        request: { query: GET_USERS_INFO, variables: { userIds: [] } },
        result: { data: { usersInfo: [] } },
      },
    ];
    const { result } = renderHook(() => useAssignedMembersInfo([]), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.members).toEqual([]);
  });

  it("returns members=[] when no data", () => {
    const { result } = renderHook(() => useAssignedMembersInfo(["u-1"]), {
      wrapper: wrap([]),
    });
    expect(result.current.members).toEqual([]);
  });
});
