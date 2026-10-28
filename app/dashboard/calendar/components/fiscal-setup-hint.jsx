"use client";

import { Info } from "lucide-react";

import { DropdownMenuItem } from "@/src/components/ui/dropdown-menu";
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
 * Invitation discrète du menu « Filtres », sous la source « Fiscal », quand
 * des informations légales manquent pour calculer certaines échéances : ces
 * échéances ne sont pas affichées plutôt que devinées. Le détail de ce qu'il
 * faut compléter est dans l'infobulle native de la ligne.
 */
export function FiscalSetupMenuItem({ setup }) {
  const concerns = fiscalMissingConcerns(setup);
  if (!setup || setup.complete || concerns.length === 0) return null;

  return (
    <DropdownMenuItem
      onSelect={openLegalSettings}
      title={setup.missing.map((missing) => missing.label).join("\n")}
      className="text-muted-foreground cursor-pointer items-start gap-2 py-1.5 pl-9 text-xs"
    >
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        Non affichées : {concerns.join(", ")}.{" "}
        <span className="text-foreground font-medium underline underline-offset-4">
          Compléter les informations légales
        </span>
      </span>
    </DropdownMenuItem>
  );
}
