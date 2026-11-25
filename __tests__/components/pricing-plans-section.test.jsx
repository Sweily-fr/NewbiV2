import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import PricingPlansSection from "@/app/(main)/tarifs/section/PricingPlansSection";

/**
 * Grille de /tarifs : essai gratuit + trois offres, une seule bascule
 * mensuel / annuel, et un lien vers un conseiller sous chaque offre payante
 * (Standard compris, ex-Freelance, depuis le 20/11/2026).
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
      "Standard",
      "Premium",
      "Entreprise",
    ]);
    expect(
      screen.getAllByRole("link", { name: "Commencer gratuitement" }),
    ).toHaveLength(4);
    // « Tout Standard, plus : » ouvre la liste de Premium.
    const puces = within(colonne("tpe"))
      .getAllByRole("listitem")
      .map((li) => li.textContent);
    expect(puces[0]).toBe("Tout Standard, plus :");
    expect(puces).toHaveLength(11);
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
    // Mensuel par défaut : 18 € TTC, le prix de référence.
    expect(within(colonne("freelance")).getByText(/18,00\s€/)).toBeTruthy();
    expect(
      within(colonne("freelance")).getByText("Facturé chaque mois"),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /^Annuel/ }));

    expect(within(colonne("freelance")).getByText(/16,17\s€/)).toBeTruthy();
    expect(within(colonne("tpe")).getByText(/45,00\s€/)).toBeTruthy();
    expect(within(colonne("entreprise")).getByText(/180,00\s€/)).toBeTruthy();
    expect(
      within(colonne("entreprise")).getByText(/Facturé 2\s160,00\s€ par an/),
    ).toBeTruthy();
    // L'essai reste à 0 €.
    expect(within(colonne("essai")).getByText("0 €")).toBeTruthy();
  });
});
