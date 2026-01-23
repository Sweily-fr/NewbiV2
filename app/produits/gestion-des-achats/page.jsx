import React from "react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { HeroSection } from "./section/hero-section";
import { Poppins } from "next/font/google";
import FAQ from "./section/faq";
import { generateNextMetadata } from "@/src/utils/seo-data";
import TrustedBySection from "@/app/(main)/new/lp-home/TrustedBySection";
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
          <TrustedBySection />
          <GestionAchatsComponentsSection />
          <TestimonialsSplit />
          <FAQ />
        </main>
        <Footer7 />
      </div>
    </>
  );
}
