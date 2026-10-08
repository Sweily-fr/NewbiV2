"use client";
import React from "react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { WhatsAppContactButton } from "@/src/components/whatsapp-contact-button";
import PurchasesDemo from "./hero-demo/PurchasesDemo";

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

// Même disposition que le hero de la LP factures : bloc de texte centré sur
// toute la largeur, puis la capture de l'interface en dessous, plein cadre.
export function HeroSection() {
  return (
    <div className="relative w-full overflow-x-clip bg-white px-5 pb-6 md:pb-10 lg:pb-16">
      <div className="max-w-7xl mx-auto relative">
        {/* Pas de gouttière horizontale : tous les enfants occupent les douze
            colonnes, et `gap-x-24` donnait onze gouttières de 96 px — 1 056 px
            dans un conteneur de 728 px — ce qui faisait sortir le titre du
            cadre entre 768 et 1 023 px. */}
        <div className="grid grid-cols-12 pt-40 md:pt-36 lg:pt-44">
          {/* Titre sur toute la largeur du conteneur. Pas de `text-balance`
              ici : ce titre est long, et l'équilibrage le resserrait à 75 % de
              la boîte — quatre lignes à 390 px au lieu de trois. */}
          <div className="col-span-12 text-center">
            <h1 className="font-semibold text-[2.75rem] sm:text-[3.5rem] md:text-[4.25rem] lg:text-[4.5rem] leading-[1.1] tracking-tight text-[#0d0d0d] dark:text-white mb-6">
              La gestion des achats, du justificatif à la compta
            </h1>
          </div>

          {/* Sous-titre, CTA et preuve sociale, centrés comme sur la LP
              factures */}
          <div className="col-span-12 lg:col-span-10 lg:col-start-2 text-center">
            <p className="text-lg md:text-xl font-normal tracking-tight text-gray-600 dark:text-gray-300 mx-auto mb-8 max-w-3xl">
              Scannez vos{" "}
              <strong className="font-medium text-gray-900">
                factures fournisseurs et vos notes de frais
              </strong>
              , laissez l&apos;OCR remplir les montants et la TVA, et
              rapprochez-les de vos transactions bancaires.
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

            {/* Preuve sociale : mêmes portraits que les autres LP produits */}
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

          {/* Démo animée de l'interface, sur toute la largeur du hero. Sur
              mobile on garde la capture : la maquette animée y serait
              illisible. */}
          <div className="col-span-12">
            <div className="relative mx-auto mt-10 md:mt-14 w-full">
              <div className="overflow-hidden rounded-lg border-4 border-[#2F2F2D] w-[150%] max-w-none ml-0 md:hidden">
                <img
                  src="/images/gestion-achats-hero.png"
                  alt="Factures d'achat et notes de frais dans Newbi : justificatifs scannés, montants et TVA reconnus par l'OCR"
                  className="w-full h-auto"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
              <PurchasesDemo className="hidden md:block" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
