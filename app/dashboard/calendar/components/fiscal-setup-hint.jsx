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
 * Invitation discrète, à côté de la source « Fiscal », quand des
 * informations légales manquent pour calculer certaines échéances : ces
 * échéances ne sont pas affichées plutôt que devinées.
 */
export function FiscalSetupHint({ setup }) {
  const concerns = fiscalMissingConcerns(setup);
  if (!setup || setup.complete || concerns.length === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={openLegalSettings}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2 text-xs underline-offset-4 transition outline-none hover:underline focus-visible:ring-[3px]"
        >
          <Info className="size-3.5" aria-hidden="true" />
          Compléter les informations légales
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-72 text-left">
        <p className="font-medium">Échéances fiscales incomplètes</p>
        <p className="mt-0.5 text-white/80">
          Non affichées faute d&apos;informations : {concerns.join(", ")}.
        </p>
        {setup.missing.map((missing) => (
          <p key={missing.code} className="mt-1 text-white/80">
            {missing.label}
          </p>
        ))}
        <p className="mt-1.5 text-white/50">
          Cliquer pour ouvrir les informations légales
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
