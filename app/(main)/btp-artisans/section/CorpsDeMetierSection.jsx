import React from "react";

/* Même disposition et mêmes jetons visuels que la section « Des outils pour
   piloter et développer ton activité » de la LP home : titre seul à gauche sur
   trois colonnes de large, puis des cartes photo plein cadre dont le texte est
   posé en haut sur un voile sombre. Quatre cartes ici au lieu de trois. */
const CORPS = [
  {
    title: "Gros œuvre et rénovation",
    desc: "Maçons, charpentiers, entreprises générales : chantiers longs, lots multiples et situations de travaux.",
    image: "/lp/metiers/btp-gros-oeuvre.jpg",
  },
  {
    title: "Menuiserie et agencement",
    desc: "Menuisiers, cuisinistes, agenceurs : devis détaillés, acomptes à la commande et pose sur site.",
    image: "/lp/metiers/btp-menuiserie.jpg",
  },
  {
    title: "Peinture et finitions",
    desc: "Peintres, plaquistes, carreleurs : métrés, surfaces et taux de TVA qui changent d'un poste à l'autre.",
    image: "/lp/metiers/btp-peinture.jpg",
  },
  {
    title: "Couverture et extérieur",
    desc: "Couvreurs, façadiers, paysagistes : interventions courtes, matériel avancé et dépannages à facturer vite.",
    image: "/lp/metiers/btp-couverture.jpg",
  },
];

export default function CorpsDeMetierSection() {
  return (
    <section className="relative overflow-hidden px-5 py-14 md:py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-10 max-w-3xl text-balance text-4xl font-medium leading-tight tracking-tight text-gray-950 md:text-5xl md:mb-14 lg:text-[3.5rem]">
          Du gros œuvre aux finitions
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4">
          {CORPS.map(({ title, desc, image }) => (
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
