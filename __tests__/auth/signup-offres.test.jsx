import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

/**
 * Étape « Choisissez votre abonnement » : même grille que /tarifs (offres,
 * avantages, prix, bascule annuelle), sans la colonne d'essai gratuit, avec
 * un lien vers un conseiller sur chaque offre.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const session = {
  user: {
    id: "507f1f77bcf86cd799439011",
    email: "u@x.fr",
    name: "Jean Dupont",
    onboardingStep: "plan",
    onboardingData: JSON.stringify({ companyName: "Studio Dupont" }),
    createdAt: "2026-01-01T00:00:00.000Z",
  },
};

vi.mock("@/src/lib/auth-client", () => ({
  signIn: { social: vi.fn() },
  performLogout: vi.fn(),
  useSession: () => ({ data: session, isPending: false, refetch: vi.fn() }),
  authClient: { getSession: vi.fn() },
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock("@/src/components/seo/seo-head", () => ({ default: () => null }));
vi.mock("@/src/components/seo/seo-metadata", () => ({ JsonLd: () => null }));
vi.mock("@/src/hooks/use-seo", () => ({ useAuthSEO: () => ({}) }));
vi.mock("@/src/utils/trackEvent", () => ({ trackSignupConversion: vi.fn() }));
vi.mock("@/src/lib/attribution", () => ({ sendAttribution: vi.fn() }));
vi.mock("@/app/auth/signup/registerForm", () => ({ default: () => null }));

import SignUpPage from "@/app/auth/signup/page";

function mockFetch() {
  const fetchMock = vi.fn(async (url) => {
    if (url === "/api/onboarding/step") {
      return { ok: true, json: async () => ({ step: "recap", changed: true }) };
    }
    throw new Error(`fetch inattendu : ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const colonne = (id) => document.getElementById(id);

describe("Inscription : choix de l'offre", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche les trois offres de /tarifs, sans l'essai gratuit", async () => {
    mockFetch();
    render(<SignUpPage />);

    expect(
      await screen.findByText("7 jours d'essai gratuit, sans engagement"),
    ).toBeInTheDocument();

    const offres = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(offres).toEqual(["Freelance", "TPE", "Entreprise"]);
    expect(screen.queryByText("Essai gratuit")).toBeNull();

    // Prix mensuels TTC et avantages de la grille /tarifs.
    expect(within(colonne("freelance")).getByText(/17,99 €/)).toBeTruthy();
    expect(within(colonne("tpe")).getByText(/48,99 €/)).toBeTruthy();
    expect(within(colonne("entreprise")).getByText(/94,99 €/)).toBeTruthy();
    expect(
      within(colonne("freelance")).getByText("Devis et factures illimités"),
    ).toBeTruthy();

    expect(
      screen.getAllByRole("button", { name: "Choisir ce plan" }),
    ).toHaveLength(3);
  });

  it("propose de parler à un conseiller sur chaque offre, Freelance compris", async () => {
    mockFetch();
    render(<SignUpPage />);
    await screen.findByText("7 jours d'essai gratuit, sans engagement");

    for (const id of ["freelance", "tpe", "entreprise"]) {
      const lien = within(colonne(id)).getByRole("link", {
        name: "Parler à un conseiller",
      });
      expect(lien).toHaveAttribute("href", "/contact");
      // Nouvel onglet : l'inscription reste ouverte.
      expect(lien).toHaveAttribute("target", "_blank");
    }
  });

  it("enregistre l'offre et la facturation annuelle choisies", async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    render(<SignUpPage />);
    await screen.findByText("7 jours d'essai gratuit, sans engagement");

    // Une seule bascule pour toute la grille, comme sur /tarifs.
    const bascules = screen.getAllByRole("switch", {
      name: "Facturé à l'année",
    });
    expect(bascules).toHaveLength(3);
    await user.click(bascules[0]);
    bascules.forEach((b) => expect(b).toHaveAttribute("aria-checked", "true"));
    expect(within(colonne("freelance")).getByText(/16,19 €/)).toBeTruthy();

    await user.click(
      within(colonne("freelance")).getByRole("button", {
        name: "Choisir ce plan",
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toMatchObject({
      step: "recap",
      data: { selectedPlan: "freelance", isAnnual: true },
    });

    // Récapitulatif avec l'offre et le prix annuel par mois.
    expect(await screen.findByText("Plan Freelance")).toBeInTheDocument();
    expect(screen.getByText("Annuelle")).toBeInTheDocument();
  });
});
