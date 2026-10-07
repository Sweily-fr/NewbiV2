import React from "react";

// Même composition que « Votre signature mail, prête avant votre prochain
// e-mail » sur la LP signatures : trois rassurances centrées sous un grand
// titre. Ici, les trois questions qui restent après avoir vu l'outil :
// combien de temps ça prend, ce que doit faire le destinataire, et ce qu'on
// garde sous contrôle une fois le lien parti.
const ITEMS = [
  {
    title: "Déposé, envoyé",
    desc: "Vous glissez vos fichiers, Newbi génère le lien pendant le téléversement. Pas de compression à préparer, pas de découpage en plusieurs envois.",
    Icon: StopwatchIcon,
  },
  {
    title: "Reçu sans rien installer",
    desc: "Votre destinataire ouvre le lien et télécharge : ni compte à créer, ni logiciel, ni limite de taille côté réception. Sur ordinateur comme sur mobile.",
    Icon: DownloadIcon,
  },
  {
    title: "Vous gardez la main",
    desc: "Mot de passe, durée de validité, notification à chaque téléchargement : vous décidez qui accède au lien et combien de temps il reste en ligne.",
    Icon: ShieldIcon,
  },
];

export default function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden px-5 pt-10 md:pt-20 lg:pt-22 pb-0">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-12 md:mb-16">
          Vos fichiers volumineux envoyés en moins d&apos;une minute
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {ITEMS.map(({ title, desc, Icon }) => (
            <div key={title} className="flex flex-col items-center">
              <span className="grid place-items-center size-16 rounded-2xl bg-[#F4F4F6] text-gray-900 mb-5">
                <Icon />
              </span>
              <h3 className="text-xl md:text-2xl font-medium tracking-tight text-gray-950 mb-3">
                {title}
              </h3>
              <p className="text-[17px] leading-relaxed text-gray-600">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Pictogrammes au trait, dans l'esprit du reste du site */

const SVG = {
  width: 32,
  height: 32,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function StopwatchIcon() {
  return (
    <svg {...SVG}>
      <circle cx="13" cy="14" r="7.5" />
      <path d="M13 10.5V14l2.5 1.5" />
      <path d="M11 2.8h4M18.8 8.2l1.6-1.6" />
      <path d="M2.5 9.5h4M3.5 13h3" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg {...SVG}>
      <path d="M21 15.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.5" />
      <path d="M7.5 10.5 12 15l4.5-4.5" />
      <path d="M12 15V3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg {...SVG}>
      <path d="M12 2.8 20 6v5.6c0 4.6-3.2 8.2-8 9.6-4.8-1.4-8-5-8-9.6V6z" />
      <path d="M9.5 11.8h5v3.4h-5z" />
      <path d="M10.8 11.8v-1.4a1.2 1.2 0 0 1 2.4 0v1.4" />
    </svg>
  );
}
