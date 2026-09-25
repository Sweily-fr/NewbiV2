import React from "react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import PricingSection from "@/app/(main)/new/lp-home/PricingSection";
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
        </header>
        <PricingSection variant="home" />
      </div>
    </>
  );
}
