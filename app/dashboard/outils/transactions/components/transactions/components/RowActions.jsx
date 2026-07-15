import { EllipsisIcon } from "lucide-react";
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
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";

// Les transactions proviennent du flux bancaire Bridge : pas de suppression.
// Actions permises : modifier (catégorie/description), copier la description,
// afficher le justificatif.
export function RowActions({ row, onEdit, onDownloadAttachment }) {
  const transaction = row.original;
  const { isReadOnly, isOwner } = useSubscriptionAccess();

  const handleEdit = () => {
    if (onEdit) {
      onEdit(transaction);
    }
  };

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(transaction.description);
    toast.success("Description copiée dans le presse-papier");
  };

  return (
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
  );
}
