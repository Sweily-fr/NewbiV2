"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import HeroAnimation from "./hero-animation";
import { TrustedCompaniesSection } from "@/src/components/trusted-companies-section";

export function HeroSection() {
  return (
    <>
      <main className="overflow-hidden">
        <section className="h-[90vh] md:h-[98vh] flex flex-col justify-between bg-gradient-to-t from-[#fce8e6] via-[#f8f9fc] to-[#f0f4ff] rounded-[15px] md:rounded-[18px] lg:rounded-[18px] shadow-xs mx-2 mt-2">
          <div className="flex-1 flex items-center justify-center">
            <HeroAnimation />
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center pb-12 md:pb-16 gap-4 px-6 sm:px-4">
            <div className="bg-[#fff]/1 rounded-[10px] border p-0.5 w-full sm:w-auto max-w-xs sm:max-w-none">
              <Button
                asChild
                size="lg"
                variant="default"
                className="px-6 py-3 text-base font-normal cursor-pointer w-full sm:w-auto"
              >
                <a href="/auth/signup" className="text-nowrap">
                  Commencez gratuitement
                </a>
              </Button>
            </div>
            <div className="bg-[#fff]/1 rounded-[10px] border p-0.5 w-full sm:w-auto max-w-xs sm:max-w-none">
              <Button
                asChild
                size="lg"
                variant="outline"
                className="px-6 py-3 text-base font-normal cursor-pointer w-full sm:w-auto"
              >
                <a href="/#pricing" className="text-nowrap">
                  Tarifs
                </a>
              </Button>
            </div>
          </div>
        </section>
        <TrustedCompaniesSection />
      </main>
    </>
  );
}
