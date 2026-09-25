import React from "react";

// Trois cartes photo plein cadre : le texte est posé en haut, sur un voile
// sombre, et l'image occupe toute la carte. Les visuels définitifs se déposent
// dans public/images/lp-home/tools/ sous les noms ci-dessous.
const TOOLS = [
  {
    title: "Gestion de projets",
    desc: "Suis l'avancement de tes chantiers et de ceux de ton équipe, où que tu sois.",
    image: "/images/lp-home/tools/projets.png",
  },
  {
    title: "Suivi de trésorerie",
    desc: "Anticipe tes rentrées et tes sorties grâce aux analyses et aux prévisions.",
    image: "/images/lp-home/tools/tresorerie.png",
  },
  {
    title: "Pré-comptabilité",
    desc: "Reçus, justificatifs et exports : tout est prêt pour ton expert-comptable.",
    image: "/images/lp-home/tools/pre-comptabilite.png",
  },
];

export default function ToolsSection() {
  return (
    <section className="relative overflow-hidden px-0 py-14 md:py-20">
      <div className="max-w-7xl mx-auto px-5">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 max-w-3xl mb-10 md:mb-14">
          Des outils pour piloter et développer ton activité
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {TOOLS.map(({ title, desc, image }) => (
            <article
              key={title}
              className="relative rounded-3xl overflow-hidden aspect-[3/4] bg-gradient-to-br from-[#D8D8DE] to-[#9A9AA5]"
            >
              <img
                src={image}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
              {/* Voile sombre en haut, pour que le texte reste lisible quelle
                  que soit la photo */}
              <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-black/65 via-black/30 to-transparent" />
              <div className="relative p-7 md:p-8 text-white">
                <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-3">
                  {title}
                </h3>
                <p className="text-[15px] leading-relaxed text-white/85 max-w-xs">
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
