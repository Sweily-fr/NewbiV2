"use client";
import React from "react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";

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
                  Vos achats et dépenses, sous contrôle
                </h1>

                <h2 className="text-base sm:text-lg font-normal tracking-tight text-gray-600 dark:text-gray-300 mb-6 lg:mb-8 max-w-md mx-auto lg:mx-0">
                  Centralisez vos fournisseurs et factures d&apos;achat.{" "}
                  <strong className="font-medium text-gray-900">
                    Suivez vos dépenses en temps réel
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
                  Plusieurs entreprises nous font déjà confiance · OCR et scan de justificatifs inclus
                </p>
              </div>

              {/* Image à droite */}
              <div className="relative flex items-center justify-center lg:items-end lg:justify-end pt-8 lg:pt-24 lg:overflow-visible">
                <div className="relative w-full lg:w-[1000px] xl:w-[1100px] lg:-mr-96 xl:-mr-[28rem] scale-[1.7] sm:scale-[1.5] lg:scale-100 origin-top translate-x-[45%] sm:translate-x-[25%] lg:translate-x-0">
                  <div className="relative rounded-lg lg:rounded-[2rem] overflow-hidden" style={{ border: "4px solid #2F2F2D" }}>
                    <img
                      src="/images/gestion-achats-hero.png"
                      alt="Gestion des achats Newbi"
                      className="w-full h-auto"
                    />
                  </div>
                  {/* Gradient flou en bas */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-36 lg:h-22 pointer-events-none z-10"
                    style={{
                      background:
                        "linear-gradient(to top, #ffffff 0%, #ffffff 50%, rgba(255,255,255,0.7) 75%, transparent 100%)",
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
