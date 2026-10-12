import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/src/hooks/useSubscriptionAccess", () => ({
  useSubscriptionAccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn() }),
}));

// Espace actif et prise en charge par un cabinet (aucun par défaut)
const mockCabinet = { value: null };
vi.mock("@/src/contexts/dashboard-layout-context", () => ({
  useDashboardLayoutContext: () => ({ organization: { id: "org1" } }),
}));
vi.mock("@/src/hooks/useOrgPaidByManager", () => ({
  useOrgPaidByManager: () => mockCabinet.value,
}));

// Droits du rôle : grille non chargée par défaut (repli sur isOwner)
const mockPermissions = { isReady: false, actions: {} };
vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => ({
    isReady: mockPermissions.isReady,
    canDo: (page, action) =>
      (mockPermissions.actions[page] || []).includes(action),
  }),
}));

import { TrialBanner } from "@/src/components/trial-banner";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";

function setHook({
  isTrialApp = false,
  trialDaysRemaining = null,
  isOwner = true,
  loading = false,
} = {}) {
  useSubscriptionAccess.mockReturnValue({
    isTrialApp,
    trialDaysRemaining,
    isOwner,
    loading,
  });
}

describe("TrialBanner — decision #6 (J-3 visibility)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCabinet.value = null;
  });

  it("espace payé par un cabinet : le client n'a rien à souscrire", () => {
    setHook({ isTrialApp: true, trialDaysRemaining: 2 });
    mockCabinet.value = {
      managerName: "Compta Dupont",
      subscriptionStatus: null,
      viewerIsManager: false,
    };
    render(<TrialBanner />);
    expect(
      screen.getByText(/Votre cabinet Compta Dupont choisit l'offre/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Souscrire")).not.toBeInTheDocument();
  });

  it("espace payé par un cabinet : le cabinet est invité à choisir l'offre", () => {
    setHook({ isTrialApp: true, trialDaysRemaining: 1 });
    mockCabinet.value = {
      managerName: "Compta Dupont",
      subscriptionStatus: null,
      viewerIsManager: true,
      linkId: "abc",
    };
    render(<TrialBanner />);
    expect(screen.getByText(/se termine demain/)).toBeInTheDocument();
    expect(screen.getByText("Choisir l'offre").closest("a")).toHaveAttribute(
      "href",
      "/dashboard/gestionnaire?offre=abc",
    );
  });

  it("n'affiche rien tant que la prise en charge n'est pas vérifiée", () => {
    setHook({ isTrialApp: true, trialDaysRemaining: 2 });
    mockCabinet.value = undefined;
    const { container } = render(<TrialBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing while loading", () => {
    setHook({ loading: true });
    const { container } = render(<TrialBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when not in app trial (Stripe-active user — non-regression)", () => {
    setHook({ isTrialApp: false, trialDaysRemaining: 7 });
    const { container } = render(<TrialBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("does NOT render at J-7 (decision #6: only from J-3)", () => {
    setHook({ isTrialApp: true, trialDaysRemaining: 7 });
    const { container } = render(<TrialBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("does NOT render at J-4", () => {
    setHook({ isTrialApp: true, trialDaysRemaining: 4 });
    const { container } = render(<TrialBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders at J-3", () => {
    setHook({ isTrialApp: true, trialDaysRemaining: 3 });
    render(<TrialBanner />);
    expect(screen.getByText(/3 jours/)).toBeInTheDocument();
  });

  it("renders at J-2", () => {
    setHook({ isTrialApp: true, trialDaysRemaining: 2 });
    render(<TrialBanner />);
    expect(screen.getByText(/2 jours/)).toBeInTheDocument();
  });

  it("renders 'Il reste 1 jour' (singular) at J-1", () => {
    setHook({ isTrialApp: true, trialDaysRemaining: 1 });
    render(<TrialBanner />);
    expect(screen.getByText(/1 jour à votre essai/)).toBeInTheDocument();
  });

  it("renders 'aujourd'hui' at J-0", () => {
    setHook({ isTrialApp: true, trialDaysRemaining: 0 });
    render(<TrialBanner />);
    expect(screen.getByText(/aujourd'hui/)).toBeInTheDocument();
  });

  it("shows 'Souscrire' CTA for owner and fires onSubscribe on click", () => {
    setHook({ isTrialApp: true, trialDaysRemaining: 2, isOwner: true });
    const onSubscribe = vi.fn();
    render(<TrialBanner onSubscribe={onSubscribe} />);
    const cta = screen.getByRole("button", { name: /souscrire/i });
    expect(cta).toBeInTheDocument();
    fireEvent.click(cta);
    expect(onSubscribe).toHaveBeenCalledTimes(1);
  });

  it("hides 'Souscrire' CTA for non-owner", () => {
    setHook({ isTrialApp: true, trialDaysRemaining: 2, isOwner: false });
    render(<TrialBanner />);
    expect(screen.queryByRole("button", { name: /souscrire/i })).toBeNull();
    expect(screen.getByText(/Demandez à l'administrateur/)).toBeInTheDocument();
  });
  it("suit le droit « Gérer l'abonnement » une fois la grille chargée", () => {
    setHook({ isTrialApp: true, trialDaysRemaining: 2, isOwner: true });
    mockPermissions.isReady = true;
    mockPermissions.actions = { billing: ["view"] };
    try {
      render(<TrialBanner />);
      expect(screen.queryByRole("button", { name: /souscrire/i })).toBeNull();
    } finally {
      mockPermissions.isReady = false;
      mockPermissions.actions = {};
    }
  });
});
