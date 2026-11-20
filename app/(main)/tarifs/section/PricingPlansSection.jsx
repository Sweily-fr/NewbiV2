"use client";

import React from "react";
import {
  COLONNE_ESSAI,
  COLONNES_OFFRES,
  PricingPlansGrid,
} from "@/src/components/pricing/pricing-plans-grid";

// La grille (offres, avantages, prix) est partagée avec l'étape
// « Choisissez votre abonnement » de l'inscription, qui l'affiche sans la
// colonne d'essai gratuit.
const COLONNES = [COLONNE_ESSAI, ...COLONNES_OFFRES];

export default function PricingPlansSection() {
  // Mensuel par défaut : en annuel, la grille ouvrait sur 16,19 € au lieu
  // du prix de référence 17,99 € TTC, lu comme un montant HT.
  const [annuel, setAnnuel] = React.useState(false);

  return (
    <section className="px-5 pt-16 md:pt-[88px] pb-16 md:pb-24 lg:pb-28">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-[-0.022em] leading-none text-gray-950 mb-10 md:mb-16">
          Tarifs
        </h2>

        <PricingPlansGrid
          colonnes={COLONNES}
          annuel={annuel}
          onAnnuelChange={setAnnuel}
        />
      </div>
    </section>
  );
}
