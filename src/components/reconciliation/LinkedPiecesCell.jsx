"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

/**
 * Cellule « Justificatif » commune aux tableaux Transactions, Factures et
 * Factures d'achat : un compteur par nature de pièce liée (icône + nombre),
 * jamais additionnés entre eux, chacun avec son infobulle détaillée.
 *
 * counters : [{ key, Icon, count, title, lines?, className? }], les entrées
 * à zéro sont ignorées. `extra` : nœud affiché à la suite (ex. suggestion de
 * rapprochement). Sans compteur ni extra : tiret + `emptyLabel`.
 */
const MAX_LINES = 5;

const plural = (count, singular, pluralForm) =>
  count > 1 ? `${count} ${pluralForm}` : `${count} ${singular}`;

export { plural as pluralizePieces };

export function LinkedPiecesCell({
  counters = [],
  extra = null,
  emptyLabel = "Aucun justificatif",
  className = "",
}) {
  const visible = counters.filter((c) => c && c.count > 0);

  if (visible.length === 0) {
    if (extra) return extra;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground">-</span>
          </TooltipTrigger>
          <TooltipContent>{emptyLabel}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {visible.map(({ key, Icon, count, className: color, title, lines }) => {
        const detail = Array.isArray(lines) ? lines.filter(Boolean) : [];
        return (
          <TooltipProvider key={key}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`flex items-center gap-1 ${
                    color || "text-muted-foreground"
                  }`}
                >
                  <Icon size={14} />
                  <span className="text-xs">{count}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="font-medium">{title}</div>
                {detail.slice(0, MAX_LINES).map((line, i) => (
                  <div
                    key={i}
                    className="text-xs text-muted-foreground truncate max-w-[220px]"
                  >
                    {line}
                  </div>
                ))}
                {detail.length > MAX_LINES && (
                  <div className="text-xs text-muted-foreground">
                    +{detail.length - MAX_LINES} autres
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
      {extra}
    </div>
  );
}
