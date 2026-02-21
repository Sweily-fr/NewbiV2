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
import { useDeleteExpense } from "@/src/hooks/useExpenses";

export function RowActions({ row, onEdit, onRefresh, onDownloadAttachment }) {
  const transaction = row.original;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteExpense, loading: deleteLoading } = useDeleteExpense();

  const handleEdit = () => {
    if (onEdit) {
      onEdit(transaction);
    }
  };

  const handleDelete = async () => {
    if (transaction.source === "invoice") {
      toast.error(
        "Les factures ne peuvent pas être supprimées depuis cette interface"
      );
      setShowDeleteDialog(false);
      return;
    }

    try {
      const result = await deleteExpense(transaction.id);
      setShowDeleteDialog(false);

      if (result.success && onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
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
              disabled={transaction.source === "invoice"}
            >
              <span>Modifier</span>
              <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyDescription}>
              <span>Copier description</span>
              <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
            </DropdownMenuItem>
            {(transaction.receiptFile?.url || transaction.attachment || (transaction.files && transaction.files.length > 0)) && (
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
            disabled={deleteLoading || transaction.source === "invoice"}
          >
            <span>{deleteLoading ? "Suppression..." : "Supprimer"}</span>
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
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
