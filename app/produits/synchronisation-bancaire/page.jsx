import React from "react";
import { NewHeroNavbar } from "@/app/(main)/new/lp-home/NewHeroNavbar";
import Footer7 from "@/src/components/footer7";
import { HeroSection } from "./section/hero-section";
import { Poppins } from "next/font/google";
import FAQ from "./section/faq";
import { generateNextMetadata } from "@/src/utils/seo-data";
import { SynchronisationBanner } from "./section/SynchronisationBanner";
import TrustedBySection from "@/app/(main)/new/lp-home/TrustedBySection";
import SynchronisationComponentsSection from "./section/SynchronisationComponentsSection";
import { TestimonialsSplit } from "./section/TestimonialsSplit";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata = generateNextMetadata("synchronisation-bancaire");

export default function SynchronisationBancairePage() {
  return (
    <>
      <div className={`${poppins.variable} font-poppins`}>
        {/* <SynchronisationBanner /> */}
        <NewHeroNavbar hasBanner={false} />
        <main>
          <HeroSection />
          <TrustedBySection />
          <SynchronisationComponentsSection />
          <TestimonialsSplit />
          <FAQ />
        </main>
        <Footer7 />
      </div>
    </>
  );
}
