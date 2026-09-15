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
import { Link as LinkIcon, Loader2 } from "lucide-react";

const formatAmount = (value) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    Math.abs(value || 0),
  );

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(d);
};

/**
 * Facture d'achat créée alors que le paiement est déjà passé : l'API a
 * trouvé une transaction sûre (montant, fournisseur, date). On demande
 * confirmation avant de lier, rien n'est rapproché sans le « Rapprocher ».
 */
export function ReconcileCandidateDialog({
  open,
  transaction,
  invoiceLabel,
  loading = false,
  onCancel,
  onConfirm,
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel?.()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Transaction trouvée</AlertDialogTitle>
          <AlertDialogDescription>
            Cette transaction bancaire semble correspondre à la facture
            {invoiceLabel ? ` ${invoiceLabel}` : ""}. Voulez-vous les rapprocher
            ? La facture passera en « Payée ».
          </AlertDialogDescription>
        </AlertDialogHeader>
        {transaction && (
          <div className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-muted/30 text-sm">
            <div className="min-w-0">
              <p className="font-medium truncate">
                {transaction.description || "Transaction"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(transaction.date)}
              </p>
            </div>
            <p className="font-medium shrink-0">
              {formatAmount(transaction.amount)}
            </p>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={loading}>
            Non, plus tard
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm?.();
            }}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <LinkIcon className="h-4 w-4 mr-1.5" />
            )}
            Rapprocher
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
