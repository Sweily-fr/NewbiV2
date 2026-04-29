import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

import { usePennylane } from "@/src/hooks/usePennylane";
import {
  MY_PENNYLANE_ACCOUNT,
  TEST_PENNYLANE_CONNECTION,
  CONNECT_PENNYLANE,
  DISCONNECT_PENNYLANE,
} from "@/src/graphql/mutations/pennylane";

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
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

const buildAccount = (overrides = {}) => ({
  id: "p-1",
  organizationId: "org-1",
  isConnected: true,
  syncStatus: "IDLE",
  lastSyncAt: null,
  ...overrides,
});

describe("usePennylane — initial state", () => {
  it("returns connected=true when account exists", async () => {
    const mocks = [
      {
        request: { query: MY_PENNYLANE_ACCOUNT },
        result: { data: { myPennylaneAccount: buildAccount() } },
      },
    ];
    const { result } = renderHook(() => usePennylane("org-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isConnected).toBe(true);
    expect(result.current.syncStatus).toBe("IDLE");
  });

  it("returns connected=false when no account", async () => {
    const mocks = [
      {
        request: { query: MY_PENNYLANE_ACCOUNT },
        result: { data: { myPennylaneAccount: null } },
      },
    ];
    const { result } = renderHook(() => usePennylane("org-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isConnected).toBe(false);
  });

  it("skips query when no organizationId", async () => {
    const { result } = renderHook(() => usePennylane(null), {
      wrapper: wrap([]),
    });
    expect(result.current.isConnected).toBe(false);
  });
});

describe("usePennylane.testConnection", () => {
  it("returns success on valid token", async () => {
    const mocks = [
      {
        request: { query: MY_PENNYLANE_ACCOUNT },
        result: { data: { myPennylaneAccount: null } },
      },
      {
        request: {
          query: TEST_PENNYLANE_CONNECTION,
          variables: { apiToken: "tok-valid" },
        },
        result: {
          data: {
            testPennylaneConnection: {
              success: true,
              message: "OK",
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => usePennylane("org-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let returned;
    await act(async () => {
      returned = await result.current.testConnection("tok-valid");
    });
    expect(returned.success).toBe(true);
  });

  it("captures error when token is invalid", async () => {
    const mocks = [
      {
        request: { query: MY_PENNYLANE_ACCOUNT },
        result: { data: { myPennylaneAccount: null } },
      },
      {
        request: {
          query: TEST_PENNYLANE_CONNECTION,
          variables: { apiToken: "tok-bad" },
        },
        result: {
          data: {
            testPennylaneConnection: {
              success: false,
              message: "Invalid token",
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => usePennylane("org-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.testConnection("tok-bad");
    });
    await waitFor(() => expect(result.current.error).toBe("Invalid token"));
  });
});

describe("usePennylane.clearError", () => {
  it("clears the error state", async () => {
    const mocks = [
      {
        request: { query: MY_PENNYLANE_ACCOUNT },
        result: { data: { myPennylaneAccount: null } },
      },
      {
        request: {
          query: TEST_PENNYLANE_CONNECTION,
          variables: { apiToken: "x" },
        },
        result: {
          data: {
            testPennylaneConnection: {
              success: false,
              message: "Boom",
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => usePennylane("org-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.testConnection("x");
    });
    await waitFor(() => expect(result.current.error).toBe("Boom"));

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
