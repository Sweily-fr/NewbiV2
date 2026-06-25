import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// usePathname est mutable pour tester le masquage sur /parametres.
let mockPathname = "/dashboard";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("@/src/hooks/useSubscriptionAccess", () => ({
  useSubscriptionAccess: vi.fn(),
}));

import {
  SubscriptionReadOnlyBanner,
  SubscriptionReadOnlyBannerView,
} from "@/src/components/subscription-readonly-banner";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";

function setHook({
  bannerType = "error",
  bannerMessage = "Votre abonnement a expiré. Vos données sont en lecture seule.",
  bannerAction = "Renouveler l'abonnement",
  isOwner = true,
  loading = false,
} = {}) {
  useSubscriptionAccess.mockReturnValue({
    bannerType,
    bannerMessage,
    bannerAction,
    isOwner,
    loading,
  });
}

let fetchMock;

describe("SubscriptionReadOnlyBanner — bug 'Renouvellement' (toast d'erreur)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/dashboard";
    // Si le composant tentait encore d'appeler l'API billing-portal, ce spy
    // le révélerait — l'ancien comportement (bug) faisait un fetch ici.
    fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("ne s'affiche pas pendant le chargement", () => {
    setHook({ loading: true });
    const { container } = render(<SubscriptionReadOnlyBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("ne s'affiche pas sans bannerType (abonnement actif)", () => {
    setHook({ bannerType: null, bannerMessage: null, bannerAction: null });
    const { container } = render(<SubscriptionReadOnlyBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("ne s'affiche pas sur la page paramètres (évite le doublon)", () => {
    mockPathname = "/dashboard/parametres";
    setHook();
    const { container } = render(<SubscriptionReadOnlyBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("affiche le message d'expiration et le bouton pour un owner", () => {
    setHook();
    render(<SubscriptionReadOnlyBanner />);
    expect(screen.getByText(/expiré/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /renouveler/i }),
    ).toBeInTheDocument();
  });

  it("le clic ouvre la souscription via onSubscribe et N'APPELLE PAS billing-portal", () => {
    const onSubscribe = vi.fn();
    setHook();
    render(<SubscriptionReadOnlyBanner onSubscribe={onSubscribe} />);

    fireEvent.click(screen.getByRole("button", { name: /renouveler/i }));

    expect(onSubscribe).toHaveBeenCalledTimes(1);
    // Cœur du fix : plus aucun appel réseau vers le portail Stripe (qui
    // renvoyait une 400 "Customer ID requis" → toast d'erreur).
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sans onSubscribe, le clic dispatche openSettingsModal(subscription) sur document", () => {
    setHook();
    const handler = vi.fn();
    document.addEventListener("openSettingsModal", handler);
    render(<SubscriptionReadOnlyBanner />);

    fireEvent.click(screen.getByRole("button", { name: /renouveler/i }));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      section: "subscription",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    document.removeEventListener("openSettingsModal", handler);
  });

  it("ne montre pas de bouton d'action pour un membre non-owner", () => {
    setHook({
      isOwner: false,
      bannerMessage:
        "L'abonnement de cet espace a expiré. Contactez l'administrateur pour le renouveler.",
    });
    render(<SubscriptionReadOnlyBanner />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText(/administrateur/i)).toBeInTheDocument();
  });
});

// La View pure est ce que le bac à sable (app/test-subscription-banner) rend
// avec des données contrôlées, sans hooks ni auth.
describe("SubscriptionReadOnlyBannerView — présentation pure", () => {
  it("ne rend rien sans bannerType", () => {
    const { container } = render(
      <SubscriptionReadOnlyBannerView bannerType={null} isOwner />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("rend le message et déclenche onAction au clic (owner)", () => {
    const onAction = vi.fn();
    render(
      <SubscriptionReadOnlyBannerView
        bannerType="error"
        bannerMessage="Votre abonnement a expiré."
        bannerAction="Renouveler l'abonnement"
        isOwner
        onAction={onAction}
      />,
    );
    expect(screen.getByText(/expiré/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /renouveler/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("masque le bouton pour un non-owner même si bannerAction est défini", () => {
    render(
      <SubscriptionReadOnlyBannerView
        bannerType="error"
        bannerMessage="…"
        bannerAction="Renouveler l'abonnement"
        isOwner={false}
        onAction={() => {}}
      />,
    );
    expect(screen.queryByRole("button")).toBeNull();
  });
});
