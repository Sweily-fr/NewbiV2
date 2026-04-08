"use client";
import React, { useState } from "react";
import { Check } from "lucide-react";

const tabs = [
  {
    label: "Agences",
    title: "Gérez vos projets clients,",
    titleHighlight: "en toute sérénité",
    description:
      "Centralisez briefs, livrables et deadlines pour chaque client dans un espace dédié.",
    checks: [
      "Un board par client ou par projet",
      "Assignez les tâches à votre équipe",
      "Suivez l'avancement en temps réel",
    ],
    features: [
      { img: "https://randomuser.me/api/portraits/women/44.jpg", color: "#5A50FF", text: "Boards dédiés par compte client" },
      { img: "https://randomuser.me/api/portraits/men/32.jpg", color: "#F59E0B", text: "Collaboration en équipe sur chaque brief" },
      { img: "https://randomuser.me/api/portraits/women/68.jpg", color: "#EF4444", text: "Planification Gantt des livrables" },
      { img: "https://randomuser.me/api/portraits/men/75.jpg", color: "#22C55E", text: "Vue Liste pour le suivi détaillé" },
    ],
  },
  {
    label: "Freelances",
    title: "Organisez vos missions,",
    titleHighlight: "sans rien oublier",
    description:
      "Gardez une vue claire sur votre charge, vos deadlines et vos priorités.",
    checks: [
      "Priorisez vos tâches par urgence",
      "Suivez vos deadlines facilement",
      "Gérez plusieurs projets en parallèle",
    ],
    features: [
      { img: "https://randomuser.me/api/portraits/men/22.jpg", color: "#3B82F6", text: "Vue Kanban pour chaque mission" },
      { img: "https://randomuser.me/api/portraits/women/55.jpg", color: "#EC4899", text: "Checklist de sous-tâches détaillées" },
      { img: "https://randomuser.me/api/portraits/men/45.jpg", color: "#F59E0B", text: "Timeline pour planifier vos semaines" },
      { img: "https://randomuser.me/api/portraits/women/12.jpg", color: "#8B5CF6", text: "Archivage des projets terminés" },
    ],
  },
  {
    label: "Startups",
    title: "Coordonnez vos sprints,",
    titleHighlight: "alignez votre équipe",
    description:
      "Pilotez votre roadmap produit et gardez tout le monde synchronisé.",
    checks: [
      "Gérez votre backlog et vos sprints",
      "Priorisez la roadmap avec votre équipe",
      "Détectez les blocages rapidement",
    ],
    features: [
      { img: "https://randomuser.me/api/portraits/women/33.jpg", color: "#EF4444", text: "Sprints visuels en Kanban" },
      { img: "https://randomuser.me/api/portraits/men/52.jpg", color: "#22C55E", text: "Roadmap Gantt pour la planification" },
      { img: "https://randomuser.me/api/portraits/women/21.jpg", color: "#3B82F6", text: "Assignation et collaboration temps réel" },
      { img: "https://randomuser.me/api/portraits/men/67.jpg", color: "#F59E0B", text: "Vue Liste pour les daily standups" },
    ],
  },
  {
    label: "Cabinets",
    title: "Suivez vos dossiers,",
    titleHighlight: "respectez vos échéances",
    description:
      "Répartissez les tâches entre collaborateurs et ne manquez aucune deadline.",
    checks: [
      "Un board par dossier client",
      "Suivi des échéances réglementaires",
      "Répartition claire de la charge",
    ],
    features: [
      { img: "https://randomuser.me/api/portraits/men/11.jpg", color: "#8B5CF6", text: "Dossiers organisés en colonnes" },
      { img: "https://randomuser.me/api/portraits/women/76.jpg", color: "#EC4899", text: "Liste des tâches par collaborateur" },
      { img: "https://randomuser.me/api/portraits/men/36.jpg", color: "#EF4444", text: "Échéances visualisées sur timeline" },
      { img: "https://randomuser.me/api/portraits/women/90.jpg", color: "#22C55E", text: "Partage sécurisé avec les clients" },
    ],
  },
];

export default function TeamsTabSection() {
  const [activeTab, setActiveTab] = useState(0);
  const tab = tabs[activeTab];

  return (
    <section className="pt-10 md:pt-20 lg:pt-22 relative overflow-hidden">
      <div className="max-w-6xl px-4 mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance text-gray-950 mb-4">
            Un Kanban adapté à votre métier
          </h2>
          <p className="text-md font-normal tracking-tight text-gray-600 mx-auto max-w-2xl">
            Agences, freelances, startups ou cabinets — gérez vos projets avec un outil pensé pour votre réalité.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {tabs.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`px-3.5 py-1 rounded-full text-sm font-semibold border-[1.5px] transition-all duration-300 ${
                activeTab === i
                  ? "border-[#5A50FF] border-solid text-[#5A50FF] bg-[#5A50FF]/5"
                  : "border-dashed border-neutral-300 text-neutral-600 hover:border-neutral-400 bg-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="rounded-3xl bg-[#F8F9FA] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left: text content */}
            <div className="p-8 lg:p-12 flex flex-col justify-start">
              <h3 className="text-3xl md:text-4xl font-semibold text-gray-950 leading-tight mb-1">
                {tab.title}
                <br />
                <span className="text-[#838383]">{tab.titleHighlight}</span>
              </h3>

              <p className="text-base text-gray-600 mt-4 mb-8 max-w-md leading-relaxed">
                {tab.description}
              </p>

              {/* Checklist */}
              <ul className="space-y-3">
                {tab.checks.map((check, i) => (
                  <li key={i} className="flex items-center gap-3 text-[15px] text-gray-700">
                    <Check size={18} className="text-[#838383] shrink-0" />
                    {check}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: feature cards */}
            <div className="p-8 lg:p-12 flex flex-col gap-3 justify-center">
              {tab.features.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 bg-white rounded-2xl shadow-sm px-5 py-4"
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ backgroundColor: `${feature.color}15` }}
                    >
                      <img
                        src={feature.img}
                        alt=""
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <span className="text-[15px] font-medium text-gray-900">
                      {feature.text}
                    </span>
                  </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
