"use client";
import React from "react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup } from "@/src/components/ui/avatar";
import { KanbanBoard } from "./KanbanBoard";

export function HeroSection() {
  return (
    <>
      <main className="overflow-hidden">
        <section className="lg:min-h-screen flex items-start lg:items-center bg-white pt-44 sm:pt-48 lg:pt-24 mb-6 lg:mb-20 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-6xl w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="space-y-4 lg:space-y-6 text-center lg:text-left">
                <h1 className="text-balance font-medium text-4xl sm:text-5xl md:text-5xl lg:text-[3.5rem] leading-tight tracking-tight">
                  Gérez vos projets visuellement, sans effort
                </h1>

                <h2 className="text-base sm:text-lg font-normal tracking-tight text-gray-600 dark:text-gray-300 mb-6 lg:mb-8 max-w-md mx-auto lg:mx-0">
                  Organisez vos tâches en colonnes,{" "}
                  <strong className="font-medium text-gray-900">
                    suivez l&apos;avancement en temps réel
                  </strong>{" "}
                  et gardez le contrôle sur chaque projet d&apos;un seul coup d&apos;œil.
                </h2>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 lg:pt-4 justify-center lg:justify-start">
                  <Link href="/auth/signup" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="bg-[#1D1D1B] hover:bg-[#2D2D2B] text-white font-normal rounded-lg px-6 w-full sm:w-auto"
                    >
                      Essayer 30 jours offerts
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-2 pt-2 justify-center lg:justify-start">
                  <AvatarGroup>
                    <Avatar className="size-7 border-2 border-white">
                      <AvatarImage src="https://i.pravatar.cc/56?img=1" />
                      <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                    <Avatar className="size-7 border-2 border-white">
                      <AvatarImage src="https://i.pravatar.cc/56?img=5" />
                      <AvatarFallback>B</AvatarFallback>
                    </Avatar>
                    <Avatar className="size-7 border-2 border-white">
                      <AvatarImage src="https://i.pravatar.cc/56?img=8" />
                      <AvatarFallback>C</AvatarFallback>
                    </Avatar>
                    <Avatar className="size-7 border-2 border-white">
                      <AvatarImage src="https://i.pravatar.cc/56?img=12" />
                      <AvatarFallback>D</AvatarFallback>
                    </Avatar>
                  </AvatarGroup>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    Collaboration en temps réel avec votre équipe.
                  </p>
                </div>
                <p className="text-gray-400 text-xs pt-3 text-center lg:text-left">
                  Plusieurs entreprises nous font déjà confiance · Collaboration illimitée
                </p>
              </div>

              <div className="relative flex items-center justify-center lg:items-end lg:justify-end pt-8 lg:pt-4 lg:overflow-visible overflow-hidden -mb-[250px] sm:-mb-[200px] lg:mb-0">
                <div className="relative w-[900px] xl:w-[950px] lg:-mr-64 xl:-mr-80 scale-[0.45] sm:scale-[0.55] lg:scale-[0.85] origin-top-left lg:origin-top -translate-x-[15%] sm:-translate-x-[10%] lg:translate-x-0" style={{ translateY: "30px", transformOrigin: "top right" }}>
                  <KanbanBoard />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
