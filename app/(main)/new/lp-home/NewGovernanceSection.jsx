"use client";
import React from "react";

const activities = [
  {
    color: "bg-blue-500",
    title: "Chiffre d'affaires",
    badge: "+12%",
    badgeType: "success",
    desc: "Croissance mensuelle détectée...",
  },
  {
    color: "bg-green-500",
    title: "Trésorerie",
    badge: "SAIN",
    badgeType: "success",
    desc: "Solde positif sur tous les comptes...",
  },
  {
    color: "bg-orange-500",
    title: "Factures impayées",
    badge: "3",
    badgeType: "processing",
    desc: "Relances automatiques planifiées...",
  },
  {
    color: "bg-indigo-500",
    title: "TVA à déclarer",
    badge: "15J",
    badgeType: "time",
    desc: "Échéance dans 15 jours...",
  },
  {
    color: "bg-blue-500",
    title: "Rapprochement",
    badge: "OK",
    badgeType: "success",
    desc: "Toutes les transactions rapprochées...",
  },
  {
    color: "bg-green-500",
    title: "Export comptable",
    badge: "ENVOYÉ",
    badgeType: "success",
    desc: "Transmis à votre expert-comptable...",
  },
  {
    color: "bg-orange-500",
    title: "Budget mensuel",
    badge: "85%",
    badgeType: "processing",
    desc: "Consommation du budget en cours...",
  },
];

const images = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80",
  "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=256&q=80",
  "https://images.unsplash.com/photo-1654110455429-cf322b40a906?w=256&q=80",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=256&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80",
  "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=256&q=80",
];

export default function NewGovernanceSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 lg-pb-10 relative overflow-hidden">
      <style>{`
        @keyframes growBar {
          0%, 5% { width: 0%; }
          25% { width: var(--bar-target); }
          75% { width: var(--bar-target); }
          90%, 100% { width: 0%; }
        }
        @keyframes spinSync {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes outerPill {
          0%, 14% { opacity: 0; width: 64px; transform: scale(0.5); }
          18% { opacity: 1; width: 64px; transform: scale(1); }
          49% { width: 64px; }
          55% { width: 170px; }
          65% { width: 170px; opacity: 1; }
          72%, 100% { width: 64px; opacity: 0; transform: scale(0.5); }
        }
        @keyframes greenPill {
          0%, 39% { width: 52px; transform: scale(0); }
          45% { width: 52px; transform: scale(1); }
          49% { width: 52px; }
          55% { width: 158px; }
          65% { width: 158px; transform: scale(1); }
          72%, 100% { width: 52px; transform: scale(0); }
        }
        @keyframes syncIcon {
          0%, 14% { opacity: 0; }
          18% { opacity: 1; }
          38% { opacity: 1; }
          40% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes checkIcon {
          0%, 42% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1); }
          65% { opacity: 1; }
          72%, 100% { opacity: 0; }
        }
        @keyframes associeText {
          0%, 52% { opacity: 0; }
          60% { opacity: 1; }
          65% { opacity: 1; }
          72%, 100% { opacity: 0; }
        }
        @keyframes insertCards {
          0% { max-height: 0; }
          15% { max-height: 220px; }
          65% { max-height: 220px; }
          78%, 100% { max-height: 0; }
        }
        @keyframes slideCard1 {
          0% { transform: translateY(-200px); }
          15% { transform: translateY(0); }
          65% { transform: translateY(0); }
          78%, 100% { transform: translateY(-200px); }
        }
        @keyframes slideCard2 {
          0% { transform: translateY(200px); }
          15% { transform: translateY(0); }
          65% { transform: translateY(0); }
          78%, 100% { transform: translateY(200px); }
        }
      `}</style>
      <div className="max-w-6xl px-4 md:px-8 mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5A50FF] mb-3">
            SOLUTION TOUT-EN-UN
          </span>
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance text-gray-950 dark:text-gray-50 mb-4">
            Gardez le contrôle de votre entreprise
          </h2>
          <p className="text-md font-normal tracking-tight text-gray-600 dark:text-gray-300 mx-auto mb-8 max-w-2xl">
            Centralisez toutes vos opérations financières et administratives sur
            une seule plateforme intuitive. Prenez des <span className="text-[#5A50FF] font-medium">décisions éclairées</span> grâce
            à une vue d'ensemble complète de votre activité.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-y border-neutral-200 dark:border-neutral-800 divide-neutral-200 dark:divide-neutral-800">
          <DashboardCard />
          <TresorerieCard />
          <MultiCompteCard />
          <RapportsCard />
          <FullWidthCard />
        </div>
      </div>
    </section>
  );
}

function DashboardCard() {
  return (
    <div className="md:border-r border-b border-neutral-200 dark:border-neutral-800">
      <div className="p-4 md:p-8">
        <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
          Tableau de bord en temps réel
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2 max-w-md text-balance">
          Suivez tous vos indicateurs clés en un coup d'oeil. Chiffre
          d'affaires, trésorerie, factures en attente — tout est centralisé.
        </p>
      </div>
      <div className="relative h-80 sm:h-60 flex flex-col md:h-80 overflow-hidden">
        <img
          src="/sectionNewGov1.png"
          alt="Dashboard newbi"
          className="absolute left-10 bottom-0 w-[140%] max-w-none rounded-tl-2xl object-cover object-left-top shadow-xs border border-neutral-200"
        />
      </div>
    </div>
  );
}

function ActivityItem({ color, title, badge, badgeType, desc }) {
  return (
    <div className="w-full" style={{ opacity: 1 }}>
      <div className="flex justify-between items-center w-full pl-4 relative overflow-hidden">
        <div className="items-center gap-2 flex">
          <div
            className={`size-5 rounded-sm text-white flex items-center justify-center ${color}`}
          >
            <SmallIcon />
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {title}
          </p>
          <Badge type={badgeType} value={badge} />
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 flex-nowrap max-w-[16rem] w-full text-left whitespace-nowrap overflow-hidden">
          {desc}
        </p>
      </div>
    </div>
  );
}

function Badge({ type, value }) {
  if (type === "time")
    return (
      <div className="flex gap-1 items-center px-1 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-200/10 dark:bg-neutral-200/10">
        <ClockIcon />
        <p className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
          {value}
        </p>
      </div>
    );
  if (type === "success")
    return (
      <div className="flex gap-1 items-center px-1 py-0.5 rounded-md bg-green-100 border border-green-200 dark:bg-green-100/10 dark:border-green-200/10">
        <p className="text-[10px] font-bold text-green-500">{value}</p>
      </div>
    );
  if (type === "processing")
    return (
      <div className="flex gap-1 items-center px-1 py-0.5 rounded-md bg-orange-100 border border-orange-200 dark:bg-orange-100/10 dark:border-orange-200/10">
        <p className="text-[10px] font-bold text-orange-500">{value}</p>
      </div>
    );
  return null;
}

function TresorerieCard() {
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="p-4 md:p-8">
        <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
          Pilotez vos chiffres, anticipez votre croissance
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2 max-w-md text-balance">
          Centralisez vos données financières et prenez les bonnes décisions
          grâce à des indicateurs clairs sur votre activité.
        </p>
      </div>
      <div className="relative h-80 sm:h-60 flex flex-col md:h-80 overflow-hidden">
        <div className="flex-1 flex items-center justify-center px-2 sm:px-8">
          <svg viewBox="0 0 400 200" className="w-full max-w-none sm:max-w-xl" fill="none">
            {/* Durée totale du cycle: 6s (1s grille + 2s courbe + 1s pause + 2s fade out/reset) */}

            {/* Grille de fond - lignes apparaissent de bas en haut avec rebond */}
            {[4, 3, 2, 1, 0].map((i, idx) => {
              const targetY = 30 + i * 35;
              const startY = targetY + 15;
              const bounceY = targetY - 4;
              return (
                <line
                  key={`h-${i}`}
                  x1="40"
                  y1={startY}
                  x2="380"
                  y2={startY}
                  stroke="#e5e5e5"
                  strokeWidth="0.5"
                  opacity="0"
                >
                  <animate
                    attributeName="opacity"
                    values="0;1;1;1;0;0"
                    keyTimes="0;0.02;0.55;0.75;0.85;1"
                    dur="7s"
                    begin={`${idx * 0.18}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="y1"
                    values={`${startY};${bounceY};${targetY + 2};${targetY};${targetY};${startY}`}
                    keyTimes="0;0.04;0.055;0.065;0.85;1"
                    dur="7s"
                    begin={`${idx * 0.18}s`}
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.2 0 0.2 1;0.4 0 0.6 1;0.4 0 0.2 1;0 0 1 1;0 0 1 1"
                  />
                  <animate
                    attributeName="y2"
                    values={`${startY};${bounceY};${targetY + 2};${targetY};${targetY};${startY}`}
                    keyTimes="0;0.04;0.055;0.065;0.85;1"
                    dur="7s"
                    begin={`${idx * 0.18}s`}
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.2 0 0.2 1;0.4 0 0.6 1;0.4 0 0.2 1;0 0 1 1;0 0 1 1"
                  />
                </line>
              );
            })}

            {/* Labels Y - apparaissent avec leurs lignes de bas en haut */}
            {[
              { y: 175, label: "0", idx: 0 },
              { y: 140, label: "3k", idx: 1 },
              { y: 105, label: "6k", idx: 2 },
              { y: 70, label: "9k", idx: 3 },
              { y: 35, label: "12k", idx: 4 },
            ].map((item) => (
              <text
                key={item.label}
                x="20"
                y={item.y}
                fontSize="10"
                textAnchor="middle"
                style={{ fill: "#a3a3a3" }}
                opacity="0"
              >
                {item.label}
                <animate
                  attributeName="opacity"
                  values="0;1;1;1;0;0"
                  keyTimes="0;0.02;0.55;0.75;0.85;1"
                  dur="7s"
                  begin={`${item.idx * 0.18}s`}
                  repeatCount="indefinite"
                />
              </text>
            ))}

            {/* Zone remplie sous la courbe */}
            <path
              d="M40,140 C80,130 100,90 140,85 C180,80 200,100 220,70 C240,40 260,50 280,35 C300,25 340,30 380,28 L380,170 L40,170 Z"
              fill="url(#areaGradient)"
              opacity="0"
            >
              <animate
                attributeName="opacity"
                values="0;0;1;1;0;0"
                keyTimes="0;0.15;0.45;0.75;0.85;1"
                dur="7s"
                repeatCount="indefinite"
              />
            </path>

            {/* Courbe principale animée */}
            <path
              d="M40,140 C80,130 100,90 140,85 C180,80 200,100 220,70 C240,40 260,50 280,35 C300,25 340,30 380,28"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="600"
              strokeDashoffset="600"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="600;600;0;0;600;600"
                keyTimes="0;0.1;0.5;0.75;0.85;1"
                dur="7s"
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0 0 1 1;0.4 0 0.2 1;0 0 1 1;0 0 1 1;0 0 1 1"
              />
            </path>

            {/* Points clés */}
            {[
              { cx: 140, cy: 85, on: "0.25" },
              { cx: 220, cy: 70, on: "0.32" },
              { cx: 280, cy: 35, on: "0.38" },
              { cx: 380, cy: 28, on: "0.45" },
            ].map((pt, i) => (
              <g key={i}>
                <circle cx={pt.cx} cy={pt.cy} r="6" fill="#22c55e" opacity="0">
                  <animate
                    attributeName="opacity"
                    values={`0;0;0.15;0.15;0;0`}
                    keyTimes={`0;${pt.on};${Number(pt.on) + 0.03};0.75;0.85;1`}
                    dur="7s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx={pt.cx} cy={pt.cy} r="3" fill="#22c55e" opacity="0">
                  <animate
                    attributeName="opacity"
                    values={`0;0;1;1;0;0`}
                    keyTimes={`0;${pt.on};${Number(pt.on) + 0.03};0.75;0.85;1`}
                    dur="7s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            ))}

            {/* Tooltip flottant */}
            <g opacity="0">
              <animate
                attributeName="opacity"
                values="0;0;1;1;0;0"
                keyTimes="0;0.45;0.48;0.75;0.85;1"
                dur="7s"
                repeatCount="indefinite"
              />
              <rect x="340" y="0" width="55" height="20" rx="4" fill="#202020" />
              <text x="367" y="13" fontSize="9" fill="white" textAnchor="middle" fontWeight="600">+34%</text>
            </g>

            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}

function GridItem({ img, icon }) {
  return (
    <div className="w-full justify-self-center aspect-square rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 relative p-[1px]">
      <div
        className={`flex items-center justify-center w-full h-full rounded-[12px] p-[1px] relative z-10 ${img ? "bg-gradient-to-br from-blue-500 via-transparent to-blue-500" : ""}`}
      >
        {img && (
          <img
            alt="item"
            loading="lazy"
            width="120"
            height="120"
            className="object-cover aspect-square rounded-[12px] relative z-20"
            src={img}
          />
        )}
        {icon && (
          <div className="h-full w-full bg-white dark:bg-neutral-900 rounded-[12px] flex items-center justify-center">
            <LogoIcon />
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-[image:repeating-linear-gradient(315deg,_rgba(0,0,0,0.05)_0,_rgba(0,0,0,0.05)_1px,_transparent_0,_transparent_50%)] bg-[size:5px_5px] rounded-xl bg-fixed"></div>
    </div>
  );
}

function RapportsCard() {
  return (
    <div className="dark:border-neutral-800">
      <div className="p-4 md:p-8">
        <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
          Gérez l'ensemble de vos dépenses
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2 max-w-md text-balance">
          Catégorisez automatiquement vos dépenses, scannez vos justificatifs
          et gardez un oeil sur chaque euro dépensé.
        </p>
      </div>
      <div className="relative h-80 sm:h-60 flex flex-col md:h-80 overflow-hidden perspective-distant">
        <div className="flex-1 rounded-t-3xl gap-2 flex flex-col bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 w-full h-full absolute inset-y-2 left-[-5%] right-4 pt-2 pl-[9%] pr-2">
          <div className="shadow-black/10 border bg-white dark:bg-neutral-900 border-transparent ring-1 rounded-tl-[16px] rounded-tr-[16px] ring-black/10 flex flex-col flex-1 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 py-2.5 px-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-neutral-200 dark:bg-neutral-700" />
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Dépenses par catégorie</p>
              </div>
              <p className="text-[10px] text-neutral-400">Ce mois</p>
            </div>

            {/* Lignes de dépenses */}
            <div className="flex flex-col">
              {[
                { label: "Logiciels", amount: "1 540 €", pct: "36%", color: "bg-indigo-500", barW: "w-[62%]" },
                { label: "Abonnements", amount: "1 140 €", pct: "27%", color: "bg-blue-500", barW: "w-[46%]" },
                { label: "Transport", amount: "880 €", pct: "21%", color: "bg-amber-500", barW: "w-[35%]" },
                { label: "Repas", amount: "720 €", pct: "16%", color: "bg-emerald-500", barW: "w-[28%]" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-neutral-50">
                  <div className={`w-2 h-2 rounded-sm ${item.color} shrink-0`} />
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 w-20 shrink-0">{item.label}</p>
                  <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full ${item.barW}`}
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 w-8 text-right shrink-0">{item.pct}</p>
                  <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 w-16 text-right shrink-0">{item.amount}</p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between px-4 py-3 mt-auto border-t border-neutral-200 dark:border-neutral-700">
              <p className="text-xs font-medium text-neutral-500">Total</p>
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">4 280 €</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MultiCompteCard() {
  return (
    <div className="border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800">
      <div className="p-4 md:p-8">
        <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
          Vos paiements, sous contrôle
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2 max-w-md text-balance">
          Synchronisez vos transactions et relancez
          les retards en quelques clics.
        </p>
      </div>
      <div className="relative h-80 sm:h-60 flex flex-col md:h-80 overflow-hidden perspective-distant">
        <div className="flex-1 rounded-t-3xl gap-2 flex flex-col bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-700 border border-neutral-200 max-w-[20rem] lg:max-w-sm mx-auto w-full h-full absolute inset-x-0 inset-y-2 p-2 overflow-hidden">
          {/* Wrapper height animation — pousse cards 3+4 vers le bas */}
          <div style={{ animation: "insertCards 5s ease-out infinite" }}>
            {/* Card 1 - Virement bancaire */}
            <div className="p-5 mb-2 shadow-black/10 border bg-white dark:bg-neutral-900 border-transparent ring-1 rounded-[20px] ring-black/10 flex items-center gap-3" style={{ animation: "slideCard1 5s ease-out infinite" }}>
              <div className="size-10 shrink-0 rounded-lg flex items-center justify-center bg-white border border-neutral-200 overflow-hidden">
                <img src="/bnp-logo.png" alt="BNP Paribas" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 space-y-2.5">
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Virement reçu</p>
                <p className="text-xs text-neutral-400">Reçu le 23 novembre 2025</p>
              </div>
              <p className="text-base font-medium text-green-600 shrink-0">2 880,00 €</p>
            </div>

            {/* Card 2 - Facture */}
            <div className="p-5 shadow-black/10 border bg-white dark:bg-neutral-900 border-transparent ring-1 rounded-[20px] ring-black/10 flex items-center gap-3 relative z-0" style={{ animation: "slideCard2 5s ease-out infinite" }}>
              <div className="size-10 shrink-0 rounded-lg flex items-center justify-center bg-white border border-neutral-200">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 space-y-2.5">
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Facture F-0027</p>
                <p className="text-xs text-neutral-400">Julien Marchand</p>
              </div>
              <p className="text-base font-medium text-neutral-800 shrink-0">2 880,00 €</p>
            </div>
          </div>

          {/* Sync badge — absolute entre les deux cards */}
          <div className="absolute left-1/2 top-[72px] -translate-x-1/2 z-20">
            <div
              className="h-[64px] rounded-full bg-white flex items-center justify-center relative overflow-hidden"
              style={{ animation: "outerPill 5s ease-out infinite", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
            >
              <div
                className="h-[52px] rounded-full bg-[#22c55e] absolute flex items-center px-3.5 gap-2.5"
                style={{ animation: "greenPill 5s ease-out infinite" }}
              >
                <div
                  className="size-8 shrink-0 rounded-full bg-white flex items-center justify-center"
                  style={{ animation: "checkIcon 5s ease-out infinite" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <span
                  className="text-lg font-semibold text-white whitespace-nowrap pr-1"
                  style={{ animation: "associeText 5s ease-out infinite" }}
                >
                  Associée
                </span>
              </div>
              <svg
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="absolute"
                style={{ animation: "syncIcon 5s ease-out infinite, spinSync 1s linear infinite" }}
              >
                <path d="M21 2v6h-6M3 12a9 9 0 0115.4-6.4L21 8M3 22v-6h6M21 12a9 9 0 01-15.4 6.4L3 16" />
              </svg>
            </div>
          </div>

          {/* Card 3 - Prélèvement (pushed down by wrapper) */}
          <div className="p-5 shadow-black/10 border bg-white dark:bg-neutral-900 border-transparent ring-1 rounded-[20px] ring-black/10 flex items-center gap-3 relative z-10">
            <div className="size-10 shrink-0 rounded-lg flex items-center justify-center bg-white overflow-hidden">
              <img src="/urssaf-logo.png" alt="URSSAF" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 space-y-2.5">
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Prélèvement URSSAF</p>
              <p className="text-xs text-neutral-400">Débité le 15 décembre 2025</p>
            </div>
            <p className="text-base font-medium text-neutral-800 shrink-0">1 240,00 €</p>
          </div>

          {/* Card 4 - Devis (pushed down by wrapper) */}
          <div className="p-5 shadow-black/10 border bg-white dark:bg-neutral-900 border-transparent ring-1 rounded-[20px] ring-black/10 flex items-center gap-3 relative z-10">
            <div className="size-10 shrink-0 rounded-lg flex items-center justify-center bg-white border border-neutral-200">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 14l2 2 4-4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 space-y-2.5">
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Devis D-0041</p>
              <p className="text-xs text-neutral-400">Sophie Lemaire</p>
            </div>
            <p className="text-base font-medium text-green-600 shrink-0">4 500,00 €</p>
          </div>

          {/* Card 5 - Dépense Vercel */}
          <div className="p-5 shadow-black/10 border bg-white dark:bg-neutral-900 border-transparent ring-1 rounded-[20px] ring-black/10 flex items-center gap-3 relative z-10">
            <div className="size-10 shrink-0 rounded-lg flex items-center justify-center bg-white border border-neutral-200 overflow-hidden">
              <img src="https://cdn.brandfetch.io/idxAg10C0L/theme/dark/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1746435914582" alt="Stripe" className="w-6 h-6 object-contain" />
            </div>
            <div className="flex-1 min-w-0 space-y-2.5">
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Stripe - Commission</p>
              <p className="text-xs text-neutral-400">Débité le 1er décembre 2025</p>
            </div>
            <p className="text-base font-medium text-neutral-800 shrink-0">45,90 €</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FullWidthCard() {
  return (
    <div className="md:col-span-2 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-1 md:grid-cols-[5fr_6fr] overflow-hidden">
      {/* Texte gauche */}
      <div className="p-4 md:p-8">
        <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
          Des factures qui inspirent confiance
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2 max-w-lg text-balance">
          Créez des factures élégantes et professionnelles
          qui reflètent l'image de votre entreprise. Personnalisez vos modèles,
          ajoutez votre logo et envoyez-les en un clic. Vos clients reçoivent
          un document soigné qui renforce votre crédibilité.
        </p>
      </div>
      {/* Image droite */}
      <div className="h-[300px]">
        <img
          src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&q=80"
          alt="Factures professionnelles"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

function FilterBtn({ color, label, active }) {
  const colors = {
    blue: "bg-blue-100 border-blue-200",
    green: "bg-green-100 border-green-200",
    orange: "bg-orange-100 border-orange-200",
    indigo: "bg-indigo-100 border-indigo-200",
    neutral: "bg-neutral-100 border-neutral-200",
    purple: "bg-purple-100 border-purple-200",
  };
  return (
    <button
      className={`px-2 py-1 rounded-sm relative text-xs gap-1 cursor-pointer flex items-center justify-center border ${colors[color]} ${active ? "opacity-100" : "opacity-50"}`}
    >
      {label}
    </button>
  );
}

function IntBadge({ label, color }) {
  return (
    <div className="flex items-center gap-1 w-fit rounded-sm px-1 py-0.5 border border-neutral-200 dark:border-neutral-200/10 text-sm">
      <div
        className="size-3 rounded-full"
        style={{ backgroundColor: color }}
      ></div>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}

function ActivityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g opacity="0.8">
        <path
          d="M3.2 2.4V4.8H6.4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.2 4.8V10.4C3.2 11.3 3.9 12 4.8 12H6.4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="8.8"
          y="2.4"
          width="4"
          height="4"
          rx="0.4"
          fill="currentColor"
        />
        <rect
          x="8.8"
          y="9.6"
          width="4"
          height="4"
          rx="0.4"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}
function SmallIcon() {
  return (
    <svg width="8" height="8" fill="white">
      <circle cx="4" cy="4" r="3" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function LogoIcon() {
  return (
    <svg width="20" height="15" viewBox="0 0 20 15" fill="currentColor">
      <path d="M4.9 14.9H0V10H4.9V14.9ZM19.7 14.9H9.8V10H4.9V5H9.8V0.1H19.7V14.9ZM9.8 10H14.8V5H9.8V10ZM4.9 5H0V0.1H4.9V5Z" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M10.3 4.3c.4-1.8 2.9-1.8 3.4 0a1.7 1.7 0 002.6 1.1c1.5-.9 3.3.8 2.4 2.4a1.7 1.7 0 001 2.6c1.8.4 1.8 2.9 0 3.3a1.7 1.7 0 00-1 2.6c.9 1.5-.9 3.3-2.4 2.4a1.7 1.7 0 00-2.6 1c-.4 1.8-2.9 1.8-3.3 0a1.7 1.7 0 00-2.6-1c-1.5.9-3.3-.9-2.4-2.4a1.7 1.7 0 00-1-2.6c-1.8-.4-1.8-2.9 0-3.3a1.7 1.7 0 001-2.6c-.9-1.5.9-3.3 2.4-2.4 1 .6 2.3.1 2.6-1z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function SparklesIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M16 18a2 2 0 012 2 2 2 0 012-2 2 2 0 01-2-2 2 2 0 01-2 2zm0-12a2 2 0 012 2 2 2 0 012-2 2 2 0 01-2-2 2 2 0 01-2 2zm-7 12a6 6 0 016-6 6 6 0 01-6-6 6 6 0 01-6 6 6 6 0 016 6z" />
    </svg>
  );
}
function BankIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
    </svg>
  );
}

function FilterSearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-purple-500"
    >
      <path d="M4 6h16M6 12h8.5M9 18h2" />
      <circle cx="18" cy="18" r="3" />
      <path d="M20.2 20.2l1.8 1.8" />
    </svg>
  );
}
function ApprovalSVG1() {
  return (
    <svg
      width="190"
      height="197"
      viewBox="0 0 190 197"
      fill="none"
      className="absolute left-40 -top-4 mx-auto z-30"
    >
      <path
        d="M59.9 36.1C100.3 49.8 140 99 153.9 150.5L155.8 148.2C158.4 145.1 163.8 146.9 167.9 152.3C171.9 157.7 173.1 164.7 170.4 167.8L156.9 183.7C154.3 186.8 148.8 185 144.8 179.6L124.3 152.2C120.3 146.8 119.2 139.9 121.8 136.7C124.5 133.6 129.9 135.4 133.9 140.8L136.3 143.9C124.4 104.9 94.2 68.4 63.4 57.9C42.3 50.8 25.7 57.6 17.4 73.9C15.4 77.8 10.2 77.1 5.8 72.2C1.4 67.4-0.5 60.2 1.5 56.3C12 35.6 33 27 59.9 36.1Z"
        fill="url(#ng1)"
        stroke="url(#ng2)"
        strokeWidth="0.2"
      />
      <defs>
        <linearGradient id="ng1" x1="86" y1="49" x2="44" y2="123">
          <stop stopColor="#CCC" />
          <stop offset="1" stopColor="#F7F7F7" />
        </linearGradient>
        <linearGradient id="ng2" x1="86" y1="49" x2="44" y2="123">
          <stop />
          <stop offset="1" stopOpacity="0.5" />
        </linearGradient>
      </defs>
    </svg>
  );
}
function ApprovalSVG2() {
  return (
    <svg
      width="191"
      height="198"
      viewBox="0 0 191 198"
      fill="none"
      className="absolute left-32 -bottom-10 mx-auto blur-[2px]"
    >
      <path
        d="M145.1 85.1C149.2 84.4 154.6 88.8 157.2 95L170.7 126.5C173.4 132.7 172.2 138.3 168.2 139C164.2 139.8 158.7 135.3 156.1 129.1L154.2 124.7C140.3 160.1 100.6 163.6 60.2 130.6C33.4 108.7 12.3 75.7 1.8 42.9C-0.2 36.6 1.7 31.8 6.1 32C10.5 32.2 15.7 37.5 17.7 43.7C26 69.6 42.6 95.6 63.7 112.8C94.5 137.9 124.7 136.2 136.6 110.9L134.3 111.3C130.2 112.1 124.8 107.6 122.1 101.4C119.5 95.2 120.6 89.6 124.6 88.9L145.1 85.1Z"
        fill="url(#ng3)"
        stroke="url(#ng4)"
        strokeWidth="0.2"
      />
      <defs>
        <linearGradient id="ng3" x1="87" y1="50" x2="44" y2="123">
          <stop stopColor="#CCC" />
          <stop offset="1" stopColor="#F7F7F7" />
        </linearGradient>
        <linearGradient id="ng4" x1="87" y1="50" x2="44" y2="123">
          <stop />
          <stop offset="1" stopOpacity="0.5" />
        </linearGradient>
      </defs>
    </svg>
  );
}
