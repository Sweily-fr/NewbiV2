"use client";
import React from "react";
import SEOHead from "@/src/components/seo/seo-head";
import { JsonLd } from "@/src/components/seo/seo-metadata";
import { useSEO } from "@/src/hooks/use-seo";

// Import des sections depuis le dossier lp-home
import {
  NewHeroNavbar,
  HeroSection,
  TrustedBySection,
  AgentStudioSection,
  ComponentsSection,
  ComplianceSection,
  GovernanceSection,
  PricingSection,
  FeaturedOnSection,
  NewPricingSection,
  FAQSection,
} from "./new/lp-home";

export default function Home() {
  const seoData = useSEO("home");

  return (
    <>
      <SEOHead {...seoData} />
      <JsonLd jsonLd={seoData.jsonLd} />
      <NewHeroNavbar />
      <div className="bg-[#FDFDFD]">
        <HeroSection />
        <TrustedBySection />
        {/* <AgentStudioSection /> */}
        <ComponentsSection />
        {/* <ComplianceSection /> */}
        <GovernanceSection />
        {/* <NewPricingSection /> */}
        <PricingSection />
        <FeaturedOnSection />
        <FAQSection />
      </div>
    </>
  );
}
