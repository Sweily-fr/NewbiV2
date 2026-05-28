import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/src/hooks/useSubscriptionAccess", () => ({
  useSubscriptionAccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
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

  it("shows 'Souscrire' CTA for owner", () => {
    setHook({ isTrialApp: true, trialDaysRemaining: 2, isOwner: true });
    render(<TrialBanner />);
    expect(
      screen.getByRole("link", { name: /souscrire/i }),
    ).toBeInTheDocument();
  });

  it("hides 'Souscrire' CTA for non-owner", () => {
    setHook({ isTrialApp: true, trialDaysRemaining: 2, isOwner: false });
    render(<TrialBanner />);
    expect(screen.queryByRole("link", { name: /souscrire/i })).toBeNull();
    expect(screen.getByText(/Demandez à l'administrateur/)).toBeInTheDocument();
  });
});
