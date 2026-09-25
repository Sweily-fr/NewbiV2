import React from "react";
import Link from "next/link";

// Section centrée : trois rassurances alignées sous un grand titre, puis un
// seul bouton. Elle ferme le bloc « est-ce que c'est pour moi ? » en répondant
// aux trois questions qui restent : c'est long ? c'est pour mon cas ? et si je
// me plante ?
const ITEMS = [
  {
    title: "Simple et rapide",
    desc: "Compte créé en cinq minutes, logo et coordonnées ajoutés, première facture envoyée dans la foulée.",
    Icon: StopwatchIcon,
  },
  {
    title: "L'offre qui te correspond",
    desc: "Seul, à deux ou en société : tu prends ce dont tu as besoin et tu changes de formule quand ton activité change.",
    Icon: TargetIcon,
  },
  {
    title: "Accompagné à chaque étape",
    desc: "Une équipe basée en France te répond, de la reprise de tes anciennes factures jusqu'à ta conformité 2026.",
    Icon: HeadsetIcon,
  },
];

export default function SupportSection() {
  return (
    <section className="relative overflow-hidden px-0 py-14 md:py-20">
      <div className="max-w-7xl mx-auto px-5 text-center">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-12 md:mb-16">
          À tes côtés, dès la première facture
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

        <div className="mt-12 md:mt-14">
          <Link
            href="/auth/register"
            className="inline-block rounded-xl border border-gray-300 px-7 py-3.5 text-[15px] text-gray-900 hover:bg-gray-50 transition-colors"
          >
            Commencer gratuitement
          </Link>
        </div>
      </div>
    </section>
  );
}

/* Pictogrammes au trait, dans l'esprit du reste de la page */

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

function TargetIcon() {
  return (
    <svg {...SVG}>
      <circle cx="11.5" cy="12.5" r="8.5" />
      <circle cx="11.5" cy="12.5" r="4.6" />
      <circle cx="11.5" cy="12.5" r="1" fill="currentColor" stroke="none" />
      <path d="m11.5 12.5 7-7M17.2 3.4l1.3 2.6 2.6 1.3-2.6 1.3-1.3 2.6-1.3-2.6-2.6-1.3 2.6-1.3z" />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg {...SVG}>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <path d="M4 13.5h2a1.5 1.5 0 0 1 1.5 1.5v2A1.5 1.5 0 0 1 6 18.5H5.5A1.5 1.5 0 0 1 4 17z" />
      <path d="M20 13.5h-2a1.5 1.5 0 0 0-1.5 1.5v2a1.5 1.5 0 0 0 1.5 1.5h.5a1.5 1.5 0 0 0 1.5-1.5z" />
      <path d="M18.5 18.5v.5a2.5 2.5 0 0 1-2.5 2.5h-2.5" />
    </svg>
  );
}
