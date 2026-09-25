"use client";

import React, { useState } from "react";

// « Quel que soit ton statut » : l'onglet auto-entrepreneur est ouvert par
// défaut pour qu'un micro-entrepreneur se reconnaisse tout de suite, mais les
// deux autres onglets restent visibles — une TPE ou une agence comprend au
// premier coup d'œil que l'outil grandit avec elle.
const PROFILES = [
  {
    id: "micro",
    label: "Auto-entrepreneur",
    headline: "Tu factures seul, sans compta ni assistant",
    points: [
      {
        title: "La mention légale écrite pour toi",
        desc: "« TVA non applicable, art. 293 B du CGI » apparaît d'elle-même tant que tu es en franchise en base.",
      },
      {
        title: "Ton plafond suivi en direct",
        desc: "Newbi additionne ton chiffre d'affaires encaissé et te prévient avant que tu n'approches du seuil.",
      },
      {
        title: "Conforme 2026, sans logiciel de compta",
        desc: "Tes factures partent au format électronique exigé en septembre 2026, micro-entreprise comprise.",
      },
    ],
    invoice: {
      client: "Camille Moreau",
      ref: "F-2026-0058",
      lines: [
        ["Création d'identité visuelle", "900,00 €"],
        ["Déclinaison réseaux sociaux", "300,00 €"],
      ],
      note: "TVA non applicable, art. 293 B du CGI",
      totalLabel: "Total net de taxe",
      total: "1 200,00 €",
    },
  },
  {
    id: "tpe",
    label: "TPE & petite équipe",
    headline: "Vous êtes deux, cinq, dix — et personne à la compta",
    points: [
      {
        title: "La TVA calculée, prête à déclarer",
        desc: "Chaque taux est appliqué à la ligne, le récapitulatif de la période est déjà fait.",
      },
      {
        title: "Chacun son accès",
        desc: "Tu invites ton associé ou ton alternant, tu décides de ce qu'il voit et de ce qu'il peut modifier.",
      },
      {
        title: "Les dépenses rapprochées toutes seules",
        desc: "Tes comptes bancaires sont synchronisés, chaque justificatif se colle à la bonne transaction.",
      },
    ],
    invoice: {
      client: "Novacom Agency",
      ref: "F-2026-0142",
      lines: [
        ["Refonte du site vitrine", "5 400,00 €"],
        ["Hébergement — 12 mois", "600,00 €"],
      ],
      note: "TVA 20 % — 1 200,00 €",
      totalLabel: "Total TTC",
      total: "7 200,00 €",
    },
  },
  {
    id: "societe",
    label: "Agence & société",
    headline: "Des projets, des équipes et des clients au long cours",
    points: [
      {
        title: "Du projet à la facture",
        desc: "Le tableau de bord suit l'avancement, la facture se génère depuis la tâche terminée.",
      },
      {
        title: "Devis, acomptes et avoirs",
        desc: "Le devis signé devient facture, l'acompte se déduit du solde, l'avoir garde la numérotation légale.",
      },
      {
        title: "Un export propre pour l'expert-comptable",
        desc: "Écritures, justificatifs et relevés partent en un fichier, à la date que tu choisis.",
      },
    ],
    invoice: {
      client: "Greentech Solutions",
      ref: "F-2026-0137",
      lines: [
        ["Accompagnement — T3 2026", "12 000,00 €"],
        ["Acompte déjà réglé", "− 4 000,00 €"],
      ],
      note: "TVA 20 % — 1 600,00 €",
      totalLabel: "Reste à payer TTC",
      total: "9 600,00 €",
    },
  },
];

const CARD =
  "rounded-3xl bg-gradient-to-b from-[#F4F4F6] to-[#FAFAFB] p-7 md:p-8 flex flex-col overflow-hidden";

export default function ProfilesSection() {
  const [active, setActive] = useState(PROFILES[0].id);
  const profile = PROFILES.find((p) => p.id === active);

  return (
    <section className="relative overflow-hidden px-0 py-14 md:py-20">
      <div className="max-w-7xl mx-auto px-5">
        <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-tight text-balance text-gray-950 mb-4">
          Quel que soit ton statut
        </h2>
        <p className="text-[17px] leading-relaxed text-gray-600 max-w-2xl mb-8 md:mb-10">
          Newbi s&apos;adapte à la façon dont tu factures aujourd&apos;hui — et
          ne te lâche pas le jour où tu changes de régime, où tu embauches ou où
          tu passes à la TVA.
        </p>

        {/* Sélecteur de profil */}
        <div
          className="flex flex-wrap gap-2 mb-8 md:mb-10"
          role="tablist"
          aria-label="Profils"
        >
          {PROFILES.map((p) => {
            const isActive = p.id === active;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(p.id)}
                className={`rounded-full px-5 py-2.5 text-[15px] transition-colors ${
                  isActive
                    ? "bg-[#5A50FF] text-white font-medium"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div
          key={profile.id}
          className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 animate-[profileIn_.35s_ease-out]"
        >
          {/* Ce qui change concrètement pour ce profil */}
          <div className={`${CARD} md:col-span-5 justify-start`}>
            <h3 className="text-xl md:text-2xl font-medium tracking-tight text-gray-950 mb-6">
              {profile.headline}
            </h3>
            <ul className="flex flex-col gap-5">
              {profile.points.map((pt) => (
                <li key={pt.title} className="flex gap-3">
                  <span className="mt-[7px] size-1.5 rounded-full bg-[#5A50FF] flex-none" />
                  <div>
                    <p className="text-[15px] font-medium text-gray-950">
                      {pt.title}
                    </p>
                    <p className="text-[15px] leading-relaxed text-gray-600 mt-1">
                      {pt.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* La même facture, avec les mentions du statut choisi */}
          <div
            className={`${CARD} md:col-span-7 justify-center items-center min-h-[380px]`}
          >
            <InvoicePreview invoice={profile.invoice} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes profileIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </section>
  );
}

function InvoicePreview({ invoice }) {
  return (
    <div className="w-full max-w-md rounded-2xl bg-white ring-1 ring-black/[0.07] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="text-[13px] text-gray-500">Facture</p>
          <p className="text-[15px] font-medium text-gray-950">{invoice.ref}</p>
        </div>
        <span className="rounded-lg bg-[#EBE6FD] text-[#5B46B8] text-[11px] font-medium px-2.5 py-1">
          Conforme 2026
        </span>
      </div>

      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-[13px] text-gray-500">Client</p>
        <p className="text-[15px] text-gray-950">{invoice.client}</p>
      </div>

      <div className="px-5 py-2">
        {invoice.lines.map(([label, amount]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 py-2.5 text-[14px]"
          >
            <span className="text-gray-700">{label}</span>
            <span className="text-gray-950 tabular-nums whitespace-nowrap">
              {amount}
            </span>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-gray-100 bg-[#FAFAFB]">
        <p className="text-[12px] text-gray-500">{invoice.note}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[13px] text-gray-600">
            {invoice.totalLabel}
          </span>
          <span className="text-[18px] font-medium text-gray-950 tabular-nums">
            {invoice.total}
          </span>
        </div>
      </div>
    </div>
  );
}
