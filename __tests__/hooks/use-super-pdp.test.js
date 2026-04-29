import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const { toastMock } = vi.hoisted(() => ({
  toastMock: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/src/components/ui/sonner", () => ({ toast: toastMock }));

vi.mock("@/src/lib/organization-client", () => ({
  useActiveOrganization: vi.fn(),
}));

import { useSuperPdp } from "@/src/hooks/useSuperPdp";
import { useActiveOrganization } from "@/src/lib/organization-client";

let originalLocation;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  useActiveOrganization.mockReturnValue({
    organization: { id: "org-1" },
  });
  originalLocation = window.location;
  delete window.location;
  window.location = { href: "" };
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  window.location = originalLocation;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useSuperPdp.checkStatus", () => {
  it("hits /api/superpdp/status with the organization id", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        connected: true,
        hasTokens: true,
        environment: "production",
      }),
    });

    const { result } = renderHook(() => useSuperPdp());
    await act(async () => {
      await result.current.checkStatus();
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/superpdp/status?organizationId=org-1",
    );
    await waitFor(() => expect(result.current.connected).toBe(true));
    expect(result.current.environment).toBe("production");
  });

  it("returns null when there is no active organization", async () => {
    useActiveOrganization.mockReturnValue({ organization: null });
    const { result } = renderHook(() => useSuperPdp());
    let returned;
    await act(async () => {
      returned = await result.current.checkStatus();
    });
    expect(returned).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("falls back to connected=false on network error", async () => {
    fetch.mockRejectedValue(new Error("Boom"));
    const { result } = renderHook(() => useSuperPdp());
    await act(async () => {
      await result.current.checkStatus();
    });
    await waitFor(() => expect(result.current.connected).toBe(false));
  });

  it("falls back to connected=false when API returns success=false", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: false }),
    });
    const { result } = renderHook(() => useSuperPdp());
    await act(async () => {
      await result.current.checkStatus();
    });
    await waitFor(() => expect(result.current.connected).toBe(false));
  });
});

describe("useSuperPdp.connect", () => {
  it("redirects to SuperPDP authorization URL on success", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        authorizationUrl: "https://superpdp/oauth?code=abc",
      }),
    });
    const { result } = renderHook(() => useSuperPdp());
    await act(async () => {
      await result.current.connect();
    });
    expect(window.location.href).toBe("https://superpdp/oauth?code=abc");
  });

  it("toasts when no active organization", async () => {
    useActiveOrganization.mockReturnValue({ organization: null });
    const { result } = renderHook(() => useSuperPdp());
    await act(async () => {
      await result.current.connect();
    });
    expect(toastMock.error).toHaveBeenCalledWith("Aucune organisation active");
  });

  it("toasts on API error", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        error: "OAuth provider down",
      }),
    });
    const { result } = renderHook(() => useSuperPdp());
    await act(async () => {
      await result.current.connect();
    });
    expect(toastMock.error).toHaveBeenCalledWith("OAuth provider down");
  });
});

describe("useSuperPdp.disconnect", () => {
  it("sets status.connected=false on success", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    const { result } = renderHook(() => useSuperPdp());
    await act(async () => {
      await result.current.disconnect();
    });
    await waitFor(() => expect(result.current.connected).toBe(false));
    expect(toastMock.success).toHaveBeenCalledWith(
      "Compte SuperPDP déconnecté",
    );
  });

  it("uses POST with the organizationId in the body", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    const { result } = renderHook(() => useSuperPdp());
    await act(async () => {
      await result.current.disconnect();
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/superpdp/disconnect",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ organizationId: "org-1" }),
      }),
    );
  });
});
