"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { PLANS_DISPLAY } from "@/src/lib/plans-display";

/* Grille tarifaire reprise de linear.app/pricing, transposée en thème clair.
   Mesures relevées sur la page Linear : colonnes de 336 px séparées par un
   filet de 1 px, 32 px de padding latéral, titre 24 px/590, ligne de prix
   17 px/510, bandeau de facturation de 60 px bordé en haut et en bas,
   fonctionnalités en 13 px/19,5 px avec une pastille de 16 px, et bouton de
   40 px entièrement arrondi, large comme la colonne. */

const FILET = "rgba(16,16,32,0.09)";

const euros = (n) => `${n.toFixed(2).replace(".", ",")} €`;

// Les montants viennent de plans-display.js, source unique du site.
const PAR_CLE = Object.fromEntries(PLANS_DISPLAY.map((p) => [p.key, p]));

// Contenus des colonnes. Chaque ligne de fonctionnalité correspond à une
// entrée de PLAN_FEATURES_SECTIONS : aucune promesse n'est inventée ici.
const COLONNES = [
  {
    id: "essai",
    nom: "Essai gratuit",
    prix: "0 €",
    suffixe: "pendant 30 jours",
    mention: "Sans carte bancaire",
    features: [
      "Toutes les fonctionnalités Freelance",
      "Aucun prélèvement à la fin de l'essai",
      "Résiliable en deux clics",
      "Vos données exportables à tout moment",
    ],
    cta: { href: "/auth/signup", label: "Commencer gratuitement" },
  },
  {
    id: "freelance",
    cle: "freelance",
    nom: "Freelance",
    suffixe: "par mois, TTC",
    features: [
      "1 utilisateur · 1 accès comptable",
      "Devis et factures illimités",
      "Facturation électronique incluse",
      "Connexion bancaire · 1 compte",
      "CRM client et catalogue produits",
      "Gestion de projet et de trésorerie",
      "50 Go de stockage",
    ],
    cta: { href: "/auth/signup", label: "Commencer gratuitement" },
  },
  {
    id: "tpe",
    cle: "pme",
    nom: "TPE",
    enAvant: true,
    suffixe: "par mois, TTC",
    features: [
      "Tout Freelance, plus :",
      "Jusqu'à 10 utilisateurs · 3 accès comptables",
      "Connexion bancaire · 3 comptes",
      "Modèles et champs personnalisés illimités",
      "Automatisations illimitées",
      "Segments clients",
      "Support prioritaire",
      "200 Go de stockage",
    ],
    cta: { href: "/auth/signup", label: "Commencer gratuitement" },
    ctaSecondaire: { href: "/contact", label: "Parler à un conseiller" },
  },
  {
    id: "entreprise",
    cle: "entreprise",
    nom: "Entreprise",
    suffixe: "par mois, TTC",
    features: [
      "Tout TPE, plus :",
      "Jusqu'à 25 utilisateurs · 5 accès comptables",
      "Connexion bancaire · 5 comptes",
      "Exports comptables tous formats",
      "E-signature illimitée",
      "Calendriers connectés illimités",
      "500 Go de stockage",
    ],
    cta: { href: "/auth/signup", label: "Commencer gratuitement" },
    ctaSecondaire: { href: "/contact", label: "Parler à un conseiller" },
  },
];

/* Pastille de validation, même dessin que celle de Linear : cercle plein
   avec la coche évidée. */
function Coche() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-gray-400"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 1.00195C4.13401 1.00195 1 4.13596 1 8.00195C1 11.8679 4.13401 15.002 8 15.002C11.866 15.002 15 11.8679 15 8.00195C15 4.13596 11.866 1.00195 8 1.00195ZM12.101 6.10299C12.433 5.77105 12.433 5.23286 12.101 4.90091C11.7691 4.56897 11.2309 4.56897 10.899 4.90091L6.5 9.29987L5.10104 7.90091C4.7691 7.56897 4.2309 7.56897 3.89896 7.90091C3.56701 8.23286 3.56701 8.77105 3.89896 9.10299L5.89896 11.103C6.2309 11.4349 6.7691 11.4349 7.10104 11.103L12.101 6.10299Z"
      />
    </svg>
  );
}

/* Interrupteur mensuel / annuel, repris du bandeau de facturation de Linear :
   piste de 32 x 20, pastille de 14 px. Un seul état pour toute la grille. */
function Bascule({ actif, onChange, id }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={actif}
      onClick={() => onChange(!actif)}
      className="flex items-center gap-2 text-left"
    >
      <span
        className={`flex h-5 w-8 items-center rounded-full px-[3px] transition-colors ${
          actif ? "bg-[#5A50FF]" : "bg-gray-300"
        }`}
      >
        <span
          className={`size-3.5 rounded-full bg-white shadow-sm transition-transform ${
            actif ? "translate-x-3" : "translate-x-0"
          }`}
        />
      </span>
      <span className="text-sm text-gray-500">Facturé à l&apos;année</span>
    </button>
  );
}

export default function PricingPlansSection() {
  const [annuel, setAnnuel] = React.useState(true);

  return (
    <section className="px-5 pt-16 md:pt-[88px] pb-16 md:pb-24 lg:pb-28">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-[-0.022em] leading-none text-gray-950 mb-10 md:mb-16">
          Tarifs
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {COLONNES.map((col, i) => {
            const plan = col.cle ? PAR_CLE[col.cle] : null;
            const montant = plan
              ? euros(annuel ? plan.annualMonthlyPrice : plan.monthlyPrice)
              : col.prix;

            return (
              <section
                key={col.id}
                id={col.id}
                // Les 32 px de padding de Linear sont retirés aux extrémités :
                // sans cela, le contenu de la première et de la dernière
                // colonne serait rentré de 32 px par rapport à la navbar.
                className={`flex flex-col px-0 py-8 lg:py-0 ${
                  i === 0 ? "lg:pl-0 lg:pr-8" : "lg:border-l"
                } ${
                  i === COLONNES.length - 1 ? "lg:pl-8 lg:pr-0" : ""
                } ${i > 0 && i < COLONNES.length - 1 ? "lg:px-8" : ""}`}
                style={{ borderLeftColor: FILET }}
              >
                <hgroup>
                  <h3 className="text-2xl font-semibold tracking-tight text-gray-950">
                    {col.nom}
                  </h3>
                  <p className="mt-2 text-[17px] font-medium text-gray-950">
                    {montant}{" "}
                    <span className="font-normal text-gray-500">
                      {col.suffixe}
                    </span>
                  </p>
                </hgroup>

                {/* Bandeau de facturation : bordé en haut et en bas, hauteur
                    fixe pour que les listes démarrent toutes à la même ligne */}
                <div
                  className="mt-4 flex h-[60px] items-center"
                  style={{
                    borderTop: `1px solid ${FILET}`,
                    borderBottom: `1px solid ${FILET}`,
                  }}
                >
                  {plan ? (
                    <Bascule
                      id={`${col.id}-bascule`}
                      actif={annuel}
                      onChange={setAnnuel}
                    />
                  ) : (
                    <span className="text-sm text-gray-500">{col.mention}</span>
                  )}
                </div>

                <ul className="mt-6 flex flex-col gap-4">
                  {col.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Coche />
                      <span className="text-[13px] leading-[19.5px] text-gray-700">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Boutons en bas de colonne, au gabarit de la navbar.
                    L'emplacement du bouton secondaire est réservé dans toutes
                    les colonnes : sans cela, les colonnes à deux boutons
                    remonteraient leur bouton principal d'une ligne. */}
                <div className="mt-11 lg:mt-auto lg:pt-11">
                  <Button
                    asChild
                    size="md"
                    variant={col.enAvant ? "primary" : "outline"}
                    className="w-full justify-center px-4"
                  >
                    <Link href={col.cta.href}>
                      <span>{col.cta.label}</span>
                    </Link>
                  </Button>
                  <div className="mt-2 h-8">
                    {col.ctaSecondaire && (
                      <Button
                        asChild
                        size="md"
                        variant="outline"
                        className="w-full justify-center px-4"
                      >
                        <Link href={col.ctaSecondaire.href}>
                          <span>{col.ctaSecondaire.label}</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}
