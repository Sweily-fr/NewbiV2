import React from "react";
import { homeJsonLd } from "@/src/utils/seo-data";
import { buildHomeFaqJsonLd } from "./new/lp-home/FAQSection";

// Import des sections depuis le dossier lp-home
import {
  NewHeroNavbar,
  HeroSection,
  AgentStudioSection,
  ComponentsSection,
  ComplianceSection,
  NewGovernanceSection,
  EInvoicingSection,
  HomePricingSection,
  NewPricingSection,
  TestimonialsSplit,
  FAQSection,
} from "./new/lp-home";

export const metadata = {
  // `absolute` court-circuite le template "%s | Newbi" du layout racine
  title: {
    absolute: "Newbi | Devis, factures et gestion pour indépendants",
  },
  description:
    "Newbi, la plateforme tout-en-un pour indépendants et petites équipes : devis, factures, clients, reçus, banque et facturation électronique au même endroit. 30 jours gratuits, sans carte bancaire.",
  keywords: [
    "logiciel de facturation",
    "logiciel devis facture",
    "logiciel de gestion TPE",
    "facturation freelance",
    "logiciel gestion entreprise",
    "facturation électronique",
  ],
  alternates: {
    canonical: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Newbi | Devis, factures et gestion pour indépendants",
    description:
      "Devis, factures, clients, reçus, banque et facturation électronique au même endroit. 30 jours gratuits, sans carte bancaire.",
    images: ["/images/op-newbi.png"],
  },
  openGraph: {
    title: "Newbi | Devis, factures et gestion pour indépendants",
    description:
      "Devis, factures, clients, reçus, banque et facturation électronique au même endroit. 30 jours gratuits, sans carte bancaire.",
    url: "/",
    type: "website",
    images: ["/images/op-newbi.png"],
  },
};

// Le FAQPage générique de homeJsonLd est remplacé par celui construit depuis
// les questions affichées sur la page (balisage = contenu visible).
const jsonLd = [
  ...homeJsonLd.filter((item) => item["@type"] !== "FAQPage"),
  buildHomeFaqJsonLd(),
];

export default function Home() {
  return (
    <>
      {/* Données structurées rendues côté serveur (lisibles sans exécuter le JS) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NewHeroNavbar />
      <div className="bg-[#FDFDFD]">
        <HeroSection />
        {/* <AgentStudioSection /> */}
        {/* <ComponentsSection /> */}
        {/* <ComplianceSection /> */}
        <NewGovernanceSection />
        <EInvoicingSection />
        {/* <NewPricingSection /> */}
        {/* <TestimonialsSplit /> */}
        <HomePricingSection />
        <FAQSection />
      </div>
    </>
  );
}
