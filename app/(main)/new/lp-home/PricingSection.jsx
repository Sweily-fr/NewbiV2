"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Check, MoveRight, ChevronDown, Info } from "lucide-react";

// Icônes SVG
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-gray-900 dark:text-gray-100">
    <path d="M7 0.5C10.5899 0.5 13.5 3.41015 13.5 7C13.5 10.5899 10.5899 13.5 7 13.5C3.41015 13.5 0.5 10.5899 0.5 7C0.5 3.41015 3.41015 0.5 7 0.5ZM9.77734 4.58398C9.54758 4.43081 9.23716 4.49289 9.08398 4.72266L6.65332 8.36914C6.5595 8.50987 6.35573 8.51869 6.25 8.38672L4.89062 6.6875C4.71812 6.47187 4.40313 6.43687 4.1875 6.60938C3.97187 6.78188 3.93687 7.09687 4.10938 7.3125L5.46875 9.01172C5.99728 9.67219 7.01611 9.6277 7.48535 8.92383L9.91602 5.27734C10.0692 5.04758 10.0071 4.73716 9.77734 4.58398Z" fill="currentColor" />
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" className="text-gray-300 dark:text-gray-600">
    <path d="M10.6469 2.64673C10.8421 2.45147 11.1586 2.45147 11.3539 2.64673C11.5488 2.84202 11.549 3.1586 11.3539 3.35376L7.7074 6.99927L11.3539 10.6458C11.5491 10.841 11.5491 11.1585 11.3539 11.3538C11.1586 11.549 10.8411 11.549 10.6459 11.3538L6.99939 7.70728L3.35388 11.3538C3.15871 11.5488 2.84208 11.5487 2.64685 11.3538C2.45159 11.1585 2.45159 10.841 2.64685 10.6458L6.29236 6.99927L2.64685 3.35376C2.45159 3.1585 2.45159 2.84199 2.64685 2.64673C2.84211 2.45147 3.15862 2.45147 3.35388 2.64673L7.00037 6.29224L10.6469 2.64673Z" fill="currentColor" />
  </svg>
);

// Plans config
const plans = [
  {
    id: "freelance",
    name: "Freelance",
    monthly: "17,99€",
    annual: "16,19€",
    priceSuffix: "/mois, TTC",
    annualTotal: "157,56€/an",
    cta: "Essayer gratuitement",
    highlighted: false,
    description: "Pour les indépendants",
    highlights: ["Facturation & Devis illimités", "CRM client", "1 comptable gratuit"],
  },
  {
    id: "pme",
    name: "TPE",
    monthly: "48,99€",
    annual: "44,09€",
    priceSuffix: "/mois, TTC",
    annualTotal: "529,08€/an",
    cta: "Essayer gratuitement",
    highlighted: true,
    badge: "Populaire",
    description: "Pour les équipes en croissance",
    highlights: ["Jusqu'à 10 utilisateurs", "E-signature & automatisations", "Support prioritaire"],
  },
  {
    id: "entreprise",
    name: "Entreprise",
    monthly: "94,99€",
    annual: "85,49€",
    priceSuffix: "/mois, TTC",
    annualTotal: "1 025,88€/an",
    cta: "Essayer gratuitement",
    highlighted: false,
    description: "Pour les structures avancées",
    highlights: ["Jusqu'à 25 utilisateurs", "Permissions avancées", "Archivage légal & API"],
  },
];

// Sections de features
const featureSections = [
  {
    title: "Général",
    features: [
      { name: "Utilisateurs inclus", tooltip: "Nombre d'utilisateurs inclus dans votre plan", freelance: "1 utilisateur", pme: "Jusqu'à 10", entreprise: "Jusqu'à 25" },
      { name: "Comptables gratuits", tooltip: "Invitez un comptable sans frais supplémentaires", freelance: "1", pme: "3", entreprise: "5" },
      { name: "Utilisateurs supplémentaires", tooltip: "Ajoutez des collaborateurs au-delà de votre limite", freelance: "7,49€/mois", pme: "7,49€/mois", entreprise: "5,99€/mois" },
      { name: "Stockage documents", tooltip: "Espace de stockage pour vos documents et fichiers", freelance: "50 Go", pme: "200 Go", entreprise: "500 Go" },
      { name: "Création d'organisation", tooltip: "Créez et gérez votre organisation", freelance: true, pme: true, entreprise: true },
    ],
  },
  {
    title: "Facturation",
    features: [
      { name: "Factures & Devis", tooltip: "Créez et gérez vos factures et devis professionnels", freelance: true, pme: true, entreprise: true },
      { name: "Relance automatique impayés", tooltip: "Automatisez vos relances de factures impayées", freelance: true, pme: true, entreprise: true },
      { name: "Exports comptables", tooltip: "Exportez vos données au format comptable", freelance: "CSV / Excel", pme: "CSV / Excel / FEC", entreprise: "Tous formats" },
      { name: "E-signature devis", tooltip: "Faites signer vos devis électroniquement", freelance: "3/mois", pme: "20/mois", entreprise: "Illimité" },
      { name: "Facturation électronique", tooltip: "Factur-X et conformité réglementaire 2026", freelance: true, pme: true, entreprise: true },
      { name: "Archivage légal", tooltip: "Archivage légal conforme via SuperPDP pour vos factures électroniques", freelance: true, pme: true, entreprise: true },
      { name: "Modèles de documents", tooltip: "Sauvegardez des modèles de factures et devis réutilisables", freelance: "10", pme: "Illimité", entreprise: "Illimité" },
    ],
  },
  {
    title: "Gestion",
    features: [
      { name: "CRM client", tooltip: "Gérez vos relations clients efficacement", freelance: true, pme: true, entreprise: true },
      { name: "Catalogue produits", tooltip: "Créez votre catalogue de produits et services", freelance: true, pme: true, entreprise: true },
      { name: "Scan de document OCR", tooltip: "Numérisez automatiquement vos documents par photo", freelance: "50/mois", pme: true, entreprise: true },
      { name: "Connexion bancaire", tooltip: "Synchronisez vos comptes bancaires automatiquement", freelance: "1 compte", pme: "3 comptes", entreprise: "5 comptes" },
      { name: "Gestion de trésorerie", tooltip: "Suivez votre trésorerie en temps réel", freelance: true, pme: true, entreprise: true },
      { name: "Gestion des projets", tooltip: "Organisez vos projets avec des tableaux Kanban", freelance: true, pme: true, entreprise: true },
      { name: "Transfert de fichier", tooltip: "Partagez vos fichiers volumineux en toute sécurité", freelance: "5 Go/transfert", pme: "15 Go/transfert", entreprise: "50 Go/transfert" },
      { name: "Signature de mail", tooltip: "Créez des signatures de mail professionnelles", freelance: "1", pme: "10", entreprise: "25" },
      { name: "Champs personnalisés", tooltip: "Ajoutez des champs sur mesure à vos clients et produits", freelance: "5", pme: "Illimité", entreprise: "Illimité" },
      { name: "Calendrier connecté", tooltip: "Synchronisez Google, Outlook ou Apple Calendar", freelance: "1", pme: "3", entreprise: "Illimité" },
    ],
  },
  {
    title: "Automatisations",
    features: [
      { name: "Automatisations documents", tooltip: "Automatisez le classement de vos documents", freelance: "5 règles", pme: "Illimité", entreprise: "Illimité" },
      { name: "Automatisations CRM", tooltip: "Automatisez la gestion de vos listes clients", freelance: "Listes auto", pme: "Listes auto + Emails", entreprise: "Listes auto + Emails" },
      { name: "Segments clients", tooltip: "Créez des segments dynamiques avec des filtres avancés", freelance: false, pme: true, entreprise: true },
    ],
  },
  {
    title: "Analytics & Prévisions",
    features: [
      { name: "Analytics & rapports", tooltip: "Analysez la performance de votre activité", freelance: true, pme: true, entreprise: true },
      { name: "Prévisions de trésorerie", tooltip: "Anticipez votre trésorerie avec des prévisions IA", freelance: true, pme: true, entreprise: true },
    ],
  },
  {
    title: "Support",
    features: [
      { name: "Support prioritaire", tooltip: "Assistance prioritaire par email et chat", freelance: false, pme: true, entreprise: true },
    ],
  },
];

function FeatureValue({ value }) {
  if (value === true) return <CheckIcon />;
  if (value === false) return <XIcon />;
  return <span className="text-[13px] text-gray-700 dark:text-gray-300">{value}</span>;
}

function InfoTooltip({ text }) {
  return (
    <span className="group relative inline-flex ml-1.5 cursor-help">
      <Info className="w-3.5 h-3.5 text-gray-400" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-md bg-gray-900 px-3 py-2 text-[11px] leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-50">
        {text}
      </span>
    </span>
  );
}

// Mobile accordion section
function MobileSection({ section }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{section.title}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          {section.features.map((feature, i) => (
            <div key={i} className="space-y-2">
              <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300 flex items-center">
                {feature.name}
                {feature.tooltip && <InfoTooltip text={feature.tooltip} />}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {plans.map((plan) => (
                  <div key={plan.id} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                      {plan.name}
                    </span>
                    <FeatureValue value={feature[plan.id]} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PricingSection({ variant = "home" }) {
  const [isAnnual, setIsAnnual] = useState(false);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new ResizeObserver(() => {
      setHeaderHeight(headerRef.current.offsetHeight);
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div id="pricing" className="w-full pt-16 lg:pt-20 pb-10">
      <div className={`mx-auto px-4 ${variant === "home" ? "container max-w-6xl" : "max-w-6xl"}`}>
        {/* Titre centré */}
        <div className="text-center mb-2">
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-gray-950 dark:text-gray-50 mb-3">
            Profitez de 30 jours offerts
          </h2>
          <p className="text-[15px] text-gray-500 dark:text-gray-400">
            Sans engagement et résiliable à tout moment !
          </p>
        </div>

        {/* ===================== DESKTOP ===================== */}
        <div className="hidden lg:block">
          {/* Header sticky — même grille que le tableau */}
          <div ref={headerRef} className={`sticky top-0 z-20 dark:bg-background pt-[88px] ${variant === "home" ? "bg-[#FDFDFD]" : "bg-white"}`}>
            <div className="grid grid-cols-[220px_1fr_1fr_1fr] items-end">
              {/* Colonne gauche : billing toggle */}
              <div className="pb-2">
                <p className="text-[13px] text-gray-500 mb-3 leading-snug">
                  Choisissez votre<br />cycle de facturation
                </p>
                <div className="inline-flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-0.5">
                  <button
                    onClick={() => setIsAnnual(false)}
                    className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                      !isAnnual
                        ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-gray-100"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Mensuel
                  </button>
                  <button
                    onClick={() => setIsAnnual(true)}
                    className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                      isAnnual
                        ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-gray-100"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Annuel
                  </button>
                </div>
              </div>

              {/* Colonnes plans */}
              {plans.map((plan) => (
                <div key={plan.id} className="text-center pb-2">
                  {/* Nom + badge */}
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h3 className="text-[22px] font-normal text-gray-900 dark:text-gray-50">
                      {plan.name}
                    </h3>
                    {plan.badge && (
                      <span className="text-[11px] font-medium text-[#5A50FF] bg-[#5A50FF]/8 border border-[#5A50FF]/15 rounded-md px-2.5 py-0.5">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  {/* Prix */}
                  <p className="text-[13px] text-gray-500 mb-4">
                    {isAnnual ? plan.annual : plan.monthly} {plan.priceSuffix}
                    {isAnnual && (
                      <span className="block text-[12px] text-gray-400">
                        facturé {plan.annualTotal}
                      </span>
                    )}
                  </p>

                  {/* CTA */}
                  <Link
                    href="/auth/signup"
                    className={`inline-flex items-center justify-center px-6 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      plan.highlighted
                        ? "bg-[#5A50FF] text-white border border-[#5A50FF] hover:bg-[#4A40EF]"
                        : "bg-[#202020] text-white border border-[#202020] hover:bg-[#333333]"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>

            {/* Séparateur sous le header */}
            <div className="h-px bg-gray-200 dark:bg-gray-800 mt-6" />
          </div>

          {/* Tableau des features */}
          {featureSections.map((section, sIdx) => (
            <div key={sIdx}>
              {/* Titre de section */}
              <div
                className={`sticky z-10 dark:bg-background pt-10 ${variant === "home" ? "bg-[#FDFDFD]" : "bg-white"}`}
                style={{ top: headerHeight ? `${headerHeight}px` : '200px' }}
              >
                <h4 className="text-[17px] font-medium text-gray-900 dark:text-gray-100">
                  {section.title}
                </h4>
                <div className="h-px bg-gray-200 dark:bg-gray-800 mt-3" />
              </div>

              {/* Lignes de features */}
              {section.features.map((feature, fIdx) => (
                <div key={fIdx}>
                  <div className="grid grid-cols-[220px_1fr_1fr_1fr] items-stretch">
                    {/* Label */}
                    <div className="flex items-center py-3">
                      <span className="text-[13px] text-gray-700 dark:text-gray-300">
                        {feature.name}
                      </span>
                      {feature.tooltip && <InfoTooltip text={feature.tooltip} />}
                    </div>

                    {/* Valeurs */}
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`flex items-center justify-center py-3 ${
                          plan.highlighted
                            ? "bg-gray-100/70 dark:bg-gray-800/40"
                            : ""
                        }`}
                      >
                        <FeatureValue value={feature[plan.id]} />
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-gray-100 dark:bg-gray-800/60" />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ===================== MOBILE ===================== */}
        <div className="lg:hidden">
          {/* Toggle mobile centré */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-0.5">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                  !isAnnual
                    ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-gray-100"
                    : "text-gray-500"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                  isAnnual
                    ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-gray-100"
                    : "text-gray-500"
                }`}
              >
                Annuel
              </button>
            </div>
          </div>

          {/* Cartes plans mobile */}
          <div className="flex flex-col gap-4 px-4 mb-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-3xl px-6 py-6 ${
                  plan.highlighted
                    ? "border-2 border-[#5A50FF]/30 shadow-sm"
                    : "border border-gray-200 dark:border-gray-800"
                }`}
              >
                {/* Nom du plan */}
                <h3 className="text-lg font-normal text-gray-900 dark:text-gray-50">
                  {plan.name}
                </h3>

                {/* Prix */}
                <div className="flex items-center gap-2.5 mt-3">
                  <span className="text-3xl font-semibold text-gray-900 dark:text-gray-50">
                    {isAnnual ? plan.annual : plan.monthly}
                  </span>
                  {isAnnual && (
                    <span className="text-[11px] font-medium text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-md px-2 py-0.5">
                      -10%
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-gray-400 mt-1">
                  {plan.priceSuffix}
                  {isAnnual && `, facturé ${plan.annualTotal}`}
                </p>

                {/* Description + highlights */}
                <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300 mt-5">
                  {plan.description}
                </p>
                <div className="flex flex-col gap-2 mt-3">
                  {plan.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <CheckIcon />
                      <span className="text-[13px] text-gray-600 dark:text-gray-400">{h}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href="/auth/signup"
                  className={`mt-5 flex items-center justify-center w-full py-2.5 rounded-lg text-[15px] font-medium transition-colors ${
                    plan.highlighted
                      ? "bg-[#5A50FF] text-white border border-[#5A50FF] hover:bg-[#4A40EF]"
                      : "bg-[#202020] text-white border border-[#202020] hover:bg-[#333333]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
