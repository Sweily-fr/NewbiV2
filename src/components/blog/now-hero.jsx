"use client";

import React from "react";
import Link from "next/link";
import { CONTENEUR } from "./now-shared";
import { BlogSearchCommand } from "./blog-search-command";

/* Effet « verre » du champ de recherche, transposé de Linear en thème clair :
   un liseré intérieur, un reflet sur l'arête haute, un contour et une ombre
   portée très douce, posés sur un fond translucide flouté. Pas d'état de
   focus distinct : à la première frappe, la palette prend le relais. */
const VERRE = [
  "inset 0 0 0 1px rgba(16,16,32,0.05)",
  "inset 0 1px 0 0 rgba(255,255,255,0.9)",
  "0 0 0 1px rgba(16,16,32,0.06)",
  "0 4px 4px 0 rgba(16,16,32,0.04)",
].join(", ");

/* En-tête du blog, repris de la page « Now » de Linear : un grand titre, une
   rangée d'onglets de filtre à gauche et un champ de recherche à droite.
   La recherche est un formulaire GET : elle fonctionne sans JavaScript et la
   page reste rendue côté serveur. */
/**
 * En-tête commun au blog et à ses pages hub. Le titre reste « Blog » partout,
 * c'est l'onglet surligné qui indique le filtre en cours.
 * `categorieActive` : le slug du thème en cours, `null` pour « Tous »,
 * `false` quand aucun onglet ne correspond (page métier ou auteur).
 */
export function BlogNowHero({
  categories = [],
  categorieActive,
  q = "",
  index = [],
  sectors = [],
}) {
  const [paletteOuverte, setPaletteOuverte] = React.useState(false);
  // Premier caractère frappé au clavier, transmis à la palette à l'ouverture.
  const [amorce, setAmorce] = React.useState("");

  const ouvrir = (depart = "") => {
    setAmorce(depart);
    setPaletteOuverte(true);
  };

  const onglets = [
    { slug: null, label: "Tous", href: "/blog" },
    ...categories.map((c) => ({
      slug: c.slug,
      label: c.label,
      href: `/blog/categorie/${c.slug}`,
    })),
  ];

  return (
    <header className={`${CONTENEUR} pt-32 md:pt-36`}>
      <h1 className="text-4xl md:text-5xl font-medium tracking-[-0.022em] leading-none text-gray-950">
        Blog
      </h1>

      <div className="mt-8 flex flex-col gap-5 md:mt-9 md:flex-row md:items-center md:gap-8">
        <nav
          aria-label="Filtrer par thème"
          className="-mx-6 flex gap-x-6 gap-y-2 overflow-x-auto px-6 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
        >
          {onglets.map((o) => {
            const actif =
              categorieActive === false
                ? false
                : (o.slug ?? null) === (categorieActive ?? null);
            return (
              <Link
                key={o.label}
                href={o.href}
                aria-current={actif ? "page" : undefined}
                className={`shrink-0 whitespace-nowrap text-[15px] transition-colors ${
                  actif ? "text-gray-950" : "text-gray-500 hover:text-gray-950"
                }`}
              >
                {o.label}
              </Link>
            );
          })}
        </nav>

        <form action="/blog/recherche" role="search" className="md:ml-auto">
          <label htmlFor="blog-q" className="sr-only">
            Rechercher un article
          </label>
          <div className="relative">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
            <input
              id="blog-q"
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Rechercher…"
              // Le champ sert de déclencheur : au clic, la palette s'ouvre et
              // prend le focus. `preventDefault` évite que l'input le prenne
              // d'abord, sinon la fermeture de la palette le lui rendrait et
              // rouvrirait aussitôt la fenêtre.
              onMouseDown={(e) => {
                e.preventDefault();
                ouvrir();
              }}
              // Chemin clavier : on arrive au champ par Tab, la première
              // frappe ouvre la palette et y est reportée, sans jamais
              // s'écrire dans ce champ-ci.
              onKeyDown={(e) => {
                if (e.metaKey || e.ctrlKey || e.altKey) return;
                if (e.key === "Enter") return;
                if (e.key.length !== 1) return;
                e.preventDefault();
                ouvrir(e.key);
              }}
              style={{ boxShadow: VERRE }}
              className="h-10 w-full cursor-pointer rounded-full bg-white/60 pl-10 pr-4 text-sm text-gray-950 placeholder:text-gray-400 outline-none backdrop-blur-[4px] backdrop-saturate-150 md:w-[280px]"
            />
          </div>
        </form>
      </div>

      <BlogSearchCommand
        open={paletteOuverte}
        onOpenChange={setPaletteOuverte}
        amorce={amorce}
        index={index}
        categories={categories}
        sectors={sectors}
      />
    </header>
  );
}
