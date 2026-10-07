import React from "react";

// Bande de presse, alignée sur la largeur et le rythme des autres sections.
const PRESSE = [
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
    logo: "/logos/appvizer.svg",
    url: "https://www.appvizer.fr/operations/gestion-entreprise/newbi",
  },
];

export function PressSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 px-5">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-10 md:mb-14">
          Ils parlent de nous
        </h2>

        <ul className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20">
          {PRESSE.map((p) => (
            <li key={p.name}>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block transition-opacity hover:opacity-70"
              >
                <img
                  src={p.logo}
                  alt={p.name}
                  className="h-9 md:h-11 w-auto object-contain grayscale transition-all duration-300 hover:grayscale-0"
                  loading="lazy"
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
