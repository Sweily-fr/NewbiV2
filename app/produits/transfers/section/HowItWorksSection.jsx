"use client";
import React from "react";
import Link from "next/link";

export default function HowItWorksSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 relative overflow-hidden">
      <div className="max-w-6xl px-4 mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5851ff] mb-3">
            SIMPLE ET RAPIDE
          </span>
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance text-gray-950 mb-4">
            Prêt en 30 secondes
          </h2>
          <p className="text-md font-normal tracking-tight text-gray-600 mx-auto max-w-2xl">
            Transférer des fichiers volumineux n&apos;a jamais été aussi simple.
          </p>
        </div>

        {/* Grid: 1 large left + 2 stacked right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card 1 — Large left: Déposez vos fichiers */}
          <div className="bg-[#F8F9FA] rounded-3xl p-8 flex flex-col justify-between lg:min-h-[650px] relative lg:overflow-hidden">
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-950 mb-2">
                Déposez vos fichiers
              </h3>
              <p className="text-base text-gray-600 max-w-md mb-6">
                Glissez-déposez vos fichiers ou cliquez pour les sélectionner. Jusqu&apos;à 5 Go par fichier, tous formats acceptés.
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium text-white bg-[#212121] hover:bg-[#333333] transition-colors"
              >
                Essayer maintenant
              </Link>
            </div>
            {/* Interface screenshot with dashed overlay */}
            <div className="relative mt-6 -mx-4 lg:mt-0 lg:mx-0 lg:absolute lg:bottom-0 lg:right-0 lg:w-[150%] lg:translate-x-[40%] lg:translate-y-[15%]">
              <div className="relative">
                <img
                  src="/lp/transfers/transfers-hero.png"
                  alt="Interface transfert Newbi"
                  className="w-full h-auto rounded-xl lg:rounded-tl-xl"
                />
                {/* Dashed upload zone overlay */}
                <div className="absolute top-[6%] left-[9%] w-[44%] h-[48%] flex items-center justify-center">
                  <div className="w-[80%] h-[70%] border border-dashed border-neutral-300 rounded-xl flex flex-col items-center justify-center gap-2 bg-white/50">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                      </svg>
                    </div>
                    <p className="text-[8px] font-medium text-neutral-600 text-center">Glissez-déposez vos fichiers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: 2 stacked cards */}
          <div className="flex flex-col gap-4">
            {/* Card 2 — Personnalisez le partage */}
            <div className="bg-[#F8F9FA] rounded-3xl p-8 flex-1 flex flex-col justify-between lg:overflow-hidden relative">
              <div>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-950 mb-2">
                  Personnalisez le partage
                </h3>
                <p className="text-sm text-gray-600 max-w-sm">
                  Ajoutez un mot de passe, définissez une date d&apos;expiration et choisissez les options de notification.
                </p>
              </div>
              {/* Mini settings UI */}
              <div className="relative mt-4 -mx-4 lg:mt-0 lg:mx-0 lg:absolute lg:bottom-0 lg:right-0 lg:w-[70%] lg:translate-x-[15%] lg:translate-y-[10%]">
                <div className="bg-white rounded-2xl shadow-lg border border-neutral-100 overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-3 border-b border-neutral-100 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#5851ff]" />
                    <span className="text-xs font-semibold text-neutral-800">Options de partage</span>
                  </div>
                  {/* Settings rows */}
                  <div className="px-5 py-3 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#5851ff]/8 flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5851ff" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-neutral-800">Mot de passe</p>
                          <p className="text-[10px] text-neutral-400">Protégez l&apos;accès</p>
                        </div>
                      </div>
                      <div className="w-9 h-5 rounded-full bg-[#5851ff] relative"><div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" /></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/8 flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-neutral-800">Expiration</p>
                          <p className="text-[10px] text-neutral-400">Durée de validité</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-lg">7 jours</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-green-500/8 flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M22 17H2a3 3 0 003 3h14a3 3 0 003-3z" /><path d="M6 7v10" /><path d="M18 7v10" /><path d="M6 12h12" /></svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-neutral-800">Notification email</p>
                          <p className="text-[10px] text-neutral-400">À chaque téléchargement</p>
                        </div>
                      </div>
                      <div className="w-9 h-5 rounded-full bg-[#22c55e] relative"><div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 — Partagez le lien */}
            <div className="bg-[#F8F9FA] rounded-3xl p-8 flex-1 flex flex-col justify-between lg:overflow-hidden relative">
              <div>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-950 mb-2">
                  Partagez le lien
                </h3>
                <p className="text-sm text-gray-600 max-w-sm">
                  Envoyez le lien par email ou copiez-le. Vos destinataires téléchargent sans inscription.
                </p>
              </div>
              {/* Mini share UI */}
              <div className="relative mt-4 -mx-4 lg:mt-0 lg:mx-0 lg:absolute lg:bottom-0 lg:right-0 lg:w-[70%] lg:translate-x-[15%] lg:translate-y-[10%]">
                <div className="bg-white rounded-2xl shadow-lg border border-neutral-100 overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-3 border-b border-neutral-100 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                    <span className="text-xs font-semibold text-neutral-800">Lien de partage</span>
                    <span className="text-[10px] text-neutral-400 ml-auto">Actif</span>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    {/* Link field */}
                    <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-3 py-2.5 border border-neutral-100">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5851ff" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
                      <span className="text-[11px] text-neutral-500 truncate flex-1 font-mono">newbi.fr/t/xK9mQ2</span>
                      <div className="text-[10px] font-semibold text-white bg-[#5851ff] px-3 py-1 rounded-lg">Copier</div>
                    </div>
                    {/* Share options */}
                    <div className="flex gap-2">
                      <div className="flex-1 h-9 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#838383" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                        <span className="text-[10px] font-medium text-neutral-600">Email</span>
                      </div>
                      <div className="flex-1 h-9 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#838383" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
                        <span className="text-[10px] font-medium text-neutral-600">Message</span>
                      </div>
                      <div className="flex-1 h-9 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#838383" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 7h.01M7 12h.01M7 17h.01M12 7h.01M12 12h.01M12 17h.01M17 7h.01M17 12h.01M17 17h.01" /></svg>
                        <span className="text-[10px] font-medium text-neutral-600">QR</span>
                      </div>
                    </div>
                    {/* Stats */}
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        <span className="text-[10px] text-neutral-400">12 vues</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#5851ff" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                        <span className="text-[10px] text-neutral-400">8 téléchargements</span>
                      </div>
                    </div>
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
