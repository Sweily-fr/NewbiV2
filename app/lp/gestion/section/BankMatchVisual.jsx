// Carte « Le virement tombe, la facture se ferme » : visuel statique — un
// extrait de relevé bancaire ancré en bas à gauche (sortant de la carte), le
// virement du jour en tête relié à sa facture « Payée ». Aucune animation.
const ROWS = [
  ["Loyer atelier", "-850,00 €"],
  ["OVHcloud", "-29,99 €"],
  ["Studio Lumière", "+1 200,00 €"],
];

export default function BankMatchVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Relevé bancaire */}
      <div className="absolute left-4 md:left-6 bottom-0 w-[215px] rounded-t-2xl bg-white border border-b-0 border-neutral-200/80 shadow-[0_-2px_12px_-6px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-neutral-100">
          <span className="flex size-5 items-center justify-center rounded-md bg-neutral-900 text-[9px] font-semibold text-white">
            €
          </span>
          <span className="text-[12px] font-semibold text-neutral-900">
            Compte pro
          </span>
          <span className="ml-auto text-[10px] text-neutral-400">
            aujourd'hui
          </span>
        </div>
        <div className="px-4 py-2 text-[11px]">
          <div className="-mx-2 px-2 py-2 rounded-lg bg-[#5A50FF]/8 flex items-center justify-between">
            <span className="font-medium text-neutral-900">
              Atelier Horizon
            </span>
            <span className="font-semibold text-green-700">+3 240,00 €</span>
          </div>
          {ROWS.map(([label, amount]) => (
            <div
              key={label}
              className="flex items-center justify-between py-2 border-t border-neutral-100 first:border-t-0"
            >
              <span className="text-neutral-700">{label}</span>
              <span
                className={
                  amount.startsWith("+") ? "text-green-700" : "text-neutral-900"
                }
              >
                {amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Lien virement → facture, aligné sur la ligne du virement */}
      <svg
        className="pointer-events-none absolute left-[228px] md:left-[236px] bottom-[126px] w-[34px] h-[12px]"
        viewBox="0 0 34 12"
        fill="none"
        stroke="#5A50FF"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M2 6 H 32" />
        <circle cx="32" cy="6" r="2" fill="#5A50FF" stroke="none" />
      </svg>

      {/* Facture reliée */}
      <div className="absolute left-[258px] md:left-[266px] bottom-[96px] w-[112px] rounded-xl bg-white border border-neutral-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] px-3 py-2.5 text-[11px]">
        <p className="font-medium text-neutral-900">F-2026-041</p>
        <p className="text-neutral-500">Atelier Horizon</p>
        <span className="mt-1.5 inline-block rounded-md bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
          Payée
        </span>
      </div>
    </div>
  );
}
