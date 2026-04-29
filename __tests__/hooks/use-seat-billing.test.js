import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { toastMock } = vi.hoisted(() => ({
  toastMock: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/src/components/ui/sonner", () => ({ toast: toastMock }));

vi.mock("@/src/lib/auth-client", () => ({
  useSession: () => ({ data: null }),
}));

import { useSeatBilling } from "@/src/hooks/useSeatBilling";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useSeatBilling.fetchBillingInfo", () => {
  it("returns null without calling fetch when organizationId is missing", async () => {
    const { result } = renderHook(() => useSeatBilling());
    let returned;
    await act(async () => {
      returned = await result.current.fetchBillingInfo();
    });
    expect(returned).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches and stores billing info on success", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ seats: 5, plan: "pme" }),
    });

    const { result } = renderHook(() => useSeatBilling());
    let returned;
    await act(async () => {
      returned = await result.current.fetchBillingInfo("org-1");
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/billing/sync-seats?organizationId=org-1",
      expect.objectContaining({ method: "GET" }),
    );
    expect(returned).toEqual({ seats: 5, plan: "pme" });
    expect(result.current.billingInfo).toEqual({ seats: 5, plan: "pme" });
  });

  it("toasts an error and returns null when the API fails", async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "DB down" }),
    });

    const { result } = renderHook(() => useSeatBilling());
    let returned;
    await act(async () => {
      returned = await result.current.fetchBillingInfo("org-1");
    });
    expect(returned).toBeNull();
    expect(toastMock.error).toHaveBeenCalled();
  });

  it("flips loading=true during the request", async () => {
    let resolveFetch;
    fetch.mockReturnValue(
      new Promise((r) => {
        resolveFetch = r;
      }),
    );
    const { result } = renderHook(() => useSeatBilling());

    let promise;
    act(() => {
      promise = result.current.fetchBillingInfo("org-1");
    });
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveFetch({ ok: true, json: async () => ({}) });
      await promise;
    });
    expect(result.current.loading).toBe(false);
  });
});

describe("useSeatBilling.syncSeats", () => {
  it("returns success:false without calling fetch when organizationId is missing", async () => {
    const { result } = renderHook(() => useSeatBilling());
    let returned;
    await act(async () => {
      returned = await result.current.syncSeats();
    });
    expect(returned).toEqual({ success: false });
    expect(fetch).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalledWith("Organization ID requis");
  });

  it("syncs and refreshes billing info on success", async () => {
    fetch
      .mockResolvedValueOnce({
        // POST /sync-seats
        ok: true,
        json: async () => ({ message: "Synchro ok" }),
      })
      .mockResolvedValueOnce({
        // GET /sync-seats?organizationId
        ok: true,
        json: async () => ({ seats: 5 }),
      });

    const { result } = renderHook(() => useSeatBilling());
    let returned;
    await act(async () => {
      returned = await result.current.syncSeats("org-1");
    });

    expect(returned.success).toBe(true);
    expect(toastMock.success).toHaveBeenCalledWith("Synchro ok");
    // POST + GET (refresh)
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("returns success:false and toasts error when sync fails", async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Stripe down" }),
    });

    const { result } = renderHook(() => useSeatBilling());
    let returned;
    await act(async () => {
      returned = await result.current.syncSeats("org-1");
    });
    expect(returned.success).toBe(false);
    expect(returned.error).toBe("Stripe down");
    expect(toastMock.error).toHaveBeenCalled();
  });
});

describe("useSeatBilling.formatCost", () => {
  it("formats EUR with the fr-FR locale", () => {
    const { result } = renderHook(() => useSeatBilling());
    const formatted = result.current.formatCost(12.5);
    // Be flexible about NBSP vs space and currency placement.
    expect(formatted).toMatch(/12,50/);
    expect(formatted).toMatch(/€/);
  });

  it("supports a custom currency", () => {
    const { result } = renderHook(() => useSeatBilling());
    const formatted = result.current.formatCost(100, "USD");
    expect(formatted).toMatch(/100/);
    expect(formatted).toMatch(/\$|USD/);
  });
});
