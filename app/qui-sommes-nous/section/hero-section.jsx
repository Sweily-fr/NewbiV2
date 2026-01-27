"use client";
import React from "react";
import { TeamBentoGrid } from "./TeamBentoGrid";
import { OurStorySection } from "./OurStorySection";

export function HeroSection() {
  return (
    <>
      <main className="overflow-hidden">
        <section className="min-h-[80vh] lg:min-h-screen flex flex-col items-center bg-white pt-32 sm:pt-28 lg:pt-38 pb-0 mb-10 lg:mb-20 px-4 sm:px-6 lg:px-12">
          {/* Contenu texte centré */}
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-balance font-normal text-4xl sm:text-5xl md:text-5xl lg:text-[3.2rem] leading-tight tracking-tight">
              Simplifier la gestion financière des entrepreneurs
            </h1>

            <h2 className="text-md font-normal tracking-tight text-gray-600 dark:text-gray-300 mx-auto mb-8 max-w-3xl">
              Nous sommes une équipe passionnée qui croit que la gestion
              financière ne devrait pas être compliquée. Notre mission est de
              simplifier le quotidien des entrepreneurs et PME avec des outils
              intuitifs et performants.
            </h2>
          </div>

          {/* Bento Grid d'images en bas sans animation */}
          <div className="relative w-full max-w-6xl mx-auto pt-8 lg:pt-12">
            <TeamBentoGrid />
          </div>
        </section>

        {/* Section Notre Histoire */}
        <OurStorySection />
      </main>
    </>
  );
}
