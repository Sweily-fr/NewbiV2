"use client";
import React from "react";
import {
  FileText,
  Users,
  Kanban,
  Calendar,
  BarChart3,
  FolderOpen,
  Mail,
  Receipt,
  ShoppingBasket,
  Landmark,
  CircleGauge,
  Clock,
  CheckSquare,
  Flag,
  Tags,
  Filter,
  ListChecks,
  GanttChart,
  LayoutList,
  UserPlus,
  Bell,
  Search,
  Lock,
  Zap,
  ArrowUpDown,
  MessageSquare,
  Paperclip,
  Globe,
  Settings,
  Send,
} from "lucide-react";
import Link from "next/link";

const row1 = [
  { icon: FileText, label: "Factures" },
  { icon: Receipt, label: "Devis" },
  { icon: Users, label: "Clients" },
  { icon: Kanban, label: "Kanban" },
  { icon: GanttChart, label: "Gantt" },
  { icon: LayoutList, label: "Vue Liste" },
  { icon: Calendar, label: "Calendrier" },
  { icon: Landmark, label: "Banque" },
  { icon: ShoppingBasket, label: "Achats" },
  { icon: FolderOpen, label: "Documents" },
];

// Middle rows: each tile gets explicit grid position
// Cols 1-3 = left, cols 4-7 = parent blocks, cols 8-10 = right
const middleTiles = [
  // Row 1 left (cols 1-3)
  { icon: Bell, label: "Notifications", col: 1, row: 1 },
  { icon: BarChart3, label: "Analytiques", col: 2, row: 1 },
  { icon: Flag, label: "Priorités", col: 3, row: 1 },
  // Row 1 right (cols 8-10)
  { icon: CheckSquare, label: "Sous-tâches", col: 8, row: 1 },
  { icon: ListChecks, label: "Checklists", col: 9, row: 1 },
  { icon: Zap, label: "Automatisations", col: 10, row: 1 },
  // Row 2 left
  { icon: Tags, label: "Étiquettes", col: 1, row: 2 },
  { icon: Filter, label: "Filtres", col: 2, row: 2 },
  { icon: UserPlus, label: "Équipe", col: 3, row: 2 },
  // Row 2 right
  { icon: Search, label: "Recherche", col: 8, row: 2 },
  { icon: Lock, label: "Sécurité", col: 9, row: 2 },
  { icon: ArrowUpDown, label: "Drag & Drop", col: 10, row: 2 },
  // Row 3 left
  { icon: MessageSquare, label: "Commentaires", col: 1, row: 3 },
  { icon: Paperclip, label: "Pièces jointes", col: 2, row: 3 },
  { icon: Globe, label: "E-invoicing", col: 3, row: 3 },
  // Row 3 right
  { icon: Settings, label: "Paramètres", col: 8, row: 3 },
  { icon: Receipt, label: "Avoirs", col: 9, row: 3 },
  { icon: FileText, label: "Bons de commande", col: 10, row: 3 },
  // Row 4 left
  { icon: Mail, label: "Signatures", col: 1, row: 4 },
  { icon: Landmark, label: "Trésorerie", col: 2, row: 4 },
  { icon: Lock, label: "RGPD", col: 3, row: 4 },
  // Row 4 right
  { icon: BarChart3, label: "Rapports", col: 8, row: 4 },
  { icon: Calendar, label: "Échéances", col: 9, row: 4 },
  { icon: Zap, label: "Webhooks", col: 10, row: 4 },
];

const row6 = [
  { icon: Send, label: "Export" },
  { icon: Search, label: "Recherche" },
  { icon: UserPlus, label: "Invitations" },
  { icon: ListChecks, label: "Modèles" },
  { icon: Filter, label: "Tri avancé" },
  { icon: Tags, label: "Catégories" },
  { icon: CircleGauge, label: "Statistiques" },
  { icon: Clock, label: "Activité" },
  { icon: FolderOpen, label: "Archives" },
  { icon: Bell, label: "Rappels" },
];

function SmallTile({ icon: Icon, label, active = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-6 px-4 transition-all cursor-pointer group border-b border-r border-[#EEEEEE] ${
        active ? "bg-[#5A50FF]/[0.04]" : "hover:bg-neutral-50/80"
      }`}
    >
      <Icon
        size={26}
        strokeWidth={1.5}
        className={`transition-colors ${
          active
            ? "text-[#5A50FF]"
            : "text-[#838383] group-hover:text-neutral-600"
        }`}
      />
      <span
        className={`text-sm leading-tight text-center transition-colors ${
          active
            ? "text-[#5A50FF] font-medium"
            : "text-[#838383] group-hover:text-neutral-700"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function ParentTile({ icon: Icon, label, color = "#5A50FF" }) {
  return (
    <>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}12` }}
      >
        <Icon size={24} style={{ color }} />
      </div>
      <span className="text-base font-semibold text-neutral-900">
        {label}
      </span>
    </>
  );
}

export default function WallOfFeatures() {
  return (
    <section className="pt-10 md:pt-20 lg:pt-22 relative overflow-hidden">
      <div className="text-center mb-12 md:mb-16 px-4">
        <h2 className="text-3xl md:text-[2.5rem] font-medium tracking-[-0.015em] text-balance text-gray-950 mb-4">
          Tout ce dont vous avez besoin,
          <br className="hidden sm:block" />
          dans une seule plateforme
        </h2>
        <p className="text-md font-normal tracking-tight text-gray-600 mx-auto max-w-2xl">
          +30 fonctionnalités pour gérer vos projets, votre facturation et
          votre activité au quotidien.
        </p>
      </div>

      {/* Mobile: simple 2x2 grid of parent blocks */}
      <div className="block md:hidden px-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F8F9FA] rounded-2xl overflow-hidden aspect-square">
            <img src="/images/wall-projets-preview.png" alt="Projets" className="w-full h-full object-contain" />
          </div>
          <div className="bg-[#F8F9FA] rounded-2xl overflow-hidden aspect-square">
            <img src="/images/wall-vue-liste-preview.png" alt="Vue Liste" className="w-full h-full object-contain" />
          </div>
          <div className="bg-[#F8F9FA] rounded-2xl overflow-hidden aspect-square">
            <img src="/images/wall-vue-gantt-preview.png" alt="Vue Gantt" className="w-full h-full object-contain" />
          </div>
          <div className="bg-[#F8F9FA] rounded-2xl overflow-hidden aspect-square">
            <img src="/images/wall-collaboration-preview.png" alt="Collaboration" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      {/* Desktop: full grid */}
      <div className="relative hidden md:block">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-b from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none" />

        {/* Row 1 with empty row above */}
        <div className="grid grid-cols-10">
          {/* Empty row */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`et-${i}`} className="py-6 border-b border-r border-[#EEEEEE]" />
          ))}
          {/* Row 1 */}
          {row1.map((f, i) => (
            <SmallTile key={`r1-${i}`} {...f} />
          ))}
        </div>

        {/* Middle section: single grid with explicit placement */}
        <div className="grid grid-cols-10 grid-rows-4 bg-[#e5e5e5]">
          {/* Small tiles with explicit positions */}
          {middleTiles.map((tile, i) => {
            const Icon = tile.icon;
            return (
              <div
                key={`mt-${i}`}
                className="flex flex-col items-center justify-center gap-3 py-6 px-4 border-b border-r border-[#EEEEEE] cursor-pointer group bg-white hover:bg-neutral-50/80"
                style={{
                  gridColumn: tile.col,
                  gridRow: tile.row,
                }}
              >
                <Icon
                  size={26}
                  strokeWidth={1.5}
                  className="text-[#838383] group-hover:text-neutral-600 transition-colors"
                />
                <span className="text-sm leading-tight text-center text-[#838383] group-hover:text-neutral-700 transition-colors">
                  {tile.label}
                </span>
              </div>
            );
          })}

          {/* Parent block 1: Projets (cols 4-5, rows 1-2) */}
          <div
            className="flex flex-col bg-white border-r border-b border-[#EEEEEE] rounded-br-2xl overflow-hidden cursor-pointer"
            style={{ gridColumn: "4 / 6", gridRow: "1 / 3" }}
          >
            <img
              src="/images/wall-projets-preview.png"
              alt="Projets preview"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Parent block 2: Vue Liste (cols 6-7, rows 1-2) */}
          <div
            className="bg-white border-b border-r border-[#EEEEEE] rounded-bl-2xl overflow-hidden cursor-pointer"
            style={{ gridColumn: "6 / 8", gridRow: "1 / 3" }}
          >
            <img
              src="/images/wall-vue-liste-preview.png"
              alt="Vue Liste preview"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Parent block 3: Vue Gantt (cols 4-5, rows 3-4) */}
          <div
            className="bg-white border-r border-b border-[#EEEEEE] rounded-tr-2xl overflow-hidden cursor-pointer"
            style={{ gridColumn: "4 / 6", gridRow: "3 / 5" }}
          >
            <img
              src="/images/wall-vue-gantt-preview.png"
              alt="Vue Gantt preview"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Parent block 4: Collaboration (cols 6-7, rows 3-4) */}
          <div
            className="bg-white border-r border-b border-[#EEEEEE] rounded-tl-2xl overflow-hidden cursor-pointer"
            style={{ gridColumn: "6 / 8", gridRow: "3 / 5" }}
          >
            <img
              src="/images/wall-collaboration-preview.png"
              alt="Collaboration preview"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Row 6 with empty row below */}
        <div className="grid grid-cols-10">
          {/* Row 6 */}
          {row6.map((f, i) => (
            <SmallTile key={`r6-${i}`} {...f} />
          ))}
          {/* Empty row */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`eb-${i}`} className="py-6 border-b border-r border-[#EEEEEE]" />
          ))}
        </div>
      </div>

    </section>
  );
}
