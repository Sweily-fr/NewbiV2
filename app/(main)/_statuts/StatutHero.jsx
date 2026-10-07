import React from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { WhatsAppContactButton } from "@/src/components/whatsapp-contact-button";

// Mêmes portraits que les autres LP produits, recadrés sur le visage.
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

/* Les trois cartes sont posées sur la photo : un pictogramme, un titre, une
   ligne de précision. Fond blanc, filet d'un pixel et ombre basse — le
   registre des cartes flottantes de Linear et de Qonto, sans effet de relief.
   Elles ne débordent qu'à partir de md : en dessous la place manque et elles
   se chevaucheraient, donc elles passent sous l'image. */
const PLACEMENTS = [
  "md:-left-6 md:top-10",
  "md:-right-6 md:bottom-28",
  "md:left-10 md:bottom-8",
];

function Carte({ icon: Icone, titre, texte, placement }) {
  return (
    <div
      className={`mt-3 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-[0_1px_2px_rgba(16,16,32,0.04),0_8px_24px_-12px_rgba(16,16,32,0.18)] ring-1 ring-black/[0.06] backdrop-blur-sm md:absolute md:mt-0 ${placement}`}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gray-50 text-gray-500 ring-1 ring-black/[0.05]">
        <Icone size={17} strokeWidth={1.75} />
      </span>
      <span className="block">
        <span className="block text-[13px] font-medium leading-tight text-gray-950">
          {titre}
        </span>
        <span className="mt-0.5 block text-[12px] leading-tight text-gray-500">
          {texte}
        </span>
      </span>
    </div>
  );
}

// Hero commun aux pages de statut : le titre à gauche, la photo à droite dans
// un cadre arrondi, avec les cartes d'information posées sur ses bords.
export default function StatutHero({ titre, chapo, image, imageAlt, cartes }) {
  return (
    /* Même cadrage que les heros des LP produits : à partir de lg la section
       occupe la hauteur de l'écran et son contenu se centre dedans, ce qui le
       décolle de la navbar. En dessous, c'est le padding qui s'en charge. */
    <section className="flex items-start bg-white px-5 pt-44 pb-10 sm:pt-48 lg:min-h-screen lg:items-center lg:pt-24 lg:pb-20">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-4 text-center lg:space-y-6 lg:text-left">
            {/* Même recette typographique que les autres LP produits */}
            <h1 className="mx-auto max-w-3xl text-balance text-[2.75rem] font-semibold leading-[1.1] tracking-tight text-[#0d0d0d] sm:text-[3.5rem] md:text-[4.25rem] lg:mx-0 lg:text-[4rem] dark:text-white">
              {titre}
            </h1>

            <p className="mx-auto mb-6 max-w-xl text-lg font-normal tracking-tight text-gray-600 md:text-xl lg:mx-0 lg:mb-8 dark:text-gray-300">
              {chapo}
            </p>

            {/* Même paire de boutons que le hero de /produits/factures :
                le CTA violet, puis le bouton WhatsApp en contour avec son
                logo vert. */}
            <div className="flex flex-col items-center gap-3 pt-2 sm:w-fit sm:flex-row sm:justify-center lg:pt-4">
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

            <div className="flex items-center justify-center gap-3 pt-3 lg:justify-start">
              <div className="flex -space-x-2.5">
                {PROOF_AVATARS.map((avatar) => (
                  <img
                    key={avatar.src}
                    src={avatar.src}
                    alt={avatar.alt}
                    style={{ objectPosition: avatar.position }}
                    className="size-7 rounded-full border-2 border-white object-cover sm:size-8"
                    loading="lazy"
                  />
                ))}
              </div>
              <p className="text-left text-xs text-gray-600 sm:text-sm">
                <span className="font-medium text-gray-900">
                  +1 000 indépendants
                </span>{" "}
                nous font confiance
              </p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="overflow-hidden rounded-3xl ring-1 ring-black/[0.06]">
              <img
                src={image}
                alt={imageAlt}
                width={1600}
                height={1069}
                className="aspect-[4/3] size-full object-cover"
              />
            </div>

            {cartes.map((carte, i) => (
              <Carte key={carte.titre} {...carte} placement={PLACEMENTS[i]} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
