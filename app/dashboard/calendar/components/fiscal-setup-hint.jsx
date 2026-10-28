"use client";

import { Info } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { fiscalMissingConcerns } from "@/src/utils/calendar-linked-items";

// Ouvre les paramètres sur l'onglet « Informations légales », par le même
// canal que les notifications (écouté par le layout du tableau de bord)
function openLegalSettings() {
  window.dispatchEvent(
    new CustomEvent("newbi:open-settings", {
      detail: { tab: "informations-legales" },
    }),
  );
}

/**
 * Invitation discrète, sous les sources, quand des informations légales
 * manquent pour calculer certaines échéances fiscales : ces échéances ne
 * sont pas affichées plutôt que devinées. Une ligne à part, pour ne pas
 * disputer la place des pastilles.
 */
export function FiscalSetupHint({ setup }) {
  const concerns = fiscalMissingConcerns(setup);
  if (!setup || setup.complete || concerns.length === 0) return null;

  return (
    <p className="text-muted-foreground flex w-full flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-help items-center gap-1.5">
            <Info className="size-3.5 shrink-0" aria-hidden="true" />
            Échéances fiscales non affichées : {concerns.join(", ")}.
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-80">
          {setup.missing.map((missing) => (
            <p key={missing.code} className="text-white/90 [&+p]:mt-1">
              {missing.label}
            </p>
          ))}
        </TooltipContent>
      </Tooltip>
      <button
        type="button"
        onClick={openLegalSettings}
        className="text-foreground focus-visible:ring-ring/50 rounded font-medium underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-[3px]"
      >
        Compléter les informations légales
      </button>
    </p>
  );
}
