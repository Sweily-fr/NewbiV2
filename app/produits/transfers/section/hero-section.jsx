"use client";
import React from "react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { DragDropAnimation } from "./DragDropAnimation";
import { MobileDragDropAnimation } from "./MobileDragDropAnimation";

export function HeroSection() {
  return (
    <>
      <main className="overflow-hidden">
        <section className="lg:min-h-screen flex items-start lg:items-center bg-white pt-44 sm:pt-48 lg:pt-24 mb-6 lg:mb-20 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-6xl w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="space-y-4 lg:space-y-6 text-center lg:text-left">
                <h1 className="text-balance font-medium text-4xl sm:text-5xl md:text-5xl lg:text-[3.5rem] leading-tight tracking-tight">
                  Envoyez vos fichiers volumineux, simplement
                </h1>

                <h2 className="text-base sm:text-lg font-normal tracking-tight text-gray-600 dark:text-gray-300 mb-6 lg:mb-8 max-w-md mx-auto lg:mx-0">
                  Envoyez des fichiers volumineux en quelques secondes.{" "}
                  <strong className="font-medium text-gray-900">
                    Sécurisé, simple et ultra-rapide
                  </strong>{" "}
                  pour tous vos partages professionnels.
                </h2>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 lg:pt-4 justify-center lg:justify-start">
                  <Link href="/auth/signup" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="bg-[#1D1D1B] hover:bg-[#2D2D2B] text-white font-normal text-base rounded-lg px-6 w-full sm:w-auto"
                    >
                      Essayer 30 jours offerts
                    </Button>
                  </Link>
                </div>
                <p className="text-gray-400 text-xs pt-3 text-center lg:text-left">
                  Plusieurs entreprises nous font déjà confiance · Jusqu&apos;à 5 Go par fichier
                </p>
              </div>

              {/* Mobile: image + animation overlay */}
              <div className="lg:hidden relative pt-8 overflow-hidden">
                <img
                  src="/lp/transfers/transfers-hero.png"
                  alt="Transfert de fichiers Newbi"
                  className="w-[250%] max-w-none -ml-[15%]"
                />
                {/* Animation positionnée sur la zone upload de l'image */}
                <div className="absolute -top-[4%] left-[38%] w-[42%] z-20">
                  <MobileDragDropAnimation />
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 h-36 pointer-events-none z-10"
                  style={{
                    background: "linear-gradient(to top, #ffffff 0%, #ffffff 40%, transparent 100%)",
                  }}
                />
              </div>

              {/* Desktop: image + animation */}
              <div className="hidden lg:flex relative items-end justify-end overflow-visible pt-4">
                <div className="relative w-[1600px] xl:w-[1700px] -mr-96 xl:-mr-[28rem]">
                  <img src="/lp/transfers/transfers-hero.png" alt="Transfert de fichiers Newbi" className="w-full h-auto relative z-10" />

                  {/* Zone upload overlay */}
                  <div className="absolute top-[6%] left-[9%] w-[44%] h-[48%] flex items-center justify-center z-20">
                    <div className="upload-zone-inner w-[80%] h-[70%] border border-dashed border-neutral-300 rounded-xl flex flex-col items-center justify-center gap-2.5 bg-white/50 relative">
                      <div className="upload-zone-content flex flex-col items-center justify-center gap-2.5">
                        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                          </svg>
                        </div>
                        <p className="text-[10px] font-medium text-neutral-700 text-center">Glissez-déposez vos fichiers<br />ou cliquez pour sélectionner</p>
                        <p className="text-[7px] text-neutral-400 text-center">Taille maximale : 5GB par fichier · Tous formats acceptés</p>
                        <p className="text-[6px] text-neutral-400">Tous les fichiers · Max 10 fichiers · Up to 5 GB</p>
                      </div>
                    </div>
                  </div>

                  {/* Drag & drop animation overlay */}
                  <DragDropAnimation />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
