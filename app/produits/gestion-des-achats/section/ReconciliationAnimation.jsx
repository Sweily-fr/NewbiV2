"use client";

import React from "react";

// Les justificatifs viennent se coller à leur transaction bancaire : la
// vignette arrive par la droite, la ligne passe en « Justificatif attaché »
// et le compteur de pièces manquantes descend à zéro. Le scénario dure 5,5 s et ne se joue qu'une fois.
const ROWS = [
  ["CB Leclerc", "−40,00 €"],
  ["Cb La Source", "−3,90 €"],
  ["PayPal", "−13,03 €"],
];

const COUNTS = ["3", "2", "1", "0"];

export function ReconciliationAnimation() {
  return (
    <div className="absolute inset-x-0 top-0 flex justify-center px-4">
      <style>{`
        @keyframes recChip {
          0%, 10%    { opacity: 0; transform: translateX(46px) }
          22%, 100%  { opacity: 1; transform: none }
        }
        @keyframes recMissing {
          0%, 10%   { opacity: 1 }
          20%, 100% { opacity: 0 }
        }
        @keyframes recCount0 { 0%, 14% { opacity: 1 } 20%, 100% { opacity: 0 } }
        @keyframes recCount1 { 0%, 20% { opacity: 0 } 26%, 40% { opacity: 1 } 46%, 100% { opacity: 0 } }
        @keyframes recCount2 { 0%, 46% { opacity: 0 } 52%, 66% { opacity: 1 } 72%, 100% { opacity: 0 } }
        @keyframes recCount3 { 0%, 72% { opacity: 0 } 78%, 100% { opacity: 1 } }
        /* En attente : rien ne bouge tant que la section n'est pas à l'écran */
        [data-play="on"] [data-rec] { animation-play-state: running !important }
        @media (prefers-reduced-motion: reduce) {
          [data-rec] { animation: none !important; opacity: 1 !important; transform: none !important }
        }
      `}</style>

      <div className="w-full max-w-[380px] rounded-t-2xl bg-white p-5 ring-1 ring-black/[0.06] shadow-[0_24px_60px_-16px_rgba(16,16,24,0.20)]">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-medium text-gray-950">
            Justificatifs manquants
          </p>
          {/* Le compteur descend au fur et à mesure des rapprochements */}
          <span className="relative inline-flex h-6 w-9 items-center justify-center">
            {COUNTS.map((n, i) => (
              <span
                key={n}
                data-rec
                className="absolute inset-0 grid place-items-center rounded-md bg-gray-50 text-[12px] font-medium text-gray-700 tabular-nums ring-1 ring-black/[0.04]"
                style={{
                  animation: `recCount${i} 5.5s linear forwards`,
                  animationPlayState: "paused",
                }}
              >
                {n}
              </span>
            ))}
          </span>
        </div>

        <div className="mt-3 divide-y divide-gray-100">
          {ROWS.map(([label, amount], i) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[12px] text-gray-900">{label}</p>
                <p className="text-[11px] text-gray-500 tabular-nums">
                  {amount}
                </p>
              </div>

              <span className="relative inline-flex h-[22px] w-[104px] items-center justify-end">
                {/* Avant : la pièce manque */}
                <span
                  data-rec
                  className="absolute inset-0 grid place-items-center rounded-md bg-gray-50 text-[10.5px] text-gray-400 ring-1 ring-black/[0.04]"
                  style={{
                    animation: `recMissing 5.5s linear ${i * 0.6}s both`,
                    animationPlayState: "paused",
                  }}
                >
                  Aucun justificatif
                </span>
                {/* Après : la vignette arrive et se colle */}
                <span
                  data-rec
                  className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-md text-[10.5px] font-medium"
                  style={{
                    backgroundColor: "#EBE6FD",
                    color: "#5B46B8",
                    animation: `recChip 5.5s ease-out ${i * 0.6}s both`,
                    animationPlayState: "paused",
                  }}
                >
                  <svg
                    className="size-3 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8-8a3.5 3.5 0 1 1 5 5l-8 8a2 2 0 0 1-3-3l7.5-7.5" />
                  </svg>
                  Justificatif
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReconciliationAnimation;
