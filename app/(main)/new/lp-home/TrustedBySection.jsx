"use client";
import React from "react";

// `width` et `height` sont les dimensions réelles des fichiers : la hauteur
// rendue vient de la classe `height`, mais sans ces attributs le navigateur
// ignore la largeur jusqu'au chargement et la ligne se réorganise à l'arrivée
// de chaque logo. Les .webp sont réduits à 2x la hauteur affichée (les .png
// d'origine faisaient de 29 à 46 Ko pour 20 à 48 px de haut).
const logos = [
  {
    name: "L'Héritage",
    src: "/lp/company/4.webp",
    height: "h-12",
    w: 185,
    h: 96,
  },
  { name: "New3dge", src: "/lp/company/1.webp", height: "h-5", w: 313, h: 40 },
  {
    name: "Mardy Studio",
    src: "/lp/company/5.webp",
    height: "h-6",
    w: 220,
    h: 48,
  },
];

export default function TrustedBySection({ variant = "home" }) {
  return (
    <section
      className={`relative z-10 ${variant === "home" ? "bg-[#FDFDFD] -mt-10 md:-mt-16" : "bg-transparent"}`}
    >
      <div className="max-w-[800px] mx-auto">
        <div className="py-6">
          <p className="text-center text-lg text-black dark:text-white mb-8">
            Ils nous font <span className="font-medium">confiance</span>
          </p>
          {/* Desktop */}
          <div className="hidden sm:flex items-center justify-center gap-16 md:gap-28 px-6">
            {logos.map((logo) => (
              <img
                key={logo.name}
                src={logo.src}
                alt={logo.name}
                width={logo.w}
                height={logo.h}
                className={`${logo.height} w-auto object-contain`}
              />
            ))}
          </div>
          {/* Mobile: 2 + 1 centered */}
          <div className="flex flex-col items-center gap-6 px-6 sm:hidden">
            <div className="flex items-center justify-center gap-12">
              {logos.slice(0, 2).map((logo) => (
                <img
                  key={logo.name}
                  src={logo.src}
                  alt={logo.name}
                  width={logo.w}
                  height={logo.h}
                  className={`${logo.height} w-auto object-contain`}
                />
              ))}
            </div>
            {logos.length > 2 && (
              <img
                src={logos[2].src}
                alt={logos[2].name}
                width={logos[2].w}
                height={logos[2].h}
                className={`${logos[2].height} w-auto object-contain`}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
