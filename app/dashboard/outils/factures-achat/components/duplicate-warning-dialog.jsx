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
 * Avertissement non bloquant avant la création d'une facture d'achat qui
 * ressemble à une facture existante (même numéro, ou même fournisseur +
 * montant + date proche). L'utilisateur peut créer quand même.
 */
export function DuplicateWarningDialog({
  open,
  duplicates = [],
  onCancel,
  onConfirm,
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
            Vérifiez qu&apos;il ne s&apos;agit pas de la même facture avant de
            continuer. Si la facture existe déjà, rattachez-la à la transaction
            depuis sa fiche plutôt que d&apos;en créer une nouvelle.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          {duplicates.map((d) => (
            <div
              key={d.id}
              className="p-3 border rounded-lg bg-muted/30 text-sm"
            >
              <p className="font-medium truncate">
                {d.supplierName || "Fournisseur"}
                {d.invoiceNumber ? ` - ${d.invoiceNumber}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatAmount(d.amountTTC)}
                {d.issueDate ? ` - ${formatDate(d.issueDate)}` : ""}
              </p>
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
