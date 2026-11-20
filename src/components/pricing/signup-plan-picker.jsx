"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { getAnnualTotalAmount, getPlanDisplay } from "@/src/lib/plans-display";
import { COLONNES_OFFRES, Coche, FILET } from "./pricing-plans-grid";

/* Choix de l'offre à l'inscription : mêmes offres, avantages et prix que la
   grille de /tarifs (COLONNES_OFFRES), sans la colonne d'essai gratuit, dans
   une mise en page plus resserrée qui tient dans l'écran :
   - une seule bascule mensuel / annuel au-dessus des offres, au lieu d'un
     interrupteur par colonne ;
   - trois colonnes dès la tablette (768 px), empilées sur téléphone ;
   - le conseiller en simple lien sous le bouton, pas en second bouton. */

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

function BasculeFacturation({ annuel, onChange }) {
  const option = (actif) =>
    `rounded-full px-3.5 py-1 text-[13px] font-medium transition-colors ${
      actif
        ? "bg-white text-gray-950 shadow-[0_1px_2px_rgba(16,16,32,0.1)]"
        : "text-gray-500 hover:text-gray-900"
    }`;

  return (
    <div
      role="group"
      aria-label="Facturation"
      className="mx-auto flex w-fit items-center rounded-full p-1"
      style={{ backgroundColor: "rgba(16,16,32,0.05)" }}
    >
      <button
        type="button"
        aria-pressed={!annuel}
        onClick={() => onChange(false)}
        className={option(!annuel)}
      >
        Mensuel
      </button>
      <button
        type="button"
        aria-pressed={annuel}
        onClick={() => onChange(true)}
        className={`${option(annuel)} flex items-center gap-1.5`}
      >
        Annuel
        <span className="text-[11px] font-medium text-[#5A50FF]">
          -10&nbsp;%
        </span>
      </button>
    </div>
  );
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
  const derniere = COLONNES_OFFRES.length - 1;

  return (
    <div className="w-full">
      <BasculeFacturation annuel={annuel} onChange={onAnnuelChange} />

      <div className="mt-8 grid grid-cols-1 md:mt-10 md:grid-cols-3">
        {COLONNES_OFFRES.map((col, i) => {
          const plan = getPlanDisplay(col.cle);
          const prix = annuel ? plan.annualMonthlyPrice : plan.monthlyPrice;
          // Téléphone : offres empilées, séparées par un filet horizontal.
          const telephone =
            i === 0
              ? "pb-7"
              : i === derniere
                ? "border-t pt-7"
                : "border-t py-7";
          // Tablette et ordinateur : trois colonnes séparées par un filet
          // vertical, sans marge extérieure aux deux bouts.
          const ecran =
            i === 0
              ? "md:pr-5 lg:pr-8"
              : i === derniere
                ? "md:border-l md:pl-5 lg:pl-8"
                : "md:border-l md:px-5 lg:px-8";

          return (
            <section
              key={col.id}
              id={col.id}
              aria-labelledby={`${col.id}-nom`}
              className={`flex flex-col ${telephone} md:border-t-0 md:py-0 ${ecran}`}
              style={{ borderColor: FILET }}
            >
              <h3
                id={`${col.id}-nom`}
                className="text-[15px] font-semibold text-gray-950"
              >
                {col.nom}
              </h3>

              <p className="mt-3 flex items-baseline gap-1.5">
                <span className="text-[28px] font-semibold leading-none tracking-[-0.02em] text-gray-950">
                  {eur.format(prix)}
                </span>
                <span className="text-[13px] text-gray-500">/mois TTC</span>
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {annuel
                  ? `Facturé ${eur.format(getAnnualTotalAmount(plan))} par an`
                  : "Facturé chaque mois"}
              </p>

              <Button
                type="button"
                size="md"
                variant={col.enAvant ? "primary" : "outline"}
                className="mt-5 h-9 w-full justify-center px-4"
                onClick={() => onChoisir(col.cle)}
                disabled={desactive}
              >
                {enCours === col.cle ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Choisir ce plan"
                )}
              </Button>
              {/* Nouvel onglet : l'inscription reste ouverte à cette étape. */}
              <Link
                href={col.ctaSecondaire.href}
                target="_blank"
                rel="noopener"
                className="mt-2.5 self-center text-xs text-gray-500 underline-offset-2 transition-colors hover:text-gray-900 hover:underline"
              >
                ou parler à un conseiller
              </Link>

              <ul className="mt-6 flex flex-col gap-2.5">
                {col.intro && (
                  <li className="text-xs font-medium text-gray-500">
                    {col.intro}
                  </li>
                )}
                {col.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Coche />
                    <span className="text-[13px] leading-5 text-gray-700">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
