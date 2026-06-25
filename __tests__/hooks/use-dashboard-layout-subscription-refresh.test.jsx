import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// ─── Mocks ──────────────────────────────────────────────────────────────────
const mockUseSession = vi.fn();
const mockUseActiveOrganization = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("@/src/lib/auth-client", () => ({
  useSession: () => mockUseSession(),
  authClient: {
    useActiveOrganization: () => mockUseActiveOrganization(),
    subscription: {
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
    },
    getSession: vi.fn().mockResolvedValue({ data: null }),
  },
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: {
    success: (...args) => mockToastSuccess(...args),
    error: (...args) => mockToastError(...args),
  },
}));

vi.mock("@/src/lib/onboarding", () => ({
  getOnboardingStep: () => "completed",
}));

import { useDashboardLayoutSimple } from "@/src/hooks/useDashboardLayoutSimple";

const cacheEntry = (data) =>
  JSON.stringify({ data, timestamp: Date.now() });

describe("useDashboardLayoutSimple — rafraîchissement de l'abonnement (bug bannière figée)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/dashboard");
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ status: "active", plan: "pro", limits: {} }),
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("ne supprime PAS subscription_success de l'URL avant que le polling le consomme", async () => {
    // Retour de Stripe mais org pas encore prête → le polling fait un early
    // return. L'effet 'toast de succès' ne doit pas effacer le paramètre,
    // sinon le polling/invalidation ne le verront jamais (bannière figée).
    window.history.replaceState(
      {},
      "",
      "/dashboard?subscription_success=true",
    );
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", role: "owner" }, session: {} }, // pas d'activeOrganizationId
      isPending: false,
    });
    mockUseActiveOrganization.mockReturnValue({ data: null, isPending: false });

    renderHook(() => useDashboardLayoutSimple());

    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledTimes(1), { timeout: 5000 });
    // Le paramètre survit : aucun effet ne l'a strippé prématurément.
    expect(window.location.search).toContain("subscription_success=true");
  });

  it("purge le cache d'abonnement de l'org quittée lors d'un changement d'organisation", async () => {
    localStorage.setItem(
      "subscription-orgA",
      cacheEntry({ status: "expired" }),
    );
    localStorage.setItem("subscription-orgB", cacheEntry({ status: "active" }));

    const sessionFor = (orgId) => ({
      data: {
        user: { id: "u1", role: "owner" },
        session: { activeOrganizationId: orgId },
      },
      isPending: false,
    });

    mockUseSession.mockReturnValue(sessionFor("orgA"));
    mockUseActiveOrganization.mockReturnValue({
      data: { id: "orgA" },
      isPending: false,
    });

    const { rerender } = renderHook(() => useDashboardLayoutSimple());

    // Cache de orgA encore présent tant qu'on est sur orgA.
    await waitFor(() =>
      expect(localStorage.getItem("subscription-orgA")).not.toBeNull(),
    { timeout: 5000 },
    );

    // Changement vers orgB.
    mockUseSession.mockReturnValue(sessionFor("orgB"));
    mockUseActiveOrganization.mockReturnValue({
      data: { id: "orgB" },
      isPending: false,
    });
    rerender();

    // Le cache de l'org quittée (orgA) est purgé → un retour sur orgA forcera
    // un fetch frais au lieu de réafficher l'ancien statut "expired".
    await waitFor(() =>
      expect(localStorage.getItem("subscription-orgA")).toBeNull(),
    { timeout: 5000 },
    );
  });

  it("un event 'subscription:refresh' vide le cache et refetch (temps réel, sans reload)", async () => {
    // C'est le mécanisme déclenché par l'outil dev après modification en BDD :
    // la bannière se met à jour sans rechargement de page.
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "u1", role: "owner" },
        session: { activeOrganizationId: "orgA" },
      },
      isPending: false,
    });
    mockUseActiveOrganization.mockReturnValue({
      data: { id: "orgA" },
      isPending: false,
    });

    renderHook(() => useDashboardLayoutSimple());
    await waitFor(() => expect(fetch).toHaveBeenCalled(), { timeout: 5000 });
    const callsBefore = fetch.mock.calls.length;

    localStorage.setItem("subscription-orgA", cacheEntry({ status: "active" }));
    act(() =>
      window.dispatchEvent(new CustomEvent("subscription:refresh")),
    );

    // Le cache est vidé puis un nouvel appel API est déclenché.
    await waitFor(() =>
      expect(fetch.mock.calls.length).toBeGreaterThan(callsBefore),
    { timeout: 5000 },
    );
  });
});
