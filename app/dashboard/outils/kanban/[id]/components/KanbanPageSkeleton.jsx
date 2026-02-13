"use client";

import { Skeleton } from "@/src/components/ui/skeleton";

/**
 * Skeleton de chargement générique pour la page Kanban
 * Affiche un skeleton unifié qui fonctionne pour toutes les vues
 * Pas de lecture de localStorage pour éviter les problèmes d'hydratation
 */
export function KanbanPageSkeleton() {
  // Skeleton générique qui fonctionne pour toutes les vues
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      {/* Header - Titre du projet */}
      <div className="flex-shrink-0 bg-background z-10">
        <div className="flex items-center gap-2 pt-2 pb-2 border-b px-4 sm:px-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-4 rounded" />
        </div>
        
        {/* Tabs et boutons d'action */}
        <div className="flex items-center justify-between gap-3 py-3 border-b px-4 sm:px-6">
          {/* Tabs: Board, List, Gantt */}
          <div className="flex items-center gap-1">
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
          
          {/* Boutons d'action */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-40 rounded-md" />
          </div>
        </div>
      </div>

      {/* Contrôles: Recherche, Filtres, Zoom */}
      <div className="sticky left-0 px-4 sm:px-6 py-3 bg-background z-10 flex items-center gap-4">
        {/* Barre de recherche + Filtres */}
        <div className="flex items-center">
          <Skeleton className="h-9 w-[250px] rounded-l-md rounded-r-none" />
          <Skeleton className="h-9 w-24 rounded-l-none rounded-r-md" />
        </div>
        
        {/* Contrôles de zoom */}
        <div className="flex items-center gap-1 ml-auto">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>

      {/* Colonnes du Kanban */}
      <div className="flex-1 overflow-hidden px-4 sm:px-6 mt-4">
        <div className="h-full overflow-x-auto overflow-y-hidden pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex gap-4 sm:gap-6 flex-nowrap items-start h-full">
            {[1, 2, 3, 4].map((i) => (
              <KanbanColumnSkeleton key={i} taskCount={i === 1 ? 4 : i === 2 ? 3 : 2} />
            ))}
            
            {/* Bouton Ajouter une colonne */}
            <div className="w-72 sm:w-80 h-fit border-2 border-dashed border-border/30 rounded-xl p-3 flex-shrink-0">
              <div className="flex flex-col items-center justify-center gap-1 h-16">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton pour une colonne du Kanban
 */
function KanbanColumnSkeleton({ taskCount = 3 }) {
  return (
    <div className="bg-muted/20 rounded-xl p-2 sm:p-3 min-w-[240px] max-w-[240px] sm:min-w-[300px] sm:max-w-[300px] border border-border/50 flex-shrink-0">
      {/* Header de la colonne */}
      <div className="flex items-center justify-between gap-2 px-2 mb-3">
        <div className="flex items-center gap-2 flex-1">
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-4 w-6 rounded-full ml-auto" />
        </div>
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      
      {/* Tâches */}
      <div className="space-y-2 sm:space-y-3 p-2">
        {Array.from({ length: taskCount }).map((_, j) => (
          <TaskCardSkeleton key={j} />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton pour une carte de tâche
 */
function TaskCardSkeleton() {
  return (
    <div className="bg-card text-card-foreground rounded-lg border border-border p-2 sm:p-3 shadow-xs min-h-[120px] flex flex-col gap-2">
      {/* En-tête avec titre */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-1">
          <Skeleton className="h-4 w-4/5 rounded" />
          <Skeleton className="h-3 w-2/3 rounded" />
        </div>
        <Skeleton className="h-4 w-4 rounded" />
      </div>

      {/* Tags */}
      <div className="flex gap-1 mt-1">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>

      {/* Pied de carte */}
      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton pour la vue Liste du Kanban
 */
export function KanbanListSkeleton() {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      {/* Header - Titre du projet */}
      <div className="flex-shrink-0 bg-background z-10">
        <div className="flex items-center gap-2 pt-2 pb-2 border-b px-4 sm:px-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-4 rounded" />
        </div>
        
        {/* Tabs et boutons d'action */}
        <div className="flex items-center justify-between gap-3 py-3 border-b px-4 sm:px-6">
          <div className="flex items-center gap-1">
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-40 rounded-md" />
          </div>
        </div>
      </div>

      {/* Contrôles */}
      <div className="sticky left-0 px-4 sm:px-6 py-3 bg-background z-10 flex items-center gap-4">
        <div className="flex items-center">
          <Skeleton className="h-9 w-[250px] rounded-l-md rounded-r-none" />
          <Skeleton className="h-9 w-24 rounded-l-none rounded-r-md" />
        </div>
      </div>

      {/* Table header */}
      <div className="px-4 sm:px-6">
        <div className="flex items-center gap-4 py-2 border-b">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20 ml-auto" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Liste des sections */}
      <div className="flex-1 overflow-auto px-4 sm:px-6">
        {[1, 2, 3].map((section) => (
          <div key={section} className="mb-4">
            {/* Header de section */}
            <div className="flex items-center gap-3 py-2 bg-muted/20 px-3 rounded-md mb-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
            
            {/* Lignes de tâches */}
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-4 py-3 border-b border-border/40 px-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-4 rounded opacity-30" />
                <Skeleton className="h-4 w-48" />
                <div className="flex -space-x-2 ml-auto">
                  <Skeleton className="h-7 w-7 rounded-full" />
                </div>
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-6 w-6 rounded opacity-30" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton pour la vue Gantt du Kanban
 */
export function KanbanGanttSkeleton() {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      {/* Header - Titre du projet */}
      <div className="flex-shrink-0 bg-background z-10">
        <div className="flex items-center gap-2 pt-2 pb-2 border-b px-4 sm:px-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-4 rounded" />
        </div>
        
        {/* Tabs et boutons d'action */}
        <div className="flex items-center justify-between gap-3 py-3 border-b px-4 sm:px-6">
          <div className="flex items-center gap-1">
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-40 rounded-md" />
          </div>
        </div>
      </div>

      {/* Gantt Chart Skeleton */}
      <div className="flex-1 overflow-hidden">
        {/* Header du Gantt avec dates */}
        <div className="flex border-b bg-muted/20">
          <div className="w-64 flex-shrink-0 p-3 border-r">
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex-1 flex">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-1 p-2 border-r border-border/30 min-w-[60px]">
                <Skeleton className="h-3 w-8 mx-auto" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Lignes du Gantt */}
        <div className="overflow-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
            <div key={row} className="flex border-b border-border/30">
              {/* Nom de la tâche */}
              <div className="w-64 flex-shrink-0 p-3 border-r flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
              {/* Barre de progression */}
              <div className="flex-1 relative p-2">
                <div 
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ 
                    left: `${(row * 7) % 40 + 5}%`, 
                    width: `${20 + (row * 5) % 30}%` 
                  }}
                >
                  <Skeleton className="h-6 w-full rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { KanbanColumnSkeleton, TaskCardSkeleton };
