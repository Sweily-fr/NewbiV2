"use client";
import React from "react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { KanbanAnimation } from "./KanbanAnimation";

export function HeroSection() {
  return (
    <>
      <main className="overflow-hidden">
        <section className="min-h-[80vh] lg:min-h-screen flex items-center bg-white pt-48 sm:pt-40 lg:pt-24 mb-10 lg:mb-20 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-7xl w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="space-y-4 lg:space-y-6 text-center lg:text-left">
                <h1 className="text-balance font-normal text-4xl sm:text-5xl md:text-5xl lg:text-[3.2rem] leading-tight tracking-tight">
                  Gérez vos projets avec des tableaux Kanban
                </h1>

                <h2 className="text-sm sm:text-md font-normal tracking-tight text-gray-600 dark:text-gray-300 mb-6 lg:mb-8 max-w-xl mx-auto lg:mx-0">
                  Organisez vos tâches et{" "}
                  <strong className="font-medium text-gray-900">
                    visualisez votre progression en temps réel
                  </strong>{" "}
                  avec des tableaux Kanban intuitifs.
                </h2>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 lg:pt-4 justify-center lg:justify-start">
                  <Link href="/auth/signup" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="bg-[#1D1D1B] hover:bg-[#2D2D2B] text-white font-normal rounded-lg px-6 w-full sm:w-auto"
                    >
                      Créez votre premier projet
                    </Button>
                  </Link>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-gray-500 text-xs sm:text-sm pt-2">
                    Collaboration en temps réel avec votre équipe.
                  </p>
                  <p className="text-gray-500 text-xs pt-2">
                    📊 Tableaux illimités et tâches personnalisables
                  </p>
                </div>
              </div>

              <div className="relative flex items-center justify-center lg:items-end lg:justify-end overflow-visible pt-8 lg:pt-24">
                <div className="relative w-full lg:w-[700px] xl:w-[800px] lg:-mr-32 xl:-mr-48">
                  <KanbanAnimation />
                  <div
                    className="absolute bottom-0 left-0 right-0 h-16 lg:h-22 pointer-events-none"
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
