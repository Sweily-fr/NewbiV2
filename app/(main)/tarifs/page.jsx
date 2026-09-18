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
    ...PLANS_DISPLAY.map((p) => ({
      "@type": "Offer",
      name: p.displayName,
      price: p.monthlyPrice.toFixed(2),
      priceCurrency: "EUR",
      description: `${p.description} · abonnement mensuel TTC`,
      availability: "https://schema.org/InStock",
    })),
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
        <PricingSection variant="home" />
      </div>
    </>
  );
}
