import React from "react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import PricingPlansSection from "./section/PricingPlansSection";
import PricingFeaturesSection from "./section/PricingFeaturesSection";
import FinalCtaSection from "./section/FinalCtaSection";
import FaqSection from "./section/FaqSection";
import TrustedBySection from "@/app/(main)/new/lp-home/TrustedBySection";
import { generateNextMetadata } from "@/src/utils/seo-data";
import { PLANS_DISPLAY } from "@/src/lib/plans-display";
import { SITE_URL } from "@/src/lib/site";

export const metadata = generateNextMetadata("pricing");

// Offres réelles (source : plans-display.js) pour les données structurées.
const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Newbi",
  description:
    "Plateforme tout-en-un de gestion pour indépendants et petites équipes : devis, factures, clients, banque et facturation électronique.",
  url: `${SITE_URL}/tarifs`,
  brand: { "@type": "Brand", name: "Newbi" },
  offers: [
    {
      "@type": "Offer",
      name: "Essai gratuit",
      price: "0",
      priceCurrency: "EUR",
      description: "30 jours gratuits, sans carte bancaire, sans engagement",
      availability: "https://schema.org/InStock",
    },
    ...PLANS_DISPLAY.flatMap((p) => [
      {
        "@type": "Offer",
        name: p.displayName,
        price: p.monthlyPrice.toFixed(2),
        priceCurrency: "EUR",
        description: `${p.description} · abonnement mensuel TTC`,
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: `${p.displayName} (engagement annuel)`,
        price: p.annualMonthlyPrice.toFixed(2),
        priceCurrency: "EUR",
        description: `${p.description} · par mois TTC en réglant à l'année`,
        availability: "https://schema.org/InStock",
      },
    ]),
  ],
};

// Page tarifs complète : même composant (comparatif détaillé, toggle
// mensuel/annuel) que celui affiché historiquement sur la page d'accueil.
export default function TarifsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      <NewHeroNavbar />
      <div className="bg-[#FDFDFD] pt-16 md:pt-20">
        {/* La section de prix porte un h2 et sa bascule mensuel/annuel est un
            état client : la page n'avait donc aucun h1, et aucun montant
            annuel n'existait dans le HTML servi. Ce récapitulatif est visible,
            pas masqué : du texte lisible seulement des robots serait à la fois
            contraire aux consignes de Google et inutile aux visiteurs. */}
        <header className="mx-auto max-w-[1200px] px-5 pb-2 text-center">
          <h1 className="sr-only">Tarifs Newbi</h1>
          {/* Récapitulatif des montants, commenté le temps de la refonte.
              Il servait à faire figurer les prix annuels dans le HTML servi :
              la bascule mensuel/annuel est un état client, sans lui aucun
              montant annuel n'existe dans la page rendue.
          <p className="text-sm text-gray-500">
            {PLANS_DISPLAY.map(
              (p) =>
                `${p.displayName} : ${p.monthlyPrice
                  .toFixed(2)
                  .replace(".", ",")} € TTC par mois, ou ${p.annualMonthlyPrice
                  .toFixed(2)
                  .replace(
                    ".",
                    ","
                  )} € par mois en réglant à l'année.`
            ).join(" ")}{" "}
            Tous les abonnements démarrent par 30 jours gratuits, sans carte
            bancaire et sans engagement.
          </p>
          */}
        </header>
        {/* Nouvelle grille tarifaire, en première position */}
        <PricingPlansSection />
        {/* Mêmes logos clients que sur les LP produits */}
        <TrustedBySection variant="default" />
        {/* Comparatif détaillé. Il remplace l'ancien bloc « Profitez de 30
            jours offerts » (lp-home/PricingSection), qui reprenait les mêmes
            plans et le même tableau : la page les affichait deux fois. Ce
            composant n'est plus monté nulle part — les LP produits utilisent
            HomePricingSection, qui est un autre composant. */}
        <PricingFeaturesSection />
        {/* Appel à l'action, puis la FAQ qui ferme la page */}
        <FinalCtaSection />
        <FaqSection />
      </div>
    </>
  );
}
