"use client";
import React from "react";
import Link from "next/link";

export default function HowItWorksSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 relative overflow-hidden">
      <div className="max-w-6xl px-4 mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5A50FF] mb-3">
            SIMPLE ET RAPIDE
          </span>
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance text-gray-950 mb-4">
            Prêt en 3 minutes
          </h2>
          <p className="text-md font-normal tracking-tight text-gray-600 mx-auto max-w-2xl">
            Créer une signature professionnelle n&apos;a jamais été aussi simple.
          </p>
        </div>

        {/* Grid: 1 large left + 2 stacked right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card 1 — Large left: Choisissez un modèle */}
          <div className="bg-[#F8F9FA] rounded-3xl p-8 flex flex-col justify-between lg:min-h-[650px] relative lg:overflow-hidden">
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-950 mb-2">
                Choisissez un modèle
              </h3>
              <p className="text-base text-gray-600 max-w-md mb-6">
                Sélectionnez parmi nos modèles professionnels celui qui correspond le mieux à votre identité.
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium text-white bg-[#212121] hover:bg-[#333333] transition-colors"
              >
                Créer ma signature
              </Link>
            </div>
            {/* Mini template grid visual */}
            <div className="relative mt-6 -mx-4 lg:mt-0 lg:mx-0 lg:absolute lg:bottom-0 lg:right-0 lg:w-[140%] lg:translate-x-[35%] lg:translate-y-[15%]">
              <div className="grid grid-cols-2 gap-3 p-4">
                {/* Template 1 — Horizontal classique */}
                <div className="bg-white rounded-xl border border-neutral-100 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E8E5FF] flex items-center justify-center text-[#5A50FF] text-xs font-bold">SM</div>
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-800">Sophie Martin</p>
                      <p className="text-[9px] text-neutral-400">Directrice Marketing</p>
                      <p className="text-[8px] text-neutral-300 mt-0.5">sophie@startup.com · +33 6 12 34</p>
                    </div>
                  </div>
                  <div className="h-px bg-[#E8E5FF] my-2.5" />
                  <div className="flex gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#E8E5FF]" />
                    <div className="w-3.5 h-3.5 rounded-full bg-[#E8E5FF]" />
                    <div className="w-3.5 h-3.5 rounded-full bg-[#E8E5FF]" />
                  </div>
                </div>
                {/* Template 2 — Vertical avec bannière */}
                <div className="bg-white rounded-xl border border-neutral-100 p-4 shadow-sm">
                  <div className="h-6 rounded-md bg-[#FFF0E5] mb-2.5" />
                  <div className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-[#FFE0CC] flex items-center justify-center text-[#E8723A] text-[10px] font-bold -mt-5 border-2 border-white">TD</div>
                    <p className="text-[10px] font-semibold text-neutral-800 mt-1.5">Thomas Dubois</p>
                    <p className="text-[8px] text-neutral-400">Lead Developer</p>
                  </div>
                  <div className="flex justify-center gap-1.5 mt-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#FFF0E5]" />
                    <div className="w-3.5 h-3.5 rounded-full bg-[#FFF0E5]" />
                  </div>
                </div>
                {/* Template 3 — Sidebar accent */}
                <div className="bg-white rounded-xl border border-neutral-100 p-4 shadow-sm flex gap-3">
                  <div className="w-1 rounded-full bg-[#D5F0E3] shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-neutral-800">Marie Laurent</p>
                    <p className="text-[9px] text-neutral-400">Designer UX/UI</p>
                    <div className="h-1 w-16 bg-neutral-100 rounded mt-2" />
                    <div className="h-1 w-12 bg-neutral-100 rounded mt-1" />
                    <div className="flex gap-1.5 mt-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#D5F0E3]" />
                      <div className="w-3.5 h-3.5 rounded-full bg-[#D5F0E3]" />
                      <div className="w-3.5 h-3.5 rounded-full bg-[#D5F0E3]" />
                    </div>
                  </div>
                </div>
                {/* Template 4 — Compact minimaliste */}
                <div className="bg-white rounded-xl border border-neutral-100 p-4 shadow-sm">
                  <p className="text-[11px] font-semibold text-neutral-800">Lucas Bernard</p>
                  <p className="text-[9px] text-neutral-400 mb-2">Chef de Projet</p>
                  <div className="h-px bg-neutral-100 mb-2" />
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-20 bg-[#E0E7FF] rounded" />
                    <div className="h-1 w-14 bg-[#E0E7FF] rounded" />
                  </div>
                  <div className="flex gap-1.5 mt-2.5">
                    <div className="w-3.5 h-3.5 rounded-sm bg-[#E0E7FF]" />
                    <div className="w-3.5 h-3.5 rounded-sm bg-[#E0E7FF]" />
                    <div className="w-3.5 h-3.5 rounded-sm bg-[#E0E7FF]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: 2 stacked cards */}
          <div className="flex flex-col gap-4">
            {/* Card 2 — Personnalisez */}
            <div className="bg-[#F8F9FA] rounded-3xl p-8 flex-1 flex flex-col justify-between lg:overflow-hidden relative">
              <div>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-950 mb-2">
                  Personnalisez
                </h3>
                <p className="text-sm text-gray-600 max-w-sm">
                  Ajoutez votre logo, photo, coordonnées et réseaux sociaux. Adaptez les couleurs à votre charte.
                </p>
              </div>
              {/* Mini editor UI */}
              <div className="relative mt-4 -mx-4 lg:mt-0 lg:mx-0 lg:absolute lg:bottom-0 lg:right-0 lg:w-[75%] lg:translate-x-[15%] lg:translate-y-[25%]">
                <div className="bg-white rounded-2xl shadow-lg border border-neutral-100 overflow-hidden">
                  <div className="px-5 py-3 border-b border-neutral-50 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-neutral-800">Personnalisation</span>
                    <span className="text-[10px] text-[#5A50FF] font-medium">Aperçu →</span>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Color picker row */}
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-2">Couleur principale</p>
                      <div className="flex gap-2.5">
                        {["#8B7FFF", "#1D1D1B", "#F4A89A", "#8ECFB0", "#F5CE7E", "#7FB8F4", "#E4A0C8"].map((c, i) => (
                          <div key={i} className={`w-5 h-5 rounded-full cursor-pointer ${i === 0 ? "ring-[1.5px] ring-offset-2 ring-[#8B7FFF]" : ""}`} style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                    {/* Fields */}
                    <div className="space-y-2">
                      <div className="h-8 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center px-3 gap-2">
                        <span className="text-[9px] text-neutral-300 w-12 shrink-0">Nom</span>
                        <span className="text-[10px] text-neutral-700 font-medium">Sophie Martin</span>
                      </div>
                      <div className="h-8 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center px-3 gap-2">
                        <span className="text-[9px] text-neutral-300 w-12 shrink-0">Poste</span>
                        <span className="text-[10px] text-neutral-700 font-medium">Directrice Marketing</span>
                      </div>
                      <div className="h-8 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center px-3 gap-2">
                        <span className="text-[9px] text-neutral-300 w-12 shrink-0">Email</span>
                        <span className="text-[10px] text-neutral-700 font-medium">sophie@startup.com</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 — Copiez et utilisez */}
            <div className="bg-[#F8F9FA] rounded-3xl p-8 flex-1 flex flex-col justify-between lg:overflow-hidden relative">
              <div>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-950 mb-2">
                  Copiez et utilisez
                </h3>
                <p className="text-sm text-gray-600 max-w-sm">
                  Copiez votre signature en un clic et collez-la dans Gmail, Outlook ou tout autre client email.
                </p>
              </div>
              {/* Mini copy UI */}
              <div className="relative mt-4 -mx-4 lg:mt-0 lg:mx-0 lg:absolute lg:bottom-0 lg:right-0 lg:w-[75%] lg:translate-x-[15%] lg:translate-y-[10%]">
                <div className="bg-white rounded-2xl shadow-lg border border-neutral-100 overflow-hidden">
                  <div className="px-5 py-3 border-b border-neutral-50 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-neutral-800">Compatible avec</span>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Email clients with real logos */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-11 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center gap-2">
                        <img src="https://cdn.brandfetch.io/id5o3EIREg/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1696475443284" alt="Gmail" className="w-4 h-4 object-contain" />
                        <span className="text-[10px] font-medium text-neutral-600">Gmail</span>
                      </div>
                      <div className="flex-1 h-11 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center gap-2">
                        <img src="https://cdn.brandfetch.io/idgdw68PEO/w/900/h/842/theme/dark/logo.jpeg?c=1bxid64Mup7aczewSAYMX&t=1667605535117" alt="Outlook" className="w-4 h-4 object-contain rounded-sm" />
                        <span className="text-[10px] font-medium text-neutral-600">Outlook</span>
                      </div>
                      <div className="flex-1 h-11 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center gap-2">
                        <img src="https://cdn.brandfetch.io/idnrCPuv87/theme/dark/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1729268375158" alt="Apple" className="w-4 h-4 object-contain" />
                        <span className="text-[10px] font-medium text-neutral-600">Apple Mail</span>
                      </div>
                    </div>
                    {/* Copy button */}
                    <button className="w-full bg-[#1D1D1B] text-white rounded-xl py-3 text-xs font-semibold flex items-center justify-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                      Copier la signature
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
