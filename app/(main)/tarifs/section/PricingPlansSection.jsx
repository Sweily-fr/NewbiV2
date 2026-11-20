"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import {
  BasculeFacturation,
  COLONNE_ESSAI,
  COLONNES_OFFRES,
  ContenuOffre,
  FILET,
} from "@/src/components/pricing/pricing-offers";

// Les offres (avantages, prix, conseiller) sont partagées avec l'étape
// « Choisissez votre abonnement » de l'inscription, qui les affiche sans la
// colonne d'essai gratuit.
const COLONNES = [COLONNE_ESSAI, ...COLONNES_OFFRES];
const DERNIERE = COLONNES.length - 1;

// Téléphone : colonnes empilées, séparées par un filet horizontal.
// Tablette : deux colonnes espacées. Ordinateur : quatre colonnes séparées
// par un filet vertical, sans marge aux deux bouts pour rester alignées sur
// la navbar. Marges réduites jusqu'à 1280 px : à 1024 px, « Commencer
// gratuitement » passait sur deux lignes dans les colonnes du milieu.
function classesColonne(i) {
  const telephone =
    i === 0 ? "pb-8" : i === DERNIERE ? "border-t pt-8" : "border-t py-8";
  const ordinateur =
    i === 0
      ? "lg:pr-5 xl:pr-8"
      : i === DERNIERE
        ? "lg:border-l lg:pl-5 xl:pl-8"
        : "lg:border-l lg:px-5 xl:px-8";
  return `flex flex-col ${telephone} sm:border-t-0 sm:py-0 ${ordinateur}`;
}

export default function PricingPlansSection() {
  // Mensuel par défaut : en annuel, la grille ouvrait sur 16,19 € au lieu
  // du prix de référence 17,99 € TTC, lu comme un montant HT.
  const [annuel, setAnnuel] = React.useState(false);

  return (
    <section className="px-5 pt-16 md:pt-[88px] pb-16 md:pb-24 lg:pb-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col items-start gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-[-0.022em] leading-none text-gray-950">
            Tarifs
          </h2>
          {/* Une seule bascule pour toutes les offres, au lieu d'un
              interrupteur dans chaque colonne. */}
          <BasculeFacturation annuel={annuel} onChange={setAnnuel} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-14 lg:grid-cols-4 lg:gap-0">
          {COLONNES.map((col, i) => (
            <section
              key={col.id}
              id={col.id}
              aria-labelledby={`${col.id}-nom`}
              className={classesColonne(i)}
              style={{ borderColor: FILET }}
            >
              <ContenuOffre
                colonne={col}
                annuel={annuel}
                action={
                  <Button
                    asChild
                    size="md"
                    variant={col.enAvant ? "primary" : "outline"}
                    className="h-9 w-full justify-center px-4"
                  >
                    <Link href={col.cta.href}>
                      <span>{col.cta.label}</span>
                    </Link>
                  </Button>
                }
              />
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
