"use client";
import React from "react";

const emailImages = [
  "https://cdn.brandfetch.io/id5o3EIREg/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1750127197312",
  "https://cdn.brandfetch.io/idgdw68PEO/w/400/h/400/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1667605535284",
  "/newbi-icon.svg",
  "https://cdn.brandfetch.io/idnrCPuv87/w/400/h/400/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1749539604383",
  "https://cdn.brandfetch.io/idgoJtPkpl/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1721723479160",
  "https://cdn.brandfetch.io/idG21jby45/w/400/h/400/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1715867804223",
  "https://cdn.brandfetch.io/idILYZGgSd/w/2048/h/2048/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1687242662517",
];

function GridItem({ img, small }) {
  return (
    <div className="w-full justify-self-center aspect-square rounded-xl border border-dashed border-neutral-200 relative p-[1px]">
      <div className="flex items-center justify-center w-full h-full rounded-[12px] p-[1px] relative z-10">
        {img && (
          <img
            alt="item"
            loading="lazy"
            width="120"
            height="120"
            className={`object-contain aspect-square rounded-[12px] relative z-20 ${small ? "w-[75%] h-[75%]" : ""}`}
            src={img}
          />
        )}
      </div>
      <div className="absolute inset-0 bg-[image:repeating-linear-gradient(315deg,_rgba(0,0,0,0.05)_0,_rgba(0,0,0,0.05)_1px,_transparent_0,_transparent_50%)] bg-[size:5px_5px] rounded-xl bg-fixed"></div>
    </div>
  );
}

export default function SignaturesGovernanceSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 lg-pb-10 relative overflow-hidden">
      <div className="max-w-6xl px-4 mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5A50FF] mb-3">
            SIGNATURES EMAIL
          </span>
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance text-gray-950 mb-4">
            Une signature qui fait la différence
          </h2>
          <p className="text-md font-normal tracking-tight text-gray-600 mx-auto mb-8 max-w-2xl">
            Créez des signatures email professionnelles et uniformes pour
            renforcer votre image de marque à chaque email envoyé.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-y border-neutral-200 divide-neutral-200">
          {/* Card 1 */}
          <div className="md:border-r border-b border-neutral-200">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Une identité cohérente pour toute l&apos;équipe
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Fini les signatures bricolées. Déployez un modèle unique
                à toute votre équipe, uniforme et professionnel.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden">
            </div>
          </div>

          {/* Card 2 */}
          <div className="border-b border-neutral-200">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Compatible tous les clients email
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Gmail, Outlook, Apple Mail, Thunderbird — votre signature
                s&apos;affiche parfaitement partout, sur desktop comme sur
                mobile.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 flex flex-col md:h-80 overflow-hidden perspective-distant mask-radial-from-20%">
              <div className="flex-1 rounded-t-3xl gap-4 space-y-4 w-full h-full px-8 flex-col items-center justify-center">
                <div className="grid grid-cols-4 gap-2 justify-center max-w-md mx-auto">
                  <GridItem />
                  <GridItem img={emailImages[0]} />
                  <GridItem img={emailImages[1]} />
                  <GridItem />
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <GridItem />
                  <GridItem img={emailImages[3]} />
                  <GridItem img={emailImages[2]} small />
                  <GridItem img={emailImages[6]} />
                  <GridItem />
                </div>
                <div className="grid grid-cols-4 justify-center max-w-md mx-auto gap-2">
                  <GridItem />
                  <GridItem img={emailImages[5]} />
                  <GridItem img={emailImages[4]} />
                  <GridItem />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="border-b md:border-b-0 md:border-r border-neutral-200">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Personnalisez à votre image
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Couleurs, polices, mise en page — adaptez chaque détail
                pour que votre signature reflète parfaitement votre
                identité visuelle.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden">
            </div>
          </div>

          {/* Card 4 */}
          <div>
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Partagez en un clic
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Copiez votre signature et collez-la dans votre client email
                en quelques secondes. Partagez-la avec toute votre équipe
                pour une communication uniforme.
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
