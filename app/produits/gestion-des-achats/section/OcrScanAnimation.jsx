"use client";

import React from "react";

// Le justificatif entre dans le cadre, une barre de scan le balaie, puis les
// champs se remplissent un à un : c'est l'OCR qui fait la saisie. Le scénario
// dure 6 s, ne se joue qu'une fois et reste sur son état final. Il démarre
// quand la section entre à l'écran (attribut `data-play`, voir
// AchatsGovernanceSection).
const FIELDS = [
  ["Fournisseur", "Leroy Merlin"],
  ["Date", "20/02/2026"],
  ["Montant TTC", "248,90 €"],
  ["TVA 20 %", "41,48 €"],
];

export function OcrScanAnimation() {
  return (
    <div className="absolute inset-x-0 bottom-0 flex justify-center px-4">
      <style>{`
        @keyframes ocrPaper {
          0%, 4%     { opacity: 0; transform: translateY(24px) }
          12%, 100%  { opacity: 1; transform: none }
        }
        /* 520 % = la hauteur du justificatif rapportée à celle du faisceau :
           un translateY(100%) ne le déplaçait que de sa propre hauteur, et le
           balayage s'arrêtait sous l'en-tête. */
        @keyframes ocrScan {
          0%, 12%   { opacity: 0; transform: translateY(-40%) }
          16%       { opacity: 1 }
          34%       { opacity: 1; transform: translateY(520%) }
          38%, 100% { opacity: 0; transform: translateY(520%) }
        }
        @keyframes ocrRead {
          0%, 14%   { opacity: 0 }
          20%, 34%  { opacity: 1 }
          40%, 100% { opacity: 0 }
        }
        @keyframes ocrField {
          0%, 36%    { opacity: 0; transform: translateY(8px) }
          44%, 100%  { opacity: 1; transform: none }
        }
        @keyframes ocrDone {
          0%, 68%    { opacity: 0; transform: scale(.9) }
          76%, 100%  { opacity: 1; transform: none }
        }
        /* En attente : rien ne bouge tant que la section n'est pas à l'écran */
        [data-play="on"] [data-ocr] { animation-play-state: running !important }
        @media (prefers-reduced-motion: reduce) {
          [data-ocr] { animation: none !important; opacity: 1 !important; transform: none !important }
        }
      `}</style>

      <div className="w-full max-w-[520px] rounded-t-2xl bg-white p-5 ring-1 ring-black/[0.06] shadow-[0_24px_60px_-16px_rgba(16,16,24,0.20)]">
        <div className="flex gap-4 md:gap-5">
          {/* Le justificatif, balayé par la barre de scan */}
          <div
            data-ocr
            className="relative w-[34%] shrink-0 overflow-hidden rounded-xl bg-[#F6F6F8] p-3 ring-1 ring-black/[0.05]"
            style={{
              animation: "ocrPaper 6s ease-out forwards",
              animationPlayState: "paused",
            }}
          >
            <div className="h-2 w-2/3 rounded-full bg-gray-300" />
            <div className="mt-2 h-1.5 w-1/2 rounded-full bg-gray-200" />
            <div className="mt-4 space-y-1.5">
              {[90, 70, 84, 60, 76].map((w, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full bg-gray-200"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="h-2 w-10 rounded-full bg-gray-300" />
              <div
                className="h-3 w-14 rounded-full"
                style={{ backgroundColor: "#D9D6FF" }}
              />
            </div>

            {/* Barre de scan */}
            <span
              data-ocr
              className="pointer-events-none absolute inset-x-0 top-0 h-10"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(90,80,255,0) 0%, rgba(90,80,255,0.18) 60%, rgba(90,80,255,0.55) 100%)",
                animation: "ocrScan 6s linear forwards",
                animationPlayState: "paused",
              }}
            />
            <span
              data-ocr
              className="absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: "#EBE6FD",
                color: "#5B46B8",
                animation: "ocrRead 6s ease-out forwards",
                animationPlayState: "paused",
              }}
            >
              Lecture…
            </span>
          </div>

          {/* Les champs reconnus, posés l'un après l'autre */}
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] uppercase tracking-wide text-gray-400">
              Champs reconnus
            </p>
            <div className="mt-2 divide-y divide-gray-100">
              {FIELDS.map(([label, value], i) => (
                <div
                  key={label}
                  data-ocr
                  className="flex items-center justify-between gap-2 py-2 text-[11.5px] md:text-[12px] whitespace-nowrap"
                  style={{
                    animation: `ocrField 6s ease-out ${i * 0.15}s both`,
                    animationPlayState: "paused",
                  }}
                >
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900 tabular-nums">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div
              data-ocr
              className="mt-3 flex items-center gap-2 rounded-lg bg-[#DDF3E4] px-3 py-2 text-[11.5px] text-[#1c7a4e]"
              style={{
                animation: "ocrDone 6s ease-out forwards",
                animationPlayState: "paused",
              }}
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
              Justificatif enregistré, aucune saisie
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OcrScanAnimation;
