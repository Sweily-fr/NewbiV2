import { useState } from "react";
import { EllipsisIcon } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { toast } from "@/src/components/ui/sonner";
import { useDeleteTransaction } from "@/src/hooks/useTransactions";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";

export function RowActions({ row, onEdit, onRefresh, onDownloadAttachment }) {
  const transaction = row.original;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteTransaction, loading: deleteLoading } = useDeleteTransaction();
  const { isReadOnly, isOwner } = useSubscriptionAccess();

  const handleEdit = () => {
    if (onEdit) {
      onEdit(transaction);
    }
  };

  const handleDelete = async () => {
    if (transaction.source === "invoice") {
      toast.error(
        "Les factures ne peuvent pas être supprimées depuis cette interface",
      );
      setShowDeleteDialog(false);
      return;
    }

    try {
      const result = await deleteTransaction(transaction.id);
      setShowDeleteDialog(false);

      if (result.success && onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setShowDeleteDialog(false);
    }
  };

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(transaction.description);
    toast.success("Description copiée dans le presse-papier");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex justify-end">
            <Button
              size="icon"
              variant="ghost"
              className="shadow-none"
              aria-label="Actions de la transaction"
            >
              <EllipsisIcon size={16} aria-hidden="true" />
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={handleEdit}
              disabled={transaction.source === "invoice" || isReadOnly}
            >
              <span>Modifier</span>
              <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyDescription}>
              <span>Copier description</span>
              <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
            </DropdownMenuItem>
            {((Array.isArray(transaction.receiptFiles) &&
              transaction.receiptFiles.length > 0) ||
              transaction.attachment ||
              (transaction.files && transaction.files.length > 0)) && (
              <DropdownMenuItem
                onClick={() =>
                  onDownloadAttachment && onDownloadAttachment(transaction)
                }
              >
                <span>Afficher le justificatif</span>
                <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
            disabled={
              deleteLoading || transaction.source === "invoice" || isReadOnly
            }
          >
            <span>{deleteLoading ? "Suppression..." : "Supprimer"}</span>
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
          {isReadOnly && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                {isOwner
                  ? "Mode lecture seule · Renouvelez votre abonnement"
                  : "Mode lecture seule · Contactez l'administrateur"}
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette transaction ? Cette
              action est irréversible.
              <br />
              <strong>Description :</strong> {transaction.description}
              <br />
              <strong>Montant :</strong> {transaction.amount.toFixed(2)} €
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteLoading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
