"use client";
import React from "react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { FacturesAnimation } from "./FacturesAnimation";

export function HeroSection() {
  return (
    <>
      <main className="overflow-hidden">
        <section className="lg:min-h-screen flex items-start lg:items-center bg-white pt-44 sm:pt-48 lg:pt-24 mb-6 lg:mb-20 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-6xl w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Contenu texte à gauche */}
              <div className="space-y-4 lg:space-y-6 text-center lg:text-left">
                <h1 className="text-balance font-medium text-4xl sm:text-5xl md:text-5xl lg:text-[3.5rem] leading-tight tracking-tight">
                  Créez vos factures en quelques clics
                </h1>

                <h2 className="text-base sm:text-lg font-normal tracking-tight text-gray-600 dark:text-gray-300 mb-6 lg:mb-8 max-w-md mx-auto lg:mx-0">
                  Créez et gérez vos factures en un clic.{" "}
                  <strong className="font-medium text-gray-900">
                    Suivez vos paiements et relancez vos clients
                  </strong>{" "}
                  depuis une seule interface.
                </h2>

                {/* Boutons CTA */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 lg:pt-4 justify-center lg:justify-start">
                  <Link href="/auth/signup" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="bg-[#1D1D1B] hover:bg-[#2D2D2B] text-white font-normal text-base rounded-lg px-6 w-full sm:w-auto"
                    >
                      Essayer 30 jours offerts
                    </Button>
                  </Link>
                  <Link href="https://meet.brevo.com/sweily/newbi" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      variant="outline"
                      className="font-normal text-base rounded-lg px-6 w-full sm:w-auto"
                    >
                      Demander une démo
                    </Button>
                  </Link>
                </div>
                <p className="text-gray-400 text-xs pt-3 text-center lg:text-left">
                  Plusieurs entreprises nous font déjà confiance · Conforme facturation électronique 2026
                </p>
              </div>

              {/* Animation SVG */}
              <div className="relative flex items-center justify-center lg:items-end lg:justify-end pt-8 lg:pt-24 lg:overflow-visible">
                <div className="relative w-full lg:w-[700px] xl:w-[800px] lg:-mr-64 xl:-mr-80 scale-[1.7] sm:scale-[1.5] lg:scale-100 origin-top translate-x-[45%] sm:translate-x-[25%] lg:translate-x-0">
                  <FacturesAnimation />
                  {/* Gradient flou en bas */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-48 lg:h-22 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to top, #ffffff 0%, #ffffff 55%, rgba(255,255,255,0.8) 75%, transparent 100%)",
                    }}
                  />
                  {/* Card logo facturation électronique */}
                  <Link
                    href="/produits/facturation-electronique"
                    className="absolute bottom-16 -left-14 z-50 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hidden lg:flex items-center px-2 py-1.5 gap-2 hover:shadow-md transition-shadow"
                  >
                    <img
                      src="/logo_Compatible_Facturation_electronique-footer.png"
                      alt="Conforme Facturation électronique 2026"
                      className="h-20 w-auto object-contain"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
