"use client";
import { HeroSection } from "@/src/components/blocks/hero-section-1";
import FeatureGrid from "@/src/components/blocks/feature-grid";
import OutreachSection from "@/src/components/blocks/outreach";
import TestimonialsSection from "@/src/components/blocks/testimonials-section";
import FreelanceSoftwareSection from "@/src/components/blocks/FreelanceSoftwareSection";

export default function Home() {
  return (
    <div className="bg-[#FDFDFD]">
      <HeroSection />
      <FeatureGrid />
      <OutreachSection />
      <FreelanceSoftwareSection />
      <TestimonialsSection />
    </div>
  );
}
