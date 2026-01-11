"use client";
import React from "react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { GestionAchatsAnimation } from "./GestionAchatsAnimation";

export function HeroSection() {
  return (
    <>
      <main className="overflow-hidden">
        <section className="min-h-screen flex items-center bg-white pt-24 mb-20 px-6 lg:px-12">
          <div className="mx-auto max-w-7xl w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Contenu texte à gauche */}
              <div className="space-y-6">
                <h1 className="text-balance font-normal text-4xl md:text-5xl lg:text-[3.2rem] leading-tight tracking-tight">
                  Optimisez la gestion de vos achats
                </h1>

                <h2 className="text-md font-normal tracking-tight text-gray-600 dark:text-gray-300 mx-auto mb-8 max-w-3xl">
                  Centralisez vos fournisseurs, commandes et factures d'achat.{" "}
                  <strong className="font-medium text-gray-900">
                    Suivez vos dépenses et optimisez votre trésorerie
                  </strong>{" "}
                  depuis une seule interface.
                </h2>

                {/* Boutons CTA */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link href="/auth/signup">
                    <Button
                      size="lg"
                      className="bg-[#1D1D1B] hover:bg-[#2D2D2B] text-white font-normal rounded-lg px-6"
                    >
                      Démarrer maintenant
                    </Button>
                  </Link>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-gray-500 text-sm pt-2">
                    Gestion des achats incluse sans surcoût dans toutes les
                    offres newbi.
                  </p>
                  <p className="text-gray-500 text-xs pt-2">
                    🇫🇷 newbi, votre partenaire gestion d'entreprise
                  </p>
                </div>
              </div>

              {/* Animation SVG à droite */}
              <div className="relative flex items-end justify-end overflow-visible pt-24">
                <div className="relative w-[700px] xl:w-[800px] -mr-32 xl:-mr-48">
                  <GestionAchatsAnimation />
                  {/* Gradient flou en bas */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-22 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to top, #ffffff 0%, #ffffff 40%, transparent 100%)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
