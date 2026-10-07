"use client";

import React from "react";

// Maquette de la facture en cours de rédaction : les lignes se posent une à
// une, les totaux suivent, puis le statut bascule de « Brouillon » à « Prête
// à envoyer » et la conformité se confirme. Un seul cycle de 9 s, en boucle,
// pour que l'animation soit toujours en train de se jouer quand on arrive
// dessus. Tout est en CSS : pas de bibliothèque, pas de capture d'écran.
const LINES = [
  ["Audit SEO", "1", "1 200,00 €"],
  ["Audit UX", "1", "1 200,00 €"],
];

export function InvoicePreviewAnimation() {
  return (
    <div className="absolute inset-0 flex items-start justify-center px-4 pt-3">
      <style>{`
        @keyframes fiIn {
          0%, 6%   { opacity: 0; transform: translateY(10px) }
          14%, 92% { opacity: 1; transform: none }
          98%,100% { opacity: 0; transform: translateY(10px) }
        }
        @keyframes fiInB {
          0%, 14%  { opacity: 0; transform: translateY(10px) }
          22%, 92% { opacity: 1; transform: none }
          98%,100% { opacity: 0; transform: translateY(10px) }
        }
        @keyframes fiInC {
          0%, 26%  { opacity: 0; transform: translateY(10px) }
          34%, 92% { opacity: 1; transform: none }
          98%,100% { opacity: 0; transform: translateY(10px) }
        }
        @keyframes fiInD {
          0%, 52%  { opacity: 0; transform: translateY(8px) }
          60%, 92% { opacity: 1; transform: none }
          98%,100% { opacity: 0 }
        }
        @keyframes fiDraft { 0%, 40% { opacity: 1 } 46%, 100% { opacity: 0 } }
        @keyframes fiReady { 0%, 40% { opacity: 0 } 46%, 92% { opacity: 1 } 98%, 100% { opacity: 0 } }
        @media (prefers-reduced-motion: reduce) {
          [data-fi] { animation: none !important; opacity: 1 !important; transform: none !important }
        }
      `}</style>

      <div className="w-full max-w-[440px] overflow-hidden rounded-t-2xl bg-white ring-1 ring-black/[0.06] shadow-[0_24px_60px_-16px_rgba(16,16,24,0.20)]">
        {/* En-tête : référence et statut */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5">
          <div className="flex items-center gap-4">
            <img
              src="/newbiLetter.png"
              alt=""
              className="h-[18px] w-auto object-contain"
            />
            {/* Référence et émetteur sur une seule ligne, alignés avec le
                logo et la pastille de statut */}
            <p className="flex items-center gap-2 text-[13px]">
              <span className="font-medium text-gray-950">F-2026-0042</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500">Newbi Demo</span>
            </p>
          </div>
          <span className="relative inline-flex h-[22px] w-[104px] items-center justify-center">
            <span
              data-fi
              className="absolute inset-0 grid place-items-center rounded-md bg-gray-100 text-[11px] font-medium text-gray-500"
              style={{ animation: "fiDraft 9s ease-out infinite" }}
            >
              Brouillon
            </span>
            <span
              data-fi
              className="absolute inset-0 grid place-items-center rounded-md bg-[#DDF3E4] text-[11px] font-medium text-[#1c7a4e]"
              style={{ animation: "fiReady 9s ease-out infinite" }}
            >
              Prête à envoyer
            </span>
          </span>
        </div>

        {/* Client et dates */}
        <div className="grid grid-cols-3 gap-4 px-5 py-4 text-[11px]">
          {[
            ["Client", "Agence Delabre"],
            ["Émission", "03/04/2026"],
            ["Échéance", "03/05/2026"],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-gray-400">{k}</p>
              <p className="mt-0.5 text-[12px] text-gray-900">{v}</p>
            </div>
          ))}
        </div>

        {/* Lignes de prestation, posées l'une après l'autre */}
        <div className="px-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 text-[10.5px] uppercase tracking-wide text-gray-400">
            <span>Description</span>
            <span className="flex gap-10">
              <span>Qté</span>
              <span>Total HT</span>
            </span>
          </div>
          {LINES.map(([label, qty, total], i) => (
            <div
              key={label}
              data-fi
              className="flex items-center justify-between border-b border-gray-50 py-2.5 text-[12px]"
              style={{
                animation: `${i === 0 ? "fiIn" : "fiInB"} 9s ease-out infinite`,
              }}
            >
              <span className="text-gray-900">{label}</span>
              <span className="flex items-center gap-10 tabular-nums">
                <span className="text-gray-500">{qty}</span>
                <span className="w-[72px] text-right text-gray-900">
                  {total}
                </span>
              </span>
            </div>
          ))}
        </div>

        {/* Totaux */}
        <div
          data-fi
          className="px-5 py-3 text-[12px]"
          style={{ animation: "fiInC 9s ease-out infinite" }}
        >
          <div className="flex justify-between py-1 text-gray-500">
            <span>Total HT</span>
            <span className="tabular-nums">2 400,00 €</span>
          </div>
          <div className="flex justify-between py-1 text-gray-500">
            <span>TVA 20 %</span>
            <span className="tabular-nums">480,00 €</span>
          </div>
          <div className="mt-1 flex justify-between rounded-lg bg-[#F4F2FF] px-3 py-2 text-[13px] font-medium text-gray-950">
            <span>Total TTC</span>
            <span className="tabular-nums">2 880,00 €</span>
          </div>
        </div>

        {/* Confirmation de conformité */}
        <div
          data-fi
          className="mx-5 mb-4 flex items-center gap-2 rounded-lg bg-[#DDF3E4] px-3 py-2 text-[11.5px] text-[#1c7a4e]"
          style={{ animation: "fiInD 9s ease-out infinite" }}
        >
          <svg
            className="size-3.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12.5 9 17.5 20 6.5" />
          </svg>
          Mentions légales, numérotation et TVA vérifiées
        </div>
      </div>
    </div>
  );
}

export default InvoicePreviewAnimation;
