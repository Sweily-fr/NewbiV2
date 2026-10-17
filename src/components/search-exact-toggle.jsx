"use client";

import { CaseSensitive } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { cn } from "@/src/lib/utils";

/**
 * Bouton « Aa » à placer dans une barre de recherche de liste : décoché (par
 * défaut), la recherche ignore majuscules et accents ; coché, elle les
 * respecte à la lettre. Voir src/utils/search-text.js.
 */
export function SearchExactToggle({ pressed, onPressedChange, className }) {
  const label = pressed
    ? "Recherche exacte : majuscules et accents respectés"
    : "Respecter les majuscules et les accents";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-pressed={pressed}
          aria-label="Respecter les majuscules et les accents"
          onClick={() => onPressedChange?.(!pressed)}
          className={cn(
            "inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors",
            pressed
              ? "bg-[#5A50FF]/10 text-[#5A50FF] dark:bg-[#5A50FF]/20 dark:text-[#8F88FF]"
              : "text-muted-foreground/80 hover:bg-accent hover:text-foreground",
            className,
          )}
        >
          <CaseSensitive size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export default SearchExactToggle;
