"use client";

import { memo, useMemo, useState } from "react";
import { CircleAlert } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { cn } from "@/src/lib/utils";
import {
  formatLinkedAmount,
  relativeDayLabel,
} from "@/src/utils/calendar-linked-items";
import { LINKED_SOURCE_META } from "./linked-sources";

// Ordre des groupes : l'argent d'abord, puis le commercial et les projets
const GROUPS = [
  { kind: "INVOICE", label: "Factures à encaisser" },
  { kind: "PURCHASE_INVOICE", label: "Factures à payer" },
  { kind: "QUOTE", label: "Devis sans réponse" },
  { kind: "DELIVERY", label: "Livraisons" },
  { kind: "TASK", label: "Tâches" },
];
const MONEY_KINDS = new Set(["INVOICE", "PURCHASE_INVOICE"]);

const euros = (amount) => formatLinkedAmount(amount, "EUR", { compact: true });

function groupTotal(items) {
  const total = items.reduce(
    (sum, item) =>
      Number.isFinite(item.amount) &&
      (!item.currency || item.currency === "EUR")
        ? sum + item.amount
        : sum,
    0,
  );
  return total > 0 ? euros(total) : null;
}

/**
 * Bouton « En retard » de l'en-tête : tout ce qui attend une action,
 * quelle que soit la date (une facture en retard depuis trois mois
 * n'apparaît plus dans le mois affiché). Un clic sur une ligne ouvre sa
 * fiche, avec ses actions (marquer payée, relancer, me rappeler). Absent
 * quand rien n'est en retard.
 */
export const CalendarOverdueButton = memo(function CalendarOverdueButton({
  items,
  truncated = false,
  onSelect,
}) {
  const [open, setOpen] = useState(false);
  const groups = useMemo(
    () =>
      GROUPS.map((group) => ({
        ...group,
        items: items.filter((item) => item.kind === group.kind),
      })).filter((group) => group.items.length > 0),
    [items],
  );

  if (items.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-1.5 font-normal text-red-600 hover:text-red-700 dark:text-red-400"
          aria-label={`${items.length} ${items.length > 1 ? "éléments" : "élément"} en retard`}
        >
          <CircleAlert className="h-4 w-4" aria-hidden="true" />
          <span className="tabular-nums">{items.length}</span>
          <span className="hidden 2xl:inline">en retard</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-medium">En retard</p>
          <p className="text-muted-foreground text-xs">
            Tout ce qui attend une action, quelle que soit la date
          </p>
        </div>
        <div className="max-h-[min(60vh,520px)] overflow-y-auto py-1">
          {groups.map((group) => {
            const meta = LINKED_SOURCE_META[group.kind];
            const Icon = meta.icon;
            const total = MONEY_KINDS.has(group.kind)
              ? groupTotal(group.items)
              : null;
            return (
              <section key={group.kind} className="py-1">
                <h3 className="text-muted-foreground flex items-center gap-2 px-4 py-1 text-xs font-medium">
                  <Icon
                    className={cn("size-3.5", meta.iconClass)}
                    aria-hidden="true"
                  />
                  <span className="flex-1">
                    {group.label} · {group.items.length}
                  </span>
                  {total && <span className="tabular-nums">{total}</span>}
                </h3>
                <ul>
                  {group.items.map((item) => {
                    const amount = formatLinkedAmount(
                      item.amount,
                      item.currency || "EUR",
                      { compact: true },
                    );
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            onSelect(item);
                          }}
                          className="hover:bg-muted/60 focus-visible:bg-muted/60 flex w-full items-center gap-3 px-4 py-1.5 text-left outline-none"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm">
                              {item.title}
                            </span>
                            <span className="text-muted-foreground block truncate text-xs">
                              {[
                                item.kind === "TASK"
                                  ? item.boardTitle
                                  : item.reference,
                                relativeDayLabel(item.day, item.state),
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </span>
                          {amount && (
                            <span className="shrink-0 text-sm tabular-nums">
                              {amount}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
          {truncated && (
            <p className="text-muted-foreground px-4 py-2 text-xs">
              Liste limitée aux 300 retards les plus anciens par type.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});
