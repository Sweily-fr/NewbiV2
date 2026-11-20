import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import PricingPlansSection from "@/app/(main)/tarifs/section/PricingPlansSection";

/**
 * Grille de /tarifs : essai gratuit + trois offres, une seule bascule
 * mensuel / annuel, et un lien vers un conseiller sous chaque offre payante
 * (Freelance compris depuis le 20/11/2026).
 */
const colonne = (id) => document.getElementById(id);

describe("/tarifs : grille des offres", () => {
  it("garde la colonne d'essai gratuit et les trois offres", () => {
    render(<PricingPlansSection />);
    const colonnes = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(colonnes).toEqual([
      "Essai gratuit",
      "Freelance",
      "TPE",
      "Entreprise",
    ]);
    expect(
      screen.getAllByRole("link", { name: "Commencer gratuitement" }),
    ).toHaveLength(4);
    // « Tout Freelance, plus : » ouvre la liste de TPE.
    const puces = within(colonne("tpe"))
      .getAllByRole("listitem")
      .map((li) => li.textContent);
    expect(puces[0]).toBe("Tout Freelance, plus :");
    expect(puces).toHaveLength(8);
  });

  it("propose un conseiller sous les trois offres payantes, pas sous l'essai", () => {
    render(<PricingPlansSection />);
    for (const id of ["freelance", "tpe", "entreprise"]) {
      const lien = within(colonne(id)).getByRole("link", {
        name: "parler à un conseiller",
      });
      expect(lien).toHaveAttribute("href", "/contact");
      // Sur /tarifs, le lien s'ouvre dans le même onglet.
      expect(lien).not.toHaveAttribute("target");
    }
    expect(
      within(colonne("essai")).queryByRole("link", {
        name: "parler à un conseiller",
      }),
    ).toBeNull();
  });

  it("bascule tous les prix à l'année avec une seule commande", async () => {
    const user = userEvent.setup();
    render(<PricingPlansSection />);

    // Plus d'interrupteur dans chaque colonne.
    expect(screen.queryAllByRole("switch")).toHaveLength(0);
    // Mensuel par défaut : 17,99 € TTC, le prix de référence.
    expect(within(colonne("freelance")).getByText(/17,99\s€/)).toBeTruthy();
    expect(
      within(colonne("freelance")).getByText("Facturé chaque mois"),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /^Annuel/ }));

    expect(within(colonne("freelance")).getByText(/16,19\s€/)).toBeTruthy();
    expect(within(colonne("tpe")).getByText(/44,09\s€/)).toBeTruthy();
    expect(within(colonne("entreprise")).getByText(/85,49\s€/)).toBeTruthy();
    expect(
      within(colonne("entreprise")).getByText(/Facturé 1\s025,88\s€ par an/),
    ).toBeTruthy();
    // L'essai reste à 0 €.
    expect(within(colonne("essai")).getByText("0 €")).toBeTruthy();
  });
});
