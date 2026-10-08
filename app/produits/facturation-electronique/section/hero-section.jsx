"use client";
import React from "react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { WhatsAppContactButton } from "@/src/components/whatsapp-contact-button";
import PurchaseInvoicesDemo from "@/app/(main)/new/lp-home/hero-demo/PurchaseInvoicesDemo";

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

// Même disposition que le hero de /produits/tresorerie : texte à gauche,
// maquette iPad surdimensionnée et débordante à droite. L'écran montré est
// celui des factures d'achat : c'est par là que transitent les factures
// fournisseurs reçues au format électronique, la première échéance de la
// réforme.
/* Dégagement sous la navbar. Sans bandeau, elle est collée en haut et mesure
   65 px. Avec le bandeau, elle descend de 80 px sur mobile et de 58 px à
   partir de `sm` : son bas tombe alors à 145 px et 123 px. Le padding du hero
   doit suivre, sinon le titre vient se coller dessous — et revenir à sa valeur
   courte dès que le bandeau est fermé. */
const PADDING_HAUT = {
  sans: "pt-44 sm:pt-48 xl:pt-24",
  avec: "pt-[237px] sm:pt-[215px] xl:pt-[180px]",
};

export function HeroSection({ hasBanner = false }) {
  // Le bandeau se ferme : la navbar remonte, le hero doit remonter avec elle.
  // `banner-closed` est l'événement que le bandeau émet déjà et que la navbar
  // écoute — on s'y branche plutôt que de partager un état.
  const [bandeauVisible, setBandeauVisible] = React.useState(hasBanner);

  React.useEffect(() => {
    if (!hasBanner) return;
    const fermer = () => setBandeauVisible(false);
    window.addEventListener("banner-closed", fermer);
    return () => window.removeEventListener("banner-closed", fermer);
  }, [hasBanner]);

  return (
    <section
      className={`xl:min-h-screen flex items-start xl:items-center overflow-hidden bg-white mb-6 xl:mb-20 px-5 transition-[padding] duration-300 ${
        bandeauVisible ? PADDING_HAUT.avec : PADDING_HAUT.sans
      }`}
    >
      {/* Même gabarit que les sections du reste de la page : 7xl plein,
          padding latéral porté par la section. */}
      <div className="mx-auto max-w-7xl w-full">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-12 items-center">
          <div className="space-y-4 xl:space-y-6 text-center xl:text-left">
            {/* Même recette typographique que les autres LP produits :
                semi-gras, interlignage serré, noir profond. */}
            <h1 className="text-balance font-semibold text-[2.75rem] sm:text-[3.5rem] md:text-[4.25rem] lg:text-[4.5rem] leading-[1.1] tracking-tight text-[#0d0d0d] dark:text-white mb-6">
              Adoptez la facturation électronique dès maintenant
            </h1>

            <p className="text-lg md:text-xl font-normal tracking-tight text-gray-600 dark:text-gray-300 mb-6 xl:mb-8 max-w-xl mx-auto xl:mx-0">
              Émettez et recevez vos factures au format Factur-X via une
              plateforme agréée, prêt pour la réforme 2026 et{" "}
              <strong className="font-medium text-gray-900">
                gratuit dans toutes les offres Newbi
              </strong>
              , sans supplément.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 xl:pt-4 justify-center xl:justify-start">
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
            <div className="flex items-center justify-center xl:justify-start gap-3 pt-3">
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

          {/* Maquette. Jusqu'à xl elle passe sous le texte, agrandie pour
              rester lisible et recadrée à droite, comme sur la LP factures ;
              à partir de xl elle se cale au bord droit et déborde, comme sur
              /produits/tresorerie. La bascule est à xl et non à lg : la
              maquette fait 1 900 px, et à 1 024 px la colonne visuelle n'en
              fait que 470 — elle recouvrait tout le texte. Elle est statique,
              sans animation. `shrink-0` ne vaut qu'en dessous de xl : il
              fait tenir le cadre à 150 % quand la maquette est empilée. En
              deux colonnes, c'est au contraire la rétraction de l'élément qui
              la garde calée à droite. */}
          <div className="relative flex items-end pt-4 xl:justify-end xl:overflow-visible">
            <div className="relative w-[150%] shrink-0 xl:w-[1900px] xl:shrink xl:-mr-[34rem]">
              <PurchaseInvoicesDemo />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
