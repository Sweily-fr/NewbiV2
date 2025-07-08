import React from "react";
import { Button } from "@/src/components/ui/button";
import HeroHeader from "@/src/components/blocks/hero-header";
import { Footer7 } from "@/src/components/footer7";
import { AuroraText } from "@/src/components/magicui/aurora-text";
import Link from "next/link";
import { LogoMarquee } from "@/src/components/ui/logo-marquee";

export default function DevisPage() {
  return (
    <>
      <HeroHeader />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="min-h-screen py-20 flex flex-col justify-between">
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Text Content */}
              <div className="space-y-8">
                <h1 className="mt-8 max-w-8xl mx-auto text-balance font-semibold text-6xl md:text-7xl lg:mt-16 xl:text-[3.5rem]">
                  Envoyez vos{" "}
                  <span className="bg-gradient-to-r from-[#f43f5e] to-[#fb7185] px-2 py-1 text-white rounded-md inline-block transform -rotate-1">
                    devis
                  </span>
                  <br />
                  en un temps record
                </h1>

                <p className="mx-auto mt-8 max-w-2xl text-balance text-md">
                  Automatisez et suivez facilement votre devis. Créez, envoyez
                  et gérez vos devis en quelques clics avec notre solution
                  intuitive.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-xl px-5 text-base bg-[#f43f5e]"
                  >
                    <Link href="/dashboard/outils/devis">
                      <span className="text-nowrap">Créez votre devis</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Logo Marquee - Positioned at bottom of screen */}
          <div className="mt-auto pt-16">
            <div className="mx-auto max-w-6xl px-6 lg:px-12">
              <div className="flex flex-col items-center justify-center">
                <p className="text-md font-medium text-gray-600 mb-6">
                  +1.000 entreprises utilisent newbi pour gérer leurs devis
                </p>
                <LogoMarquee
                  logos={[
                    <div key="logo1" className="h-8 w-32 flex items-center">
                      <svg
                        viewBox="0 0 100 30"
                        className="h-full w-full text-gray-800"
                      >
                        <text x="10" y="20" className="text-lg font-bold">
                          Scaleway
                        </text>
                      </svg>
                    </div>,
                    <div key="logo2" className="h-8 w-32 flex items-center">
                      <svg
                        viewBox="0 0 100 30"
                        className="h-full w-full text-gray-800"
                      >
                        <text x="10" y="20" className="text-lg font-bold">
                          Meero
                        </text>
                      </svg>
                    </div>,
                    <div key="logo3" className="h-8 w-32 flex items-center">
                      <svg
                        viewBox="0 0 100 30"
                        className="h-full w-full text-gray-800"
                      >
                        <text x="10" y="20" className="text-lg font-bold">
                          Shapr
                        </text>
                      </svg>
                    </div>,
                    <div key="logo4" className="h-8 w-32 flex items-center">
                      <svg
                        viewBox="0 0 100 30"
                        className="h-full w-full text-gray-800"
                      >
                        <text x="10" y="20" className="text-lg font-bold">
                          Leena AI
                        </text>
                      </svg>
                    </div>,
                    <div key="logo5" className="h-8 w-32 flex items-center">
                      <svg
                        viewBox="0 0 100 30"
                        className="h-full w-full text-gray-800"
                      >
                        <text x="10" y="20" className="text-lg font-bold">
                          Eskimo
                        </text>
                      </svg>
                    </div>,
                    <div key="logo6" className="h-8 w-32 flex items-center">
                      <svg
                        viewBox="0 0 100 30"
                        className="h-full w-full text-gray-800"
                      >
                        <text x="10" y="20" className="text-lg font-bold">
                          Little Connect
                        </text>
                      </svg>
                    </div>,
                  ]}
                  speed={30}
                  pauseOnHover={true}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer7 />
    </>
  );
}
