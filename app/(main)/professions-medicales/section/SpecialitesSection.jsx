import React from "react";

/* Même disposition que « Des outils pour piloter et développer ton activité »
   de la LP home, reprise sur la LP BTP : titre seul à gauche, puis des cartes
   photo plein cadre dont le texte est posé en haut sur un voile sombre. */
const SPECIALITES = [
  {
    title: "Médecins et spécialistes",
    desc: "Généralistes, spécialistes, chirurgiens-dentistes : consultations, actes et remplacements à facturer sans y passer la soirée.",
    image: "/lp/metiers/med-medecins.jpg",
  },
  {
    title: "Kinés et ostéopathes",
    desc: "Séances suivies, forfaits et bilans : la note d'honoraires part après la séance, pas trois semaines plus tard.",
    image: "/lp/metiers/med-paramedical.jpg",
  },
  {
    title: "Infirmiers libéraux",
    desc: "Tournées, actes à domicile et frais de déplacement : vos justificatifs rentrent au fur et à mesure.",
    image: "/lp/metiers/med-infirmiers.jpg",
  },
  {
    title: "Psychologues et thérapeutes",
    desc: "Séances individuelles ou de groupe, forfaits et rendez-vous non honorés, suivis sans tableur.",
    image: "/lp/metiers/med-therapeutes.jpg",
  },
];

export default function SpecialitesSection() {
  return (
    <section className="relative overflow-hidden px-5 py-14 md:py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-10 max-w-3xl text-balance text-4xl font-medium leading-tight tracking-tight text-gray-950 md:mb-14 md:text-5xl lg:text-[3.5rem]">
          Du cabinet au domicile du patient
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4">
          {SPECIALITES.map(({ title, desc, image }) => (
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
