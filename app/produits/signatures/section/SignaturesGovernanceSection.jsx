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
          <div className="md:border-r border-b border-neutral-200 flex flex-col">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Une identité cohérente pour toute l&apos;équipe
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Fini les signatures bricolées. Déployez un modèle unique
                à toute votre équipe, uniforme et professionnel.
              </p>
            </div>
            <div className="relative flex-1 min-h-[320px] overflow-hidden px-4 md:px-6 pb-4">
              <div className="flex flex-col gap-3">
                {/* Signature 1 — Horizontal classique avec séparateur */}
                <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4 flex gap-3.5">
                  <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Sophie Martin" className="w-14 h-14 rounded-full object-cover shrink-0" />
                  <div className="w-px bg-[#1D6B4F]/20 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-neutral-900 leading-tight">Sophie Martin</p>
                    <p className="text-[10px] text-[#1D6B4F] font-medium leading-tight">Directrice Marketing</p>
                    <p className="text-[8px] text-neutral-400 mt-0.5">Agence Verdure · agence-verdure.fr</p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="text-[8px] text-neutral-500">sophie@agence-verdure.fr</span>
                      <span className="text-[8px] text-neutral-500">+33 6 12 34 56 78</span>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <div className="w-4 h-4 rounded-full bg-[#1D6B4F] flex items-center justify-center">
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="white"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></svg>
                      </div>
                      <div className="w-4 h-4 rounded-full bg-[#1D6B4F] flex items-center justify-center">
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /><path d="M2 12h20" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signature 2 — Centré avec bannière colorée */}
                <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden" style={{ transform: "translateX(6px)" }}>
                  <div className="h-2 bg-gradient-to-r from-[#5A50FF] to-[#8B7FFF]" />
                  <div className="p-4 flex gap-3.5 items-center">
                    <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Thomas Leroy" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-neutral-900 leading-tight">Thomas Leroy</p>
                      <p className="text-[10px] text-[#5A50FF] font-medium leading-tight">Lead Developer · Studio Pixel</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] text-neutral-500">thomas@studio-pixel.io</span>
                        <span className="text-[8px] text-neutral-400">·</span>
                        <span className="text-[8px] text-neutral-500">+33 6 23 45 67 89</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <div className="w-5 h-5 rounded-md bg-[#5A50FF]/10 flex items-center justify-center">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="#5A50FF"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></svg>
                      </div>
                      <div className="w-5 h-5 rounded-md bg-[#5A50FF]/10 flex items-center justify-center">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#5A50FF" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signature 3 — Dark compact avec sidebar accent */}
                <div className="bg-[#1E1E1E] rounded-xl border border-neutral-800 shadow-sm p-4 flex gap-3" style={{ transform: "translateX(12px)" }}>
                  <div className="w-1 rounded-full bg-[#F59E0B] shrink-0" />
                  <div className="flex items-center gap-3 flex-1">
                    <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Camille Dubois" className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-[#F59E0B]/30" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-white leading-tight">Camille Dubois</p>
                      <p className="text-[10px] text-[#F59E0B] font-medium leading-tight">Designer UX/UI</p>
                      <p className="text-[8px] text-neutral-500 mt-0.5">camille@atelier-nova.com · +33 6 34 56 78 90</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="#F59E0B"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></svg>
                      </div>
                      <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" /></svg>
                      </div>
                      <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><path d="M4 4l11.733 16h4.267l-11.733-16zM4 20l6.768-6.768M17.5 4l-6.768 6.768" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
          <div className="border-b md:border-b-0 md:border-r border-neutral-200 flex flex-col">
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
            <div className="relative flex-1 min-h-[320px] overflow-hidden">
              <div className="absolute bottom-0 right-0 w-[85%] translate-x-[10%] translate-y-[12%]">
                <img
                  src="/lp/signatures/signatures-hero.png"
                  alt="Éditeur de signature Newbi"
                  className="w-full h-auto rounded-tl-xl shadow-lg"
                />
              </div>
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
            <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden px-4 md:px-8 pb-4">
              <div className="flex flex-col gap-2.5">
                {[
                  { name: "Sophie Martin", role: "Directrice Marketing", avatar: "https://randomuser.me/api/portraits/women/44.jpg", status: "applied" },
                  { name: "Thomas Leroy", role: "Lead Developer", avatar: "https://randomuser.me/api/portraits/men/32.jpg", status: "applied" },
                  { name: "Camille Dubois", role: "Designer UX/UI", avatar: "https://randomuser.me/api/portraits/women/68.jpg", status: "applied" },
                  { name: "Lucas Bernard", role: "Chef de Projet", avatar: "https://randomuser.me/api/portraits/men/75.jpg", status: "pending" },
                ].map((member, i) => (
                  <div key={i} className="flex items-center gap-3.5 py-3 px-4 rounded-xl border border-neutral-100 bg-white shadow-sm">
                    <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800">{member.name}</p>
                      <p className="text-[10px] text-neutral-400">{member.role}</p>
                    </div>
                    {member.status === "applied" ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5A50FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span className="text-[10px] font-medium text-[#5A50FF]">Appliquée</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                        <span className="text-[10px] font-medium text-[#F59E0B]">En attente</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer stats */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#5A50FF]" />
                  <span className="text-[10px] text-neutral-500">3 appliquées</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                  <span className="text-[10px] text-neutral-500">1 en attente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
