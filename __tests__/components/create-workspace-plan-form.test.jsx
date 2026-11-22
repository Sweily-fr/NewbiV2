import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

vi.mock("@/src/lib/analytics", () => ({ capture: vi.fn() }));

import { PLANS, PlanForm } from "@/src/components/create-workspace/plan-form";
import { COLONNES_OFFRES } from "@/src/components/pricing/pricing-offers";

/**
 * Étape d'offre de /create-workspace (« Nouvel espace ») : mêmes offres,
 * avantages et prix que /tarifs, même bascule mensuel / annuel.
 */
describe("Création d'espace : offres alignées sur /tarifs", () => {
  it("reprend les noms et les avantages de /tarifs", () => {
    expect(PLANS.map((p) => p.name)).toEqual([
      "Standard",
      "Premium",
      "Entreprise",
    ]);
    for (const plan of PLANS) {
      const offre = COLONNES_OFFRES.find((c) => c.cle === plan.key);
      expect(plan.features).toEqual(offre.features);
      expect(plan.intro).toBe(offre.intro ?? null);
    }
    // Avantages de l'ancien écran, absents de /tarifs.
    const tous = PLANS.flatMap((p) => p.features);
    expect(tous).not.toContain("Permissions avancées");
    expect(tous).not.toContain("Archivage légal & API");
  });
});

describe("Création d'espace : étape d'offre", () => {
  let props;
  beforeEach(() => {
    props = {
      selectedPlan: "",
      setSelectedPlan: vi.fn(),
      isAnnual: false,
      setIsAnnual: vi.fn(),
      onContinue: vi.fn(),
    };
  });

  it("affiche les prix mensuels TTC et le rythme de facturation", () => {
    render(<PlanForm {...props} />);
    expect(
      screen.getByText(/17,99\s€\/mois TTC · Facturé chaque mois/),
    ).toBeInTheDocument();
    expect(screen.getByText(/48,99\s€\/mois TTC/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuer" })).toBeDisabled();
  });

  it("affiche les prix à l'année avec le total facturé", () => {
    render(<PlanForm {...props} isAnnual />);
    expect(
      screen.getByText(/16,19\s€\/mois TTC · Facturé 194,28\s€ par an/),
    ).toBeInTheDocument();
  });

  it("choisit une offre et bascule la facturation", async () => {
    const user = userEvent.setup();
    render(<PlanForm {...props} />);

    await user.click(screen.getByRole("button", { name: /^Premium/ }));
    expect(props.setSelectedPlan).toHaveBeenCalledWith("pme");

    await user.click(screen.getByRole("button", { name: /^Annuel/ }));
    expect(props.setIsAnnual).toHaveBeenCalledWith(true);
  });

  it("propose de parler à un conseiller dans un nouvel onglet", () => {
    render(<PlanForm {...props} />);
    const lien = screen.getByRole("link", { name: "Parler à un conseiller" });
    expect(lien).toHaveAttribute("href", "/contact");
    expect(lien).toHaveAttribute("target", "_blank");
  });
});
