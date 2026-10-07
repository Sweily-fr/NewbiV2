import React from "react";

/* Même disposition que « Des outils pour piloter et développer ton activité »
   de la LP home, reprise sur les autres pages métier : titre seul à gauche,
   puis des cartes photo plein cadre dont le texte est posé en haut sur un
   voile sombre.

   Les quatre modes de facturation sont ceux décrits dans l'article
   « Facture d'avocat » du blog. */
const MODES = [
  {
    title: "Au temps passé",
    desc: "Chronométrez vos diligences dossier par dossier, avec leur taux horaire, puis reportez le total sur la facture.",
    image: "/lp/metiers/avocat-temps.jpg",
  },
  {
    title: "Au forfait",
    desc: "Un montant convenu pour une mission délimitée : une ligne, un prix, et la convention d'honoraires qui l'encadre.",
    image: "/lp/metiers/avocat-forfait.jpg",
  },
  {
    title: "Sur provision",
    desc: "Une avance demandée avant d'engager les diligences, puis des factures imputées au fur et à mesure de la mission.",
    image: "/lp/metiers/avocat-provision.jpg",
  },
  {
    title: "Par abonnement",
    desc: "Un conseil récurrent facturé chaque mois au même client, avec un document identique d'une échéance à l'autre.",
    image: "/lp/metiers/avocat-abonnement.jpg",
  },
];

export default function ModesSection() {
  return (
    <section className="relative overflow-hidden px-5 py-14 md:py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-10 max-w-3xl text-balance text-4xl font-medium leading-tight tracking-tight text-gray-950 md:mb-14 md:text-5xl lg:text-[3.5rem]">
          Quatre façons de facturer vos honoraires
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4">
          {MODES.map(({ title, desc, image }) => (
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
