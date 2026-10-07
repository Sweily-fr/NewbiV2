import React from "react";

/* Même disposition que « Des outils pour piloter et développer ton activité »
   de la LP home, reprise sur les autres pages métier : titre seul à gauche,
   puis des cartes photo plein cadre dont le texte est posé en haut sur un
   voile sombre. */
const METIERS = [
  {
    title: "Photographes",
    desc: "Mariages, corporate, produit : la prise de vue et la cession de droits sur deux lignes distinctes, et la galerie livrée par lien.",
    image: "/lp/metiers/creatif-photo.jpg",
  },
  {
    title: "Vidéastes et monteurs",
    desc: "Rushes lourds, versions successives, validation client : chaque livraison part par un lien qui expire, sans bloquer la boîte mail.",
    image: "/lp/metiers/creatif-video.jpg",
  },
  {
    title: "Graphistes et illustrateurs",
    desc: "Forfait ou tarif journalier, cession de droits précisée, fichiers sources remis une fois la facture réglée.",
    image: "/lp/metiers/creatif-graphiste.jpg",
  },
  {
    title: "Studios et agences",
    desc: "Plusieurs intervenants sur le même dossier, un seul espace, et des documents qui gardent la même numérotation.",
    image: "/lp/metiers/creatif-studio.jpg",
  },
];

export default function MetiersSection() {
  return (
    <section className="relative overflow-hidden px-5 py-14 md:py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-10 max-w-3xl text-balance text-4xl font-medium leading-tight tracking-tight text-gray-950 md:mb-14 md:text-5xl lg:text-[3.5rem]">
          De la prise de vue à la livraison
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4">
          {METIERS.map(({ title, desc, image }) => (
            <article
              key={title}
              className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-gradient-to-br from-[#D8D8DE] to-[#9A9AA5]"
            >
              <img
                src={image}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
              {/* Voile sombre en haut, pour que le texte reste lisible quelle
                  que soit la photo */}
              <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-black/65 via-black/30 to-transparent" />
              <div className="relative p-7 text-white md:p-8">
                <h3 className="mb-3 text-xl font-medium tracking-tight md:text-2xl">
                  {title}
                </h3>
                <p className="max-w-xs text-[15px] leading-relaxed text-white/85">
                  {desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
