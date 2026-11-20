import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import React from "react";

import PricingPlansSection from "@/app/(main)/tarifs/section/PricingPlansSection";

/**
 * Grille de /tarifs : essai gratuit + trois offres. Depuis le 20/11/2026,
 * l'offre Freelance a elle aussi son lien vers un conseiller.
 */
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
    // La ligne « Tout Freelance, plus : » reste la première puce de TPE,
    // comme avant le partage des offres avec l'inscription.
    const puces = within(document.getElementById("tpe"))
      .getAllByRole("listitem")
      .map((li) => li.textContent);
    expect(puces[0]).toBe("Tout Freelance, plus :");
    expect(puces).toHaveLength(8);
  });

  it("propose un conseiller sur les trois offres payantes, pas sur l'essai", () => {
    render(<PricingPlansSection />);
    for (const id of ["freelance", "tpe", "entreprise"]) {
      const lien = within(document.getElementById(id)).getByRole("link", {
        name: "Parler à un conseiller",
      });
      expect(lien).toHaveAttribute("href", "/contact");
      // Sur /tarifs, le lien s'ouvre dans le même onglet.
      expect(lien).not.toHaveAttribute("target");
    }
    expect(
      within(document.getElementById("essai")).queryByRole("link", {
        name: "Parler à un conseiller",
      }),
    ).toBeNull();
  });
});
