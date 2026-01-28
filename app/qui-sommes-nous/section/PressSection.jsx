"use client";
import React from "react";
import Link from "next/link";

const pressLogos = [
  {
    name: "Digitiz",
    logo: "https://digitiz.fr/wp-content/uploads/2025/04/digitiz-logo-officiel.svg",
    url: "https://digitiz.fr/newbi/",
  },
  {
    name: "La Fabrique du Net",
    logo: "/logos/fabriquedunet.png",
    url: "https://www.lafabriquedunet.fr/logiciel/newbi/",
  },
  {
    name: "Appvizer",
    logo: "https://www.lentrepreneurcharentais.fr/wp-content/uploads/2018/06/appvizer.png",
    url: "https://www.appvizer.fr/operations/gestion-entreprise/newbi",
  },
];

export function PressSection() {
  return (
    <section className="py-20 lg:py-28 w-full bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-14">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5A50FF] mb-2">
            Ils parlent de nous
          </span>
          <h2 className="text-2xl md:text-3xl font-normal tracking-[-0.015em] text-balance text-gray-950">
            Newbi dans la presse
          </h2>
        </div>

        {/* Logos alignés */}
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20">
            {pressLogos.map((press, index) => (
              <a
                key={index}
                href={press.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center p-4 transition-opacity hover:opacity-70"
              >
                <img
                  src={press.logo}
                  alt={`${press.name} logo`}
                  className="h-10 md:h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
                />
              </a>
            ))}
          </div>
        </div>

        {/* Bouton */}
        <div className="mt-14 flex justify-center">
          <Link
            href="/#presse"
            className="inline-block rounded-xl px-8 py-3 text-center text-base font-normal transition duration-150 active:scale-[0.98] bg-[#202020] text-white hover:bg-gray-800"
          >
            Lire les articles
          </Link>
        </div>
      </div>
    </section>
  );
}
