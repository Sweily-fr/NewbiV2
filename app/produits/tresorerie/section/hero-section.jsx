"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { TresorerieAnimation } from "./TresorerieAnimation";
import { Smartphone } from "lucide-react";

export function HeroSection() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calcul de la rotation et de la position basées sur le scroll
  const maxScroll = 400;
  const progress = Math.min(scrollY / maxScroll, 1);
  const rotation = 8 * (1 - progress); // De 8deg à 0deg
  const translateY = 100 * (1 - progress); // De 100px à 0px

  return (
    <>
      <main className="overflow-hidden">
        <section className="min-h-screen flex flex-col items-center bg-white pt-38 pb-0 mb-20 px-6 lg:px-12">
          {/* Contenu texte centré */}
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-balance font-normal text-4xl md:text-5xl lg:text-[3.2rem] leading-tight tracking-tight">
              Solution de gestion de trésorerie pour votre entreprise
            </h1>

            <p className="text-md font-normal tracking-tight text-gray-600 max-w-3xl mx-auto">
              Obtenez la clarté financière nécessaire pour prendre des décisions
              stratégiques grâce à des graphiques prêts à l'analyse, plusieurs
              scénarios de prévision, et une intégration en temps réel.
            </p>

            {/* Boutons CTA */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-[#1D1D1B] hover:bg-[#2D2D2B] text-white font-normal rounded-lg px-6"
                >
                  Essayer gratuitement
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-300 text-gray-900 rounded-lg px-6"
                >
                  Demander une demo
                </Button>
              </Link>
            </div>

            <p className="text-gray-500 text-sm pt-2">
              Essayer 14 jours gratuit
            </p>

            <p className="text-gray-600 text-sm flex items-center justify-center gap-2">
              <Smartphone />
              Sur web ou mobile, suivez en temps réel vos indicateurs
            </p>
          </div>

          {/* Animation SVG en bas avec inclinaison */}
          <div className="relative w-full max-w-6xl mx-auto pt-8">
            <div
              className="relative transition-transform duration-300 ease-out"
              style={{
                transform: `perspective(1000px) rotateX(${rotation}deg) translateY(${translateY}px)`,
              }}
            >
              <TresorerieAnimation />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
