"use client";
import { HeroSection } from "./section/hero-section";
import FeatureGrid from "./section/feature-grid";
import BusinessAgility from "./section/business-agility";
import TestimonialsSection from "./section/testimonial";
import Freelance from "./section/freelance";
import PricingSection from "./section/pricing-section";
import FAQ from "./section/faq";
import SEOHead from "@/src/components/seo/seo-head";
import { JsonLd } from "@/src/components/seo/seo-metadata";
import { useSEO } from "@/src/hooks/use-seo";

export default function Home() {
  const seoData = useSEO("home");

  return (
    <>
      <SEOHead {...seoData} />
      <JsonLd jsonLd={seoData.jsonLd} />
      <div className="bg-[#FDFDFD]">
        <HeroSection />
        <FeatureGrid />
        <BusinessAgility />
        {/* <Freelance /> */}
        {/* <TestimonialsSection /> */}
        <PricingSection />
        <FAQ />
      </div>
    </>
  );
}
