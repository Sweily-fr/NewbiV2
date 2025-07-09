"use client";
import { HeroSection } from "@/src/components/blocks/hero-section-1";
import FeatureGrid from "@/src/components/blocks/feature-grid";
import OutreachSection from "@/src/components/blocks/outreach";
import TestimonialsSection from "@/src/components/blocks/testimonials-section";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeatureGrid />
      <TestimonialsSection />
      {/* <OutreachSection /> */}
    </>
  );
}
