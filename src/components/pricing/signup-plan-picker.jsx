"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  BasculeFacturation,
  COLONNES_OFFRES,
  ContenuOffre,
  FILET,
} from "./pricing-offers";

/* Choix de l'offre à l'inscription : mêmes offres, avantages, prix et
   bascule que /tarifs (pricing-offers.jsx), sans la colonne d'essai gratuit.
   Trois colonnes dès la tablette (768 px), empilées sur téléphone. */

const DERNIERE = COLONNES_OFFRES.length - 1;

// Téléphone : offres empilées, séparées par un filet horizontal. Tablette et
// ordinateur : trois colonnes séparées par un filet vertical, sans marge
// extérieure aux deux bouts.
function classesColonne(i) {
  const telephone =
    i === 0 ? "pb-7" : i === DERNIERE ? "border-t pt-7" : "border-t py-7";
  const ecran =
    i === 0
      ? "md:pr-5 lg:pr-8"
      : i === DERNIERE
        ? "md:border-l md:pl-5 lg:pl-8"
        : "md:border-l md:px-5 lg:px-8";
  return `flex flex-col ${telephone} md:border-t-0 md:py-0 ${ecran}`;
}

/**
 * @param {object} props
 * @param {boolean} props.annuel - prix affichés à l'année.
 * @param {(annuel: boolean) => void} props.onAnnuelChange
 * @param {(cle: string) => void} props.onChoisir - clé technique de l'offre.
 * @param {string|null} [props.enCours] - offre en cours d'enregistrement.
 * @param {boolean} [props.desactive]
 */
export function SignupPlanPicker({
  annuel,
  onAnnuelChange,
  onChoisir,
  enCours = null,
  desactive = false,
}) {
  return (
    <div className="w-full">
      <BasculeFacturation
        annuel={annuel}
        onChange={onAnnuelChange}
        className="mx-auto"
      />

      <div className="mt-8 grid grid-cols-1 md:mt-10 md:grid-cols-3">
        {COLONNES_OFFRES.map((col, i) => (
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
              // Nouvel onglet : l'inscription reste ouverte à cette étape.
              lienConseiller={{ target: "_blank", rel: "noopener" }}
              action={
                <Button
                  type="button"
                  size="md"
                  variant={col.enAvant ? "primary" : "outline"}
                  className="h-9 w-full justify-center px-4"
                  onClick={() => onChoisir(col.cle)}
                  disabled={desactive}
                >
                  {enCours === col.cle ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Commencer gratuitement"
                  )}
                </Button>
              }
            />
          </section>
        ))}
      </div>
    </div>
  );
}
