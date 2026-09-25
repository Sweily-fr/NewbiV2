"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PLANS_DISPLAY } from "@/src/lib/plans-display";

// Version condensée des tarifs (home + LP) : essai gratuit, offre Freelance,
// et renvoi vers /tarifs pour le comparatif complet. Disposition en 3
// colonnes séparées par un filet vertical, sans cartes : prix, nom de
// l'offre, description, liste à puces, lien fléché en bas.
// Le prix Freelance vient du module central (plans-display.js).
const freelancePlan = PLANS_DISPLAY.find((p) => p.key === "freelance");
const freelancePrice = `${freelancePlan.monthlyPrice
  .toFixed(2)
  .replace(".", ",")}€`;

const TRIAL_HIGHLIGHTS = [
  "Toutes les fonctionnalités Freelance",
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

function Column({ children, first = false }) {
  return (
    <div
      className={`flex flex-col py-8 md:py-2 md:pr-10 last:md:pr-0 ${
        first
          ? ""
          : "border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 md:pl-10"
      }`}
    >
      {children}
    </div>
  );
}

function PriceLine({ price, suffix, badge }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-2xl md:text-[1.75rem] font-medium tracking-tight text-gray-950 dark:text-gray-50 leading-tight">
        {price}
        {suffix && (
          <span className="text-base md:text-lg font-normal text-gray-500 dark:text-gray-400">
            {" "}
            {suffix}
          </span>
        )}
      </p>
      {badge && (
        <span className="relative overflow-hidden shrink-0 mt-1 rounded-md bg-[#E4E2FF] px-2.5 py-0.5 text-[12px] font-medium text-[#5A50FF]">
          <span className="relative z-10">{badge}</span>
          {/* Reflet qui balaie le badge toutes les 5 s */}
          <span
            aria-hidden="true"
            className="absolute inset-0 z-0 pointer-events-none opacity-0"
            style={{
              background:
                "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.75) 50%, transparent 70%)",
              backgroundSize: "250% 100%",
              animation: "pricingBadgeShine 5s ease-in-out infinite",
            }}
          />
          <style>{`
            @keyframes pricingBadgeShine {
              0% { background-position: 150% 0; opacity: 0; }
              1% { opacity: 1; }
              17% { opacity: 1; }
              18% { background-position: -150% 0; opacity: 0; }
              100% { background-position: -150% 0; opacity: 0; }
            }
          `}</style>
        </span>
      )}
    </div>
  );
}

function Bullets({ items }) {
  return (
    <ul className="mt-3 space-y-2 text-[15px] text-gray-800 dark:text-gray-200 list-disc pl-5 marker:text-gray-400">
      {items.map((h) => (
        <li key={h}>{h}</li>
      ))}
    </ul>
  );
}

function ArrowLink({ href, children, sub }) {
  return (
    <div className="mt-auto pt-10">
      <Link
        href={href}
        className="group inline-flex items-center gap-1.5 text-[17px] font-medium text-gray-950 dark:text-gray-50 hover:underline underline-offset-4"
      >
        {children}
        {/* Au survol : la flèche monte et disparaît, puis revient par le bas */}
        <span className="relative inline-flex size-[18px] overflow-hidden">
          <ArrowUpRight className="size-[18px] group-hover:animate-[pricingArrowSwap_0.5s_ease-in-out]" />
        </span>
      </Link>
      <style>{`
        @keyframes pricingArrowSwap {
          0% { transform: translate(0, 0); opacity: 1; }
          45% { transform: translate(60%, -100%); opacity: 0; }
          50% { transform: translate(-60%, 100%); opacity: 0; }
          100% { transform: translate(0, 0); opacity: 1; }
        }
      `}</style>
      {sub && (
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
          {sub}
        </p>
      )}
    </div>
  );
}

// `maxWidth` : les LP gardent max-w-6xl, la home passe en max-w-7xl
export default function HomePricingSection({ maxWidth = "max-w-6xl" }) {
  return (
    <div id="pricing" className="w-full pt-16 lg:pt-20 pb-10">
      <div className={`container ${maxWidth} mx-auto px-4`}>
        {/* Titre centré */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-gray-950 dark:text-gray-50 mb-4">
            Profite de 30 jours offerts
          </h2>
          <p className="text-[15px] text-gray-500 dark:text-gray-400">
            Sans engagement et résiliable à tout moment !
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Essai gratuit */}
          <Column first>
            <PriceLine price="0€" suffix="pendant 30 jours" />
            <h3 className="mt-3 text-lg text-gray-900 dark:text-gray-50">
              Essai gratuit
            </h3>
            <p className="mt-8 text-[15px] text-gray-800 dark:text-gray-200">
              Pour tester Newbi sans risque :
            </p>
            <Bullets items={TRIAL_HIGHLIGHTS} />
            <ArrowLink href="/auth/signup" sub="Sans carte bancaire">
              Commencer gratuitement
            </ArrowLink>
          </Column>

          {/* Freelance */}
          <Column>
            <PriceLine
              price={freelancePrice}
              suffix="/mois, TTC"
              badge="Populaire"
            />
            <h3 className="mt-3 text-lg text-gray-900 dark:text-gray-50">
              {freelancePlan.displayName}
            </h3>
            <p className="mt-8 text-[15px] text-gray-800 dark:text-gray-200">
              {freelancePlan.description}
            </p>
            <Bullets items={FREELANCE_HIGHLIGHTS} />
            <ArrowLink href="/auth/signup" sub="30 jours offerts">
              Commencer gratuitement
            </ArrowLink>
          </Column>

          {/* Toutes les offres */}
          <Column>
            <PriceLine price="Toutes nos offres" />
            <h3 className="mt-3 text-lg text-gray-900 dark:text-gray-50">
              TPE, Entreprise et comparatif détaillé
            </h3>
            <p className="mt-8 text-[15px] text-gray-800 dark:text-gray-200">
              Tu as une équipe ou plusieurs comptes bancaires ?
            </p>
            <p className="mt-3 text-[15px] text-gray-600 dark:text-gray-400">
              Découvre le détail complet de chaque offre, fonctionnalité par
              fonctionnalité, et choisis celle qui correspond à ton activité.
            </p>
            <ArrowLink href="/tarifs">Voir toutes nos offres</ArrowLink>
          </Column>
        </div>

        {/* CTA centré */}
        <div className="flex justify-center mt-14">
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center rounded-xl bg-[#202020] hover:bg-[#333333] text-white text-base font-medium px-8 py-3 transition-colors"
          >
            Commencer gratuitement
          </Link>
        </div>
      </div>
    </div>
  );
}
