import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

const useSessionMock = vi.fn();
const subscriptionListMock = vi.fn();
const updateUserMock = vi.fn();
const getSessionMock = vi.fn();

vi.mock("@/src/lib/auth-client", () => ({
  useSession: () => useSessionMock(),
  authClient: {
    subscription: { list: (...args) => subscriptionListMock(...args) },
    updateUser: (...args) => updateUserMock(...args),
    getSession: (...args) => getSessionMock(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useDashboardLayout } from "@/src/hooks/useDashboardLayout";

beforeEach(() => {
  useSessionMock.mockReset();
  subscriptionListMock.mockReset();
  updateUserMock.mockReset().mockResolvedValue({});
  getSessionMock.mockReset().mockResolvedValue({});

  useSessionMock.mockReturnValue({
    data: {
      user: {
        id: "u-1",
        role: "owner",
        hasSeenOnboarding: true,
        organization: { id: "org-1" },
      },
      session: { activeOrganizationId: "org-1" },
    },
    isPending: false,
  });
  subscriptionListMock.mockResolvedValue({ data: [], error: null });

  if (typeof localStorage !== "undefined") localStorage.clear();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useDashboardLayout — initial state", () => {
  it("starts loading", () => {
    const { result } = renderHook(() => useDashboardLayout());
    expect(result.current.isLoading).toBe(true);
  });

  it("returns user from session after init", async () => {
    const { result } = renderHook(() => useDashboardLayout());
    await waitFor(() => expect(result.current.user?.id).toBe("u-1"));
    expect(result.current.organization?.id).toBe("org-1");
  });

  it("isInitialized=true after data load", async () => {
    const { result } = renderHook(() => useDashboardLayout());
    await waitFor(() => expect(result.current.isInitialized).toBe(true));
  });
});

describe("useDashboardLayout subscription helpers", () => {
  it("hasFeature returns false without subscription", async () => {
    subscriptionListMock.mockResolvedValue({ data: [], error: null });
    const { result } = renderHook(() => useDashboardLayout());
    await waitFor(() => expect(result.current.isInitialized).toBe(true));
    expect(result.current.hasFeature("invoices")).toBe(false);
    expect(result.current.getLimit("invoices")).toBe(0);
  });

  it("hasFeature returns true when subscription has positive limit", async () => {
    subscriptionListMock.mockResolvedValue({
      data: [{ status: "active", limits: { invoices: 100, kanban: 0 } }],
      error: null,
    });
    const { result } = renderHook(() => useDashboardLayout());
    await waitFor(() => expect(result.current.subscription).toBeTruthy());
    expect(result.current.hasFeature("invoices")).toBe(true);
    expect(result.current.hasFeature("kanban")).toBe(false);
    expect(result.current.getLimit("invoices")).toBe(100);
  });

  it("isActive returns true for active subscription", async () => {
    subscriptionListMock.mockResolvedValue({
      data: [{ status: "active", limits: {} }],
      error: null,
    });
    const { result } = renderHook(() => useDashboardLayout());
    await waitFor(() => expect(result.current.subscription).toBeTruthy());
    expect(result.current.isActive()).toBe(true);
  });

  it("isActive returns true for trialing subscription", async () => {
    subscriptionListMock.mockResolvedValue({
      data: [{ status: "trialing", limits: {} }],
      error: null,
    });
    const { result } = renderHook(() => useDashboardLayout());
    await waitFor(() => expect(result.current.subscription).toBeTruthy());
    expect(result.current.isActive()).toBe(true);
  });
});

describe("useDashboardLayout onboarding", () => {
  it("opens onboarding modal for owner with hasSeenOnboarding=false", async () => {
    useSessionMock.mockReturnValue({
      data: {
        user: { id: "u-1", role: "owner", hasSeenOnboarding: false },
        session: { activeOrganizationId: "org-1" },
      },
      isPending: false,
    });
    const { result } = renderHook(() => useDashboardLayout());
    await waitFor(() => expect(result.current.isOnboardingOpen).toBe(true));
    expect(result.current.shouldShowOnboarding).toBe(true);
  });

  it("does not open modal for already-seen onboarding", async () => {
    const { result } = renderHook(() => useDashboardLayout());
    await waitFor(() => expect(result.current.isInitialized).toBe(true));
    expect(result.current.shouldShowOnboarding).toBe(false);
    expect(result.current.isOnboardingOpen).toBe(false);
  });

  it("does not open modal for non-owner role", async () => {
    useSessionMock.mockReturnValue({
      data: {
        user: { id: "u-2", role: "member", hasSeenOnboarding: false },
        session: { activeOrganizationId: "org-1" },
      },
      isPending: false,
    });
    const { result } = renderHook(() => useDashboardLayout());
    await waitFor(() => expect(result.current.isInitialized).toBe(true));
    expect(result.current.shouldShowOnboarding).toBe(false);
  });

  it("completeOnboarding calls authClient.updateUser", async () => {
    useSessionMock.mockReturnValue({
      data: {
        user: { id: "u-1", role: "owner", hasSeenOnboarding: false },
        session: { activeOrganizationId: "org-1" },
      },
      isPending: false,
    });
    const { result } = renderHook(() => useDashboardLayout());
    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    await act(async () => {
      await result.current.completeOnboarding();
    });

    expect(updateUserMock).toHaveBeenCalledWith({ hasSeenOnboarding: true });
  });
});

describe("useDashboardLayout.refreshLayoutData", () => {
  it("clears localStorage cache and triggers reload", async () => {
    if (typeof localStorage === "undefined") return;
    const cacheKey = "dashboard-layout-u-1-org-1";
    localStorage.setItem(cacheKey, JSON.stringify({ lastUpdate: Date.now() }));

    const { result } = renderHook(() => useDashboardLayout());
    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    act(() => {
      result.current.refreshLayoutData();
    });

    expect(localStorage.getItem(cacheKey)).toBeNull();
  });
});
