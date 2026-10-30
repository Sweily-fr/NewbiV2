"use client";

import { ArrowUpDown } from "lucide-react";
import { cn } from "@/src/lib/utils";

/**
 * En-tête de colonne triable des listes de documents (TanStack Table) : un
 * vrai bouton, atteint au clavier (Tab, Entrée) et annoncé par les lecteurs
 * d'écran, là où une zone cliquable ne l'était pas. Un clic alterne l'ordre
 * croissant et décroissant, comme avant.
 */
export function SortableColumnHeader({ column, children, className }) {
  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className={cn(
        "flex items-center cursor-pointer font-normal rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
    >
      {children}
      <ArrowUpDown className="ml-2 h-3 w-3" aria-hidden="true" />
    </button>
  );
}
