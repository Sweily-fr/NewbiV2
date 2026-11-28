// Pièces de mini-interfaces pour les LP outils : on montre le produit
// plutôt qu'une icône générique, avec les codes du tableau de bord (chips de
// statut, lignes de liste, violet Newbi). Purement statiques.

export const VIOLET = "#5A50FF";

export function Chip({ tone = "gray", children }) {
  const tones = {
    gray: "bg-gray-100 text-gray-600",
    violet: "bg-[#5A50FF]/10 text-[#5A50FF]",
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

// Fenêtre d'application (barre à 3 points + titre) pour le visuel du hero.
export function AppWindow({ title, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-[0_24px_60px_-20px_rgba(16,16,32,0.18)] overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-1.5 border-b border-gray-100 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-gray-200" />
        <span className="size-2.5 rounded-full bg-gray-200" />
        <span className="size-2.5 rounded-full bg-gray-200" />
        {title && (
          <span className="ml-3 text-[11px] font-medium text-gray-500">
            {title}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// Carte ancrée en bas d'une carte du bento (coins bas carrés, sort du cadre).
export function SheetCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-t-xl border border-b-0 border-gray-200 bg-white shadow-xs overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

export function Row({ children, className = "" }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-3 py-2 text-xs text-gray-700 border-b border-gray-100 last:border-0 ${className}`}
    >
      {children}
    </div>
  );
}

export function Avatar({ initials, tone = "violet" }) {
  const tones = {
    violet: "bg-[#5A50FF]/10 text-[#5A50FF]",
    orange: "bg-orange-100 text-orange-700",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ${tones[tone]}`}
    >
      {initials}
    </span>
  );
}

export function Stat({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2.5">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className="mt-0.5 text-base font-semibold tracking-tight text-gray-950">
        {value}
      </p>
      {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
    </div>
  );
}

export function Bar({ pct, tone = VIOLET }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100">
      <div
        className="h-1.5 rounded-full"
        style={{ width: `${pct}%`, backgroundColor: tone }}
      />
    </div>
  );
}
