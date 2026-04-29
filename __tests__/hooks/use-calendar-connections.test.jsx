import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import {
  useCalendarConnections,
  useAvailableCalendars,
} from "@/src/hooks/useCalendarConnections";
import {
  GET_CALENDAR_CONNECTIONS,
  GET_AVAILABLE_CALENDARS,
} from "@/src/graphql/queries/calendarConnection";

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

describe("useCalendarConnections", () => {
  it("returns the connections list from the query", async () => {
    const mocks = [
      {
        request: { query: GET_CALENDAR_CONNECTIONS },
        result: {
          data: {
            getCalendarConnections: {
              success: true,
              connections: [
                { id: "c-1", provider: "GOOGLE" },
                { id: "c-2", provider: "APPLE" },
              ],
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useCalendarConnections(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.connections).toHaveLength(2);
    expect(result.current.success).toBe(true);
  });

  it("returns [] and success=false when no data", () => {
    const { result } = renderHook(() => useCalendarConnections(), {
      wrapper: wrap([]),
    });
    expect(result.current.connections).toEqual([]);
    expect(result.current.success).toBe(false);
  });
});

describe("useAvailableCalendars", () => {
  it("skips when no connectionId", () => {
    const { result } = renderHook(() => useAvailableCalendars(null), {
      wrapper: wrap([]),
    });
    expect(result.current.loading).toBe(false);
  });
});
