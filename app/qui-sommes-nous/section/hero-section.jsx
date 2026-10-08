import React from "react";
import { TeamBentoGrid } from "./TeamBentoGrid";

// Même disposition que le hero des LP produits : le texte centré sur toute la
// largeur du conteneur, puis le visuel en dessous.
export function HeroSection() {
  return (
    <div className="relative w-full overflow-x-clip bg-white px-5 pb-6 md:pb-10 lg:pb-16">
      <div className="max-w-7xl mx-auto relative">
        {/* Pas de gouttière horizontale : tous les enfants occupent les douze
            colonnes, et `gap-x-24` donnait onze gouttières de 96 px — 1 056 px
            dans un conteneur de 728 px — ce qui faisait sortir le titre du
            cadre entre 768 et 1 023 px. */}
        <div className="grid grid-cols-12 pt-40 md:pt-36 lg:pt-44">
          <div className="col-span-12 text-center">
            <h1 className="text-balance font-semibold text-[2.75rem] sm:text-[3.5rem] md:text-[4.25rem] lg:text-[4.5rem] leading-[1.1] tracking-tight text-[#0d0d0d] mb-6">
              L&apos;équipe qui simplifie la gestion des indépendants
            </h1>
          </div>

          <div className="col-span-12 lg:col-span-10 lg:col-start-2 text-center">
            <p className="text-lg md:text-xl font-normal tracking-tight text-gray-600 mx-auto mb-0 max-w-3xl">
              Newbi est né d&apos;une agence web française qui en avait assez de
              jongler entre dix outils pour facturer, relancer et suivre sa
              trésorerie. Nous construisons aujourd&apos;hui{" "}
              <strong className="font-medium text-gray-900">
                le logiciel que nous voulions avoir
              </strong>{" "}
              — pour les indépendants et les TPE.
            </p>
          </div>

          {/* Mosaïque de l'équipe, sous le texte */}
          <div className="col-span-12 mt-10 md:mt-14">
            <TeamBentoGrid />
          </div>
        </div>
      </div>
    </div>
  );
}
