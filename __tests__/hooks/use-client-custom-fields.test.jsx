import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import {
  useClientCustomFields,
  FIELD_TYPES,
} from "@/src/hooks/useClientCustomFields";
import { GET_CLIENT_CUSTOM_FIELDS } from "@/src/graphql/queries/clientCustomFields";

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

describe("FIELD_TYPES", () => {
  it("contains all expected field types", () => {
    const values = FIELD_TYPES.map((f) => f.value);
    expect(values).toEqual(
      expect.arrayContaining([
        "TEXT",
        "TEXTAREA",
        "NUMBER",
        "DATE",
        "SELECT",
        "MULTISELECT",
        "CHECKBOX",
        "URL",
        "EMAIL",
        "PHONE",
      ]),
    );
  });

  it("each field type has value, label, icon", () => {
    for (const f of FIELD_TYPES) {
      expect(f.value).toBeTruthy();
      expect(f.label).toBeTruthy();
      expect(f.icon).toBeTruthy();
    }
  });
});

describe("useClientCustomFields", () => {
  it("returns custom fields for the workspace", async () => {
    const mocks = [
      {
        request: {
          query: GET_CLIENT_CUSTOM_FIELDS,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            clientCustomFields: [
              { id: "cf-1", name: "Industry", type: "TEXT" },
            ],
          },
        },
      },
    ];

    const { result } = renderHook(() => useClientCustomFields("ws-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.fields).toHaveLength(1);
  });

  it("returns [] when no data", () => {
    const { result } = renderHook(() => useClientCustomFields("ws-1"), {
      wrapper: wrap([]),
    });
    expect(result.current.fields).toEqual([]);
  });

  it("skips when no workspaceId", () => {
    const { result } = renderHook(() => useClientCustomFields(null), {
      wrapper: wrap([]),
    });
    expect(result.current.fields).toEqual([]);
  });
});
