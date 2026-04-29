import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { toastMock } = vi.hoisted(() => ({
  toastMock: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

vi.mock("@/src/components/ui/sonner", () => ({ toast: toastMock }));

vi.mock("@/src/hooks/useWorkspace", () => ({
  useRequiredWorkspace: () => ({ workspaceId: "ws-1" }),
}));

import { useAutoReconcile } from "@/src/hooks/useAutoReconcile";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useAutoReconcile.findMatchingTransaction", () => {
  it("returns the API match result on success", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        match: { transactionId: "tx-1", confidence: "high" },
      }),
    });

    const { result } = renderHook(() => useAutoReconcile());
    let returned;
    await act(async () => {
      returned = await result.current.findMatchingTransaction({
        amount: 100,
        date: "2026-04-15",
        vendor: "Acme",
      });
    });

    expect(returned.match.confidence).toBe("high");
    expect(result.current.matchResult).toEqual(returned);
    expect(fetch).toHaveBeenCalledWith(
      "/api/unified-expenses/match",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("captures error message on API failure", async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Match service down" }),
    });
    const { result } = renderHook(() => useAutoReconcile());
    await act(async () => {
      await result.current.findMatchingTransaction({ amount: 100 });
    });
    expect(result.current.error).toBe("Match service down");
  });

  it("flips isSearching during the request", async () => {
    let resolve;
    fetch.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { result } = renderHook(() => useAutoReconcile());

    let promise;
    act(() => {
      promise = result.current.findMatchingTransaction({ amount: 100 });
    });
    expect(result.current.isSearching).toBe(true);

    await act(async () => {
      resolve({ ok: true, json: async () => ({}) });
      await promise;
    });
    expect(result.current.isSearching).toBe(false);
  });
});

describe("useAutoReconcile.autoReconcile", () => {
  it("toasts success on auto-matched action", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        action: "auto-matched",
        matchedTransaction: { description: "CARREFOUR" },
      }),
    });

    const { result } = renderHook(() => useAutoReconcile());
    await act(async () => {
      await result.current.autoReconcile(
        new Blob(["x"]),
        { vendor: "Acme" },
        null,
      );
    });
    expect(toastMock.success).toHaveBeenCalled();
  });

  it("toasts info on 'created' action", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ action: "created" }),
    });
    const { result } = renderHook(() => useAutoReconcile());
    await act(async () => {
      await result.current.autoReconcile(new Blob(["x"]));
    });
    expect(toastMock.info).toHaveBeenCalled();
  });

  it("toasts error on API failure", async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "OCR failed" }),
    });
    const { result } = renderHook(() => useAutoReconcile());
    await act(async () => {
      await result.current.autoReconcile(new Blob(["x"]));
    });
    expect(toastMock.error).toHaveBeenCalled();
    expect(result.current.error).toBe("OCR failed");
  });
});

describe("useAutoReconcile.reset", () => {
  it("clears matchResult/reconcileResult/error", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ match: { id: "x" } }),
    });
    const { result } = renderHook(() => useAutoReconcile());
    await act(async () => {
      await result.current.findMatchingTransaction({ amount: 100 });
    });
    expect(result.current.matchResult).toBeTruthy();

    act(() => result.current.reset());
    expect(result.current.matchResult).toBeNull();
    expect(result.current.reconcileResult).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
