import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@/src/contexts/dashboard-layout-context", () => ({
  useSubscription: vi.fn(),
}));

vi.mock("@/src/hooks/usePermissions", () => ({
  usePermissions: vi.fn(),
}));

import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { usePermissions } from "@/src/hooks/usePermissions";

const mockSubscription = (sub, { isActive = true } = {}) => {
  useSubscription.mockReturnValue({
    subscription: sub,
    isActive: () => isActive,
    loading: false,
  });
};

const mockRole = (role) => {
  usePermissions.mockReturnValue({ getUserRole: () => role });
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRole("owner");
});

describe("useSubscriptionAccess — status: trialing", () => {
  it("flags isInTrial and grants full write access", () => {
    const periodEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    mockSubscription({ status: "trialing", periodEnd });

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.isInTrial).toBe(true);
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.canCreate).toBe(true);
    expect(result.current.canEdit).toBe(true);
    expect(result.current.canDelete).toBe(true);
  });

  it("computes trialDaysRemaining (rounded up)", () => {
    const periodEnd = new Date(Date.now() + 5.4 * 24 * 60 * 60 * 1000);
    mockSubscription({ status: "trialing", periodEnd });

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.trialDaysRemaining).toBe(6);
  });

  it("clamps trialDaysRemaining to 0 when periodEnd is in the past", () => {
    const periodEnd = new Date(Date.now() - 1000);
    mockSubscription({ status: "trialing", periodEnd });

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.trialDaysRemaining).toBe(0);
  });
});

describe("useSubscriptionAccess — status: active", () => {
  it("grants full access and shows no banner", () => {
    mockSubscription({ status: "active", plan: "pme" });

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.canCreate).toBe(true);
    expect(result.current.bannerType).toBeNull();
    expect(result.current.plan).toBe("pme");
  });
});

describe("useSubscriptionAccess — status: canceled (still in period)", () => {
  it("flags isCanceled, allows editing, and shows an info banner with reactivate CTA for owner", () => {
    const periodEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    mockSubscription({ status: "canceled", periodEnd });

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.isCanceled).toBe(true);
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.canEdit).toBe(true);
    expect(result.current.bannerType).toBe("info");
    expect(result.current.bannerAction).toBe("Réactiver");
    expect(result.current.canceledDaysRemaining).toBe(5);
  });

  it("removes the action CTA for non-owners", () => {
    const periodEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    mockSubscription({ status: "canceled", periodEnd });
    mockRole("member");

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.isOwner).toBe(false);
    expect(result.current.bannerType).toBe("info");
    expect(result.current.bannerAction).toBeNull();
  });
});

describe("useSubscriptionAccess — status: canceled (period ended)", () => {
  it("flips to read-only with an error banner", () => {
    const periodEnd = new Date(Date.now() - 24 * 60 * 60 * 1000);
    mockSubscription({ status: "canceled", periodEnd });

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.isReadOnly).toBe(true);
    expect(result.current.isCanceled).toBe(false);
    expect(result.current.canCreate).toBe(false);
    expect(result.current.canEdit).toBe(false);
    expect(result.current.canDelete).toBe(false);
    expect(result.current.bannerType).toBe("error");
  });
});

describe("useSubscriptionAccess — status: past_due (grace period)", () => {
  it("keeps write access but shows a warning banner for owner", () => {
    mockSubscription({ status: "past_due" });

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.isGracePeriod).toBe(true);
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.canCreate).toBe(true);
    expect(result.current.bannerType).toBe("warning");
    expect(result.current.bannerAction).toBe("Mettre à jour");
  });

  it("hides the action CTA for non-owners during grace period", () => {
    mockSubscription({ status: "past_due" });
    mockRole("member");

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.bannerType).toBe("warning");
    expect(result.current.bannerAction).toBeNull();
  });
});

describe("useSubscriptionAccess — read-only states", () => {
  it.each([["unpaid"], ["incomplete"], ["expired"]])(
    "marks read-only for status: %s",
    (status) => {
      mockSubscription({ status });

      const { result } = renderHook(() => useSubscriptionAccess());

      expect(result.current.isReadOnly).toBe(true);
      expect(result.current.canCreate).toBe(false);
      expect(result.current.canEdit).toBe(false);
      expect(result.current.canDelete).toBe(false);
    },
  );

  it("marks read-only when there is no subscription at all", () => {
    mockSubscription(null, { isActive: false });

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.isReadOnly).toBe(true);
    expect(result.current.bannerType).toBe("error");
  });
});

describe("useSubscriptionAccess — canExport is always true", () => {
  it.each([["unpaid"], ["incomplete"], ["expired"]])(
    "allows export even in read-only mode (legal 10-year requirement) — %s",
    (status) => {
      mockSubscription({ status });

      const { result } = renderHook(() => useSubscriptionAccess());

      expect(result.current.canExport).toBe(true);
    },
  );
});

describe("useSubscriptionAccess — owner detection", () => {
  it.each([
    ["owner", true],
    ["admin", true],
    ["member", false],
    ["viewer", false],
    [null, false],
  ])("treats role %s as isOwner=%s", (role, expected) => {
    mockRole(role);
    mockSubscription({ status: "active" });

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.isOwner).toBe(expected);
  });
});
