import React from "react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { BlogFurtherReading } from "@/src/components/blog/blog-further-reading";
import { HeroSection } from "./section/hero-section";
import { Poppins } from "next/font/google";
import FAQ from "./section/faq";
import { generateNextMetadata } from "@/src/utils/seo-data";
import TrustedBySection from "@/app/(main)/new/lp-home/TrustedBySection";
import AchatsGovernanceSection from "./section/AchatsGovernanceSection";
import MetiersPhotoSection from "./section/MetiersPhotoSection";
import CommentCaMarcheSection from "./section/CommentCaMarcheSection";
import LpTestimonials from "@/app/lp/_components/LpTestimonials";
import HomePricingSection from "@/app/(main)/new/lp-home/HomePricingSection";
import LpFinalCta from "@/app/lp/_components/LpFinalCta";
import GestionAchatsComponentsSection from "./section/GestionAchatsComponentsSection";
import { TestimonialsSplit } from "./section/TestimonialsSplit";
import { JsonLd } from "@/src/components/seo/json-ld";
import { productJsonLd } from "@/src/lib/product-jsonld";

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
      {/* Données structurées : application + fil d'Ariane, rendues côté serveur */}
      <JsonLd data={productJsonLd("gestion-des-achats")} />
      <div className={`${poppins.variable} font-poppins`}>
        <NewHeroNavbar />
        <main>
          {/* Hero Section */}
          <HeroSection />
          <TrustedBySection variant="default" />
          <AchatsGovernanceSection />
          <CommentCaMarcheSection />
          <HomePricingSection
            maxWidth="max-w-7xl"
            className="pt-10 md:pt-20 lg:pt-22 pb-0"
          />
          <MetiersPhotoSection />
          {/* Mêmes avis que la home, sur la largeur des autres sections */}
          <LpTestimonials
            maxWidth="max-w-7xl"
            className="mt-10 md:mt-20 lg:mt-22"
          />
          {/* Même bannière que sur /produits/factures et /produits/tresorerie */}
          <LpFinalCta
            title={
              <>
                Passe à la facturation
                <br className="hidden md:block" /> électronique sans stress
              </>
            }
            subtitle="Crée ton compte, envoie ta première facture électronique aujourd'hui. Tu as 30 jours pour tester, sans carte bancaire."
            image="/lp/facturation-electronique/cta-laptop.jpg"
            imageAlt="Un indépendant consulte ses factures clients dans Newbi sur son ordinateur portable"
            maxWidth="max-w-7xl"
            className="pt-10 md:pt-20 lg:pt-22 pb-0 md:pb-0"
          />
          {/* <GestionAchatsComponentsSection /> */}
          {/* <TestimonialsSplit /> */}
          <FAQ />
        </main>
        <BlogFurtherReading product="gestion-des-achats" />
        <Footer7 />
      </div>
    </>
  );
}
