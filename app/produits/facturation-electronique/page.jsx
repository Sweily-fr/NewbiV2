import React from "react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { HeroSection } from "./section/hero-section";
import { Poppins } from "next/font/google";
import FAQ from "./section/faq";
import TrustedBySection from "@/app/(main)/new/lp-home/TrustedBySection";
import FactElecGovernanceSection from "./section/FactElecGovernanceSection";
import PricingSection from "@/app/(main)/new/lp-home/PricingSection";
import FacturationElectroniqueComponentsSection from "./section/FacturationElectroniqueComponentsSection";
import { FacturationBanner } from "@/app/produits/factures/section/FacturationBanner";
import EInvoicingSection from "@/app/(main)/new/lp-home/EInvoicingSection";

// Configuration de Poppins uniquement pour les landing pages
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

// Export des metadata pour le SEO
export const metadata = {
  title: "Facturation Électronique 2026 | E-invoicing Conforme | newbi",
  description:
    "Préparez-vous à la réforme de la facturation électronique 2026 avec newbi. Solution e-invoicing et e-reporting conforme, formats Factur-X, UBL, CII. Archivage légal 10 ans.",
  keywords:
    "facturation électronique, e-invoicing, e-reporting, réforme 2026, Factur-X, facture électronique, PPF, portail public facturation, conformité fiscale, archivage factures",
  openGraph: {
    title: "Facturation Électronique 2026 | newbi",
    description:
      "Anticipez l'obligation de facturation électronique. Solution conforme e-invoicing et e-reporting avec archivage légal.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function FacturationElectroniquePage() {
  return (
    <>
      <div className={`${poppins.variable} font-poppins`}>
        <FacturationBanner />
        <NewHeroNavbar hasBanner={true} />
        <main>
          {/* Hero Section */}
          <HeroSection />
          <TrustedBySection variant="default" />
          <FactElecGovernanceSection />
          <EInvoicingSection maxWidth="max-w-6xl" />
          <PricingSection variant="default" />
          {/* <FacturationElectroniqueComponentsSection /> */}
          <FAQ />
        </main>
        <Footer7 />
      </div>
    </>
  );
}
