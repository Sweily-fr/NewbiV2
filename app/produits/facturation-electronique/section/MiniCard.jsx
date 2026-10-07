import React from "react";

/* Petite carte d'information posée sur un visuel photographique : même dessin
   que celles des hero des LP métier et statut (app/(main)/_statuts/StatutHero),
   à une taille réduite pour tenir dans la largeur d'une carte de bento.

   `className` porte le placement (absolu, relatif au conteneur du visuel). */
export default function MiniCard({
  icon: Icone,
  titre,
  texte,
  className = "",
}) {
  return (
    <div
      className={`absolute flex items-center gap-2.5 rounded-xl bg-white/95 px-3 py-2.5 ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(16,16,32,0.04),0_8px_24px_-12px_rgba(16,16,32,0.18)] backdrop-blur-sm ${className}`}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-gray-50 text-gray-500 ring-1 ring-black/[0.05]">
        <Icone size={14} strokeWidth={1.75} />
      </span>
      <span className="block">
        <span className="block text-[12px] font-medium leading-tight text-gray-950">
          {titre}
        </span>
        <span className="mt-0.5 block text-[11px] leading-tight text-gray-500">
          {texte}
        </span>
      </span>
    </div>
  );
}
