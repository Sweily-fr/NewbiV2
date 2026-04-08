"use client";
import React from "react";
import ExpenseDonutAnimation from "./ExpenseDonutAnimation";

export default function AchatsGovernanceSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 lg-pb-10 relative overflow-hidden">
      <div className="max-w-6xl px-4 mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5A50FF] mb-3">
            GESTION DES ACHATS
          </span>
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance text-gray-950 mb-4">
            Maîtrisez chaque dépense de votre entreprise
          </h2>
          <p className="text-md font-normal tracking-tight text-gray-600 mx-auto mb-8 max-w-2xl">
            Centralisez vos achats, suivez vos fournisseurs et gardez le
            contrôle sur vos dépenses depuis un seul espace.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-y border-neutral-200 divide-neutral-200">
          {/* Card 1 */}
          <div className="md:border-r border-b border-neutral-200 flex flex-col">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Numérisez vos justificatifs en un clic
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Scannez ou importez vos tickets et factures d&apos;achat. L&apos;OCR
                extrait automatiquement les informations clés.
              </p>
            </div>
            <div className="relative flex-1 min-h-[320px] overflow-hidden perspective-distant">
              <div className="rounded-t-2xl bg-neutral-100 border border-neutral-200 w-full h-full absolute inset-x-4 inset-y-2 p-2 overflow-hidden">
                <div className="relative w-full h-full rounded-tl-[12px] rounded-tr-[12px] ring-1 ring-black/5 overflow-hidden">
                  <img
                    src="/images/gestion-achats-hero.png"
                    alt="Interface gestion des achats Newbi"
                    className="absolute inset-0 w-full h-full object-cover object-left-top"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="border-b border-neutral-200">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Catégorisez vos dépenses automatiquement
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Chaque achat est classé par catégorie pour une vision
                claire de vos postes de dépenses.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden">
              <ExpenseDonutAnimation />
            </div>
          </div>

          {/* Card 3 */}
          <div className="border-b md:border-b-0 md:border-r border-neutral-200">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Suivez vos fournisseurs
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Gérez votre carnet de fournisseurs, consultez l&apos;historique
                d&apos;achats et comparez les montants facilement.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden px-4 md:px-8 pb-4">
              <div className="flex flex-col gap-2.5">
                {[
                  { name: "Amazon Business", logo: "https://cdn.brandfetch.io/idawOgYOsG/theme/dark/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1747149760488", factures: "12", total: "4 820 €", last: "Il y a 3j" },
                  { name: "OVHcloud", logo: "https://cdn.brandfetch.io/idrlAPpgYV/w/352/h/352/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668507128073", factures: "8", total: "3 180 €", last: "Il y a 12j", highlight: true },
                  { name: "Scaleway", logo: "https://cdn.brandfetch.io/id61Gz1Oce/w/1035/h/1035/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1768679366261", factures: "6", total: "2 460 €", last: "Il y a 18j" },
                  { name: "Figma", logo: "https://cdn.brandfetch.io/idZHcZ_i7F/w/320/h/320/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1729268227605", factures: "4", total: "1 920 €", last: "Il y a 25j" },
                ].map((supplier, i) => (
                  <div key={i} className={`flex items-center gap-4 py-3.5 px-4 rounded-xl border bg-white ${supplier.highlight ? "border-neutral-200 shadow-xl scale-[1.06] z-10 relative" : "border-neutral-100 shadow-sm"}`}>
                    <div className="w-11 h-11 rounded-lg bg-white border border-neutral-100 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={supplier.logo} alt={supplier.name} className="w-7 h-7 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">{supplier.name}</p>
                      <p className="text-xs text-neutral-400">{supplier.factures} factures · {supplier.last}</p>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900 shrink-0">{supplier.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div>
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Exportez pour votre comptable
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Générez des exports propres et structurés de vos achats
                pour simplifier le travail de votre expert-comptable.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden flex items-center justify-center px-4 md:px-8">
              <div className="w-full max-w-[320px] bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
                {/* Email header */}
                <div className="px-5 py-3 border-b border-neutral-100 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5A50FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span className="text-[11px] font-semibold text-neutral-800">Nouveau message</span>
                  <div className="ml-auto flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                    <span className="text-[8px] text-[#22C55E] font-medium">Prêt</span>
                  </div>
                </div>

                {/* Email fields */}
                <div className="px-5 py-3 space-y-2.5 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-neutral-400 w-8 shrink-0">À</span>
                    <span className="text-[11px] text-neutral-700 font-medium">cabinet@dupont-associes.fr</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-neutral-400 w-8 shrink-0">Objet</span>
                    <span className="text-[11px] text-neutral-700 font-medium">Exports comptables — Mars 2026</span>
                  </div>
                </div>

                {/* Email body */}
                <div className="px-5 py-3 border-b border-neutral-100">
                  <p className="text-[10px] text-neutral-500 leading-relaxed">
                    Bonjour Maître Dupont,<br /><br />
                    Veuillez trouver ci-joint les exports comptables du mois de mars 2026.
                  </p>
                </div>

                {/* Attachments */}
                <div className="px-5 py-3 space-y-2">
                  <p className="text-[9px] text-neutral-400 uppercase tracking-wider font-medium">Pièces jointes</p>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-100 flex-1">
                      <svg width="14" height="17" viewBox="0 0 22 26" fill="none" className="shrink-0">
                        <path d="M0 3C0 1.34 1.34 0 3 0h10l9 9v14c0 1.66-1.34 3-3 3H3c-1.66 0-3-1.34-3-3V3z" fill="#EEF2FF" />
                        <path d="M13 0l9 9h-6c-1.66 0-3-1.34-3-3V0z" fill="#C7D2FE" />
                        <text x="5" y="20" fontSize="7" fontWeight="700" fill="#5A50FF" fontFamily="system-ui">FEC</text>
                      </svg>
                      <div>
                        <p className="text-[9px] font-medium text-neutral-700">Export_FEC.txt</p>
                        <p className="text-[7px] text-neutral-400">247 écritures · 14 Ko</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-100 flex-1">
                      <svg width="14" height="17" viewBox="0 0 22 26" fill="none" className="shrink-0">
                        <path d="M0 3C0 1.34 1.34 0 3 0h10l9 9v14c0 1.66-1.34 3-3 3H3c-1.66 0-3-1.34-3-3V3z" fill="#FEF2F2" />
                        <path d="M13 0l9 9h-6c-1.66 0-3-1.34-3-3V0z" fill="#FECACA" />
                        <text x="4" y="20" fontSize="7" fontWeight="700" fill="#EF4444" fontFamily="system-ui">PDF</text>
                      </svg>
                      <div>
                        <p className="text-[9px] font-medium text-neutral-700">Récap_Mars.pdf</p>
                        <p className="text-[7px] text-neutral-400">Synthèse · 2 pages</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
