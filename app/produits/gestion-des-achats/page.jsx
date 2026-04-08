import React from "react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { HeroSection } from "./section/hero-section";
import { Poppins } from "next/font/google";
import FAQ from "./section/faq";
import { generateNextMetadata } from "@/src/utils/seo-data";
import TrustedBySection from "@/app/(main)/new/lp-home/TrustedBySection";
import AchatsGovernanceSection from "./section/AchatsGovernanceSection";
import EInvoicingSection from "@/app/(main)/new/lp-home/EInvoicingSection";
import MetiersSection from "@/app/(main)/new/lp-home/MetiersSection";
import PricingSection from "@/app/(main)/new/lp-home/PricingSection";
import GestionAchatsComponentsSection from "./section/GestionAchatsComponentsSection";
import { TestimonialsSplit } from "./section/TestimonialsSplit";

// Configuration de Poppins uniquement pour les landing pages
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

// Export des metadata pour le SEO
export const metadata = generateNextMetadata("gestion-des-achats");

export default function GestionDesAchatsPage() {
  return (
    <>
      <div className={`${poppins.variable} font-poppins`}>
        <NewHeroNavbar />
        <main>
          {/* Hero Section */}
          <HeroSection />
          <TrustedBySection variant="default" />
          <AchatsGovernanceSection />
          <EInvoicingSection maxWidth="max-w-6xl" />
          <MetiersSection
            badge="Pour chaque type d'achat"
            title="Adapté à tous les profils d'entreprise"
            subtitle="Que vous gériez des fournitures, des sous-traitants ou des abonnements, Newbi s'adapte à vos besoins d'achat."
            items={[
              {
                title: "Artisans & BTP",
                desc: "Matériaux, sous-traitants, location de matériel et fournitures de chantier.",
                image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
              },
              {
                title: "Freelances & Agences",
                desc: "Licences logiciels, abonnements SaaS, coworking et outils de travail.",
                image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&q=80",
              },
              {
                title: "Commerçants",
                desc: "Stock, marchandises, emballages et frais de livraison.",
                image: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=600&q=80",
              },
              {
                title: "Consultants & Services",
                desc: "Déplacements, hébergement, restauration et frais professionnels.",
                image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80",
              },
            ]}
            bottomTitle=""
            bottomText=""
            ctaText=""
            maxWidth="max-w-6xl"
          />
          <PricingSection variant="default" />
          {/* <GestionAchatsComponentsSection /> */}
          {/* <TestimonialsSplit /> */}
          <FAQ />
        </main>
        <Footer7 />
      </div>
    </>
  );
}
