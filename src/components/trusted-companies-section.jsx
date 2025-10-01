"use client";
import React from "react";
import { ChevronRight } from "lucide-react";
import { getAssetUrl } from "@/src/lib/image-utils";

/**
 * Section "Ils nous font confiance" - Composant réutilisable
 * Affiche une grille de logos d'entreprises avec effet hover
 */
export function TrustedCompaniesSection() {
  const companies = [
    { name: "new3dge", alt: "Entreprise 1" },
    { name: "awayout", alt: "Entreprise 2" },
    { name: "cgs", alt: "Entreprise 3" },
    { name: "mardy", alt: "Entreprise 4" },
    { name: "heritage", alt: "Entreprise 5" },
    { name: "smefrance", alt: "Entreprise 6" },
    { name: "skyevent", alt: "Entreprise 7" },
    { name: "new3dge", alt: "Entreprise 1" }, // Répétition pour remplir la grille
  ];

  return (
    <section className="bg-background pb-10 pt-10 md:pb-32">
      <div className="group relative m-auto max-w-5xl px-6">
        <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
          <div className="block text-sm duration-150 hover:opacity-75">
            <span>Ils nous font confiance</span>
            <ChevronRight className="ml-1 inline-block size-3" />
          </div>
        </div>
        <div className="group-hover:blur-xs mx-auto mt-12 grid max-w-2xl grid-cols-4 gap-x-12 transition-all duration-500 group-hover:opacity-50 sm:gap-x-16 sm:gap-y-14">
          {companies.map((company, index) => (
            <div key={`${company.name}-${index}`} className="flex">
              <img
                className="mx-auto w-fit filter grayscale opacity-30 hover:opacity-90 transition-opacity"
                src={getAssetUrl(`Logo company/${company.name}.png`)}
                alt={company.alt}
                height="10"
                width="auto"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
