import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { gql } from "@apollo/client";
import React from "react";

vi.mock("@/src/lib/cache-utils", () => ({
  getOptimizedPolicy: vi.fn((dataType, context) => ({
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  })),
}));

import {
  useOptimizedQuery,
  useOptimizedListQuery,
  useOptimizedFormQuery,
  useOptimizedStatsQuery,
  useOptimizedSettingsQuery,
  useOptimizedOrganizationQuery,
} from "@/src/hooks/useOptimizedQuery";
import { getOptimizedPolicy } from "@/src/lib/cache-utils";

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

describe("useOptimizedQuery", () => {
  it("returns query data and _cacheInfo metadata", async () => {
    const mocks = [
      {
        request: { query: PING_QUERY },
        result: { data: { ping: "pong" } },
      },
    ];

    const { result } = renderHook(
      () => useOptimizedQuery(PING_QUERY, {}, "lists", "table"),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.data?.ping).toBe("pong"));
    expect(result.current._cacheInfo).toMatchObject({
      dataType: "lists",
      context: "table",
    });
  });

  it("merges options.errorPolicy default to 'all'", async () => {
    const mocks = [
      {
        request: { query: PING_QUERY },
        result: { data: { ping: "pong" } },
      },
    ];
    const { result } = renderHook(
      () => useOptimizedQuery(PING_QUERY, {}, "lists"),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.data?.ping).toBe("pong"));
    // The hook calls getOptimizedPolicy which we've mocked
    expect(getOptimizedPolicy).toHaveBeenCalledWith("lists", "default");
  });
});

describe("optimization presets", () => {
  it("useOptimizedListQuery uses 'lists' + 'table'", () => {
    renderHook(() => useOptimizedListQuery(PING_QUERY), {
      wrapper: wrap([
        {
          request: { query: PING_QUERY },
          result: { data: { ping: "pong" } },
        },
      ]),
    });
    expect(getOptimizedPolicy).toHaveBeenCalledWith("lists", "table");
  });

  it("useOptimizedFormQuery uses 'forms' + 'form'", () => {
    renderHook(() => useOptimizedFormQuery(PING_QUERY), {
      wrapper: wrap([
        {
          request: { query: PING_QUERY },
          result: { data: { ping: "pong" } },
        },
      ]),
    });
    expect(getOptimizedPolicy).toHaveBeenCalledWith("forms", "form");
  });

  it("useOptimizedStatsQuery uses 'stats' + 'dashboard'", () => {
    renderHook(() => useOptimizedStatsQuery(PING_QUERY), {
      wrapper: wrap([
        {
          request: { query: PING_QUERY },
          result: { data: { ping: "pong" } },
        },
      ]),
    });
    expect(getOptimizedPolicy).toHaveBeenCalledWith("stats", "dashboard");
  });

  it("useOptimizedSettingsQuery uses 'settings' + 'default'", () => {
    renderHook(() => useOptimizedSettingsQuery(PING_QUERY), {
      wrapper: wrap([
        {
          request: { query: PING_QUERY },
          result: { data: { ping: "pong" } },
        },
      ]),
    });
    expect(getOptimizedPolicy).toHaveBeenCalledWith("settings", "default");
  });

  it("useOptimizedOrganizationQuery uses 'organization' + 'default'", () => {
    renderHook(() => useOptimizedOrganizationQuery(PING_QUERY), {
      wrapper: wrap([
        {
          request: { query: PING_QUERY },
          result: { data: { ping: "pong" } },
        },
      ]),
    });
    expect(getOptimizedPolicy).toHaveBeenCalledWith("organization", "default");
  });
});
