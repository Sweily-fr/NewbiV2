"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { PLAN_FEATURES_SECTIONS } from "@/src/lib/plans-display";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

/* Comparatif détaillé repris de linear.app/pricing, transposé en thème clair.
   Mesures relevées sur la page Linear : grille d'une colonne de libellés
   large d'un tiers suivie d'une colonne par plan, lignes de 44 px sans filet
   horizontal, libellés et valeurs en 15 px, pastille de 16 px, titres de
   section en 24 px/510 avec 42 px d'air au-dessus et au-dessous, en-tête
   collant de 56 px aligné en bas, et rangée de boutons finale de 42 px
   d'air au-dessus avec des boutons larges comme la colonne.

   Les trois colonnes sont les trois plans payants : l'essai gratuit n'a pas
   de ligne qui lui soit propre (il ouvre l'intégralité du plan Freelance
   pendant 30 jours), une quatrième colonne serait la copie exacte de celle
   de Freelance. La mention est rappelée sous le tableau. */

const FILET = "rgba(16,16,32,0.09)";

// Hauteur rendue de la navbar fixe (NewHeroNavbar) : l'en-tête du tableau se
// cale exactement dessous, sans laisser passer de contenu entre les deux.
const HAUTEUR_NAVBAR = 64;

// `cle` renvoie au nom de champ utilisé dans PLAN_FEATURES_SECTIONS.
const COLONNES = [
  {
    id: "freelance",
    cle: "freelance",
    nom: "Freelance",
    cta: { href: "/auth/signup", label: "Commencer gratuitement" },
  },
  {
    id: "tpe",
    cle: "pme",
    nom: "TPE",
    enAvant: true,
    cta: { href: "/auth/signup", label: "Commencer gratuitement" },
    lien: { href: "/contact", label: "parler à un conseiller" },
  },
  {
    id: "entreprise",
    cle: "entreprise",
    nom: "Entreprise",
    cta: { href: "/auth/signup", label: "Commencer gratuitement" },
    lien: { href: "/contact", label: "parler à un conseiller" },
  },
];

// Colonne de libellés large d'un tiers, comme chez Linear.
const GRILLE =
  "grid grid-cols-[1fr_auto] lg:grid-cols-[1.5fr_repeat(3,minmax(0,1fr))]";

/* Pastille de validation : même dessin que celle de la grille tarifaire. */
function Coche() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="shrink-0 text-gray-400"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 1.00195C4.13401 1.00195 1 4.13596 1 8.00195C1 11.8679 4.13401 15.002 8 15.002C11.866 15.002 15 11.8679 15 8.00195C15 4.13596 11.866 1.00195 8 1.00195ZM12.101 6.10299C12.433 5.77105 12.433 5.23286 12.101 4.90091C11.7691 4.56897 11.2309 4.56897 10.899 4.90091L6.5 9.29987L5.10104 7.90091C4.7691 7.56897 4.2309 7.56897 3.89896 7.90091C3.56701 8.23286 3.56701 8.77105 3.89896 9.10299L5.89896 11.103C6.2309 11.4349 6.7691 11.4349 7.10104 11.103L12.101 6.10299Z"
      />
    </svg>
  );
}

/* Croix des fonctionnalités absentes, plus pâle que la coche. */
function Croix() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="shrink-0 text-gray-300"
      fill="currentColor"
    >
      <path d="M2.96967 2.96967C3.26256 2.67678 3.73744 2.67678 4.03033 2.96967L8 6.939L11.9697 2.96967C12.2626 2.67678 12.7374 2.67678 13.0303 2.96967C13.3232 3.26256 13.3232 3.73744 13.0303 4.03033L9.061 8L13.0303 11.9697C13.2966 12.2359 13.3208 12.6526 13.1029 12.9462L13.0303 13.0303C12.7374 13.3232 12.2626 13.3232 11.9697 13.0303L8 9.061L4.03033 13.0303C3.73744 13.3232 3.26256 13.3232 2.96967 13.0303C2.67678 12.7374 2.67678 12.2626 2.96967 11.9697L6.939 8L2.96967 4.03033C2.7034 3.76406 2.6792 3.3474 2.89705 3.05379L2.96967 2.96967Z" />
    </svg>
  );
}

/* Pictogramme d'information : invisible au repos, révélé au survol de la
   ligne — exactement comme sur Linear, où il ne doit pas bruiter la lecture. */
function Info() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="shrink-0 text-gray-400 opacity-0 transition-opacity group-hover/ligne:opacity-100"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8ZM8 13.5C11.0376 13.5 13.5 11.0376 13.5 8C13.5 4.96243 11.0376 2.5 8 2.5C4.96243 2.5 2.5 4.96243 2.5 8C2.5 11.0376 4.96243 13.5 8 13.5Z"
      />
      <path d="M8 6C8.55228 6 9 5.55228 9 5C9 4.44772 8.55228 4 8 4C7.44772 4 7 4.44772 7 5C7 5.55228 7.44772 6 8 6Z" />
      <path d="M6 8C6 7.58579 6.33579 7.25 6.75 7.25H7.5C8.19036 7.25 8.75 7.80964 8.75 8.5V11.25C8.75 11.6642 8.41421 12 8 12C7.58579 12 7.25 11.6642 7.25 11.25V8.75H6.75C6.33579 8.75 6 8.41421 6 8Z" />
    </svg>
  );
}

/* Chevrons du sélecteur mobile, repris du composant Select de Linear. */
function Chevrons() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.35355 4.56051C8.15829 4.36525 7.84171 4.36525 7.64645 4.56051L5.35355 6.8534C5.15829 7.04866 4.84171 7.04866 4.64645 6.8534C4.45118 6.65814 4.45118 6.34156 4.64645 6.1463L6.93934 3.8534C7.52513 3.26762 8.47487 3.26762 9.06066 3.8534L11.3536 6.1463C11.5488 6.34156 11.5488 6.65814 11.3536 6.8534C11.1583 7.04866 10.8417 7.04866 10.6464 6.8534L8.35355 4.56051Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.64645 11.4392C7.84171 11.6344 8.15829 11.6344 8.35355 11.4392L10.6464 9.14629C10.8417 8.95103 11.1583 8.95103 11.3536 9.14629C11.5488 9.34156 11.5488 9.65814 11.3536 9.8534L9.06066 12.1463C8.47487 12.7321 7.52513 12.7321 6.93934 12.1463L4.64645 9.8534C4.45118 9.65814 4.45118 9.34156 4.64645 9.14629C4.84171 8.95103 5.15829 8.95103 5.35355 9.14629L7.64645 11.4392Z"
      />
    </svg>
  );
}

/* Padding horizontal de Linear (32 px). Il est retiré aux deux extrémités du
   tableau — à gauche de la colonne de libellés et à droite de la dernière
   colonne — pour que le contenu s'aligne sur la navbar. */
const PAD_LIBELLE = "lg:pl-0 lg:pr-8";

function paddingDe(index) {
  return index === COLONNES.length - 1 ? "lg:pl-8 lg:pr-0" : "lg:px-8";
}

/* Filet vertical entre les colonnes : chez Linear il est porté par chaque
   cellule de plan, ce qui le fait courir le long des lignes et s'interrompre
   au droit des titres de section, de l'en-tête et de la rangée de boutons. */
// Seulement à partir de lg : en dessous, une seule colonne est affichée et un
// filet à sa gauche n'aurait plus de sens.
const FILET_VERTICAL = "lg:border-l lg:border-[rgba(16,16,32,0.09)]";

function Valeur({ valeur }) {
  if (valeur === false) return <Croix />;
  return (
    <>
      <Coche />
      {typeof valeur === "string" && (
        <span className="text-[15px] leading-6 tracking-[-0.011em] text-gray-800">
          {valeur}
        </span>
      )}
    </>
  );
}

export default function PricingFeaturesSection() {
  // Sur petit écran, une seule colonne de plan est affichée à la fois : le
  // sélecteur remplace les en-têtes, comme sur Linear.
  const [planMobile, setPlanMobile] = React.useState("pme");

  // L'en-tête ne porte son filet que lorsqu'il est effectivement collé sous
  // la navbar : au repos il doit se fondre dans la page. Même mécanique que
  // Linear, qui observe une sentinelle d'un pixel placée juste au-dessus.
  const sentinelle = React.useRef(null);
  const [colle, setColle] = React.useState(false);

  React.useEffect(() => {
    const cible = sentinelle.current;
    if (!cible || typeof IntersectionObserver === "undefined") return;
    const observateur = new IntersectionObserver(
      ([entree]) => setColle(!entree.isIntersecting),
      { rootMargin: `-${HAUTEUR_NAVBAR + 1}px 0px 0px 0px`, threshold: 0 },
    );
    observateur.observe(cible);
    return () => observateur.disconnect();
  }, []);
  const indexMobile = COLONNES.findIndex((c) => c.cle === planMobile);

  // Masque la colonne non retenue en dessous de `lg`, sans la retirer du DOM
  // (les trois colonnes restent lisibles par les robots et à l'impression).
  const visible = (i) => (i === indexMobile ? "flex" : "hidden lg:flex");

  return (
    /* L'air au-dessus de la bande « Ils nous font confiance » est donné par le
       padding bas de la grille tarifaire (64 / 96 / 112 px). On le rend ici à
       l'identique pour que la bande respire pareil des deux côtés, à deux
       corrections près : −13 px d'amorce de l'en-tête collant (sa ligne de
       56 px aligne son titre en bas), et +32 px en dessous de lg, où les
       colonnes de la grille ajoutent leur propre py-8 sous le dernier bouton. */
    <section className="px-5 pt-[calc(4rem+19px)] pb-16 md:pt-[calc(6rem+19px)] md:pb-24 lg:pt-[calc(7rem-13px)]">
      <div className="mx-auto max-w-7xl">
        {/* Sentinelle d'un pixel : elle sort du cadre au moment précis où
            l'en-tête se colle, ce qui déclenche l'affichage de son filet. */}
        <div ref={sentinelle} aria-hidden="true" className="h-px" />

        {/* En-tête collant : il se cale au ras du bas de la navbar fixe */}
        <div
          className="sticky z-20 bg-[#FDFDFD]"
          style={{
            top: HAUTEUR_NAVBAR,
            borderBottom: `1px solid ${colle ? FILET : "transparent"}`,
          }}
        >
          <div className={`${GRILLE} h-14 items-end`}>
            <h2
              className={`pb-3 text-2xl font-medium tracking-[-0.012em] text-gray-950 ${PAD_LIBELLE}`}
            >
              Fonctionnalités
            </h2>

            {/* Sélecteur de plan, visible seulement en dessous de lg */}
            <div className="relative pb-3 lg:hidden">
              <select
                aria-label="Choisir un plan à comparer"
                value={planMobile}
                onChange={(e) => setPlanMobile(e.target.value)}
                className="h-8 cursor-pointer appearance-none rounded-md border border-gray-200 bg-white pl-3 pr-9 text-[15px] text-gray-900"
              >
                {COLONNES.map((col) => (
                  <option key={col.id} value={col.cle}>
                    {col.nom}
                  </option>
                ))}
              </select>
              <Chevrons />
            </div>

            {COLONNES.map((col, i) => (
              <div
                key={col.id}
                className={`hidden items-end pb-3 lg:flex ${paddingDe(i)}`}
              >
                <span className="text-2xl font-medium tracking-[-0.012em] text-gray-950">
                  {col.nom}
                </span>
              </div>
            ))}
          </div>
        </div>

        {PLAN_FEATURES_SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="py-[42px] text-2xl font-medium tracking-[-0.012em] text-gray-950">
              {section.title}
            </h3>

            {section.features.map((feature) => {
              /* La surbrillance déborde de 12 px de chaque côté pour que le
                 texte ne colle pas au bord du gris. Le padding compense la
                 marge négative : la boîte de contenu ne bouge pas, donc les
                 colonnes restent alignées sur celles de l'en-tête. */
              const ligne = (
                <div
                  className={`${GRILLE} group/ligne -mx-3 min-h-11 items-center rounded-md px-3 transition-colors hover:bg-black/[0.028]`}
                >
                  <div
                    className={`flex items-center gap-2 py-[10px] ${PAD_LIBELLE}`}
                  >
                    <span className="text-[15px] leading-6 tracking-[-0.011em] text-gray-500">
                      {feature.name}
                    </span>
                    {feature.tooltip && (
                      <span className="flex items-center">
                        <Info />
                        <span className="sr-only">{feature.tooltip}</span>
                      </span>
                    )}
                  </div>

                  {COLONNES.map((col, i) => (
                    <div
                      key={col.id}
                      className={`items-center gap-2 py-[10px] ${visible(i)} ${paddingDe(i)} ${FILET_VERTICAL}`}
                    >
                      <Valeur valeur={feature[col.cle]} />
                    </div>
                  ))}
                </div>
              );

              /* Comme chez Linear, c'est la ligne entière qui déclenche
                 l'infobulle, pas seulement le pictogramme. */
              return feature.tooltip ? (
                <Tooltip key={feature.name} delayDuration={200}>
                  <TooltipTrigger asChild>{ligne}</TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    className="max-w-[320px]"
                  >
                    {feature.tooltip}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <React.Fragment key={feature.name}>{ligne}</React.Fragment>
              );
            })}
          </div>
        ))}

        {/* Rangée de boutons finale, au gabarit de la navbar */}
        <div className={`${GRILLE} pt-[42px]`}>
          <div className={PAD_LIBELLE} />
          {COLONNES.map((col, i) => (
            <div
              key={col.id}
              className={`flex-col ${visible(i)} ${paddingDe(i)}`}
            >
              <Button
                asChild
                size="md"
                variant={col.enAvant ? "primary" : "outline"}
                className="w-full justify-center px-4"
              >
                <Link href={col.cta.href}>
                  <span>{col.cta.label}</span>
                </Link>
              </Button>
              <span className="mt-2 block h-5 text-center text-[13px] text-gray-500">
                {col.lien && (
                  <>
                    ou{" "}
                    <Link
                      href={col.lien.href}
                      className="underline underline-offset-2 hover:text-gray-900"
                    >
                      {col.lien.label}
                    </Link>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[13px] leading-5 text-gray-500">
          L&apos;essai gratuit de 30 jours ouvre l&apos;intégralité des
          fonctionnalités du plan Freelance, sans carte bancaire et sans
          engagement.
        </p>
      </div>
    </section>
  );
}
