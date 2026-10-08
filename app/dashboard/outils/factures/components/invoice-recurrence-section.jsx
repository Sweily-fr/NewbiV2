"use client";

import { useState } from "react";
import { CalendarSync, TriangleAlert } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import {
  formatRecurrenceDay,
  formatRecurrenceFrequency,
  useInvoiceRecurrences,
} from "@/src/graphql/invoiceRecurrenceQueries";
import InvoiceRecurrenceDialog from "./invoice-recurrence-dialog";

const capitalize = (text) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

/**
 * Section « Récurrence » du panneau d'une facture :
 * - facture modèle : rythme, prochaine facture, gestion ;
 * - facture générée : rappel de son origine automatique.
 * Rien pour les autres factures (l'action est dans le menu de la ligne).
 */
export default function InvoiceRecurrenceSection({
  invoice,
  variant = "sidebar",
}) {
  const isMobile = variant === "mobile";
  const { recurrences } = useInvoiceRecurrences();
  const { isReadOnly } = useSubscriptionAccess();
  // Droits du rôle (tout autorisé tant que la grille n'est pas chargée)
  const { canWrite, isReady } = useMyPermissions();
  const canEditInvoices = !isReady || canWrite("invoices");
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!invoice?.id) return null;

  const recurrence = recurrences.find(
    (r) =>
      r.sourceInvoiceId === invoice.id &&
      ["ACTIVE", "PAUSED"].includes(r.status),
  );
  const origin = invoice.recurrenceOrigin?.recurrenceId
    ? recurrences.find((r) => r.id === invoice.recurrenceOrigin.recurrenceId)
    : null;

  if (!recurrence && !invoice.recurrenceOrigin?.recurrenceId) return null;

  return (
    <>
      {!isMobile && <Separator />}
      <div className={isMobile ? "space-y-2.5" : "space-y-3"}>
        {isMobile ? (
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Récurrence
          </h3>
        ) : (
          <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
            Récurrence
          </p>
        )}

        {recurrence ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm">
                <CalendarSync className="size-3.5 text-muted-foreground" />
                {capitalize(
                  formatRecurrenceFrequency(
                    recurrence.frequency,
                    recurrence.interval,
                  ),
                )}
                {recurrence.status === "PAUSED" && (
                  <span className="text-muted-foreground"> · suspendue</span>
                )}
              </span>
              {canEditInvoices && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={isReadOnly}
                  onClick={() => setDialogOpen(true)}
                >
                  Gérer
                </Button>
              )}
            </div>
            {recurrence.status === "ACTIVE" && recurrence.nextRunDate && (
              <div className="flex justify-between">
                <span className="text-sm font-normal text-muted-foreground">
                  Prochaine facture
                </span>
                <span className="text-sm font-normal">
                  {formatRecurrenceDay(recurrence.nextRunDate)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm font-normal text-muted-foreground">
                Factures générées
              </span>
              <span className="text-sm font-normal">
                {recurrence.generatedCount}
              </span>
            </div>
            {recurrence.lastError && (
              <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                <TriangleAlert className="size-3.5 mt-0.5 shrink-0" />
                <span>{recurrence.lastError}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Créée et envoyée automatiquement
            {origin?.sourceInvoice?.number
              ? ` à partir de la facture ${[
                  origin.sourceInvoice.prefix,
                  origin.sourceInvoice.number,
                ]
                  .filter(Boolean)
                  .join("-")}`
              : " par une facture récurrente"}
            {invoice.recurrenceOrigin?.occurrenceDate
              ? ` (échéance du ${formatRecurrenceDay(invoice.recurrenceOrigin.occurrenceDate)})`
              : ""}
            .
          </p>
        )}
      </div>

      {dialogOpen && recurrence && (
        <InvoiceRecurrenceDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          invoice={invoice}
          recurrence={recurrence}
        />
      )}
    </>
  );
}
