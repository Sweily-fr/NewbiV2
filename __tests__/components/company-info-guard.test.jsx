import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

/**
 * Fenêtre « Configuration de votre entreprise » : posée sur les pages de
 * création de documents. « Retour » (ou la fermeture de la fenêtre) ramène
 * d'où l'on vient, en général la liste qui a lancé la création.
 */

const router = { back: vi.fn(), push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
// Formulaire de la fenêtre (chargé à la demande) : son bouton « Retour »
// suffit ici, le formulaire est testé à part (company-info-form.test.jsx).
vi.mock("next/dynamic", () => ({
  default: () => (props) => (
    <button type="button" onClick={props.onCancel}>
      Retour
    </button>
  ),
}));

let organization;
vi.mock("@/src/contexts/dashboard-layout-context", () => ({
  useDashboardLayoutContext: () => ({ organization, isLoading: false }),
}));
vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => ({ canDo: () => true, isReady: true }),
}));

import { CompanyInfoGuard } from "@/src/components/company-info-guard";

const COMPLETE = {
  companyName: "Studio Dupont",
  companyEmail: "contact@studio.fr",
  addressStreet: "1 rue de Paris",
  addressCity: "Paris",
  addressZipCode: "75001",
  addressCountry: "France",
  siret: "12345678900011",
  legalForm: "SASU",
  rcs: "RCS Paris 123 456 789",
  capitalSocial: "1000",
};

const renderGuard = () =>
  render(
    <CompanyInfoGuard fallback={<p>squelette</p>}>
      <p>éditeur</p>
    </CompanyInfoGuard>,
  );

describe("CompanyInfoGuard", () => {
  // Arrivée depuis la liste : il y a une page où revenir.
  const setHistoryLength = (length) =>
    Object.defineProperty(window.history, "length", {
      configurable: true,
      get: () => length,
    });

  beforeEach(() => {
    vi.clearAllMocks();
    setHistoryLength(2);
  });

  it("affiche la page quand les informations sont complètes", () => {
    organization = COMPLETE;
    renderGuard();

    expect(screen.getByText("éditeur")).toBeInTheDocument();
    expect(screen.queryByText("Configuration de votre entreprise")).toBeNull();
  });

  it("ouvre la fenêtre sans SIRET, et « Retour » revient en arrière", async () => {
    organization = { ...COMPLETE, siret: "" };
    const user = userEvent.setup();
    renderGuard();

    expect(
      await screen.findByText("Configuration de votre entreprise"),
    ).toBeInTheDocument();
    expect(screen.queryByText("éditeur")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Retour" }));
    expect(router.back).toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalledWith("/dashboard");
  });

  it("fermer la fenêtre (Échap) revient aussi en arrière", async () => {
    organization = { ...COMPLETE, siret: "" };
    const user = userEvent.setup();
    renderGuard();

    await screen.findByText("Configuration de votre entreprise");
    await user.keyboard("{Escape}");

    expect(router.back).toHaveBeenCalled();
  });

  it("revient à l'accueil si la page a été ouverte directement", async () => {
    organization = { ...COMPLETE, siret: "" };
    setHistoryLength(1);
    const user = userEvent.setup();
    renderGuard();

    await user.click(await screen.findByRole("button", { name: "Retour" }));

    expect(router.back).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith("/dashboard");
  });
});
