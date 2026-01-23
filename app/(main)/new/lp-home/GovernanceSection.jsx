"use client";
import React from "react";

const activities = [
  {
    color: "bg-blue-500",
    title: "Bilan comptable",
    badge: "2m",
    badgeType: "time",
    desc: "Partagé avec cabinet-expert@comp...",
  },
  {
    color: "bg-green-500",
    title: "Factures Q4",
    badge: "ENVOYÉ",
    badgeType: "success",
    desc: "12 fichiers envoyés à votre compta...",
  },
  {
    color: "bg-orange-500",
    title: "Justificatifs TVA",
    badge: "EN COURS",
    badgeType: "processing",
    desc: "Téléchargement par collaborateur...",
  },
  {
    color: "bg-indigo-500",
    title: "Notes de frais",
    badge: "5m",
    badgeType: "time",
    desc: "Accès accordé à marie@entreprise...",
  },
  {
    color: "bg-blue-500",
    title: "Contrats clients",
    badge: "1h",
    badgeType: "time",
    desc: "Dossier partagé avec équipe juridiq...",
  },
  {
    color: "bg-green-500",
    title: "Rapports annuels",
    badge: "ENVOYÉ",
    badgeType: "success",
    desc: "Documents transmis au commissai...",
  },
  {
    color: "bg-orange-500",
    title: "Pièces justificatives",
    badge: "EN COURS",
    badgeType: "processing",
    desc: "Synchronisation avec votre expert...",
  },
];

const images = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80",
  "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=256&q=80",
  "https://images.unsplash.com/photo-1654110455429-cf322b40a906?w=256&q=80",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=256&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80",
  "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=256&q=80",
];

export default function GovernanceSection() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 lg-pb-10 relative overflow-hidden">
      <div className="max-w-[1400px] px-4 md:px-8 mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[#5A50FF] mb-3">
            ET CE N'EST PAS TOUT
          </span>
          <h2 className="text-3xl md:text-4xl font-normal tracking-[-0.015em] text-balance text-gray-950 dark:text-gray-50 mb-4">
            Des outils supplémentaires pour aller plus loin
          </h2>
          <p className="text-md font-normal tracking-tight text-gray-600 dark:text-gray-300 mx-auto mb-8 max-w-2xl">
            En plus de la gestion financière, profitez d'une suite d'outils
            collaboratifs pour optimiser votre quotidien professionnel.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-y border-neutral-200 dark:border-neutral-800 divide-neutral-200 dark:divide-neutral-800">
          <AuditTrail />
          <RoleBasedAccess />
          <ApprovalQueue />
          <GuardrailEngine />
        </div>
      </div>
    </section>
  );
}

function AuditTrail() {
  return (
    <div className="md:border-r border-b border-neutral-200 dark:border-neutral-800">
      <div className="p-4 md:p-8">
        <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
          Partage de documents
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2 max-w-md text-balance">
          Partagez vos documents comptables et professionnels avec votre
          expert-comptable ou vos collaborateurs en toute sécurité.
        </p>
      </div>
      <div className="relative h-80 sm:h-60 flex flex-col md:h-80 overflow-hidden perspective-distant">
        <div className="flex-1 rounded-t-3xl gap-2 flex flex-col bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 mx-auto w-full h-full absolute inset-x-10 inset-y-2 pt-2 px-2">
          <div className="shadow-black/10 gap-4 border bg-white dark:bg-neutral-900 border-transparent ring-1 rounded-tl-[16px] ring-black/10 flex flex-col items-start flex-1">
            <div className="flex items-center gap-2 border-b w-full py-2 px-4">
              <ActivityIcon />
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Activité récente
              </p>
            </div>
            {activities.map((a, i) => (
              <ActivityItem key={i} {...a} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ color, title, badge, badgeType, desc }) {
  return (
    <div className="w-full" style={{ opacity: 1 }}>
      <div className="flex justify-between items-center w-full pl-4 relative overflow-hidden">
        <div className="items-center gap-2 flex">
          <div
            className={`size-5 rounded-sm text-white flex items-center justify-center ${color}`}
          >
            <SmallIcon />
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {title}
          </p>
          <Badge type={badgeType} value={badge} />
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 flex-nowrap max-w-[16rem] w-full text-left whitespace-nowrap overflow-hidden">
          {desc}
        </p>
      </div>
    </div>
  );
}

function Badge({ type, value }) {
  if (type === "time")
    return (
      <div className="flex gap-1 items-center px-1 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-200/10 dark:bg-neutral-200/10">
        <ClockIcon />
        <p className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
          {value}
        </p>
      </div>
    );
  if (type === "failed")
    return (
      <div className="flex gap-1 items-center px-1 py-0.5 rounded-md bg-red-100 border border-red-200 dark:bg-red-100/10 dark:border-red-200/10">
        <p className="text-[10px] font-bold text-red-500">{value}</p>
      </div>
    );
  if (type === "success")
    return (
      <div className="flex gap-1 items-center px-1 py-0.5 rounded-md bg-green-100 border border-green-200 dark:bg-green-100/10 dark:border-green-200/10">
        <p className="text-[10px] font-bold text-green-500">{value}</p>
      </div>
    );
  if (type === "processing")
    return (
      <div className="flex gap-1 items-center px-1 py-0.5 rounded-md bg-orange-100 border border-orange-200 dark:bg-orange-100/10 dark:border-orange-200/10">
        <p className="text-[10px] font-bold text-orange-500">{value}</p>
      </div>
    );
  return null;
}

function RoleBasedAccess() {
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="p-4 md:p-8">
        <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
          Signature de mail
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2 max-w-md text-balance">
          Créez des signatures email professionnelles et uniformes pour toute
          votre équipe en quelques clics.
        </p>
      </div>
      <div className="relative h-80 sm:h-60 flex flex-col md:h-80 overflow-hidden perspective-distant mask-radial-from-20%">
        <div className="flex-1 rounded-t-3xl gap-4 space-y-4 w-full h-full px-8 flex-col items-center justify-center">
          <div className="grid grid-cols-4 gap-2 justify-center max-w-md mx-auto">
            <GridItem />
            <GridItem img={images[0]} />
            <GridItem img={images[1]} />
            <GridItem />
          </div>
          <div className="grid grid-cols-5 gap-2">
            <GridItem />
            <GridItem img={images[2]} />
            <GridItem icon />
            <GridItem img={images[3]} />
            <GridItem />
          </div>
          <div className="grid grid-cols-4 justify-center max-w-md mx-auto gap-2">
            <GridItem />
            <GridItem img={images[4]} />
            <GridItem img={images[5]} />
            <GridItem />
          </div>
        </div>
      </div>
    </div>
  );
}

function GridItem({ img, icon }) {
  return (
    <div className="w-full justify-self-center aspect-square rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 relative p-[1px]">
      <div
        className={`flex items-center justify-center w-full h-full rounded-[12px] p-[1px] relative z-10 ${img ? "bg-gradient-to-br from-blue-500 via-transparent to-blue-500" : ""}`}
      >
        {img && (
          <img
            alt="item"
            loading="lazy"
            width="120"
            height="120"
            className="object-cover aspect-square rounded-[12px] relative z-20"
            src={img}
          />
        )}
        {icon && (
          <div className="h-full w-full bg-white dark:bg-neutral-900 rounded-[12px] flex items-center justify-center">
            <LogoIcon />
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-[image:repeating-linear-gradient(315deg,_rgba(0,0,0,0.05)_0,_rgba(0,0,0,0.05)_1px,_transparent_0,_transparent_50%)] bg-[size:5px_5px] rounded-xl bg-fixed"></div>
    </div>
  );
}

function ApprovalQueue() {
  return (
    <div className="border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800">
      <div className="p-4 md:p-8">
        <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
          Transfert de fichiers
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2 max-w-md text-balance">
          Envoyez des fichiers volumineux en toute sécurité avec suivi de
          téléchargement et notifications automatiques.
        </p>
      </div>
      <div className="relative h-80 sm:h-60 flex flex-col md:h-80 overflow-hidden perspective-distant mask-radial-from-20% mask-r-from-50%">
        <div className="flex-1 rounded-t-3xl gap-2 flex flex-col z-20 mx-auto w-full h-full absolute inset-0 pt-2 px-2 perspective-[4000px] max-w-lg">
          <ApprovalSVG1 />
          <ApprovalSVG2 />
          <div
            className="flex items-center justify-center gap-20 h-[200%] absolute -inset-x-[150%] -inset-y-40 [background-size:40px_40px] [background-image:linear-gradient(to_right,rgba(200,200,200,1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(200,200,200,1)_1px,transparent_1px)] mask-radial-from-50% mask-t-from-50% mask-b-from-50%"
            style={{
              transform: "rotateY(20deg) rotateX(50deg) rotateZ(40deg)",
            }}
          >
            <div className="px-4 py-2 rounded-full bg-orange-100 border border-orange-300 text-orange-500 font-medium flex items-center gap-2">
              <SettingsIcon />
              <span>En cours</span>
            </div>
            <div className="px-4 py-2 rounded-full bg-green-100 border border-green-300 text-green-500 font-medium flex items-center gap-2">
              <SparklesIcon />
              <span>Téléchargé</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GuardrailEngine() {
  return (
    <div className="dark:border-neutral-800">
      <div className="p-4 md:p-8">
        <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
          Gestion de projets
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2 max-w-md text-balance">
          Suivez l'avancement de vos projets avec des tableaux visuels simples.
          Organisez vos tâches par statut et ne perdez plus rien de vue.
        </p>
      </div>
      <div className="relative h-80 sm:h-60 flex flex-col md:h-80 overflow-hidden perspective-distant">
        <div>
          <div className="flex gap-4 items-center justify-center max-w-lg mx-auto flex-wrap mb-4">
            <FilterBtn color="blue" label="À faire" />
            <FilterBtn color="orange" label="En cours" active />
            <FilterBtn color="green" label="Terminé" />
            <FilterBtn color="purple" label="Validé" />
          </div>
          <div className="flex-1 rounded-t-3xl gap-2 flex flex-col bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-700 border border-neutral-200 max-w-[20rem] lg:max-w-sm mx-auto w-full h-full absolute inset-x-0 p-2">
            <div className="p-4 shadow-black/10 gap-4 border bg-white dark:bg-neutral-900 border-transparent ring-1 rounded-[16px] ring-black/10 flex items-start flex-col">
              <div className="flex items-center gap-2">
                <div className="size-6 shrink-0 rounded-full flex mt-1 items-center justify-center bg-purple-100 border border-purple-200 dark:bg-purple-100/10 dark:border-purple-200/10">
                  <FilterSearchIcon />
                </div>
                <p className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                  En cours
                </p>
              </div>
              <div>
                <p className="text-base text-neutral-600">Déclaration TVA Q4</p>
                <p className="text-sm mt-2 mb-4 text-neutral-600 dark:text-neutral-400 rounded-sm border border-neutral-200 dark:border-neutral-200/10 px-2 border-dashed py-1">
                  Rassembler tous les justificatifs et préparer le dossier pour
                  l'expert-comptable. Échéance : 20 janvier.
                </p>
                <div className="mt-2 flex flex-row flex-wrap gap-2">
                  <IntBadge label="Comptabilité" color="#F59E0B" />
                  <IntBadge label="Urgent" color="#EF4444" />
                  <IntBadge label="Admin" color="#6366F1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterBtn({ color, label, active }) {
  const colors = {
    blue: "bg-blue-100 border-blue-200",
    green: "bg-green-100 border-green-200",
    orange: "bg-orange-100 border-orange-200",
    indigo: "bg-indigo-100 border-indigo-200",
    neutral: "bg-neutral-100 border-neutral-200",
    purple: "bg-purple-100 border-purple-200",
  };
  return (
    <button
      className={`px-2 py-1 rounded-sm relative text-xs gap-1 cursor-pointer flex items-center justify-center border ${colors[color]} ${active ? "opacity-100" : "opacity-50"}`}
    >
      {label}
    </button>
  );
}

function IntBadge({ label, color }) {
  return (
    <div className="flex items-center gap-1 w-fit rounded-sm px-1 py-0.5 border border-neutral-200 dark:border-neutral-200/10 text-sm">
      <div
        className="size-3 rounded-full"
        style={{ backgroundColor: color }}
      ></div>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}

function ActivityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g opacity="0.8">
        <path
          d="M3.2 2.4V4.8H6.4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.2 4.8V10.4C3.2 11.3 3.9 12 4.8 12H6.4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="8.8"
          y="2.4"
          width="4"
          height="4"
          rx="0.4"
          fill="currentColor"
        />
        <rect
          x="8.8"
          y="9.6"
          width="4"
          height="4"
          rx="0.4"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}
function SmallIcon() {
  return (
    <svg width="8" height="8" fill="white">
      <circle cx="4" cy="4" r="3" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function LogoIcon() {
  return (
    <svg width="20" height="15" viewBox="0 0 20 15" fill="currentColor">
      <path d="M4.9 14.9H0V10H4.9V14.9ZM19.7 14.9H9.8V10H4.9V5H9.8V0.1H19.7V14.9ZM9.8 10H14.8V5H9.8V10ZM4.9 5H0V0.1H4.9V5Z" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M10.3 4.3c.4-1.8 2.9-1.8 3.4 0a1.7 1.7 0 002.6 1.1c1.5-.9 3.3.8 2.4 2.4a1.7 1.7 0 001 2.6c1.8.4 1.8 2.9 0 3.3a1.7 1.7 0 00-1 2.6c.9 1.5-.9 3.3-2.4 2.4a1.7 1.7 0 00-2.6 1c-.4 1.8-2.9 1.8-3.3 0a1.7 1.7 0 00-2.6-1c-1.5.9-3.3-.9-2.4-2.4a1.7 1.7 0 00-1-2.6c-1.8-.4-1.8-2.9 0-3.3a1.7 1.7 0 001-2.6c-.9-1.5.9-3.3 2.4-2.4 1 .6 2.3.1 2.6-1z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function SparklesIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M16 18a2 2 0 012 2 2 2 0 012-2 2 2 0 01-2-2 2 2 0 01-2 2zm0-12a2 2 0 012 2 2 2 0 012-2 2 2 0 01-2-2 2 2 0 01-2 2zm-7 12a6 6 0 016-6 6 6 0 01-6-6 6 6 0 01-6 6 6 6 0 016 6z" />
    </svg>
  );
}
function FilterSearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-purple-500"
    >
      <path d="M4 6h16M6 12h8.5M9 18h2" />
      <circle cx="18" cy="18" r="3" />
      <path d="M20.2 20.2l1.8 1.8" />
    </svg>
  );
}
function ApprovalSVG1() {
  return (
    <svg
      width="190"
      height="197"
      viewBox="0 0 190 197"
      fill="none"
      className="absolute left-40 -top-4 mx-auto z-30"
    >
      <path
        d="M59.9 36.1C100.3 49.8 140 99 153.9 150.5L155.8 148.2C158.4 145.1 163.8 146.9 167.9 152.3C171.9 157.7 173.1 164.7 170.4 167.8L156.9 183.7C154.3 186.8 148.8 185 144.8 179.6L124.3 152.2C120.3 146.8 119.2 139.9 121.8 136.7C124.5 133.6 129.9 135.4 133.9 140.8L136.3 143.9C124.4 104.9 94.2 68.4 63.4 57.9C42.3 50.8 25.7 57.6 17.4 73.9C15.4 77.8 10.2 77.1 5.8 72.2C1.4 67.4-0.5 60.2 1.5 56.3C12 35.6 33 27 59.9 36.1Z"
        fill="url(#g1)"
        stroke="url(#g2)"
        strokeWidth="0.2"
      />
      <defs>
        <linearGradient id="g1" x1="86" y1="49" x2="44" y2="123">
          <stop stopColor="#CCC" />
          <stop offset="1" stopColor="#F7F7F7" />
        </linearGradient>
        <linearGradient id="g2" x1="86" y1="49" x2="44" y2="123">
          <stop />
          <stop offset="1" stopOpacity="0.5" />
        </linearGradient>
      </defs>
    </svg>
  );
}
function ApprovalSVG2() {
  return (
    <svg
      width="191"
      height="198"
      viewBox="0 0 191 198"
      fill="none"
      className="absolute left-32 -bottom-10 mx-auto blur-[2px]"
    >
      <path
        d="M145.1 85.1C149.2 84.4 154.6 88.8 157.2 95L170.7 126.5C173.4 132.7 172.2 138.3 168.2 139C164.2 139.8 158.7 135.3 156.1 129.1L154.2 124.7C140.3 160.1 100.6 163.6 60.2 130.6C33.4 108.7 12.3 75.7 1.8 42.9C-0.2 36.6 1.7 31.8 6.1 32C10.5 32.2 15.7 37.5 17.7 43.7C26 69.6 42.6 95.6 63.7 112.8C94.5 137.9 124.7 136.2 136.6 110.9L134.3 111.3C130.2 112.1 124.8 107.6 122.1 101.4C119.5 95.2 120.6 89.6 124.6 88.9L145.1 85.1Z"
        fill="url(#g3)"
        stroke="url(#g4)"
        strokeWidth="0.2"
      />
      <defs>
        <linearGradient id="g3" x1="87" y1="50" x2="44" y2="123">
          <stop stopColor="#CCC" />
          <stop offset="1" stopColor="#F7F7F7" />
        </linearGradient>
        <linearGradient id="g4" x1="87" y1="50" x2="44" y2="123">
          <stop />
          <stop offset="1" stopOpacity="0.5" />
        </linearGradient>
      </defs>
    </svg>
  );
}
