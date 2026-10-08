"use client";
import React from "react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { WhatsAppContactButton } from "@/src/components/whatsapp-contact-button";

// Portraits affichés sous les CTA : les mêmes clients que sur la LP home.
// `position` recadre chaque photo sur le visage.
const PROOF_AVATARS = [
  {
    src: "/lp/avis/maeva.jpg",
    alt: "Maëva, graphiste, cliente Newbi",
    position: "50% 18%",
  },
  {
    src: "/lp/avis/pedro-avatar.jpg",
    alt: "Pedro, commerçant, client Newbi",
    position: "50% 35%",
  },
  {
    src: "/lp/factures/41682668-4F07-4D9F-B672-DC469853793A.PNG",
    alt: "Mustafa, artisan du bâtiment, client Newbi",
    position: "50% 20%",
  },
  {
    src: "/lp/about/about-11.jpeg",
    alt: "Une cliente Newbi",
    position: "50% 25%",
  },
];

// Même disposition que le hero de la LP home : bloc de texte centré sur toute
// la largeur, puis la maquette de l'interface en dessous, plein cadre.
/* Dégagement sous la navbar. Sans bandeau, elle est collée en haut et mesure
   65 px. Avec le bandeau, elle descend de 80 px sur mobile et de 58 px à
   partir de `sm` : son bas tombe alors à 145 px et 123 px. Le padding du hero
   doit suivre, sinon le titre vient se coller dessous. */
const PADDING_HAUT = {
  sans: "pt-40 md:pt-36 lg:pt-44",
  avec: "pt-[236px] sm:pt-[214px] md:pt-[204px] lg:pt-[236px]",
};

export function HeroSection({ hasBanner = false }) {
  return (
    <div className="relative w-full overflow-x-clip bg-white px-5 pb-6 md:pb-10 lg:pb-16">
      <div className="max-w-[1200px] mx-auto relative">
        {/* Pas de gouttière horizontale : tous les enfants occupent les douze
            colonnes. Avec `md:gap-x-24`, les onze gouttières pesaient 1 056 px
            et faisaient déborder la piste hors d'un conteneur de 728 px — le
            titre et les boutons sortaient du cadre entre 768 et 1 023 px. */}
        <div
          className={`grid grid-cols-12 ${hasBanner ? PADDING_HAUT.avec : PADDING_HAUT.sans}`}
        >
          {/* Titre sur toute la largeur du conteneur */}
          <div className="col-span-12 text-center">
            <h1 className="text-balance font-semibold text-[2.75rem] sm:text-[3.5rem] md:text-[4.25rem] lg:text-[4.5rem] leading-[1.1] tracking-tight text-[#0d0d0d] dark:text-white mb-6">
              Votre logiciel de facturation, du devis au paiement
            </h1>
          </div>

          {/* Sous-titre, CTA et preuve sociale, centrés comme sur la home */}
          <div className="col-span-12 lg:col-span-10 lg:col-start-2 text-center">
            <p className="text-lg md:text-xl font-normal tracking-tight text-gray-600 dark:text-gray-300 mx-auto mb-8 max-w-3xl">
              Créez vos devis et vos factures en un clic, suivez vos paiements
              et vos relances, et passez à la{" "}
              <strong className="font-medium text-gray-900">
                facturation électronique conforme
              </strong>{" "}
              sans changer d&apos;outil.
            </p>

            <div className="mb-8 flex flex-col items-center gap-3 sm:mx-auto sm:flex sm:w-fit sm:flex-row sm:justify-center">
              {/* Même gabarit que le CTA du hero de la LP home */}
              <Button
                asChild
                size="md"
                variant="primary"
                className="h-auto w-full px-4 py-1.5 text-[17px] sm:w-auto"
              >
                <Link href="/auth/signup">
                  <span>Essayer 30 jours offerts</span>
                </Link>
              </Button>
              <WhatsAppContactButton
                className="bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-900 dark:bg-transparent dark:hover:bg-gray-100 dark:text-gray-900"
                iconClassName="text-[#25D366]"
              />
            </div>

            {/* Preuve sociale : mêmes portraits que le hero de la LP home */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex -space-x-2.5">
                {PROOF_AVATARS.map((avatar) => (
                  <img
                    key={avatar.src}
                    src={avatar.src}
                    alt={avatar.alt}
                    style={{ objectPosition: avatar.position }}
                    className="size-7 sm:size-8 rounded-full border-2 border-white object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 text-left">
                <span className="text-gray-900 font-medium">
                  +1 000 indépendants
                </span>{" "}
                nous font confiance
              </p>
            </div>
          </div>

          {/* Maquette de l'interface, sur toute la largeur du hero. Sur mobile
              elle est agrandie pour rester lisible : plutôt que de la rogner
              des deux côtés, elle part du bord de page et file vers la droite
              — la tablette entre dans le cadre au lieu d'y être coupée. */}
          <div className="col-span-12">
            <div className="relative mx-auto mt-10 md:mt-14 w-full">
              <img
                src="/lp/factures/ipad-mockup.png"
                alt="Liste des factures clients dans Newbi : statuts, échéances et suivi"
                className="w-[150%] max-w-none ml-0 h-auto md:w-full"
                loading="eager"
                fetchPriority="high"
              />
              {/* Badge posé dans la maquette, juste au-dessus de l'encadré
                  violet « Facturation électronique » de la sidebar. */}
              <Link
                href="/produits/facturation-electronique"
                className="absolute left-[6.4%] top-[51.6%] z-50 hidden lg:flex w-[11.7%] items-center justify-center rounded-sm bg-white p-[0.9%] transition-colors hover:bg-gray-50"
              >
                <img
                  src="/logo_Compatible_Facturation_electronique-footer.png"
                  alt="Conforme Facturation électronique 2026"
                  className="w-full h-auto object-contain"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
