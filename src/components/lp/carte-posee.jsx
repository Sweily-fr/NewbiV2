import React from "react";
import { OMBRE } from "@/src/lib/lp-visuels";

/* Petite carte d'information posée sur une photographie : un pictogramme, un
   titre, une ligne de précision. C'est le dessin des cartes des heros de LP
   métier (_statuts/StatutHero), à une échelle plus petite — ici elles sont
   posées dans une carte de bento, pas dans un hero.

   `placement` porte le positionnement absolu, qui dépend de la photo : la
   carte ne présume de rien, elle se contente d'être positionnable. */
export default function CartePosee({ icon: Icone, titre, texte, placement }) {
  return (
    <div
      className={`absolute flex max-w-[210px] items-center gap-2.5 rounded-xl bg-white/95 px-3 py-2.5 backdrop-blur-sm ${OMBRE} ${placement}`}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gray-50 text-gray-500 ring-1 ring-black/[0.05]">
        <Icone size={15} strokeWidth={1.75} />
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
