import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { useInstalledApps } from "@/src/hooks/useInstalledApps";
import {
  GET_INSTALLED_APPS,
  INSTALL_APP,
  UNINSTALL_APP,
} from "@/src/graphql/installedAppQueries";

import { toast } from "@/src/components/ui/sonner";

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

describe("useInstalledApps query", () => {
  it("returns installed apps from query", async () => {
    const mocks = [
      {
        request: {
          query: GET_INSTALLED_APPS,
          variables: { organizationId: "org-1" },
        },
        result: {
          data: {
            getInstalledApps: [
              { appId: "app-1", name: "Stripe" },
              { appId: "app-2", name: "Pennylane" },
            ],
          },
        },
      },
    ];
    const { result } = renderHook(() => useInstalledApps("org-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.installedApps).toHaveLength(2);
    expect(result.current.installedAppIds).toEqual(["app-1", "app-2"]);
  });

  it("returns sensible defaults on initial render", () => {
    const { result } = renderHook(() => useInstalledApps("org-1"), {
      wrapper: wrap([]),
    });
    expect(result.current.installedApps).toEqual([]);
    expect(result.current.installedAppIds).toEqual([]);
  });

  it("isInstalled() returns true/false based on the list", async () => {
    const mocks = [
      {
        request: {
          query: GET_INSTALLED_APPS,
          variables: { organizationId: "org-1" },
        },
        result: {
          data: { getInstalledApps: [{ appId: "stripe", name: "Stripe" }] },
        },
      },
    ];
    const { result } = renderHook(() => useInstalledApps("org-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isInstalled("stripe")).toBe(true);
    expect(result.current.isInstalled("pennylane")).toBe(false);
  });

  it("skips query when organizationId missing", () => {
    const { result } = renderHook(() => useInstalledApps(null), {
      wrapper: wrap([]),
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.installedApps).toEqual([]);
  });
});

describe("useInstalledApps.installApp", () => {
  it("calls the install mutation and toasts on success", async () => {
    const mocks = [
      {
        request: {
          query: GET_INSTALLED_APPS,
          variables: { organizationId: "org-1" },
        },
        result: { data: { getInstalledApps: [] } },
      },
      {
        request: {
          query: INSTALL_APP,
          variables: { organizationId: "org-1", appId: "stripe" },
        },
        result: { data: { installApp: { appId: "stripe" } } },
      },
    ];
    const { result } = renderHook(() => useInstalledApps("org-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.installApp("stripe");
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("is a no-op when organizationId is missing", async () => {
    const { result } = renderHook(() => useInstalledApps(null), {
      wrapper: wrap([]),
    });
    let out;
    await act(async () => {
      out = await result.current.installApp("stripe");
    });
    expect(out).toBeUndefined();
  });
});

describe("useInstalledApps.uninstallApp", () => {
  it("calls the uninstall mutation and toasts on success", async () => {
    const mocks = [
      {
        request: {
          query: GET_INSTALLED_APPS,
          variables: { organizationId: "org-1" },
        },
        result: { data: { getInstalledApps: [{ appId: "stripe" }] } },
      },
      {
        request: {
          query: UNINSTALL_APP,
          variables: { organizationId: "org-1", appId: "stripe" },
        },
        result: { data: { uninstallApp: true } },
      },
    ];
    const { result } = renderHook(() => useInstalledApps("org-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.uninstallApp("stripe");
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });
});
