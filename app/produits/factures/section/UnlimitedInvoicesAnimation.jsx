"use client";

import React from "react";

// Le compteur de factures du mois grimpe, la jauge se remplit… puis les deux
// laissent place au symbole de l'infini : il n'y a pas de plafond. Cycle de
// 9 s en boucle, en CSS pur, aligné sur l'animation de la première carte.
const STEPS = ["12", "64", "218", "∞"];

export function UnlimitedInvoicesAnimation() {
  return (
    <div className="absolute inset-0 flex items-start justify-center px-4 pt-3">
      <style>{`
        @keyframes uiN1 { 0%, 4% { opacity: 0 } 8%, 24% { opacity: 1 } 28%, 100% { opacity: 0 } }
        @keyframes uiN2 { 0%, 24% { opacity: 0 } 28%, 44% { opacity: 1 } 48%, 100% { opacity: 0 } }
        @keyframes uiN3 { 0%, 44% { opacity: 0 } 48%, 62% { opacity: 1 } 66%, 100% { opacity: 0 } }
        @keyframes uiInf { 0%, 62% { opacity: 0; transform: scale(.85) } 70%, 94% { opacity: 1; transform: none } 99%, 100% { opacity: 0 } }
        @keyframes uiBar { 0%, 4% { transform: scaleX(0) } 62%, 94% { transform: scaleX(1) } 99%, 100% { transform: scaleX(0) } }
        @keyframes uiQuota { 0%, 62% { opacity: 1 } 68%, 100% { opacity: 0 } }
        @keyframes uiFree  { 0%, 62% { opacity: 0 } 68%, 94% { opacity: 1 } 99%, 100% { opacity: 0 } }
        @keyframes uiChip  { 0%, 66% { opacity: 0; transform: translateY(8px) } 74%, 94% { opacity: 1; transform: none } 99%, 100% { opacity: 0 } }
        @media (prefers-reduced-motion: reduce) {
          [data-ui] { animation: none !important; opacity: 1 !important; transform: none !important }
        }
      `}</style>

      <div className="w-full min-h-[340px] max-w-[320px] overflow-hidden rounded-t-2xl bg-white p-5 ring-1 ring-black/[0.06] shadow-[0_24px_60px_-16px_rgba(16,16,24,0.20)]">
        <p className="text-[10.5px] uppercase tracking-wide text-gray-400">
          Factures émises ce mois
        </p>

        {/* Le compteur : trois paliers, puis l'infini */}
        <div className="relative mt-1 h-[54px]">
          {STEPS.map((n, i) => (
            <span
              key={n}
              data-ui
              className="absolute inset-0 flex items-center text-[44px] font-medium leading-none tracking-tight text-gray-950 tabular-nums"
              style={{
                animation: `${["uiN1", "uiN2", "uiN3", "uiInf"][i]} 9s ease-out infinite`,
              }}
            >
              {n}
            </span>
          ))}
        </div>

        {/* La jauge se remplit sans jamais buter */}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <span
            data-ui
            className="block h-full origin-left rounded-full"
            style={{
              backgroundColor: "#5A50FF",
              animation: "uiBar 9s ease-out infinite",
            }}
          />
        </div>

        <div className="relative mt-2 h-4">
          <p
            data-ui
            className="absolute inset-0 text-[11px] text-gray-500"
            style={{ animation: "uiQuota 9s ease-out infinite" }}
          >
            Quota du mois
          </p>
          <p
            data-ui
            className="absolute inset-0 text-[11px] font-medium text-[#5B46B8]"
            style={{ animation: "uiFree 9s ease-out infinite" }}
          >
            Aucune limite, sur toutes les offres
          </p>
        </div>

        {/* Ce qui reste illimité, une fois le plafond levé */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {["Factures", "Devis", "Avoirs", "Clients"].map((label, i) => (
            <span
              key={label}
              data-ui
              className="rounded-md bg-gray-50 px-2 py-1 text-[11px] text-gray-700 ring-1 ring-black/[0.04]"
              style={{
                animation: `uiChip 9s ease-out ${i * 0.12}s infinite`,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UnlimitedInvoicesAnimation;
