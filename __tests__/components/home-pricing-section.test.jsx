import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import HomePricingSection from "@/app/(main)/new/lp-home/HomePricingSection";

/**
 * Bloc de prix condensé (accueil, pages métiers, statuts, produits) : les
 * offres y portent les mêmes noms que sur /tarifs (planLabel). Jusqu'au
 * 25/11/2026, la dernière colonne disait encore « TPE », l'ancien nom de
 * Premium.
 */
describe("bloc de prix condensé", () => {
  it("nomme les offres avec leurs noms actuels", () => {
    render(<HomePricingSection />);
    const titres = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(titres).toEqual([
      "Essai gratuit",
      "Standard",
      "Premium, Entreprise et comparatif détaillé",
    ]);
    expect(document.body.textContent).not.toMatch(/\bTPE\b/);
  });
});
