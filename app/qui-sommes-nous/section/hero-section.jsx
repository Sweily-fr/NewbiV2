"use client";
import React from "react";
import { TeamBentoGrid } from "./TeamBentoGrid";

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

            <h2 className="text-sm sm:text-md font-normal tracking-tight text-gray-600 dark:text-gray-300 mb-6 lg:mb-8 max-w-2xl mx-auto">
              Nous sommes une équipe passionnée qui croit que la gestion
              financière ne devrait pas être compliquée. Notre mission est de
              simplifier le quotidien des entrepreneurs et PME avec des outils
              intuitifs et performants.
            </h2>

            <p className="text-gray-500 text-sm pt-2 max-w-xl mx-auto">
              Depuis notre création, nous accompagnons des milliers
              d'entreprises dans leur gestion financière au quotidien.
            </p>
          </div>

          {/* Bento Grid d'images en bas sans animation */}
          <div className="relative w-full max-w-6xl mx-auto pt-8 lg:pt-12">
            <TeamBentoGrid />
          </div>
        </section>
      </main>
    </>
  );
}
