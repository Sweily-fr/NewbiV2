import React from "react";
import { Check } from "lucide-react";
import { OMBRE } from "@/src/lib/lp-visuels";
import CartePosee from "./carte-posee";

/* Kit des illustrations de cartes de landing page.

   Quatre formes, toutes dans la même matière — encadré blanc, filet d'un
   pixel, ombre basse sans relief — mais lues différemment : une liste cochée,
   une répartition, une fiche à deux colonnes, une photographie. Avoir
   plusieurs formes évite qu'une page enchaînant trois cartes ne se répète.

   Chaque composant reçoit son positionnement par `className` : il ne présume
   rien de la carte qui l'accueille (bento, « l'essentiel », etc.). */

const BOITE = `overflow-hidden rounded-2xl bg-white ${OMBRE}`;

// Palette des pastilles, reprise des catégories de l'application.
const TEINTES = [
  { pastille: "bg-[#5A50FF]", barre: "bg-[#5A50FF]" },
  { pastille: "bg-amber-400", barre: "bg-amber-300" },
  { pastille: "bg-emerald-400", barre: "bg-emerald-400" },
];

function Chip({ children }) {
  return (
    <span className="rounded-md bg-[#EFEDFF] px-1.5 py-0.5 text-[10.5px] font-medium text-[#5A50FF]">
      {children}
    </span>
  );
}

/* Liste cochée : ce que le document ou le réglage porte, point par point. */
export function VisuelListe({ titre, lignes, chip, className = "" }) {
  return (
    <div className={`${BOITE} ${className}`}>
      <div className="border-b border-black/[0.06] px-4 py-3">
        <p className="text-[13px] font-medium text-gray-950">{titre}</p>
      </div>

      <div className="space-y-2.5 px-4 py-3.5">
        {lignes.map((l) => (
          <p
            key={l}
            className="flex items-center gap-2.5 text-[12.5px] text-gray-700"
          >
            <span className="grid size-4 flex-none place-items-center rounded-full bg-[#5A50FF] text-white">
              <Check size={9} strokeWidth={3.5} />
            </span>
            {l}
          </p>
        ))}
      </div>

      {chip && (
        <div className="border-t border-black/[0.06] px-4 py-2.5">
          <Chip>{chip}</Chip>
        </div>
      )}
    </div>
  );
}

/* Répartition : un total, une jauge segmentée, puis le détail. Une forme de
   proportion, pas de liste — c'est ce qui la distingue de la précédente. */
export function VisuelRepartition({ titre, total, parts, className = "" }) {
  const somme = parts.reduce((s, p) => s + p.part, 0);

  return (
    <div className={`${BOITE} ${className}`}>
      <div className="px-4 pt-3.5">
        <p className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-medium text-gray-950">{titre}</span>
          <span className="text-[12.5px] tabular-nums text-gray-500">
            {total}
          </span>
        </p>

        <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full">
          {parts.map((p, i) => (
            <span
              key={p.label}
              className={TEINTES[i % TEINTES.length].barre}
              style={{ width: `${(p.part / somme) * 100}%` }}
            />
          ))}
        </div>
      </div>

      <div className="mt-3.5 divide-y divide-black/[0.04] border-t border-black/[0.06]">
        {parts.map((p, i) => (
          <p key={p.label} className="flex items-center gap-2.5 px-4 py-2.5">
            <span
              className={`size-2 flex-none rounded-full ${TEINTES[i % TEINTES.length].pastille}`}
            />
            <span className="flex-1 text-[12.5px] text-gray-700">
              {p.label}
            </span>
            <span className="text-[12.5px] tabular-nums text-gray-500">
              {p.valeur}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

/* Tuiles : quelques valeurs mises côte à côte. Pour les cartes larges, où un
   encadré en liste laisserait la moitié du cadre vide. */
export function VisuelTuiles({ titre, tuiles, chip, className = "" }) {
  return (
    <div className={`${BOITE} ${className}`}>
      <div className="px-4 pt-3.5">
        <p className="text-[12px] text-gray-500">{titre}</p>
        <div
          className="mt-2.5 grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${tuiles.length}, minmax(0, 1fr))`,
          }}
        >
          {tuiles.map((t, i) => (
            <span
              key={t.label}
              className={`rounded-xl px-3 py-3 ring-1 ${
                t.enAvant
                  ? "bg-[#F6F5FF] ring-[#5A50FF]/30"
                  : "bg-[#FAFAFB] ring-black/[0.05]"
              }`}
            >
              <span className="block text-[11.5px] text-gray-500">
                {t.label}
              </span>
              <span
                className={`mt-0.5 block text-[15px] font-medium tracking-tight ${
                  t.enAvant ? "text-[#5A50FF]" : "text-gray-950"
                }`}
              >
                {t.valeur}
              </span>
            </span>
          ))}
        </div>
      </div>

      {chip && (
        <div className="mt-3.5 border-t border-black/[0.06] px-4 py-2.5">
          <Chip>{chip}</Chip>
        </div>
      )}
    </div>
  );
}

/* Fiche : deux colonnes, un libellé et sa valeur. Pour ce qui se lit comme
   une correspondance plutôt que comme une énumération. */
export function VisuelFiche({ titre, lignes, chip, className = "" }) {
  return (
    <div className={`${BOITE} ${className}`}>
      <div className="border-b border-black/[0.06] px-4 py-3">
        <p className="text-[13px] font-medium text-gray-950">{titre}</p>
      </div>

      <div className="divide-y divide-black/[0.04]">
        {lignes.map((l) => (
          <p key={l.cle} className="flex items-center gap-3 px-4 py-2.5">
            <span className="flex-1 text-[12.5px] text-gray-500">{l.cle}</span>
            <span className="text-[12.5px] font-medium text-gray-950">
              {l.valeur}
            </span>
          </p>
        ))}
      </div>

      {chip && (
        <div className="border-t border-black/[0.06] px-4 py-2.5">
          <Chip>{chip}</Chip>
        </div>
      )}
    </div>
  );
}

/* Photographie, avec deux cartes posées sur son bord. Le cadre donne sa
   hauteur à l'image : à ratio fixe, sur une carte large, elle remonterait
   par-dessus le texte. */
export function VisuelPhoto({
  src,
  alt,
  cartes,
  className = "",
  placements = ["-left-9 top-6", "-left-5 bottom-16"],
}) {
  return (
    <div className={`absolute ${className}`}>
      <div className={`h-full overflow-hidden rounded-2xl ${OMBRE}`}>
        <img
          src={src}
          alt={alt}
          width={1200}
          height={800}
          loading="lazy"
          className="size-full object-cover"
        />
      </div>

      {cartes.map((carte, i) => (
        <CartePosee key={carte.titre} {...carte} placement={placements[i]} />
      ))}
    </div>
  );
}
