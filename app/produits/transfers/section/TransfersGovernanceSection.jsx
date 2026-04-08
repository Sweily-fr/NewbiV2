"use client";
import React from "react";

export default function TransfersGovernanceSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 lg-pb-10 relative overflow-hidden">
      <div className="max-w-6xl px-4 mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5851ff] mb-3">
            TRANSFERT SIMPLIFIÉ
          </span>
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance text-gray-950 mb-4">
            Tout ce qu&apos;il faut pour transférer en toute confiance
          </h2>
          <p className="text-md font-normal tracking-tight text-gray-600 mx-auto mb-8 max-w-2xl">
            Du partage au téléchargement, Newbi sécurise et simplifie
            chaque transfert de fichiers.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-y border-neutral-200 divide-neutral-200">
          {/* Card 1 */}
          <div className="md:border-r border-b border-neutral-200 flex flex-col">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Envoyez jusqu&apos;à 5 Go par fichier
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Vidéos, archives, projets créatifs — transférez vos fichiers
                volumineux sans compression ni perte de qualité.
              </p>
            </div>
            <div className="relative flex-1 min-h-[320px] overflow-hidden">
            </div>
          </div>

          {/* Card 2 */}
          <div className="border-b border-neutral-200 flex flex-col">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Sécurisé de bout en bout
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Chiffrement SSL/TLS, protection par mot de passe et liens
                à durée limitée pour garder le contrôle sur vos fichiers.
              </p>
            </div>
            <div className="relative flex-1 min-h-[320px] overflow-hidden">
            </div>
          </div>

          {/* Card 3 */}
          <div className="border-b md:border-b-0 md:border-r border-neutral-200">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Suivez chaque téléchargement
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Notifications en temps réel et tableau de bord complet
                pour savoir exactement qui a téléchargé vos fichiers et quand.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden">
            </div>
          </div>

          {/* Card 4 */}
          <div>
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Partagez en quelques secondes
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Glissez-déposez vos fichiers, personnalisez le lien de partage
                et envoyez-le par email — c&apos;est aussi simple que ça.
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
