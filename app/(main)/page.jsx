import React from "react";
import { homeJsonLd } from "@/src/utils/seo-data";

// Import des sections depuis le dossier lp-home
import {
  NewHeroNavbar,
  HeroSection,
  TrustedBySection,
  AgentStudioSection,
  ComponentsSection,
  ComplianceSection,
  GovernanceSection,
  NewGovernanceSection,
  EInvoicingSection,
  MetiersSection,
  PricingSection,
  FeaturedOnSection,
  NewPricingSection,
  TestimonialsSplit,
  FAQSection,
} from "./new/lp-home";

export const metadata = {
  // `absolute` court-circuite le template "%s | Newbi" du layout racine
  title: {
    absolute:
      "Newbi — Logiciel de facturation et gestion tout-en-un pour TPE et freelances",
  },
  description:
    "Newbi, le logiciel de facturation et de gestion tout-en-un pour TPE, PME et freelances : devis, factures, trésorerie, signatures mail, kanban et transfert de fichiers. Essai gratuit de 30 jours.",
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
  openGraph: {
    title:
      "Newbi — Logiciel de facturation et gestion tout-en-un pour TPE et freelances",
    description:
      "Le logiciel tout-en-un pour piloter votre activité : devis, factures, trésorerie, signatures mail, kanban et transfert de fichiers. Essai gratuit de 30 jours.",
    url: "/",
    type: "website",
    images: ["/images/op-newbi.png"],
  },
};

export default function Home() {
  return (
    <>
      {/* Données structurées rendues côté serveur (lisibles sans exécuter le JS) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <NewHeroNavbar />
      <div className="bg-[#FDFDFD]">
        <HeroSection />
        <TrustedBySection />
        {/* <AgentStudioSection /> */}
        {/* <ComponentsSection /> */}
        {/* <ComplianceSection /> */}
        <NewGovernanceSection />
        <EInvoicingSection />
        <GovernanceSection />
        <MetiersSection />
        {/* <NewPricingSection /> */}
        {/* <TestimonialsSplit /> */}
        <PricingSection />
        <FeaturedOnSection />
        <FAQSection />
      </div>
    </>
  );
}
