import React from "react";

// Même composition que « À tes côtés, dès la première facture » sur la LP
// home : trois rassurances centrées sous un grand titre.
// Ici, les trois questions qui restent après avoir vu l'outil : combien de
// temps ça prend, est-ce que ça marche avec ma messagerie, et qui suit quand
// l'équipe grandit.
const ITEMS = [
  {
    title: "Prête en trois minutes",
    desc: "Vous choisissez un modèle, vous renseignez vos coordonnées, vous copiez la signature dans votre messagerie. C'est tout.",
    Icon: StopwatchIcon,
  },
  {
    title: "Dans votre messagerie",
    desc: "Gmail, Outlook, Apple Mail, Thunderbird : l'installation est guidée pas à pas, et le rendu est le même sur ordinateur et sur mobile.",
    Icon: MailIcon,
  },
  {
    title: "Toute l'équipe suivie",
    desc: "Un collaborateur arrive ou change de poste : sa signature est générée à son nom et reste alignée sur celles du groupe.",
    Icon: TeamIcon,
  },
];

export default function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden px-5 pt-10 md:pt-20 lg:pt-22 pb-0">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-12 md:mb-16">
          Votre signature mail, prête avant votre prochain e-mail
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

function MailIcon() {
  return (
    <svg {...SVG}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="m3.5 7.5 7.4 5.3a2 2 0 0 0 2.2 0l7.4-5.3" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg {...SVG}>
      <circle cx="9" cy="8.5" r="3.4" />
      <path d="M3 19.5a6 6 0 0 1 12 0" />
      <path d="M16.2 6.2a3.4 3.4 0 0 1 0 6.1" />
      <path d="M17.5 13.6a6 6 0 0 1 3.5 5.4" />
    </svg>
  );
}
