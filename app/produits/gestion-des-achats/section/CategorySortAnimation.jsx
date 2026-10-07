"use client";

import React from "react";

// Les dépenses se répartissent d'elles-mêmes : les arcs du camembert se
// tracent un à un et la légende suit. Cycle de 5,5 s, en CSS pur.
// Circonférence du cercle (r = 34) ≈ 214.
const SEGMENTS = [
  { label: "Fournitures", amount: "1 240 €", color: "#5A50FF", len: 96, at: 0 },
  { label: "Repas", amount: "820 €", color: "#E8883A", len: 64, at: 96 },
  { label: "Carburant", amount: "410 €", color: "#2AA37A", len: 40, at: 160 },
];

export function CategorySortAnimation() {
  return (
    <div className="absolute inset-x-0 bottom-0 flex justify-center px-4">
      <style>{`
        @keyframes segGrow0 { 0%, 6%  { stroke-dasharray: 0 214 } 26%, 100% { stroke-dasharray: 96 214 } }
        @keyframes segGrow1 { 0%, 24% { stroke-dasharray: 0 214 } 44%, 100% { stroke-dasharray: 64 214 } }
        @keyframes segGrow2 { 0%, 42% { stroke-dasharray: 0 214 } 62%, 100% { stroke-dasharray: 40 214 } }
        @keyframes catRow {
          0%, 8%     { opacity: 0; transform: translateY(6px) }
          24%, 100%  { opacity: 1; transform: none }
        }
        /* En attente : rien ne bouge tant que la section n'est pas à l'écran */
        [data-play="on"] [data-cat] { animation-play-state: running !important }
        @media (prefers-reduced-motion: reduce) {
          [data-cat] { animation: none !important; opacity: 1 !important; transform: none !important; stroke-dasharray: none !important }
        }
      `}</style>

      <div className="w-full max-w-[380px] rounded-t-2xl bg-white p-5 ring-1 ring-black/[0.06] shadow-[0_24px_60px_-16px_rgba(16,16,24,0.20)]">
        <p className="text-[10.5px] uppercase tracking-wide text-gray-400">
          Dépenses du mois
        </p>

        <div className="mt-3 flex items-center gap-5">
          <svg viewBox="0 0 80 80" className="size-[92px] shrink-0 -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#F1F1F4"
              strokeWidth="10"
            />
            {SEGMENTS.map((s, i) => (
              <circle
                key={s.label}
                data-cat
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke={s.color}
                strokeWidth="10"
                strokeDashoffset={-s.at}
                style={{
                  animation: `segGrow${i} 5.5s ease-out forwards`,
                  animationPlayState: "paused",
                }}
              />
            ))}
          </svg>

          <div className="min-w-0 flex-1 space-y-2">
            {SEGMENTS.map((s, i) => (
              <div
                key={s.label}
                data-cat
                className="flex items-center gap-2 text-[12px]"
                style={{
                  animation: `catRow 5.5s ease-out ${i * 0.35}s both`,
                  animationPlayState: "paused",
                }}
              >
                <span
                  className="size-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: s.color }}
                />
                <span className="flex-1 truncate text-gray-700">{s.label}</span>
                <span className="font-medium text-gray-900 tabular-nums">
                  {s.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-[11px] text-gray-500">
          Catégorie déduite du fournisseur, modifiable en un clic.
        </p>
      </div>
    </div>
  );
}

export default CategorySortAnimation;
