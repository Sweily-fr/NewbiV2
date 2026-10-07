"use client";

import dynamic from "next/dynamic";
import React from "react";
import {
  Shield,
  LockOpen,
  Lock as LockIcon,
  Eye,
  ServerCrash,
} from "lucide-react";
// Animation gsap chargée dans son propre chunk (hors chemin critique SEO)
const DataFilterAnimation = dynamic(() => import("./DataFilterAnimation"), {
  ssr: false,
});

// Mêmes jetons visuels que la section « Gardez un œil sur chaque euro ».
const CARD =
  "rounded-3xl bg-gradient-to-b from-[#F4F4F6] to-[#FAFAFB] p-7 md:p-8 flex flex-col overflow-hidden";
const TITLE =
  "text-xl md:text-2xl font-medium tracking-tight text-gray-950 mb-3";
const TEXT = "text-[15px] leading-relaxed text-gray-700";

export default function BankSecuritySection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 lg-pb-10 relative overflow-hidden px-5">
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
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-4">
          Vos données bancaires en sécurité
        </h2>
        <p className="text-[17px] leading-relaxed text-gray-600 max-w-2xl mb-10 md:mb-14">
          La synchronisation bancaire repose sur des standards de sécurité
          bancaires. Vos données sont protégées à chaque instant.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
          <article
            className={`${CARD} md:col-span-7 min-h-[420px] pb-0 md:pb-0`}
          >
            <h3 className={TITLE}>Connexion sécurisée</h3>
            <p className={`${TEXT} max-w-lg`}>
              Vos identifiants bancaires ne transitent jamais par nos serveurs.
              La connexion passe par un prestataire agréé par l&apos;ACPR.
            </p>
            <div className="relative flex-1 min-h-[300px] mt-6 -mx-7 md:-mx-8 overflow-hidden flex items-center justify-center px-8">
              <div className="flex items-center gap-0 w-full max-w-[480px]">
                {/* Newbi */}
                <div className="flex flex-col items-center gap-2.5 shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center overflow-hidden">
                    <img
                      src="/newbi-icon.svg"
                      alt="Newbi"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium text-neutral-800">
                    Newbi
                  </span>
                </div>

                {/* Line 1 */}
                <div className="flex-1 flex items-center justify-center -mt-6 relative">
                  <div
                    className="w-full border-t border-dashed border-neutral-300"
                    style={{ animation: "revealLine1 3s ease-out forwards" }}
                  />
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <LockOpen
                      className="w-3.5 h-3.5 text-neutral-300 absolute"
                      style={{
                        opacity: 0,
                        animation: "lockOpen1 3s ease-out forwards",
                      }}
                    />
                    <LockIcon
                      className="w-3.5 h-3.5 text-neutral-300 absolute"
                      style={{
                        opacity: 0,
                        animation: "lockClosed1 3s ease-out forwards",
                      }}
                    />
                  </div>
                </div>

                {/* Bridge API */}
                <div className="flex flex-col items-center gap-2.5 shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center overflow-hidden">
                    <img
                      src="https://cdn.brandfetch.io/idnA3rbFGH/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1690558247926"
                      alt="Bridge API"
                      className="w-full h-full object-cover rounded-xl translate-y-1"
                    />
                  </div>
                  <span className="text-sm font-medium text-neutral-800">
                    Bridge API
                  </span>
                </div>

                {/* Line 2 */}
                <div className="flex-1 flex items-center justify-center -mt-6 relative">
                  <div
                    className="w-full border-t border-dashed border-neutral-300"
                    style={{ animation: "revealLine2 3s ease-out forwards" }}
                  />
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <LockOpen
                      className="w-3.5 h-3.5 text-neutral-300 absolute"
                      style={{
                        opacity: 0,
                        animation: "lockOpen2 3s ease-out forwards",
                      }}
                    />
                    <LockIcon
                      className="w-3.5 h-3.5 text-neutral-300 absolute"
                      style={{
                        opacity: 0,
                        animation: "lockClosed2 3s ease-out forwards",
                      }}
                    />
                  </div>
                </div>

                {/* Banque */}
                <div className="flex flex-col items-center gap-2.5 shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center overflow-hidden">
                    <img
                      src="https://cdn.brandfetch.io/iddTHt7H9X/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1667628466273"
                      alt="Banque"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                  <span className="text-sm font-medium text-neutral-800">
                    Votre banque
                  </span>
                </div>
              </div>
            </div>
          </article>

          <article
            className={`${CARD} md:col-span-5 min-h-[420px] pb-0 md:pb-0`}
          >
            <h3 className={TITLE}>Chiffrement 256 bits</h3>
            <p className={TEXT}>
              Toutes vos données sont chiffrées de bout en bout avec le même
              niveau de sécurité que votre banque.
            </p>
            <div className="relative flex-1 min-h-[300px] mt-6 -mx-7 md:-mx-8 overflow-hidden perspective-distant">
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
                      <p className="text-sm font-semibold text-neutral-800">
                        {notif.title}
                      </p>
                      <p className="text-xs text-neutral-400">{notif.desc}</p>
                    </div>
                    <span
                      className={`text-[9px] font-medium px-2 py-1 rounded-md border shrink-0 ${notif.badgeColor}`}
                    >
                      {notif.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* Carte photo, comme celle du bento « Garde le contrôle de ton
              activité » : image plein cadre, voile sombre, texte en blanc */}
          <article className="relative rounded-3xl overflow-hidden min-h-[340px] md:col-span-6 flex flex-col justify-end p-7 md:p-8 text-white">
            <img
              src="/lp/tresorerie/lecture-seule.jpg"
              alt=""
              className="absolute inset-0 size-full object-cover object-[60%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/10" />
            <div className="relative">
              <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-3">
                Lecture seule
              </h3>
              <p className="text-[15px] leading-relaxed text-white/85 max-w-md">
                Newbi accède à vos transactions en lecture seule. Aucun
                virement, aucune modification n&apos;est possible depuis notre
                plateforme.
              </p>
            </div>
          </article>

          <article className={`${CARD} md:col-span-6 pb-0 md:pb-0`}>
            <h3 className={TITLE}>Aucun stockage sensible</h3>
            <p className={TEXT}>
              Vos mots de passe bancaires ne sont jamais stockés sur nos
              serveurs. Vos données restent les vôtres.
            </p>
            <div className="relative flex-1 min-h-[280px] mt-6 -mx-7 md:-mx-8 overflow-hidden">
              <DataFilterAnimation />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
