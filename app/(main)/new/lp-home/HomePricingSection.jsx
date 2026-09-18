"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PLANS_DISPLAY } from "@/src/lib/plans-display";

// Version condensée des tarifs pour la page d'accueil : essai gratuit,
// offre Freelance, et renvoi vers /tarifs pour le comparatif complet.
// Le prix Freelance vient du module central (plans-display.js).
const freelancePlan = PLANS_DISPLAY.find((p) => p.key === "freelance");
const freelancePrice = `${freelancePlan.monthlyPrice
  .toFixed(2)
  .replace(".", ",")}€`;

const TRIAL_HIGHLIGHTS = [
  "Toutes les fonctionnalités incluses",
  "Sans carte bancaire",
  "Sans engagement",
];

const FREELANCE_HIGHLIGHTS = [
  "Facturation & Devis illimités",
  "Facturation électronique incluse",
  "Connexion bancaire · 1 compte",
  "CRM client & catalogue produits",
  "Un accès comptable gratuit",
];

function Highlight({ children }) {
  return (
    <li className="flex items-start gap-2.5 text-[13px] text-gray-600 dark:text-gray-400">
      <Check className="mt-0.5 size-4 shrink-0 text-gray-900 dark:text-gray-100" />
      <span>{children}</span>
    </li>
  );
}

export default function HomePricingSection() {
  return (
    <div id="pricing" className="w-full pt-16 lg:pt-20 pb-10">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Titre centré */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-gray-950 dark:text-gray-50 mb-3">
            Profite de 30 jours offerts
          </h2>
          <p className="text-[15px] text-gray-500 dark:text-gray-400">
            Sans engagement et résiliable à tout moment !
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Essai gratuit */}
          <div className="flex flex-col rounded-3xl border border-gray-200 dark:border-gray-800 px-6 py-6">
            <h3 className="text-lg font-normal text-gray-900 dark:text-gray-50">
              Essai gratuit
            </h3>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-3xl font-semibold text-gray-900 dark:text-gray-50">
                0€
              </span>
              <span className="text-[13px] text-gray-400">
                pendant 30 jours
              </span>
            </div>
            <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300 mt-5">
              Pour tester Newbi sans risque
            </p>
            <ul className="flex flex-col gap-2 mt-3">
              {TRIAL_HIGHLIGHTS.map((h) => (
                <Highlight key={h}>{h}</Highlight>
              ))}
            </ul>
            <Link href="/auth/signup" className="mt-auto pt-6 block">
              <span className="flex items-center justify-center w-full py-2.5 rounded-lg text-[15px] font-medium bg-[#202020] text-white hover:bg-[#333333] transition-colors">
                Commencer gratuitement
              </span>
            </Link>
          </div>

          {/* Freelance */}
          <div className="flex flex-col rounded-3xl border-2 border-[#5A50FF]/30 shadow-sm px-6 py-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-normal text-gray-900 dark:text-gray-50">
                {freelancePlan.displayName}
              </h3>
              <span className="text-[11px] font-medium text-[#5A50FF] bg-[#5A50FF]/8 border border-[#5A50FF]/15 rounded-md px-2.5 py-0.5">
                Populaire
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-3xl font-semibold text-gray-900 dark:text-gray-50">
                {freelancePrice}
              </span>
              <span className="text-[13px] text-gray-400">/mois, TTC</span>
            </div>
            <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300 mt-5">
              {freelancePlan.description}
            </p>
            <ul className="flex flex-col gap-2 mt-3">
              {FREELANCE_HIGHLIGHTS.map((h) => (
                <Highlight key={h}>{h}</Highlight>
              ))}
            </ul>
            <Link href="/auth/signup" className="mt-auto pt-6 block">
              <span className="flex items-center justify-center w-full py-2.5 rounded-lg text-[15px] font-medium bg-[#5b50FF] text-white hover:bg-[#4a40e6] transition-colors">
                Commencer gratuitement
              </span>
            </Link>
          </div>

          {/* Toutes les offres */}
          <div className="flex flex-col rounded-3xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-6 py-6">
            <h3 className="text-lg font-normal text-gray-900 dark:text-gray-50">
              Toutes nos offres
            </h3>
            <p className="text-[13px] text-gray-400 mt-3">
              TPE, Entreprise et comparatif détaillé
            </p>
            <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300 mt-5">
              Tu as une équipe ou plusieurs comptes bancaires ?
            </p>
            <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-2">
              Découvre le détail complet de chaque offre, fonctionnalité par
              fonctionnalité, et choisis celle qui correspond à ton activité.
            </p>
            <Link href="/tarifs" className="mt-auto pt-6 block">
              <span className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-[15px] font-medium border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                Voir toutes nos offres
                <ArrowRight className="size-4" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
