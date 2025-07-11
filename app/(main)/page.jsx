"use client";
import { HeroSection } from "./section/hero-section";
import FeatureGrid from "./section/feature-grid";
import BusinessAgility from "./section/business-agility";
import TestimonialsSection from "./section/testimonial";
import Freelance from "./section/freelance";
import PricingSection from "./section/pricing-section";

export default function Home() {
  return (
    <div className="bg-[#FDFDFD]">
      <HeroSection />
      <FeatureGrid />
      <BusinessAgility />
      <Freelance />
      <TestimonialsSection />
      <PricingSection />
    </div>
  );
}
