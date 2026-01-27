"use client";
import React from "react";
import Image from "next/image";

export function OurStorySection() {
  return (
    <section className="py-24 lg:py-32 w-full bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-7 lg:gap-12 items-center">
          {/* Image à gauche */}
          <div className="col-span-1 lg:col-span-4 h-[400px] lg:h-[500px] rounded-2xl overflow-hidden">
            <Image
              src="/lp/about/about-5.jpeg"
              alt="L'équipe Newbi - Notre histoire"
              fill
              className="!relative h-full w-full object-cover"
              sizes="(max-width: 768px) 100vw, 60vw"
            />
          </div>

          {/* Contenu à droite */}
          <div className="col-span-1 lg:col-span-3 space-y-6 lg:pl-8">
            <span className="text-sm font-medium text-primary uppercase tracking-wider mb-4 block">
              Notre histoire
            </span>

            <h2 className="text-md font-normal tracking-tight text-gray-600 dark:text-gray-300 leading-relaxed mt-6">
              Tout a commencé avec Sweily, notre agence web. Cinq passionnés,
              cinq expertises différentes, une même vision : simplifier la vie
              des entrepreneurs.
            </h2>

            <p className="text-sm text-gray-500 leading-relaxed">
              En tant qu'entrepreneurs nous-mêmes, nous avons rapidement été
              confrontés à une réalité frustrante : jongler entre la facturation,
              les devis, la gestion de trésorerie, le suivi client, les outils
              de productivité... Autant de tâches chronophages qui nous éloignaient
              de notre cœur de métier.
            </p>

            <p className="text-sm text-gray-500 leading-relaxed">
              C'est de ce constat qu'est née l'idée de Newbi. Notre mission ?
              Créer une solution tout-en-un qui libère les entrepreneurs de la
              complexité administrative, pour qu'ils puissent se concentrer
              pleinement sur ce qu'ils font de mieux : développer leur activité.
            </p>

            <div className="flex flex-col justify-between gap-4 pt-2 lg:flex-row lg:items-center">
              <p className="flex-1 text-xs text-gray-400 italic">
                "Nous croyons qu'entreprendre devrait être une aventure passionnante,
                pas une bataille administrative."
              </p>
              <div className="flex w-fit items-center gap-3">
                <div className="size-10 rounded-full overflow-hidden">
                  <Image
                    src="/lp/about/about-11.jpeg"
                    alt="L'équipe Sweily"
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium tracking-tight">L'équipe Sweily</h3>
                  <p className="text-xs text-gray-400">Fondateurs de Newbi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
