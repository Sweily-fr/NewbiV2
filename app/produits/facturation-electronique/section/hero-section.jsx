"use client";
import React from "react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { FacturationElectroniqueAnimation } from "./FacturationElectroniqueAnimation";
import { FacturesAnimationIphone } from "./Facturesanimationiphone";

export function HeroSection() {
  return (
    <>
      <main className="overflow-hidden">
        <section className="min-h-0 lg:min-h-screen flex items-center bg-white pt-28 sm:pt-32 lg:pt-24 mb-6 lg:mb-20 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-6xl w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Contenu texte à gauche */}
              <div className="space-y-4 lg:space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-lg bg-[#cdcaff] text-[#1D1D1B] px-3 py-1.5 text-sm font-semibold relative overflow-hidden">
                  <span className="relative z-10">Facturation électronique 100% conforme</span>
                  <div
                    className="absolute inset-0 z-0"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
                      backgroundSize: "200% 100%",
                      animation: "shineTag 3s ease-in-out infinite",
                    }}
                  />
                  <style>{`
                    @keyframes shineTag {
                      0% { background-position: 200% 0; }
                      100% { background-position: -200% 0; }
                    }
                  `}</style>
                </div>
                <h1 className="text-balance font-medium text-4xl sm:text-5xl md:text-5xl lg:text-[3.5rem] leading-tight tracking-tight">
                  Votre facturation conforme, sans effort
                </h1>

                <h2 className="text-base sm:text-lg font-normal tracking-tight text-gray-600 dark:text-gray-300 mb-6 lg:mb-8 max-w-md mx-auto lg:mx-0">
                  Anticipez la réforme 2026.{" "}
                  <strong className="font-medium text-gray-900">
                    Conformité garantie
                  </strong>{" "}
                  avec les nouvelles obligations légales.
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
                  Plusieurs entreprises nous font déjà confiance · Incluse dans toutes les offres Newbi
                </p>
              </div>

              {/* Animation SVG à droite */}
              <div className="hidden lg:flex relative items-end justify-end overflow-visible pt-24">
                <div className="relative w-[700px] xl:w-[800px] -mr-48 xl:-mr-64">
                  <FacturationElectroniqueAnimation />

                  {/* iPhone Animation en bas à gauche */}
                  <div className="absolute -bottom-8 -left-10 xl:-left-15 w-[160px] xl:w-[180px] z-50">
                    <FacturesAnimationIphone />
                    <div
                      className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(to top, #ffffff 0%, #ffffff 40%, transparent 100%)",
                      }}
                    />
                  </div>

                  {/* Gradient flou en bas du Mac */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-22 pointer-events-none z-40"
                    style={{
                      background:
                        "linear-gradient(to top, #ffffff 0%, #ffffff 40%, transparent 100%)",
                    }}
                  />

                  {/* Badge facturation électronique */}
                  <Link
                    href="/produits/facturation-electronique"
                    className="absolute -top-8 left-1/3 z-50 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex items-center px-2 py-1.5 gap-2 hover:shadow-md transition-shadow"
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
