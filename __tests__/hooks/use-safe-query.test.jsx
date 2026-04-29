import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { gql } from "@apollo/client";
import React from "react";

const { useSessionMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
}));

vi.mock("@/src/lib/auth-client", () => ({
  useSession: useSessionMock,
}));

import { useSafeQuery, useAuthenticatedQuery } from "@/src/hooks/useSafeQuery";

const PING_QUERY = gql`
  query Ping {
    ping
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

describe("useSafeQuery", () => {
  it("skips the query when session is pending", () => {
    useSessionMock.mockReturnValue({ data: null, isPending: true });
    const { result } = renderHook(() => useSafeQuery(PING_QUERY), {
      wrapper: wrap([]),
    });
    expect(result.current.data).toBeUndefined();
  });

  it("skips the query when there is no session", () => {
    useSessionMock.mockReturnValue({ data: null, isPending: false });
    const { result } = renderHook(() => useSafeQuery(PING_QUERY), {
      wrapper: wrap([]),
    });
    expect(result.current.data).toBeUndefined();
  });

  it("runs the query when session is loaded", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "u-1" } },
      isPending: false,
    });
    const mocks = [
      {
        request: { query: PING_QUERY },
        result: { data: { ping: "pong" } },
      },
    ];
    const { result } = renderHook(() => useSafeQuery(PING_QUERY), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.data?.ping).toBe("pong"));
  });

  it("respects an explicit options.skip=true", () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "u-1" } },
      isPending: false,
    });
    const { result } = renderHook(
      () => useSafeQuery(PING_QUERY, { skip: true }),
      { wrapper: wrap([]) },
    );
    expect(result.current.data).toBeUndefined();
  });
});

describe("useAuthenticatedQuery", () => {
  it("returns loading=true while session is pending", () => {
    useSessionMock.mockReturnValue({ data: null, isPending: true });
    const { result } = renderHook(() => useAuthenticatedQuery(PING_QUERY), {
      wrapper: wrap([]),
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("returns an error when there is no session", () => {
    useSessionMock.mockReturnValue({ data: null, isPending: false });
    const { result } = renderHook(() => useAuthenticatedQuery(PING_QUERY), {
      wrapper: wrap([]),
    });
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe("Non authentifié");
  });

  it("returns the query result when authenticated", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "u-1" } },
      isPending: false,
    });
    const mocks = [
      {
        request: { query: PING_QUERY },
        result: { data: { ping: "pong" } },
      },
    ];
    const { result } = renderHook(() => useAuthenticatedQuery(PING_QUERY), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.data?.ping).toBe("pong"));
  });
});
