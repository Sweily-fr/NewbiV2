"use client";

import Link from "next/link";
import {
  getAnnualTotalAmount,
  getPlanDisplay,
  planLabel,
} from "@/src/lib/plans-display";
import { SIGNUP_TRIAL_DAYS } from "@/src/lib/signup-trial";

/* Offres affichées sur la page /tarifs, à l'étape « Choisissez votre
   abonnement » de l'inscription et à l'étape d'offre de /create-workspace,
   et les pièces communes à ces écrans : la bascule mensuel / annuel, les
   lignes de prix et le contenu d'une colonne. Avant, l'inscription et la
   création d'espace avaient leurs propres listes d'avantages, qui
   divergeaient de celles de /tarifs.

   Chaque écran garde sa mise en page (grille, liste) et son bouton : lien
   vers l'inscription sur /tarifs, choix de l'offre ailleurs. */

export const FILET = "rgba(16,16,32,0.09)";

// Montants issus de plans-display.js, source unique du site.
const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

/**
 * Prix mensuel affiché et rythme de facturation d'une offre, au format des
 * écrans d'offres : { prix: "17,99 €", facturation: "Facturé chaque mois" }
 * ou, à l'année, { prix: "16,19 €", facturation: "Facturé 194,28 € par an" }.
 */
export function prixOffre(cle, annuel) {
  const plan = getPlanDisplay(cle);
  if (!plan) return { prix: "", facturation: "" };
  return {
    prix: eur.format(annuel ? plan.annualMonthlyPrice : plan.monthlyPrice),
    facturation: annuel
      ? `Facturé ${eur.format(getAnnualTotalAmount(plan))} par an`
      : "Facturé chaque mois",
  };
}

// Bouton des offres payantes : l'essai gratuit est rappelé sur chaque offre,
// pas seulement dans la colonne d'essai.
const ESSAI_CTA = `Essayer ${SIGNUP_TRIAL_DAYS} jours gratuits`;

const CONSEILLER = { href: "/contact", label: "parler à un conseiller" };

// Colonne d'essai gratuit : sur /tarifs seulement. À l'inscription, l'essai
// est déjà annoncé au-dessus des offres.
export const COLONNE_ESSAI = {
  id: "essai",
  nom: "Essai gratuit",
  prix: "0 €",
  suffixe: `pendant ${SIGNUP_TRIAL_DAYS} jours`,
  mention: `Aucun prélèvement pendant ${SIGNUP_TRIAL_DAYS} jours`,
  features: [
    "Toutes les fonctionnalités de l'offre choisie",
    "Sans engagement",
    "Résiliable en deux clics",
    "Vos données exportables à tout moment",
  ],
  cta: { href: "/auth/signup", label: "Commencer gratuitement" },
};

// Offres payantes. Chaque ligne de fonctionnalité correspond à une entrée de
// PLAN_FEATURES_SECTIONS : aucune promesse n'est inventée ici. `intro` est
// la ligne « Tout X, plus : » qui ouvre la liste.
export const COLONNES_OFFRES = [
  {
    id: "freelance",
    cle: "freelance",
    nom: planLabel("freelance"),
    features: [
      "1 utilisateur · 1 accès comptable",
      "Devis et factures illimités",
      "Facturation électronique incluse",
      "Connexion bancaire · 1 compte",
      "CRM client et catalogue produits",
      "Gestion de projet et de trésorerie",
      "10 signatures de devis par mois",
      "Campagnes e-mail · 500 par mois",
      "100 Go de stockage",
    ],
    cta: { href: "/auth/signup", label: ESSAI_CTA },
    ctaSecondaire: CONSEILLER,
  },
  {
    id: "tpe",
    cle: "pme",
    nom: planLabel("pme"),
    enAvant: true,
    intro: `Tout ${planLabel("freelance")}, plus :`,
    features: [
      "Jusqu'à 10 utilisateurs · 3 accès comptables",
      "Connexion bancaire · 3 comptes",
      "Prospection · 30 crédits par mois",
      "100 signatures de devis par mois",
      "Campagnes e-mail · 2 500 par mois",
      "Modèles et champs personnalisés illimités",
      "Automatisations illimitées",
      "Segments clients",
      "Support prioritaire",
      "500 Go de stockage",
    ],
    cta: { href: "/auth/signup", label: ESSAI_CTA },
    ctaSecondaire: CONSEILLER,
  },
  {
    id: "entreprise",
    cle: "entreprise",
    nom: planLabel("entreprise"),
    intro: `Tout ${planLabel("pme")}, plus :`,
    features: [
      "Jusqu'à 25 utilisateurs · 5 accès comptables",
      "Connexion bancaire · 5 comptes",
      "Prospection · 100 crédits par mois",
      "200 signatures de devis par mois",
      "Campagnes e-mail · 10 000 par mois",
      "Exports comptables tous formats",
      "Calendriers connectés illimités",
      "5 To de stockage (+50 Go à 2,99 €/mois)",
    ],
    cta: { href: "/auth/signup", label: ESSAI_CTA },
    ctaSecondaire: CONSEILLER,
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

/* Une seule bascule mensuel / annuel pour toutes les offres. Variantes
   sombres pour /create-workspace, qui suit le thème du tableau de bord. */
export function BasculeFacturation({ annuel, onChange, className = "" }) {
  const option = (actif) =>
    `rounded-full px-3.5 py-1 text-[13px] font-medium transition-colors ${
      actif
        ? "bg-white text-gray-950 shadow-[0_1px_2px_rgba(16,16,32,0.1)] dark:bg-[#2a2a2a] dark:text-white"
        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
    }`;

  return (
    <div
      role="group"
      aria-label="Facturation"
      className={`flex w-fit items-center rounded-full bg-[rgba(16,16,32,0.05)] p-1 dark:bg-white/10 ${className}`}
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
 * Contenu d'une colonne : nom, prix, facturation, bouton, lien vers un
 * conseiller, avantages. À placer dans un conteneur `flex flex-col`.
 * @param {object} props
 * @param {object} props.colonne - COLONNE_ESSAI ou une entrée de
 *   COLONNES_OFFRES.
 * @param {boolean} props.annuel - prix affichés à l'année.
 * @param {React.ReactNode} props.action - bouton principal.
 * @param {object} [props.lienConseiller] - attributs ajoutés au lien
 *   « parler à un conseiller » (ex. ouverture dans un nouvel onglet).
 */
export function ContenuOffre({ colonne, annuel, action, lienConseiller }) {
  const plan = colonne.cle ? getPlanDisplay(colonne.cle) : null;
  const { prix, facturation } = prixOffre(colonne.cle, annuel);

  return (
    <>
      <h3
        id={`${colonne.id}-nom`}
        className="text-base font-semibold text-gray-950"
      >
        {colonne.nom}
      </h3>

      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="text-[28px] font-semibold leading-none tracking-[-0.02em] text-gray-950">
          {plan ? prix : colonne.prix}
        </span>
        <span className="text-[13px] text-gray-500">
          {plan ? "/mois TTC" : colonne.suffixe}
        </span>
      </p>
      <p className="mt-2 text-xs text-gray-500">
        {plan ? facturation : colonne.mention}
      </p>

      <div className="mt-5">{action}</div>
      {colonne.ctaSecondaire ? (
        <p className="mt-2.5 text-center text-xs text-gray-500">
          ou{" "}
          <Link
            href={colonne.ctaSecondaire.href}
            {...lienConseiller}
            className="underline underline-offset-2 transition-colors hover:text-gray-900"
          >
            {colonne.ctaSecondaire.label}
          </Link>
        </p>
      ) : (
        // Même hauteur que la ligne du conseiller : côte à côte, les listes
        // d'avantages démarrent toutes à la même hauteur. Inutile quand les
        // offres sont empilées (téléphone).
        <p aria-hidden="true" className="mt-2.5 hidden h-4 sm:block" />
      )}

      <ul className="mt-6 flex flex-col gap-2.5">
        {colonne.intro && (
          <li className="text-xs font-medium text-gray-500">{colonne.intro}</li>
        )}
        {colonne.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Coche />
            <span className="text-[13px] leading-5 text-gray-700">{f}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
