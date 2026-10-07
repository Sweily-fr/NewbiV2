import React from "react";

// Illustration fixe : l'export comptable du mois, prêt à partir chez
// l'expert-comptable. Pas d'animation — c'est une preuve, pas une démo.
const ROWS = [
  ["Factures de vente", "38"],
  ["Avoirs", "4"],
  ["Justificatifs d'achat", "10"],
];

export function AccountingExportVisual() {
  return (
    <div className="absolute inset-0 flex items-start justify-center px-4 pt-3">
      <div className="w-full min-h-[340px] max-w-[320px] overflow-hidden rounded-t-2xl bg-white p-5 ring-1 ring-black/[0.06] shadow-[0_24px_60px_-16px_rgba(16,16,24,0.20)]">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-gray-950">
            Export comptable
          </p>
          <span className="rounded-md bg-[#DDF3E4] px-2 py-1 text-[11px] font-medium text-[#1c7a4e]">
            Prêt
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-gray-500">
          Mars 2026 · 52 pièces
        </p>

        <div className="mt-4 divide-y divide-gray-100">
          {ROWS.map(([label, count]) => (
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
              <span className="tabular-nums text-gray-500">{count}</span>
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

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#F4F2FF] px-3 py-2 text-[11.5px] text-[#5B46B8]">
          <svg
            className="size-3.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v12M8 11l4 4 4-4" />
            <path d="M4 20h16" />
          </svg>
          Envoyé à votre expert-comptable
        </div>
      </div>
    </div>
  );
}

export default AccountingExportVisual;
