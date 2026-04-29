import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import {
  useCrmEmailAutomations,
  useCrmEmailAutomation,
} from "@/src/hooks/useCrmEmailAutomations";
import {
  GET_CRM_EMAIL_AUTOMATIONS,
  GET_CRM_EMAIL_AUTOMATION,
} from "@/src/graphql/queries/crmEmailAutomations";

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

describe("useCrmEmailAutomations", () => {
  it("returns automations from the query", async () => {
    const mocks = [
      {
        request: {
          query: GET_CRM_EMAIL_AUTOMATIONS,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            crmEmailAutomations: [{ id: "ea-1", name: "Welcome" }],
          },
        },
      },
    ];
    const { result } = renderHook(() => useCrmEmailAutomations("ws-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.automations).toHaveLength(1);
  });

  it("returns [] when no data", () => {
    const { result } = renderHook(() => useCrmEmailAutomations("ws-1"), {
      wrapper: wrap([]),
    });
    expect(result.current.automations).toEqual([]);
  });

  it("skips when workspaceId is missing", () => {
    const { result } = renderHook(() => useCrmEmailAutomations(null), {
      wrapper: wrap([]),
    });
    expect(result.current.automations).toEqual([]);
  });
});

describe("useCrmEmailAutomation", () => {
  it("skips when id missing", () => {
    const { result } = renderHook(() => useCrmEmailAutomation("ws-1", null), {
      wrapper: wrap([]),
    });
    expect(result.current.automation).toBeUndefined();
  });
});
