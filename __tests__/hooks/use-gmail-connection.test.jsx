import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/hooks/useWorkspace", () => ({
  useRequiredWorkspace: () => ({ workspaceId: "ws-1" }),
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { useGmailConnection } from "@/src/hooks/useGmailConnection";
import {
  GET_GMAIL_CONNECTION,
  GET_GMAIL_SYNC_STATS,
} from "@/src/graphql/queries/gmailConnectionQueries";

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

describe("useGmailConnection", () => {
  it("returns the connection and stats from the queries", async () => {
    const mocks = [
      {
        request: {
          query: GET_GMAIL_CONNECTION,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            gmailConnection: {
              id: "gc-1",
              email: "test@gmail.com",
              connected: true,
            },
          },
        },
      },
      {
        request: {
          query: GET_GMAIL_SYNC_STATS,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            gmailSyncStats: {
              totalEmailsScanned: 100,
              totalInvoicesFound: 5,
              pendingReview: 2,
              lastSyncAt: "2026-04-15T00:00:00Z",
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useGmailConnection(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.connection?.email).toBe("test@gmail.com");
    expect(result.current.stats.totalEmailsScanned).toBe(100);
    expect(result.current.stats.totalInvoicesFound).toBe(5);
  });

  it("returns null connection and zero stats when no data", () => {
    const { result } = renderHook(() => useGmailConnection(), {
      wrapper: wrap([]),
    });
    expect(result.current.connection).toBeNull();
    expect(result.current.stats).toMatchObject({
      totalEmailsScanned: 0,
      totalInvoicesFound: 0,
      pendingReview: 0,
      lastSyncAt: null,
    });
  });
});
