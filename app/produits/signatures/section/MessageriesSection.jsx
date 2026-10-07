import React from "react";

// Bande de compatibilité : les messageries dans lesquelles la signature
// s'installe. Les logos sont auto-hébergés (simple-icons et Wikimedia).
// Les marques monochromes sont colorées via `currentColor` ; Outlook garde
// ses couleurs, son SVG est multicolore.
const MESSAGERIES = [
  { nom: "Gmail", src: "/lp/signatures/logos/gmail.svg", couleur: "#EA4335" },
  // Le SVG d'Outlook est déjà multicolore, on le sert tel quel
  { nom: "Outlook", src: "/lp/signatures/logos/outlook.svg", brut: true },
  {
    nom: "Apple Mail",
    src: "/lp/signatures/logos/apple.svg",
    couleur: "#000000",
  },
  {
    nom: "Thunderbird",
    src: "/lp/signatures/logos/thunderbird.svg",
    couleur: "#0A84FF",
  },
  {
    nom: "Proton Mail",
    src: "/lp/signatures/logos/protonmail.svg",
    couleur: "#6D4AFF",
  },
  {
    nom: "Zoho Mail",
    src: "/lp/signatures/logos/zoho.svg",
    couleur: "#E42527",
  },
];

export default function MessageriesSection() {
  return (
    <section className="px-5 py-10 md:py-14">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-[13px] text-gray-500 mb-7">
          Votre signature s&apos;installe dans votre messagerie, en deux minutes
        </p>

        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-14">
          {MESSAGERIES.map((m) => (
            <li key={m.nom} className="flex items-center gap-2.5 text-gray-700">
              {/* Les SVG de simple-icons sont monochromes : on les teinte
                  par masque avec la couleur officielle de chaque marque. */}
              {m.brut ? (
                <img src={m.src} alt="" className="size-6 object-contain" />
              ) : (
                <span
                  aria-hidden="true"
                  className="size-6"
                  style={{
                    backgroundColor: m.couleur,
                    maskImage: `url(${m.src})`,
                    WebkitMaskImage: `url(${m.src})`,
                    maskSize: "contain",
                    WebkitMaskSize: "contain",
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat: "no-repeat",
                    maskPosition: "center",
                    WebkitMaskPosition: "center",
                  }}
                />
              )}
              <span className="text-[15px] font-medium tracking-tight">
                {m.nom}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
