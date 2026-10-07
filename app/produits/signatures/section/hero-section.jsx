"use client";
import React from "react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import SignaturesDemo from "./hero-demo/SignaturesDemo";

// Portraits affichés sous les CTA : les mêmes clients que sur les autres LP
// produits. `position` recadre chaque photo sur le visage.
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

// Même disposition que le hero de /produits/facturation-electronique : texte à
// gauche sur une colonne large, visuel à droite. La colonne de droite attend
// sa maquette.
export function HeroSection() {
  return (
    <section className="lg:min-h-screen flex items-start lg:items-center bg-white pt-44 sm:pt-48 lg:pt-24 mb-6 lg:mb-20 px-5 overflow-x-clip">
      <div className="mx-auto max-w-7xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_0.5fr] gap-8 lg:gap-12 items-center">
          <div className="space-y-4 lg:space-y-6 text-center lg:text-left">
            {/* Même recette typographique que les autres LP produits :
                semi-gras, interlignage serré, noir profond. */}
            <h1 className="text-balance font-semibold text-[2.75rem] sm:text-[3.5rem] md:text-[4.25rem] lg:text-[4.5rem] leading-[1.1] tracking-tight text-[#0d0d0d] dark:text-white max-w-3xl mx-auto lg:mx-0">
              Une signature mail à votre image, sur tous vos e-mails
            </h1>

            <p className="text-lg md:text-xl font-normal tracking-tight text-gray-600 dark:text-gray-300 mb-6 lg:mb-8 max-w-xl mx-auto lg:mx-0">
              Créez, déployez et mettez à jour les{" "}
              <strong className="font-medium text-gray-900">
                signatures e-mail de toute votre entreprise
              </strong>{" "}
              depuis un seul endroit, avec le générateur de signature mail Newbi
              — compatible Gmail, Outlook et Apple Mail.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 lg:pt-4 justify-center lg:justify-start">
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
            </div>

            {/* Preuve sociale : mêmes portraits que les autres LP produits */}
            <div className="flex items-center justify-center lg:justify-start gap-3 pt-3">
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
                  +1 000 signatures
                </span>{" "}
                déjà en bas de page des e-mails Newbi
              </p>
            </div>
          </div>

          {/* Colonne visuel : la maquette sort du conteneur et se cale au
              bord droit de l'écran, comme sur /produits/tresorerie.
              L'interface sera reconstruite dans le panneau vide. */}
          <div className="relative hidden lg:flex min-w-0 items-center justify-end overflow-visible">
            <div className="shrink-0 w-[1100px] xl:w-[1200px] -mr-[37rem] xl:-mr-[39rem]">
              <SignaturesDemo />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
