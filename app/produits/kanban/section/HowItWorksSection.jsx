"use client";
import React from "react";
import { Kanban, LayoutList, GanttChart } from "lucide-react";
import Link from "next/link";

export default function HowItWorksSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 relative overflow-hidden">
      <div className="max-w-6xl px-4 mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5851ff] mb-3">
            3 VUES, 1 SEUL OUTIL
          </span>
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance text-gray-950 mb-4">
            Pilotez vos projets comme vous voulez
          </h2>
          <p className="text-md font-normal tracking-tight text-gray-600 mx-auto max-w-2xl">
            Passez d&apos;une vue à l&apos;autre en un clic selon vos besoins.
          </p>
        </div>

        {/* Grid: 1 large left + 2 stacked right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card 1 — Large left */}
          <div className="bg-[#F8F9FA] rounded-3xl p-8 flex flex-col justify-between lg:min-h-[650px] relative lg:overflow-hidden">
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-950 mb-2">
                Vue Board
              </h3>
              <p className="text-base text-gray-600 max-w-md mb-6">
                Visualisez l&apos;avancement de vos tâches en colonnes. Glissez-déposez pour mettre à jour le statut en un instant.
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium text-white bg-[#212121] hover:bg-[#333333] transition-colors"
              >
                Essayer le Board
              </Link>
            </div>
            {/* Board screenshot */}
            <div className="relative mt-6 -mx-4 lg:absolute lg:bottom-0 lg:right-0 lg:mt-0 lg:mx-0 lg:w-[150%] lg:translate-x-[40%] lg:translate-y-[15%]">
              <img
                src="/images/kanban-board-screenshot.png"
                alt="Vue Board Newbi"
                className="w-full h-auto rounded-xl lg:rounded-tl-xl shadow-lg"
              />
            </div>
          </div>

          {/* Right column: 2 stacked cards */}
          <div className="flex flex-col gap-4">
            {/* Card 2 — List */}
            <div className="bg-[#F8F9FA] rounded-3xl p-8 flex-1 flex flex-col justify-between lg:overflow-hidden relative">
              <div>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-950 mb-2">
                  Vue Liste
                </h3>
                <p className="text-sm text-gray-600 max-w-sm">
                  Affichez toutes vos tâches en tableau avec statut, priorité, assigné et échéance.
                </p>
              </div>
              <div className="relative mt-4 -mx-4 lg:absolute lg:bottom-0 lg:right-0 lg:mt-0 lg:mx-0 lg:w-[150%] lg:translate-x-[45%] lg:translate-y-[65%]">
                <img
                  src="/images/kanban-list-screenshot.png"
                  alt="Vue Liste Newbi"
                  className="w-full h-auto rounded-tl-xl shadow-lg"
                />
              </div>
            </div>

            {/* Card 3 — Gantt */}
            <div className="bg-[#F8F9FA] rounded-3xl p-8 flex-1 flex flex-col justify-between lg:overflow-hidden relative">
              <div>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-950 mb-2">
                  Vue Gantt
                </h3>
                <p className="text-sm text-gray-600 max-w-sm">
                  Planifiez vos projets sur une timeline et visualisez les dépendances entre les tâches.
                </p>
              </div>
              <div className="relative mt-4 -mx-4 lg:absolute lg:bottom-0 lg:right-0 lg:mt-0 lg:mx-0 lg:w-[150%] lg:translate-x-[45%] lg:translate-y-[65%]">
                <img
                  src="/images/kanban-gantt-screenshot.png"
                  alt="Vue Gantt Newbi"
                  className="w-full h-auto rounded-tl-xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
