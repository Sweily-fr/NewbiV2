import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

import { useBankingConnection } from "@/src/hooks/useBankingConnection";

let originalLocation;

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn());
  originalLocation = window.location;
  delete window.location;
  window.location = { href: "" };
});

afterEach(() => {
  window.location = originalLocation;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useBankingConnection.checkConnectionStatus", () => {
  it("polls the status endpoint on mount with workspace header", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        isConnected: true,
        accountsCount: 3,
        hasAccounts: true,
        provider: "gocardless",
      }),
    });

    const { result } = renderHook(() => useBankingConnection("ws-1"));
    await waitFor(() => expect(result.current.isConnected).toBe(true));
    expect(result.current.accountsCount).toBe(3);
    expect(result.current.provider).toBe("gocardless");
    expect(fetch).toHaveBeenCalledWith(
      "/api/banking-connect/status",
      expect.objectContaining({
        headers: expect.objectContaining({ "x-workspace-id": "ws-1" }),
      }),
    );
  });

  it("does not call API without workspaceId", async () => {
    renderHook(() => useBankingConnection(null));
    await act(async () => {});
    expect(fetch).not.toHaveBeenCalled();
  });

  it("falls back to disconnected state on API error", async () => {
    fetch.mockResolvedValue({ ok: false });
    const { result } = renderHook(() => useBankingConnection("ws-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isConnected).toBe(false);
    expect(result.current.accountsCount).toBe(0);
  });
});

describe("useBankingConnection.fetchInstitutions", () => {
  beforeEach(() => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        isConnected: false,
        accountsCount: 0,
        hasAccounts: false,
      }),
    });
  });

  it("returns institutions for the country", async () => {
    const { result } = renderHook(() => useBankingConnection("ws-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        institutions: [{ id: "i-1", name: "BNP" }],
      }),
    });

    let returned;
    await act(async () => {
      returned = await result.current.fetchInstitutions("FR");
    });

    expect(returned).toHaveLength(1);
    expect(result.current.institutions).toHaveLength(1);
    expect(fetch).toHaveBeenLastCalledWith(
      "/api/banking-connect/gocardless/institutions?country=FR",
      expect.any(Object),
    );
  });

  it("uses FR by default", async () => {
    const { result } = renderHook(() => useBankingConnection("ws-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ institutions: [] }),
    });

    await act(async () => {
      await result.current.fetchInstitutions();
    });
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("country=FR"),
      expect.any(Object),
    );
  });

  it("captures error on API failure", async () => {
    const { result } = renderHook(() => useBankingConnection("ws-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "GoCardless down" }),
    });
    await act(async () => {
      await result.current.fetchInstitutions("DE");
    });
    expect(result.current.error).toBe("GoCardless down");
  });
});

describe("useBankingConnection.connectBank", () => {
  beforeEach(() => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        isConnected: false,
        accountsCount: 0,
        hasAccounts: false,
      }),
    });
  });

  it("redirects to the bank's connect URL on success", async () => {
    const { result } = renderHook(() => useBankingConnection("ws-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ connectUrl: "https://bank/connect" }),
    });

    await act(async () => {
      await result.current.connectBank("inst-1");
    });

    expect(window.location.href).toBe("https://bank/connect");
  });

  it("sets error when no institutionId", async () => {
    const { result } = renderHook(() => useBankingConnection("ws-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.connectBank(null);
    });
    expect(result.current.error).toMatch(/banque/i);
  });

  it("sets error when no workspaceId", async () => {
    const { result } = renderHook(() => useBankingConnection(null));
    await act(async () => {
      await result.current.connectBank("inst-1");
    });
    expect(result.current.error).toMatch(/Workspace/i);
  });
});

describe("useBankingConnection.disconnectBank", () => {
  it("returns success on full disconnect (no accountId)", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isConnected: true,
        accountsCount: 1,
        hasAccounts: true,
        provider: "gocardless",
      }),
    });

    const { result } = renderHook(() => useBankingConnection("ws-1"));
    await waitFor(() => expect(result.current.isConnected).toBe(true));

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        mode: "all",
        disconnectedAccountIds: ["a-1"],
        disconnectedItems: [],
      }),
    });

    let returned;
    await act(async () => {
      returned = await result.current.disconnectBank();
    });

    expect(returned.success).toBe(true);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.accountsCount).toBe(0);
  });

  it("returns success=false when no workspaceId", async () => {
    const { result } = renderHook(() => useBankingConnection(null));
    let returned;
    await act(async () => {
      returned = await result.current.disconnectBank();
    });
    expect(returned.success).toBe(false);
  });
});
