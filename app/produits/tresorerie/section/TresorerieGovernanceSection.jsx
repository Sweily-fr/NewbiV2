"use client";
import React from "react";
import { Bell, FileText, CheckCircle } from "lucide-react";

const bankImages = [
  "/bnp-logo.png",
  "https://cdn.brandfetch.io/idVPrMdDmu/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1682683847616",
  "https://cdn.brandfetch.io/idkTaHd18D/w/400/h/400/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1697548241418",
  "https://cdn.brandfetch.io/id9aYcqo6q/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1768677706910",
  "https://cdn.brandfetch.io/iddTHt7H9X/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1667628466273",
  "https://cdn.brandfetch.io/idrMp227Ng/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1681661440866",
];

function GridItem({ img, icon, small }) {
  return (
    <div className="w-full justify-self-center aspect-square rounded-xl border border-dashed border-neutral-200 relative p-[1px]">
      <div className="flex items-center justify-center w-full h-full rounded-[12px] p-[1px] relative z-10">
        {img && (
          <img
            alt="Logo de banque compatible avec la gestion de trésorerie Newbi"
            loading="lazy"
            width="120"
            height="120"
            className={`object-contain aspect-square rounded-[12px] relative z-20 ${small ? "w-[75%] h-[75%]" : ""}`}
            src={img}
          />
        )}
        {icon && (
          <div className="h-full w-full bg-white rounded-[12px] flex items-center justify-center">
            <svg width="20" height="15" viewBox="0 0 20 15" fill="currentColor">
              <path d="M4.9 14.9H0V10H4.9V14.9ZM19.7 14.9H9.8V10H4.9V5H9.8V0.1H19.7V14.9ZM9.8 10H14.8V5H9.8V10ZM4.9 5H0V0.1H4.9V5Z" />
            </svg>
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-[image:repeating-linear-gradient(315deg,_rgba(0,0,0,0.05)_0,_rgba(0,0,0,0.05)_1px,_transparent_0,_transparent_50%)] bg-[size:5px_5px] rounded-xl bg-fixed"></div>
    </div>
  );
}

export default function TresorerieGovernanceSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 lg-pb-10 relative overflow-hidden">
      <div className="max-w-6xl px-4 mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5A50FF] mb-3">
            TRÉSORERIE SIMPLIFIÉE
          </span>
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance text-gray-950 mb-4">
            Gardez un œil sur chaque euro
          </h2>
          <p className="text-md font-normal tracking-tight text-gray-600 mx-auto mb-8 max-w-2xl">
            Synchronisez vos comptes, suivez vos flux et anticipez vos besoins
            de trésorerie depuis un seul tableau de bord.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-y border-neutral-200 divide-neutral-200">
          {/* Card 1 */}
          <div className="md:border-r border-b border-neutral-200">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Synchronisation bancaire automatique
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Connectez vos comptes bancaires et retrouvez toutes vos
                transactions en temps réel, sans ressaisie manuelle.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 flex flex-col md:h-80 overflow-hidden perspective-distant mask-radial-from-20%">
              <div className="flex-1 rounded-t-3xl gap-4 space-y-4 w-full h-full px-8 flex-col items-center justify-center">
                <div className="grid grid-cols-4 gap-2 justify-center max-w-md mx-auto">
                  <GridItem />
                  <GridItem img={bankImages[0]} />
                  <GridItem img={bankImages[1]} />
                  <GridItem />
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <GridItem />
                  <GridItem img={bankImages[2]} />
                  <GridItem img="/newbi-icon.svg" small />
                  <GridItem img={bankImages[3]} />
                  <GridItem />
                </div>
                <div className="grid grid-cols-4 justify-center max-w-md mx-auto gap-2">
                  <GridItem />
                  <GridItem img={bankImages[4]} />
                  <GridItem img={bankImages[5]} />
                  <GridItem />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="border-b border-neutral-200">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Rapprochez vos transactions
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Associez automatiquement vos factures à vos mouvements bancaires
                pour un suivi comptable sans effort.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 flex flex-col md:h-80 overflow-hidden perspective-distant">
              <div className="flex-1 rounded-t-3xl gap-2 flex flex-col bg-neutral-100 border border-neutral-200 max-w-[20rem] lg:max-w-sm mx-auto w-full h-full absolute inset-x-0 inset-y-2 p-2 overflow-hidden">
                <div className="p-5 shadow-black/10 border bg-white border-transparent ring-1 rounded-[20px] ring-black/10 flex items-center gap-3">
                  <div className="size-10 shrink-0 rounded-lg flex items-center justify-center bg-white border border-neutral-200 overflow-hidden">
                    <img
                      src="/bnp-logo.png"
                      alt="BNP Paribas"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <p className="text-sm font-semibold text-neutral-800">
                      Virement reçu
                    </p>
                    <p className="text-xs text-neutral-400">
                      Reçu le 23 novembre 2025
                    </p>
                  </div>
                  <p className="text-base font-medium text-green-600 shrink-0">
                    2 880,00 €
                  </p>
                </div>
                <div className="absolute left-1/2 top-[82px] -translate-x-1/2 z-20">
                  <div className="size-10 rounded-full bg-white shadow-md flex items-center justify-center">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#525252"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 2v6h-6M3 12a9 9 0 0115.4-6.4L21 8M3 22v-6h6M21 12a9 9 0 01-15.4 6.4L3 16" />
                    </svg>
                  </div>
                </div>
                <div className="p-5 shadow-black/10 border bg-white border-transparent ring-1 rounded-[20px] ring-black/10 flex items-center gap-3">
                  <div className="size-10 shrink-0 rounded-lg flex items-center justify-center bg-white border border-neutral-200">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#525252"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <p className="text-sm font-semibold text-neutral-800">
                      Facture F-0027
                    </p>
                    <p className="text-xs text-neutral-400">Julien Marchand</p>
                  </div>
                  <p className="text-base font-medium text-neutral-800 shrink-0">
                    2 880,00 €
                  </p>
                </div>
                <div className="p-5 shadow-black/10 border bg-white border-transparent ring-1 rounded-[20px] ring-black/10 flex items-center gap-3">
                  <div className="size-10 shrink-0 rounded-lg flex items-center justify-center bg-white overflow-hidden">
                    <img
                      src="/urssaf-logo.png"
                      alt="URSSAF"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <p className="text-sm font-semibold text-neutral-800">
                      Prélèvement URSSAF
                    </p>
                    <p className="text-xs text-neutral-400">
                      Débité le 15 décembre 2025
                    </p>
                  </div>
                  <p className="text-base font-medium text-neutral-800 shrink-0">
                    1 240,00 €
                  </p>
                </div>
                <div className="p-5 shadow-black/10 border bg-white border-transparent ring-1 rounded-[20px] ring-black/10 flex items-center gap-3">
                  <div className="size-10 shrink-0 rounded-lg flex items-center justify-center bg-white border border-neutral-200">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#525252"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                      <rect x="9" y="3" width="6" height="4" rx="1" />
                      <path d="M9 14l2 2 4-4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <p className="text-sm font-semibold text-neutral-800">
                      Devis D-0041
                    </p>
                    <p className="text-xs text-neutral-400">Sophie Lemaire</p>
                  </div>
                  <p className="text-base font-medium text-green-600 shrink-0">
                    4 500,00 €
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="border-b md:border-b-0 md:border-r border-neutral-200">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Anticipez vos échéances
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Recevez des alertes sur vos prochaines échéances et ne laissez
                plus aucun paiement vous surprendre.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 flex flex-col md:h-80 overflow-hidden perspective-distant">
              <div className="flex-1 rounded-t-3xl gap-2 flex flex-col bg-neutral-100 border border-neutral-200 mx-auto w-full h-full absolute inset-x-4 inset-y-2 p-2 overflow-hidden">
                {/* Notification cards */}
                {/* Notif 1 - TVA */}
                <div className="p-5 shadow-black/10 border bg-white border-transparent ring-1 rounded-[20px] ring-black/10 flex items-center gap-3">
                  <div className="size-10 shrink-0 rounded-lg flex items-center justify-center bg-white border border-neutral-200">
                    <Bell className="w-4 h-4 text-neutral-600" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <p className="text-sm font-semibold text-neutral-800">
                      Échéance TVA dans 5 jours
                    </p>
                    <p className="text-xs text-neutral-400">
                      Déclaration trimestrielle à effectuer
                    </p>
                  </div>
                  <span className="text-[9px] font-medium px-2 py-1 rounded-md border shrink-0 bg-red-50 text-red-500 border-red-200">
                    Urgent
                  </span>
                </div>

                {/* Notif 2 - Facture */}
                <div className="p-5 shadow-black/10 border bg-white border-transparent ring-1 rounded-[20px] ring-black/10 flex items-center gap-3">
                  <div className="size-10 shrink-0 rounded-lg flex items-center justify-center bg-white border border-neutral-200">
                    <FileText className="w-4 h-4 text-neutral-600" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <p className="text-sm font-semibold text-neutral-800">
                      Facture F-0027 à relancer
                    </p>
                    <p className="text-xs text-neutral-400">
                      Julien Marchand — 2 880,00 €
                    </p>
                  </div>
                  <span className="text-[9px] font-medium px-2 py-1 rounded-md border shrink-0 bg-orange-50 text-orange-500 border-orange-200">
                    En retard
                  </span>
                </div>

                {/* Notif 3 - URSSAF */}
                <div className="p-5 shadow-black/10 border bg-white border-transparent ring-1 rounded-[20px] ring-black/10 flex items-center gap-3">
                  <div className="size-10 shrink-0 rounded-lg flex items-center justify-center bg-white overflow-hidden">
                    <img
                      src="/urssaf-logo.png"
                      alt="URSSAF"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <p className="text-sm font-semibold text-neutral-800">
                      Prélèvement URSSAF le 15
                    </p>
                    <p className="text-xs text-neutral-400">
                      Cotisations sociales — 1 240,00 €
                    </p>
                  </div>
                  <span className="text-[9px] font-medium px-2 py-1 rounded-md border shrink-0 bg-blue-50 text-blue-500 border-blue-200">
                    Dans 12j
                  </span>
                </div>

                {/* Notif 4 - Payé */}
                <div className="p-5 shadow-black/10 border bg-white border-transparent ring-1 rounded-[20px] ring-black/10 flex items-center gap-3">
                  <div className="size-10 shrink-0 rounded-lg flex items-center justify-center bg-white border border-neutral-200">
                    <CheckCircle className="w-4 h-4 text-neutral-600" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <p className="text-sm font-semibold text-neutral-800">
                      Loyer bureau payé
                    </p>
                    <p className="text-xs text-neutral-400">
                      Paiement automatique effectué
                    </p>
                  </div>
                  <span className="text-[9px] font-medium px-2 py-1 rounded-md border shrink-0 bg-green-50 text-green-600 border-green-200">
                    Payé
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div>
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Visualisez vos flux en un coup d&apos;œil
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Graphiques clairs et intuitifs pour comprendre instantanément
                vos entrées, sorties et solde de trésorerie.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden">
              <div className="flex items-center justify-center h-full px-6 gap-8">
                <div className="relative shrink-0">
                  <svg width="220" height="220" viewBox="-5 -5 210 210">
                    <circle
                      cx="100"
                      cy="100"
                      r="88"
                      fill="none"
                      stroke="#f5f5f5"
                      strokeWidth="24"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="88"
                      fill="none"
                      stroke="#A585DB"
                      strokeWidth="24"
                      strokeDasharray="228 325"
                      strokeDashoffset="138"
                      transform="rotate(-90 100 100)"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="88"
                      fill="none"
                      stroke="#7BC8A4"
                      strokeWidth="24"
                      strokeDasharray="151 402"
                      strokeDashoffset="-94"
                      transform="rotate(-90 100 100)"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="88"
                      fill="none"
                      stroke="#E8B87D"
                      strokeWidth="24"
                      strokeDasharray="96 457"
                      strokeDashoffset="-249"
                      transform="rotate(-90 100 100)"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="88"
                      fill="none"
                      stroke="#85B8E0"
                      strokeWidth="24"
                      strokeDasharray="62 491"
                      strokeDashoffset="-349"
                      transform="rotate(-90 100 100)"
                    />
                    <circle cx="100" cy="100" r="76" fill="white" />
                    <text
                      x="100"
                      y="92"
                      textAnchor="middle"
                      style={{ fill: "#1a1a1a" }}
                      fontSize="17"
                      fontWeight="600"
                      fontFamily="system-ui"
                    >
                      42 580,00 €
                    </text>
                    <text
                      x="100"
                      y="112"
                      textAnchor="middle"
                      style={{ fill: "#a3a3a3" }}
                      fontSize="9"
                      fontFamily="system-ui"
                    >
                      Du 1 janv. 2026
                    </text>
                    <text
                      x="100"
                      y="125"
                      textAnchor="middle"
                      style={{ fill: "#a3a3a3" }}
                      fontSize="9"
                      fontFamily="system-ui"
                    >
                      au 3 avr. 2026
                    </text>
                  </svg>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    {
                      color: "#A585DB",
                      label: "Prestations de service",
                      pct: "42,0",
                    },
                    {
                      color: "#7BC8A4",
                      label: "Ventes de produits",
                      pct: "28,0",
                    },
                    { color: "#E8B87D", label: "Consulting", pct: "18,0" },
                    { color: "#85B8E0", label: "Autres revenus", pct: "12,0" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-normal text-neutral-800">
                        {item.label} ({item.pct} %)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
