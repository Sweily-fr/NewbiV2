import React from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";

// Quatre métiers qui achètent au quotidien, en cartes photo. La deuxième est
// plus large : elle donne le rythme de la rangée, comme sur la référence.
const METIERS = [
  {
    title: "Artisans & BTP",
    img: "/lp/achats/metiers/artisans.jpg",
    alt: "Un artisan menuisier dans son atelier",
    wide: false,
    position: "50% 45%",
  },
  {
    title: "Restaurants & cafés",
    img: "/lp/achats/metiers/restaurants.jpg",
    alt: "Le comptoir d'un café indépendant",
    wide: true,
    position: "50% 55%",
  },
  {
    title: "Commerces",
    img: "/lp/achats/metiers/commerces.jpg",
    alt: "Une commerçante réassortit les rayons de sa boutique",
    wide: false,
    position: "55% 40%",
  },
  {
    title: "Agences & studios",
    img: "/lp/achats/metiers/studios.jpg",
    alt: "Une graphiste dans son studio",
    wide: false,
    position: "50% 40%",
  },
];

export default function MetiersPhotoSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 relative overflow-hidden px-5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-10 md:mb-14">
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950">
            Adapté à votre métier
          </h2>
          {/* Noir ici, pour ne pas doubler le CTA violet du hero */}
          <Button
            asChild
            size="md"
            variant="primary"
            className="h-auto w-full px-4 py-1.5 text-[17px] sm:w-auto flex-none self-start md:self-auto bg-[#17171A] text-white hover:bg-[#2A2A2E] active:bg-[#0D0D0F] [box-shadow:none]"
          >
            <Link href="/auth/signup">
              <span>Essayer 30 jours offerts</span>
            </Link>
          </Button>
        </div>

        {/* Sur mobile, deux colonnes ; à partir de md, une rangée où la carte
            large prend deux fois la place des autres. Au survol, la carte
            pointée s'élargit : seul son facteur d'étirement change, les
            voisines se resserrent d'elles-mêmes. */}
        <ul className="grid grid-cols-2 gap-4 md:flex md:gap-6">
          {METIERS.map((m) => (
            <li
              key={m.title}
              className={`group relative overflow-hidden rounded-2xl aspect-[3/4] md:aspect-auto md:h-[470px] md:transition-[flex-grow] md:duration-[900ms] md:ease-[cubic-bezier(0.22,1,0.36,1)] ${
                m.wide
                  ? "md:flex-[1.9] md:hover:flex-[3]"
                  : "md:flex-1 md:hover:flex-[2.2]"
              }`}
            >
              <img
                src={m.img}
                alt={m.alt}
                style={{ objectPosition: m.position }}
                className="absolute inset-0 size-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                loading="lazy"
              />
              {/* Voile depuis le haut : le titre reste lisible sur toutes les
                  photos, claires comme sombres */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/70 via-black/30 to-transparent" />
              <h3 className="relative p-5 md:p-7 text-lg md:text-2xl font-medium tracking-tight leading-snug text-white">
                {m.title}
              </h3>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
