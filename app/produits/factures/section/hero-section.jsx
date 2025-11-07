"use client";
import React from "react";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { TrustedCompaniesSection } from "@/src/components/trusted-companies-section";

export function HeroSection() {
  return (
    <>
      <main className="overflow-hidden">
        <section className="h-[120vh] flex flex-col bg-[#f0f4ff]/70 rounded-[15px] md:rounded-[18px] lg:rounded-[18px] shadow-xs mx-2 mt-2 pt-20">
          <div className="flex-1 flex flex-col items-center justify-center relative w-full px-4 md:px-8 pt-8 md:pt-16">
            <div className="flex flex-col items-center justify-center z-10 gap-6 max-w-4xl text-center">
              <h1 className="max-w-4xl text-center mx-auto text-balance font-medium font-Poppins text-3xl md:text-7xl xl:text-[2.7rem] font-['Poppins'] leading-tight">
                L’outil de <span className="text-[#5B4FFF]">facturation</span>{" "}
                qui génère vraiment des{" "}
                <span className="text-[#5B4FFF]">paiements</span>
              </h1>
              <span className="text-[#2E2E2E] max-w-xl text-center block">
                Automatisez, relancez et encaissez plus vite : simplifiez votre
                gestion, boostez votre trésorerie.
              </span>
              <div className="flex justify-center gap-4 mt-2">
                <div className="bg-[#fff]/1 rounded-[10px] border p-0.5">
                  <Button size="lg" variant="default" className="group">
                    <>
                      <a href="/auth/signup" className="text-nowrap">
                        Essayer GRATUITEMENT !
                      </a>
                      <ArrowRightIcon
                        className="-me-1 opacity-60 transition-transform group-hover:translate-x-0.5"
                        size={16}
                        aria-hidden="true"
                      />
                    </>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="relative -mr-56 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
            <div
              aria-hidden
              className="bg-gradient-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
            />
            <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-6xl overflow-hidden rounded-2xl border shadow-lg shadow-zinc-950/15 ring-1">
              <img
                className="bg-background w-full h-auto relative hidden rounded-2xl dark:block"
                src="/images/lp-factures/Factures.jpg"
                alt="app screen"
                width="2700"
                height="1440"
              />
              <img
                className="z-2 border-border/25 w-full h-auto relative rounded-2xl border dark:hidden"
                src="/images/lp-factures/Factures.jpg"
                alt="app screen"
                width="2700"
                height="1440"
              />
            </div>
          </div>
        </section>
        <TrustedCompaniesSection />
      </main>
    </>
  );
}
