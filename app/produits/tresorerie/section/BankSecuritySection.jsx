"use client";
import React from "react";
import { Shield, LockOpen, Lock as LockIcon, Eye, ServerCrash } from "lucide-react";
import DataFilterAnimation from "./DataFilterAnimation";

export default function BankSecuritySection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 lg-pb-10 relative overflow-hidden">
      <style>{`
        @keyframes revealLine1 {
          0%, 20% { clip-path: inset(0 100% 0 0); }
          40% { clip-path: inset(0 0% 0 0); }
          100% { clip-path: inset(0 0% 0 0); }
        }
        @keyframes revealLine2 {
          0%, 40% { clip-path: inset(0 100% 0 0); }
          60% { clip-path: inset(0 0% 0 0); }
          100% { clip-path: inset(0 0% 0 0); }
        }
        @keyframes lockOpen1 {
          0%, 20% { opacity: 0; }
          25% { opacity: 1; }
          39% { opacity: 1; }
          40% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes lockClosed1 {
          0%, 39% { opacity: 0; transform: scale(0.5); }
          42% { opacity: 1; transform: scale(1.15); }
          46% { opacity: 1; transform: scale(1); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes lockOpen2 {
          0%, 40% { opacity: 0; }
          45% { opacity: 1; }
          59% { opacity: 1; }
          60% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes lockClosed2 {
          0%, 59% { opacity: 0; transform: scale(0.5); }
          62% { opacity: 1; transform: scale(1.15); }
          66% { opacity: 1; transform: scale(1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div className="max-w-6xl px-4 mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5A50FF] mb-3">
            SÉCURITÉ BANCAIRE
          </span>
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance text-gray-950 mb-4">
            Vos données bancaires en sécurité
          </h2>
          <p className="text-md font-normal tracking-tight text-gray-600 mx-auto mb-8 max-w-2xl">
            La synchronisation bancaire repose sur des standards de sécurité
            bancaires. Vos données sont protégées à chaque instant.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-y border-neutral-200 divide-neutral-200">
          {/* Card 1 */}
          <div className="md:border-r border-b border-neutral-200">
            <div className="p-4 md:p-8">

              <h2 className="text-lg font-medium text-neutral-800">
                Connexion sécurisée
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Vos identifiants bancaires ne transitent jamais par nos
                serveurs. La connexion passe par un prestataire agréé par
                l&apos;ACPR.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden flex items-center justify-center px-8">
              <div className="flex items-center gap-0 w-full max-w-[480px]">
                {/* Newbi */}
                <div className="flex flex-col items-center gap-2.5 shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center overflow-hidden">
                    <img src="/newbi-icon.svg" alt="Newbi" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm font-medium text-neutral-800">Newbi</span>
                </div>

                {/* Line 1 */}
                <div className="flex-1 flex items-center justify-center -mt-6 relative">
                  <div className="w-full border-t border-dashed border-neutral-300" style={{ animation: "revealLine1 3s ease-out forwards" }} />
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <LockOpen className="w-3.5 h-3.5 text-neutral-300 absolute" style={{ opacity: 0, animation: "lockOpen1 3s ease-out forwards" }} />
                    <LockIcon className="w-3.5 h-3.5 text-neutral-300 absolute" style={{ opacity: 0, animation: "lockClosed1 3s ease-out forwards" }} />
                  </div>
                </div>

                {/* Bridge API */}
                <div className="flex flex-col items-center gap-2.5 shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center overflow-hidden">
                    <img src="https://cdn.brandfetch.io/idnA3rbFGH/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1690558247926" alt="Bridge API" className="w-full h-full object-cover rounded-xl translate-y-1" />
                  </div>
                  <span className="text-sm font-medium text-neutral-800">Bridge API</span>
                </div>

                {/* Line 2 */}
                <div className="flex-1 flex items-center justify-center -mt-6 relative">
                  <div className="w-full border-t border-dashed border-neutral-300" style={{ animation: "revealLine2 3s ease-out forwards" }} />
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <LockOpen className="w-3.5 h-3.5 text-neutral-300 absolute" style={{ opacity: 0, animation: "lockOpen2 3s ease-out forwards" }} />
                    <LockIcon className="w-3.5 h-3.5 text-neutral-300 absolute" style={{ opacity: 0, animation: "lockClosed2 3s ease-out forwards" }} />
                  </div>
                </div>

                {/* Banque */}
                <div className="flex flex-col items-center gap-2.5 shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center overflow-hidden">
                    <img src="https://cdn.brandfetch.io/iddTHt7H9X/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1667628466273" alt="Banque" className="w-full h-full object-cover rounded-xl" />
                  </div>
                  <span className="text-sm font-medium text-neutral-800">Votre banque</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="border-b border-neutral-200">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Chiffrement 256 bits
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Toutes vos données sont chiffrées de bout en bout avec le même
                niveau de sécurité que votre banque.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 flex flex-col md:h-80 overflow-hidden perspective-distant">
              <div className="flex-1 rounded-t-3xl gap-2 flex flex-col bg-neutral-100 border border-neutral-200 w-full h-full absolute top-2 bottom-0 left-[-5%] right-10 p-2 overflow-hidden">
                {[
                  {
                    icon: <Shield className="w-4 h-4 text-[#5A50FF]" />,
                    title: "Connexion chiffrée SSL/TLS",
                    desc: "Protocole HTTPS actif",
                    badge: "Actif",
                    badgeColor: "bg-green-50 text-green-600 border-green-200",
                  },
                  {
                    icon: <LockIcon className="w-4 h-4 text-[#5A50FF]" />,
                    title: "Chiffrement AES-256",
                    desc: "Données chiffrées de bout en bout",
                    badge: "Actif",
                    badgeColor: "bg-green-50 text-green-600 border-green-200",
                  },
                  {
                    icon: <Shield className="w-4 h-4 text-[#5A50FF]" />,
                    title: "Certificat SSL valide",
                    desc: "Émis par Let's Encrypt — expire dans 89j",
                    badge: "Vérifié",
                    badgeColor: "bg-green-50 text-green-600 border-green-200",
                  },
                  {
                    icon: <Eye className="w-4 h-4 text-[#5A50FF]" />,
                    title: "Accès en lecture seule",
                    desc: "Aucune opération bancaire possible",
                    badge: "Actif",
                    badgeColor: "bg-green-50 text-green-600 border-green-200",
                  },
                ].map((notif, i) => (
                  <div
                    key={i}
                    className="p-4 shadow-black/10 border bg-white border-transparent ring-1 rounded-[20px] ring-black/10 flex items-center gap-3"
                  >
                    <div className="size-9 shrink-0 rounded-lg flex items-center justify-center bg-[#5A50FF]/10 border border-[#5A50FF]/20">
                      {notif.icon}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-neutral-800">{notif.title}</p>
                      <p className="text-xs text-neutral-400">{notif.desc}</p>
                    </div>
                    <span className={`text-[9px] font-medium px-2 py-1 rounded-md border shrink-0 ${notif.badgeColor}`}>
                      {notif.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="border-b md:border-b-0 md:border-r border-neutral-200">
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Lecture seule
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Newbi accède à vos transactions en lecture seule. Aucun
                virement, aucune modification n&apos;est possible depuis notre
                plateforme.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 flex flex-col md:h-80 overflow-hidden perspective-distant">
              <div className="flex-1 rounded-t-3xl bg-neutral-100 border border-neutral-200 mx-auto w-full h-full absolute inset-x-4 top-2 bottom-0 p-2 overflow-hidden">
                <div className="w-full h-full rounded-tl-[12px] rounded-tr-[12px] ring-1 ring-black/5 bg-white flex flex-col items-center justify-center px-8 gap-4 relative">
                  {/* Mini interface mockup */}
                  <div className="w-full max-w-[280px]">
                    {/* Fake nav bar */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-neutral-200" />
                        <div className="w-16 h-2 rounded bg-neutral-200" />
                      </div>
                      <div className="flex gap-1.5">
                        <div className="w-8 h-2 rounded bg-neutral-100" />
                        <div className="w-8 h-2 rounded bg-neutral-100" />
                      </div>
                    </div>

                    {/* Fake input fields */}
                    <div className="space-y-3 mb-5">
                      <div>
                        <div className="w-12 h-1.5 rounded bg-neutral-200 mb-1.5" />
                        <div className="w-full h-7 rounded-md border border-neutral-200 bg-neutral-50 px-2 flex items-center">
                          <span className="text-[8px] text-neutral-400">FR76 •••• •••• •••• •••• ••••</span>
                        </div>
                      </div>
                      <div>
                        <div className="w-10 h-1.5 rounded bg-neutral-200 mb-1.5" />
                        <div className="w-full h-7 rounded-md border border-neutral-200 bg-neutral-50 px-2 flex items-center">
                          <span className="text-[8px] text-neutral-400">1 500,00 €</span>
                        </div>
                      </div>
                    </div>

                    {/* Disabled button with lock */}
                    <div className="relative">
                      <button className="w-full py-2.5 rounded-lg bg-neutral-200 text-neutral-400 text-xs font-medium cursor-not-allowed flex items-center justify-center gap-2" disabled>
                        <LockIcon className="w-3 h-3" />
                        Effectuer un virement
                      </button>
                    </div>

                    {/* Tooltip */}
                    <div className="mt-2">
                      <div className="w-full py-2.5 rounded-lg bg-neutral-900 text-white text-xs font-medium flex items-center justify-center gap-2">
                        <LockIcon className="w-3 h-3" />
                        Action non disponible — Mode lecture seule
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div>
            <div className="p-4 md:p-8">
              <h2 className="text-lg font-medium text-neutral-800">
                Aucun stockage sensible
              </h2>
              <p className="text-neutral-600 mt-2 max-w-md text-balance">
                Vos mots de passe bancaires ne sont jamais stockés sur nos
                serveurs. Vos données restent les vôtres.
              </p>
            </div>
            <div className="relative h-80 sm:h-60 md:h-80 overflow-hidden">
              <DataFilterAnimation />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
