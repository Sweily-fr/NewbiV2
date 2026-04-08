"use client";
import React from "react";

export default function KanbanGovernanceSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 lg-pb-10 relative overflow-hidden">
      <div className="max-w-7xl px-4 mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5851ff] mb-3">
            GESTION DE PROJETS
          </span>
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance text-gray-950 mb-4">
            Tout ce qu&apos;il faut pour piloter vos projets efficacement
          </h2>
          <p className="text-md font-normal tracking-tight text-gray-600 mx-auto mb-8 max-w-2xl">
            Du suivi des tâches à la collaboration en équipe, Newbi simplifie
            chaque étape de votre gestion de projets.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-y border-neutral-200 divide-neutral-200">
          {/* Card 1 */}
          <div className="md:border-r border-b border-neutral-200 flex flex-col">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Vue Kanban intuitive
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Organisez vos tâches en colonnes personnalisables. Glissez-déposez
                les cartes pour mettre à jour l&apos;avancement en un instant.
              </p>
            </div>
            <div className="relative flex-1 min-h-[320px] overflow-hidden">
            </div>
          </div>

          {/* Card 2 */}
          <div className="border-b border-neutral-200 flex flex-col">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Collaboration en temps réel
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Assignez des tâches, ajoutez des commentaires et suivez
                la progression de votre équipe en direct.
              </p>
            </div>
            <div className="relative flex-1 min-h-[320px] overflow-hidden">
            </div>
          </div>

          {/* Card 3 */}
          <div className="border-b md:border-b-0 md:border-r border-neutral-200">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Priorités et échéances
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Définissez des niveaux de priorité, des dates limites et des
                sous-tâches pour ne jamais perdre le fil de vos projets.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden">
            </div>
          </div>

          {/* Card 4 */}
          <div>
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Vues multiples : Board, Liste et Gantt
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Passez d&apos;une vue à l&apos;autre selon vos besoins — tableau Kanban,
                liste détaillée ou diagramme de Gantt pour la planification.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden">
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
