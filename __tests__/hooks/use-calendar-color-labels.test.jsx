import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: () => ({ workspaceId: "ws-1" }),
}));

import { useCalendarColorLabels } from "@/src/hooks/useCalendarColorLabels";
import { GET_CALENDAR_COLOR_LABELS } from "@/src/graphql/queries/calendarColorLabels";
import { UPDATE_CALENDAR_COLOR_LABELS } from "@/src/graphql/mutations/calendarColorLabels";

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

describe("useCalendarColorLabels", () => {
  it("returns the default 6 labels when no data", () => {
    const { result } = renderHook(() => useCalendarColorLabels(), {
      wrapper: wrap([]),
    });
    expect(result.current.labels).toHaveLength(6);
    expect(result.current.labels[0]).toMatchObject({
      color: "#1D1D1B",
      label: "Noir",
    });
  });

  it("returns server labels when data is loaded", async () => {
    const mocks = [
      {
        request: {
          query: GET_CALENDAR_COLOR_LABELS,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            getCalendarColorLabels: {
              success: true,
              message: "OK",
              labels: [
                { color: "#FF0000", label: "Custom rouge" },
                { color: "#00FF00", label: "Custom vert" },
              ],
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useCalendarColorLabels(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.labels).toHaveLength(2));
  });

  it("updateLabels calls the mutation with cleaned input", async () => {
    const mocks = [
      {
        request: {
          query: UPDATE_CALENDAR_COLOR_LABELS,
          variables: {
            labels: [{ color: "#000", label: "Test" }],
            workspaceId: "ws-1",
          },
        },
        result: {
          data: {
            updateCalendarColorLabels: {
              success: true,
              message: "ok",
              labels: [{ color: "#000", label: "Test" }],
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useCalendarColorLabels(), {
      wrapper: wrap(mocks),
    });

    let returned;
    await act(async () => {
      returned = await result.current.updateLabels([
        { color: "#000", label: "Test", extra: "ignored" },
      ]);
    });
    expect(returned.success).toBe(true);
  });
});
