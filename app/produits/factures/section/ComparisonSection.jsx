"use client";
import React from "react";

const withoutItems = [
  {
    label: "Risqué",
    desc: "Mentions légales manquantes rendant vos documents non conformes",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
      </svg>
    ),
  },
  {
    label: "Chronophage",
    desc: "Copier-coller redondant de factures, risques d'erreur de calcul",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    label: "Amateur",
    desc: "Design basique qui ne met pas vos prestations en valeur",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01" />
      </svg>
    ),
  },
  {
    label: "Stressant",
    desc: "Difficulté à suivre vos paiements, trous dans la trésorerie",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zM8 15s1.5-2 4-2 4 2 4 2" /><path d="M9 9l.01 0M15 9l.01 0" />
      </svg>
    ),
  },
  {
    label: "Limité",
    desc: "Difficile à gérer quand l'activité grandit",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
  },
];

const withItems = [
  {
    label: "Sécurisé",
    desc: "Documents pré-remplis et toujours 100% conformes aux dernières lois",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: "Rapide",
    desc: "Vos devis transformés en factures en 1 clic, sans ressaisie ni erreur",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    label: "Personnalisable",
    desc: "Vos devis et factures à votre image, mettant vos clients en confiance",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.8-.1 2.6-.4" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4" />
      </svg>
    ),
  },
  {
    label: "Clair",
    desc: "Alertes en cas de retard, suivi des paiements en temps réel",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    label: "Illimité",
    desc: "Créez autant de devis et factures que nécessaire, sans restriction",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-5.095-8 0-8zM5.822 8c-5.096 0-5.096 8 0 8 5.095 0 5.095-8 0-8z" />
      </svg>
    ),
  },
];

export default function ComparisonSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 relative overflow-hidden">
      <div className="max-w-6xl px-4 mx-auto">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5A50FF] mb-3">
            Pourquoi choisir Newbi
          </span>
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-gray-950 mb-4">
            Pourquoi continuer à perdre du temps ?
          </h2>
          <p className="text-md font-normal tracking-tight text-gray-600 mx-auto max-w-2xl">
            Comparez votre quotidien sans et avec Newbi.
          </p>
        </div>

        {/* Comparison grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Sans Newbi */}
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex flex-row flex-wrap items-center justify-center gap-4 p-3 h-16">
              <div className="flex shrink-0 justify-center">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              </div>
              <p className="text-lg">
                <strong className="text-neutral-500">Sans Newbi : </strong>
                <span className="text-neutral-500">la perte de temps</span>
              </p>
            </div>

            {/* Card */}
            <div className="rounded-2xl bg-[#efefef] p-1.5 flex-1">
              <div className="bg-white flex flex-col items-start gap-1 rounded-xl p-3 h-full ring-1 ring-black/[0.07]">
                {withoutItems.map((item, i) => (
                  <div key={i} className="flex items-start justify-start gap-3 self-stretch p-3">
                    <div className="shrink-0 mt-0.5">{item.icon}</div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-600">{item.label}</p>
                      <p className="text-sm text-neutral-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Avec Newbi */}
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex flex-row flex-wrap items-center justify-center gap-4 p-3 h-16">
              <div className="flex shrink-0 justify-center">
                <img src="/newbiLetter.png" alt="Newbi" className="h-5 w-auto object-contain" />
              </div>
              <p className="text-lg">
                <strong className="text-neutral-800">Avec Newbi : </strong>
                <span className="text-neutral-800">le gain de temps</span>
              </p>
            </div>

            {/* Card */}
            <div className="rounded-2xl bg-[#5A50FF]/10 p-1.5 flex-1">
              <div className="bg-white flex flex-col items-start gap-1 rounded-xl p-3 h-full ring-1 ring-[#5A50FF]/[0.15]">
                {withItems.map((item, i) => (
                  <div key={i} className="flex items-start justify-start gap-3 self-stretch p-3">
                    <div className="shrink-0 mt-0.5">{item.icon}</div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">{item.label}</p>
                      <p className="text-sm text-neutral-600 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
