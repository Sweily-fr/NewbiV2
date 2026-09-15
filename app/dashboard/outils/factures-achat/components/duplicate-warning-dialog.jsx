"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { Button } from "@/src/components/ui/button";
import { ExternalLink } from "lucide-react";

const formatAmount = (value) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    value || 0,
  );

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(d);
};

/**
 * Avertissement avant la création d'une facture d'achat qui ressemble à une
 * facture existante (même numéro, ou même fournisseur + montant + date
 * proche). Trois issues : annuler, utiliser la facture existante
 * (`onUseExisting(duplicate)`, si fourni), ou créer quand même.
 */
export function DuplicateWarningDialog({
  open,
  duplicates = [],
  onCancel,
  onConfirm,
  onUseExisting,
  useExistingLabel = "Utiliser cette facture",
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel?.()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {duplicates.length > 1
              ? "Des factures similaires existent déjà"
              : "Une facture similaire existe déjà"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {onUseExisting
              ? "S'il s'agit de la même facture, utilisez la facture existante plutôt que d'en créer une nouvelle : vous pourrez la rattacher à la transaction depuis sa fiche."
              : "Vérifiez qu'il ne s'agit pas de la même facture avant de continuer. Si la facture existe déjà, rattachez-la à la transaction depuis sa fiche plutôt que d'en créer une nouvelle."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          {duplicates.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-muted/30 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {d.supplierName || "Fournisseur"}
                  {d.invoiceNumber ? ` - ${d.invoiceNumber}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatAmount(d.amountTTC)}
                  {d.issueDate ? ` - ${formatDate(d.issueDate)}` : ""}
                </p>
              </div>
              {onUseExisting && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => onUseExisting(d)}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  {useExistingLabel}
                </Button>
              )}
            </div>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Créer quand même
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
