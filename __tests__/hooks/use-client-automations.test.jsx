import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

import {
  useClientAutomations,
  useClientAutomation,
} from "@/src/hooks/useClientAutomations";
import {
  GET_CLIENT_AUTOMATIONS,
  GET_CLIENT_AUTOMATION,
} from "@/src/graphql/queries/clientAutomations";

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

describe("useClientAutomations", () => {
  it("returns automations from the query", async () => {
    const mocks = [
      {
        request: {
          query: GET_CLIENT_AUTOMATIONS,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            clientAutomations: [
              { id: "a-1", name: "Onboarding" },
              { id: "a-2", name: "Followup" },
            ],
          },
        },
      },
    ];
    const { result } = renderHook(() => useClientAutomations("ws-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.automations).toHaveLength(2);
  });

  it("skips when workspaceId is missing", () => {
    const { result } = renderHook(() => useClientAutomations(null), {
      wrapper: wrap([]),
    });
    expect(result.current.automations).toEqual([]);
  });
});

describe("useClientAutomation", () => {
  it("returns an automation by id", async () => {
    const mocks = [
      {
        request: {
          query: GET_CLIENT_AUTOMATION,
          variables: { workspaceId: "ws-1", id: "a-42" },
        },
        result: {
          data: { clientAutomation: { id: "a-42", name: "Single" } },
        },
      },
    ];
    const { result } = renderHook(() => useClientAutomation("ws-1", "a-42"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.automation?.name).toBe("Single");
  });

  it("skips when id is missing", () => {
    const { result } = renderHook(() => useClientAutomation("ws-1", null), {
      wrapper: wrap([]),
    });
    expect(result.current.automation).toBeUndefined();
  });
});
