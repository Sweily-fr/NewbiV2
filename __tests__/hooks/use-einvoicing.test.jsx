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

import {
  useEInvoicingSettings,
  useEInvoicingStats,
} from "@/src/hooks/useEInvoicing";
import {
  GET_EINVOICING_SETTINGS,
  GET_EINVOICING_STATS,
} from "@/src/graphql/eInvoicingQueries";

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

describe("useEInvoicingSettings", () => {
  it("returns the settings from the query", async () => {
    const settings = {
      eInvoicingEnabled: true,
      superPdpConfigured: true,
      superPdpWebhookConfigured: true,
      superPdpClientId: "client-x",
      superPdpEnvironment: "production",
      eInvoicingActivatedAt: "2026-04-15T00:00:00Z",
    };
    const mocks = [
      {
        request: {
          query: GET_EINVOICING_SETTINGS,
          variables: { workspaceId: "ws-1" },
        },
        result: { data: { eInvoicingSettings: settings } },
      },
    ];
    const { result } = renderHook(() => useEInvoicingSettings(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.settings).toEqual(settings);
  });

  it("returns sensible defaults when there is no data", () => {
    const { result } = renderHook(() => useEInvoicingSettings(), {
      wrapper: wrap([]),
    });
    expect(result.current.settings).toEqual({
      eInvoicingEnabled: false,
      superPdpConfigured: false,
      superPdpWebhookConfigured: false,
      superPdpClientId: null,
      superPdpEnvironment: "sandbox",
      eInvoicingActivatedAt: null,
    });
  });
});

describe("useEInvoicingStats", () => {
  it("returns the stats from the query", async () => {
    const stats = {
      NOT_SENT: 5,
      PENDING_VALIDATION: 2,
      VALIDATED: 10,
      SENT_TO_RECIPIENT: 0,
      RECEIVED: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      PAID: 8,
      ERROR: 1,
      totalSent: 17,
      successRate: 0.94,
    };
    const mocks = [
      {
        request: {
          query: GET_EINVOICING_STATS,
          variables: { workspaceId: "ws-1" },
        },
        result: { data: { eInvoicingStats: stats } },
      },
    ];
    const { result } = renderHook(() => useEInvoicingStats(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toEqual(stats);
  });

  it("returns zero defaults when there is no data", () => {
    const { result } = renderHook(() => useEInvoicingStats(), {
      wrapper: wrap([]),
    });
    expect(result.current.stats.totalSent).toBe(0);
    expect(result.current.stats.NOT_SENT).toBe(0);
  });
});
