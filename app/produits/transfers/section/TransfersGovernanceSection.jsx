"use client";
import React from "react";
import MiniUploadAnimation from "./MiniUploadAnimation";
import ShareTrackingAnimation from "./ShareTrackingAnimation";

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
              <MiniUploadAnimation />
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
            <div className="relative flex-1 min-h-[320px] overflow-hidden px-4 md:px-8 pb-6 flex items-center">
              <div className="w-full space-y-3">
                {/* Card: Chiffrement */}
                <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-[#F8F9FA]">
                  <div className="w-12 h-12 rounded-xl bg-[#5A50FF]/8 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A50FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-neutral-900">Chiffrement SSL/TLS</p>
                      <span className="text-[9px] font-semibold text-[#22C55E] bg-[#22C55E]/8 px-2.5 py-1 rounded-full">Actif</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Protocole HTTPS · Données chiffrées en transit</p>
                  </div>
                </div>

                {/* Card: Mot de passe */}
                <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-[#F8F9FA]">
                  <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/8 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-neutral-900">Protection par mot de passe</p>
                      <span className="text-[9px] font-semibold text-[#F59E0B] bg-[#F59E0B]/8 px-2.5 py-1 rounded-full">Optionnel</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Accès restreint aux destinataires autorisés</p>
                  </div>
                </div>

                {/* Card: Expiration */}
                <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-[#F8F9FA]">
                  <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/8 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-neutral-900">Lien à durée limitée</p>
                      <span className="text-[9px] font-semibold text-[#3B82F6] bg-[#3B82F6]/8 px-2.5 py-1 rounded-full">7 jours</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Suppression automatique après expiration</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-neutral-400">Hébergé en</span>
                    <span className="text-[10px] font-semibold text-neutral-600">🇫🇷 France</span>
                  </div>
                  <div className="w-px h-3 bg-neutral-200" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-neutral-600">RGPD</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#5A50FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                </div>
              </div>
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
            <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden px-6 md:px-10 pb-4 flex items-center">
              <div className="w-full">
                <div className="space-y-0">
                  {[
                    { icon: "link", color: "#5A50FF", bg: true, title: "Lien créé et partagé", desc: "3 fichiers · 5.98 Go · Expire dans 7j", time: "14:20" },
                    { icon: "eye", color: "#3B82F6", bg: false, title: "Julie a ouvert le lien", desc: "Première consultation", time: "14:32", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
                    { icon: "download", color: "#22C55E", bg: true, title: "Julie a téléchargé", desc: "Maquette_Final.psd · 1.8 Go", time: "14:33", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
                    { icon: "download", color: "#22C55E", bg: true, title: "Thomas a téléchargé", desc: "Rushes_Campagne.mov · 3.2 Go", time: "15:10", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
                  ].map((event, i, arr) => (
                    <div key={i} className="flex gap-4">
                      {/* Left: dot + line */}
                      <div className="flex flex-col items-center shrink-0" style={{ width: "20px" }}>
                        <div
                          className={`w-3 h-3 rounded-full shrink-0 mt-1.5 ${event.bg ? "" : "border-2"}`}
                          style={event.bg ? { backgroundColor: event.color } : { borderColor: event.color }}
                        />
                        {i < arr.length - 1 && <div className="w-px flex-1 bg-neutral-200 my-1" />}
                      </div>
                      {/* Right: content */}
                      <div className="flex-1 min-w-0 pb-6">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {event.avatar && <img src={event.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />}
                            <p className="text-sm font-semibold text-neutral-900">{event.title}</p>
                          </div>
                          <span className="text-[10px] text-neutral-400 shrink-0 mt-0.5">{event.time}</span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">{event.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
              <ShareTrackingAnimation />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
