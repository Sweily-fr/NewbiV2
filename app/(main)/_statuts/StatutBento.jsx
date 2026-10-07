import React from "react";
import { Check, Lock } from "lucide-react";
import { OMBRE, VISUEL } from "@/src/lib/lp-visuels";
import CartePosee from "@/src/components/lp/carte-posee";

// Mêmes jetons visuels que le bento de /produits/factures : on reprend la
// disposition et les styles existants, seul le contenu change d'un statut
// à l'autre. Les deux cartes de la colonne large portent un visuel ancré en
// bas, qui sort de leur cadre — une illustration pour la première, une
// photographie pour la seconde, comme sur la LP factures.
const CARD =
  "rounded-3xl bg-gradient-to-b from-[#F4F4F6] to-[#FAFAFB] p-7 md:p-8 flex flex-col overflow-hidden";
// Variante des cartes qui portent un visuel : il doit atteindre le bord bas.
const CARD_VISUEL = `${CARD} pb-0`;
const TITLE =
  "text-xl md:text-2xl font-medium tracking-tight text-gray-950 mb-3";
const TEXT = "text-[15px] leading-relaxed text-gray-700";
// Les deux illustrations sont calées à droite, à la largeur de la photo de la
// carte voisine : étirées sur les huit colonnes, elles laisseraient un vide.
const ENCADRE =
  "absolute right-8 -bottom-6 w-[340px] overflow-hidden rounded-2xl bg-white lg:w-[460px]";

export default function StatutBento({ titre, chapo, photo, cartes }) {
  const [haute, basse] = cartes;

  return (
    <section className="relative overflow-hidden px-5 pt-10 md:pt-20 lg:pt-22">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-4 text-balance text-4xl font-medium leading-tight tracking-tight text-gray-950 md:text-5xl lg:text-[3.5rem]">
          {titre}
        </h2>
        <p className="mb-10 max-w-2xl text-[17px] leading-relaxed text-gray-600 md:mb-14">
          {chapo}
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
          {/* Colonne étroite : la carte photo, puis une carte texte */}
          <div className="flex flex-col gap-4 md:col-span-4 md:gap-5">
            <article className="relative flex min-h-[520px] flex-1 flex-col justify-start overflow-hidden rounded-3xl p-7 text-white md:p-8">
              <img
                src={photo.src}
                alt=""
                className="absolute inset-0 size-full object-cover object-[60%_center]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-black/10" />
              <div className="relative">
                <h3 className="mb-3 text-xl font-medium tracking-tight md:text-2xl">
                  {photo.titre}
                </h3>
                <p className="text-[15px] leading-relaxed text-white/85">
                  {photo.texte}
                </p>
              </div>
            </article>

            <article className={CARD}>
              <h3 className={TITLE}>{cartes[2].titre}</h3>
              <p className={TEXT}>{cartes[2].texte}</p>
            </article>
          </div>

          {/* Colonne large : une carte illustrée, une carte photo */}
          <div className="flex flex-col gap-4 md:col-span-8 md:gap-5">
            <article
              className={`${haute.visuel ? CARD_VISUEL : CARD} min-h-[340px] ${haute.visuel ? "md:min-h-[400px]" : ""}`}
            >
              <h3 className={TITLE}>{haute.titre}</h3>
              <p className={`${TEXT} max-w-xl`}>{haute.texte}</p>
              {haute.visuel && (
                <div className={VISUEL}>
                  <ListeVisual {...haute.visuel} />
                </div>
              )}
            </article>

            {/* Dernière carte : elle absorbe la hauteur restante pour que les
                deux colonnes se referment à la même ligne */}
            <article
              className={`${basse.image || basse.archive ? CARD_VISUEL : CARD} flex-1 ${basse.image ? "md:min-h-[500px]" : ""} ${basse.archive ? "md:min-h-[500px]" : ""}`}
            >
              <h3 className={TITLE}>{basse.titre}</h3>
              <p className={`${TEXT} max-w-xl`}>{basse.texte}</p>
              {basse.image && (
                <div className={VISUEL}>
                  <PhotoVisual {...basse.image} />
                </div>
              )}
              {basse.archive && (
                <div className={VISUEL}>
                  <ArchiveVisual {...basse.archive} />
                </div>
              )}
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Visuels — ancrés en bas, ils sortent du cadre de leur carte         */
/* ------------------------------------------------------------------ */

/* Illustration : ce que le statut doit porter, coché ligne à ligne. Une
   forme de liste, distincte du document et des tuiles utilisés sur les LP
   produits. Les lignes viennent du texte de la carte : rien n'y est promis
   qui n'y soit déjà écrit. */
function ListeVisual({ titre, lignes, chip }) {
  return (
    <div className={`${ENCADRE} ${OMBRE}`}>
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
          <span className="rounded-md bg-[#EFEDFF] px-1.5 py-0.5 text-[10.5px] font-medium text-[#5A50FF]">
            {chip}
          </span>
        </div>
      )}
    </div>
  );
}

/* Photographie : elle n'occupe que la droite de la carte, sort du cadre à
   droite et en bas, qui la recadre, et porte deux cartes posées sur son bord
   gauche. Sa hauteur vient du cadre (top-0 / -bottom-10) et non de sa
   largeur : à ratio fixe, elle remonterait par-dessus le texte. */
function PhotoVisual({ src, alt, cartes }) {
  return (
    <div className="absolute -right-10 top-0 -bottom-10 w-[340px] lg:w-[560px]">
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
        <CartePosee
          key={carte.titre}
          {...carte}
          placement={i === 0 ? "-left-9 top-6" : "-left-5 bottom-16"}
        />
      ))}
    </div>
  );
}

/* Archivage : ce que le coffre contient, et pendant combien de temps. Trois
   natures de pièces, chacune avec sa pastille de couleur — c'est la palette
   des catégories utilisée dans l'application — puis la fenêtre de
   conservation. L'année de fin se déduit de l'année courante : elle ne se
   périmera pas. */
const TEINTES = [
  "bg-[#EFEDFF] text-[#5A50FF]",
  "bg-amber-50 text-amber-600",
  "bg-emerald-50 text-emerald-600",
];

function ArchiveVisual({ titre, duree, lignes }) {
  const debut = new Date().getFullYear();
  const total = lignes.reduce((somme, l) => somme + l.nb, 0);

  return (
    <div className={`${ENCADRE} ${OMBRE}`}>
      <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3">
        <p className="text-[13px] font-medium text-gray-950">{titre}</p>
        <p className="text-[12px] tabular-nums text-gray-500">{total} pièces</p>
      </div>

      <div className="divide-y divide-black/[0.04]">
        {lignes.map((l, i) => (
          <p key={l.label} className="flex items-center gap-2.5 px-4 py-2.5">
            <span
              className={`grid size-6 flex-none place-items-center rounded-lg ${TEINTES[i % TEINTES.length]}`}
            >
              <l.icon size={13} strokeWidth={1.9} />
            </span>
            <span className="flex-1 text-[12.5px] text-gray-700">
              {l.label}
            </span>
            <span className="text-[12.5px] tabular-nums text-gray-500">
              {l.nb}
            </span>
          </p>
        ))}
      </div>

      <div className="border-t border-black/[0.06] px-4 py-3">
        <p className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11.5px] text-gray-500">
            <Lock size={11} strokeWidth={1.9} />
            Conservation légale
          </span>
          <span className="rounded-md bg-[#EFEDFF] px-1.5 py-0.5 text-[10.5px] font-medium text-[#5A50FF]">
            {duree} ans
          </span>
        </p>

        <div className="mt-2.5 flex items-baseline justify-between">
          <span className="text-[14px] font-medium tracking-tight text-gray-950">
            {debut}
          </span>
          <span className="text-[14px] font-medium tracking-tight text-gray-950">
            {debut + duree}
          </span>
        </div>
        {/* La barre figure la durée, pas un avancement : elle est pleine. */}
        <span className="mt-1.5 block h-1.5 rounded-full bg-gradient-to-r from-[#5A50FF] via-[#8F88FF] to-[#CFCBFF]" />
      </div>
    </div>
  );
}
