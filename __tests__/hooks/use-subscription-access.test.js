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

const inFuture = (days) => new Date(Date.now() + days * 86_400_000);
const inPast = (days) => new Date(Date.now() - days * 86_400_000);

function mockContext({
  subscription = null,
  isActive = false,
  loading = false,
  role = "owner",
  lastFetchOk = true,
} = {}) {
  useSubscription.mockReturnValue({
    subscription,
    isActive: () => isActive,
    loading,
    lastFetchOk,
  });
  usePermissions.mockReturnValue({ getUserRole: () => role });
}

describe("useSubscriptionAccess — Stripe-only behaviour (flag OFF)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("treats Stripe-active sub as full access — no regression", () => {
    mockContext({
      subscription: {
        status: "active",
        appTrialEnabled: false,
        isTrialActive: false,
      },
      isActive: true,
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.canCreate).toBe(true);
    expect(result.current.canEdit).toBe(true);
    expect(result.current.canDelete).toBe(true);
    expect(result.current.isTrialApp).toBe(false);
    expect(result.current.isInTrial).toBe(false);
  });

  it("past_due is no longer read-only (Lot 5 décision #12 — grace period)", () => {
    mockContext({
      subscription: {
        status: "past_due",
        appTrialEnabled: false,
      },
      isActive: true, // hook now treats past_due as active
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.isGracePeriod).toBe(true);
  });

  it("treats Stripe trialing as in-trial", () => {
    const future = inFuture(20);
    mockContext({
      subscription: {
        status: "trialing",
        periodEnd: future,
        appTrialEnabled: false,
      },
      isActive: true,
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isInTrial).toBe(true);
    expect(result.current.isTrialApp).toBe(false);
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.trialDaysRemaining).toBeGreaterThan(0);
  });

  it("ignores trial fields when appTrialEnabled is false (no regression)", () => {
    // Even if the org doc has trial fields, when the flag is OFF the API
    // returns appTrialEnabled=false → hook must NOT treat as active.
    mockContext({
      subscription: {
        status: null,
        appTrialEnabled: false,
        isTrialActive: true,
        trialEndDate: inFuture(30).toISOString(),
      },
      isActive: false,
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isTrialApp).toBe(false);
    expect(result.current.isReadOnly).toBe(true);
  });

  it("no subscription + not loading → read only", () => {
    mockContext({ subscription: null, isActive: false, loading: false });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(true);
    expect(result.current.canCreate).toBe(false);
  });

  it("unpaid status → read only", () => {
    mockContext({
      subscription: { status: "unpaid", appTrialEnabled: false },
      isActive: false,
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(true);
  });
});

describe("useSubscriptionAccess — app-managed trial (flag ON)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("active app trial → full access, isTrialApp=true", () => {
    mockContext({
      subscription: {
        status: null, // No Stripe sub yet
        appTrialEnabled: true,
        isTrialActive: true,
        trialEndDate: inFuture(10).toISOString(),
      },
      isActive: true,
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isTrialApp).toBe(true);
    expect(result.current.isInTrial).toBe(true);
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.canCreate).toBe(true);
    expect(result.current.trialDaysRemaining).toBeGreaterThanOrEqual(9);
    expect(result.current.trialDaysRemaining).toBeLessThanOrEqual(10);
  });

  it("expired app trial + no Stripe sub → read only", () => {
    mockContext({
      subscription: {
        status: null,
        appTrialEnabled: true,
        isTrialActive: true, // backend may not have flipped this yet
        trialEndDate: inPast(1).toISOString(),
      },
      isActive: false,
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isTrialApp).toBe(false);
    expect(result.current.isReadOnly).toBe(true);
  });

  it("isTrialActive=false even with future trialEndDate → not trial app", () => {
    mockContext({
      subscription: {
        status: null,
        appTrialEnabled: true,
        isTrialActive: false,
        trialEndDate: inFuture(10).toISOString(),
      },
      isActive: false,
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isTrialApp).toBe(false);
    expect(result.current.isReadOnly).toBe(true);
  });

  it("app trial active + Stripe sub also active → both true, no read only", () => {
    mockContext({
      subscription: {
        status: "active",
        appTrialEnabled: true,
        isTrialActive: true,
        trialEndDate: inFuture(5).toISOString(),
      },
      isActive: true,
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.isTrialApp).toBe(true);
  });

  // Lot 3 safety net — fetch failure must NOT be interpreted as "expired"
  it("safety net: fetch failure with no subscription does NOT trigger isReadOnly", () => {
    mockContext({
      subscription: null,
      isActive: false,
      loading: false,
      lastFetchOk: false, // ← fetch errored
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.bannerType).toBeNull();
  });

  it("safety net: fetch failure does not override Stripe-active sub", () => {
    mockContext({
      subscription: { status: "active" },
      isActive: true,
      loading: false,
      lastFetchOk: true,
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(false);
  });

  it("trialDaysRemaining respects decision #6: banner shows from J-3 only", () => {
    // J-2 case
    mockContext({
      subscription: {
        status: null,
        appTrialEnabled: true,
        isTrialActive: true,
        trialEndDate: inFuture(2).toISOString(),
      },
      isActive: true,
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.trialDaysRemaining).toBeLessThanOrEqual(2);
    expect(result.current.isTrialApp).toBe(true);
    // The TrialBanner component reads this and decides visibility.
  });
});

// ─── Banner derivation (bannerType / bannerMessage / bannerAction) ──────────
// Ce que SubscriptionReadOnlyBanner lit pour s'afficher. Régression liée au
// bug "bannière Expiré + bouton Renouvellement" : on verrouille ici le
// libellé d'action attendu pour chaque statut.
describe("useSubscriptionAccess — banner state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("expired + owner → error banner with 'Renouveler l'abonnement' action", () => {
    mockContext({
      subscription: { status: "expired", appTrialEnabled: false },
      role: "owner",
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(true);
    expect(result.current.bannerType).toBe("error");
    expect(result.current.bannerMessage).toMatch(/expiré/i);
    expect(result.current.bannerAction).toBe("Renouveler l'abonnement");
  });

  it("expired + member → error banner WITHOUT action (contact admin)", () => {
    mockContext({
      subscription: { status: "expired", appTrialEnabled: false },
      role: "member",
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(true);
    expect(result.current.isOwner).toBe(false);
    expect(result.current.bannerType).toBe("error");
    expect(result.current.bannerAction).toBeNull();
    expect(result.current.bannerMessage).toMatch(/administrateur/i);
  });

  it("admin role is treated as owner (gets the action button)", () => {
    mockContext({
      subscription: { status: "expired", appTrialEnabled: false },
      role: "admin",
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isOwner).toBe(true);
    expect(result.current.bannerAction).toBe("Renouveler l'abonnement");
  });

  it("no subscription + owner → expired error banner", () => {
    mockContext({ subscription: null, role: "owner", loading: false });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(true);
    expect(result.current.bannerType).toBe("error");
    expect(result.current.bannerAction).toBe("Renouveler l'abonnement");
  });

  it("canceled period ended → expired error banner", () => {
    mockContext({
      subscription: {
        status: "canceled",
        periodEnd: inPast(1).toISOString(),
        appTrialEnabled: false,
      },
      role: "owner",
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(true);
    expect(result.current.bannerType).toBe("error");
    expect(result.current.bannerAction).toBe("Renouveler l'abonnement");
  });

  it("past_due + owner → warning banner with 'Mettre à jour' action", () => {
    mockContext({
      subscription: { status: "past_due", appTrialEnabled: false },
      role: "owner",
      isActive: true,
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.bannerType).toBe("warning");
    expect(result.current.bannerAction).toBe("Mettre à jour");
  });

  it("canceled but still in paid period + owner → info banner with 'Réactiver'", () => {
    mockContext({
      subscription: {
        status: "canceled",
        periodEnd: inFuture(10).toISOString(),
        appTrialEnabled: false,
      },
      role: "owner",
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.bannerType).toBe("info");
    expect(result.current.bannerAction).toBe("Réactiver");
  });

  it("active subscription → no banner at all", () => {
    mockContext({
      subscription: { status: "active", appTrialEnabled: false },
      isActive: true,
      role: "owner",
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.bannerType).toBeNull();
    expect(result.current.bannerMessage).toBeNull();
    expect(result.current.bannerAction).toBeNull();
  });

  it("fetch failed (lastFetchOk=false) → no banner (safety net)", () => {
    mockContext({
      subscription: null,
      role: "owner",
      loading: false,
      lastFetchOk: false,
    });
    const { result } = renderHook(() => useSubscriptionAccess());
    expect(result.current.bannerType).toBeNull();
  });
});
