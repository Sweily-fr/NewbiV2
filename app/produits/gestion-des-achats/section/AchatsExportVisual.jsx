import React from "react";

// Visuel fixe : le point de repos du bento. L'export du mois, prêt à partir
// chez l'expert-comptable — c'est une preuve, pas une démo.
const ROWS = [
  ["Factures d'achat", "38"],
  ["Notes de frais", "10"],
  ["TVA déductible", "1 240,00 €"],
];

export function AchatsExportVisual() {
  return (
    <div className="absolute inset-x-0 top-0 flex justify-center px-4">
      <div className="w-full max-w-[440px] rounded-t-2xl bg-white p-5 ring-1 ring-black/[0.06] shadow-[0_24px_60px_-16px_rgba(16,16,24,0.20)]">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-gray-950">Export achats</p>
          <span className="rounded-md bg-[#DDF3E4] px-2 py-1 text-[11px] font-medium text-[#1c7a4e]">
            Prêt
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-gray-500">
          Mars 2026 · 48 pièces
        </p>

        <div className="mt-4 divide-y divide-gray-100">
          {ROWS.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between py-2.5 text-[12px]"
            >
              <span className="flex items-center gap-2 text-gray-800">
                <svg
                  className="size-3.5 shrink-0 text-[#1c7a4e]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12.5 9 17.5 20 6.5" />
                </svg>
                {label}
              </span>
              <span className="tabular-nums text-gray-500">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-1.5">
          {["FEC", "CSV", "Sage", "Cegid"].map((f) => (
            <span
              key={f}
              className="rounded-md bg-gray-50 px-2 py-1 text-[11px] text-gray-700 ring-1 ring-black/[0.04]"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AchatsExportVisual;
