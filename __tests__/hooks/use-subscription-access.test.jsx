import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const { subState, permState } = vi.hoisted(() => ({
  subState: {
    subscription: null,
    isActive: vi.fn(() => false),
    loading: false,
  },
  permState: {
    getUserRole: vi.fn(() => "member"),
  },
}));

vi.mock("@/src/contexts/dashboard-layout-context", () => ({
  useSubscription: () => subState,
}));

vi.mock("@/src/hooks/usePermissions", () => ({
  usePermissions: () => permState,
}));

import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";

beforeEach(() => {
  subState.subscription = null;
  subState.isActive = vi.fn(() => false);
  subState.loading = false;
  permState.getUserRole = vi.fn(() => "member");
});

describe("useSubscriptionAccess", () => {
  it("no subscription → readOnly + error banner for owner", () => {
    permState.getUserRole = vi.fn(() => "owner");
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(true);
    expect(result.current.canCreate).toBe(false);
    expect(result.current.canExport).toBe(true);
    expect(result.current.bannerType).toBe("error");
    expect(result.current.bannerAction).toMatch(/Renouveler/);
  });

  it("no subscription + non-owner → readOnly + no action", () => {
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(true);
    expect(result.current.bannerType).toBe("error");
    expect(result.current.bannerAction).toBeNull();
  });

  it("trialing → not readOnly, isInTrial=true, daysRemaining > 0", () => {
    subState.subscription = {
      status: "trialing",
      periodEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    };
    subState.isActive = vi.fn(() => true);
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isInTrial).toBe(true);
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.trialDaysRemaining).toBeGreaterThan(0);
    expect(result.current.canCreate).toBe(true);
  });

  it("active → all good, no banner", () => {
    subState.subscription = { status: "active", plan: "freelance" };
    subState.isActive = vi.fn(() => true);
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.bannerType).toBeNull();
    expect(result.current.canCreate).toBe(true);
  });

  it("past_due → grace period, warning banner for owner", () => {
    permState.getUserRole = vi.fn(() => "owner");
    subState.subscription = { status: "past_due" };
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isGracePeriod).toBe(true);
    expect(result.current.bannerType).toBe("warning");
    expect(result.current.bannerAction).toMatch(/Mettre à jour/);
  });

  it("unpaid → readOnly, error banner", () => {
    subState.subscription = { status: "unpaid" };
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(true);
    expect(result.current.canCreate).toBe(false);
  });

  it("expired → readOnly", () => {
    subState.subscription = { status: "expired" };
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(true);
  });

  it("canceled with future periodEnd → not readOnly, info banner", () => {
    permState.getUserRole = vi.fn(() => "owner");
    subState.subscription = {
      status: "canceled",
      periodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isCanceled).toBe(true);
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.bannerType).toBe("info");
    expect(result.current.bannerAction).toMatch(/Réactiver/);
  });

  it("canceled with past periodEnd → readOnly", () => {
    subState.subscription = {
      status: "canceled",
      periodEnd: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(true);
  });
});
