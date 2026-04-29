import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: vi.fn(),
}));

vi.mock("@/src/lib/auth-client", () => ({
  useSession: vi.fn(),
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { useEvents, useEvent } from "@/src/hooks/useEvents";
import { GET_EVENTS, GET_EVENT } from "@/src/graphql/queries/event";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useSession } from "@/src/lib/auth-client";

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
  useWorkspace.mockReturnValue({ workspaceId: "ws-1", loading: false });
  useSession.mockReturnValue({ data: null });
});

describe("useEvents", () => {
  it("returns events with default limit/offset and includeExternalCalendars=true", async () => {
    const mocks = [
      {
        request: {
          query: GET_EVENTS,
          variables: {
            startDate: undefined,
            endDate: undefined,
            type: undefined,
            limit: 500,
            offset: 0,
            workspaceId: "ws-1",
            includeExternalCalendars: true,
          },
        },
        result: {
          data: {
            getEvents: {
              events: [{ id: "ev-1" }, { id: "ev-2" }],
              totalCount: 2,
              success: true,
              message: null,
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useEvents(), { wrapper: wrap(mocks) });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toHaveLength(2);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.success).toBe(true);
  });

  it("forwards date range and type filters", async () => {
    const mocks = [
      {
        request: {
          query: GET_EVENTS,
          variables: {
            startDate: "2026-04-01",
            endDate: "2026-04-30",
            type: "INVOICE_DUE",
            limit: 500,
            offset: 0,
            workspaceId: "ws-1",
            includeExternalCalendars: true,
          },
        },
        result: {
          data: {
            getEvents: {
              events: [{ id: "ev-99" }],
              totalCount: 1,
              success: true,
              message: null,
            },
          },
        },
      },
    ];

    const { result } = renderHook(
      () =>
        useEvents({
          startDate: "2026-04-01",
          endDate: "2026-04-30",
          type: "INVOICE_DUE",
        }),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events[0].id).toBe("ev-99");
  });

  it("returns [] and totalCount=0 when no data", () => {
    const { result } = renderHook(() => useEvents(), {
      wrapper: wrap([]),
    });
    expect(result.current.events).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it("uses options.workspaceId over the context value", async () => {
    const mocks = [
      {
        request: {
          query: GET_EVENTS,
          variables: {
            startDate: undefined,
            endDate: undefined,
            type: undefined,
            limit: 500,
            offset: 0,
            workspaceId: "ws-override",
            includeExternalCalendars: true,
          },
        },
        result: {
          data: {
            getEvents: {
              events: [],
              totalCount: 0,
              success: true,
              message: null,
            },
          },
        },
      },
    ];

    const { result } = renderHook(
      () => useEvents({ workspaceId: "ws-override" }),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toEqual([]);
  });
});

describe("useEvent", () => {
  it("returns the event by id (event nested under getEvent.event)", async () => {
    const mocks = [
      {
        request: {
          query: GET_EVENT,
          variables: { id: "ev-42", workspaceId: "ws-1" },
        },
        result: {
          data: {
            getEvent: {
              event: { id: "ev-42", title: "Réunion" },
              success: true,
              message: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useEvent("ev-42"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.event?.title).toBe("Réunion");
    expect(result.current.success).toBe(true);
  });
});
