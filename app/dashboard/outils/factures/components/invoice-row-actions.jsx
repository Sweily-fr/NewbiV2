"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  EllipsisIcon,
  Edit,
  Eye,
  Copy,
  Download,
  Send,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
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
import { toast } from "sonner";

import {
  useDeleteInvoice,
  useSendInvoice,
  useMarkInvoiceAsPaid,
  useChangeInvoiceStatus,
  INVOICE_STATUS_LABELS,
} from "@/src/graphql/invoiceQueries";

export default function InvoiceRowActions({ row }) {
  const router = useRouter();
  const invoice = row.original;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { mutate: deleteInvoice, loading: deleting } = useDeleteInvoice();
  const { mutate: sendInvoice, loading: sending } = useSendInvoice();
  const { mutate: markAsPaid, loading: marking } = useMarkInvoiceAsPaid();
  const { mutate: changeStatus, loading: changing } = useChangeInvoiceStatus();

  const isDraft = invoice.status === "DRAFT";
  const isPending = invoice.status === "PENDING";
  const isCompleted = invoice.status === "COMPLETED";
  const canEdit = isDraft;
  const canDelete = isDraft;

  const handleView = () => {
    router.push(`/dashboard/outils/factures/${invoice.id}`);
  };

  const handleEdit = () => {
    if (!canEdit) {
      toast.error("Seules les factures en brouillon peuvent être modifiées");
      return;
    }
    router.push(`/dashboard/outils/factures/${invoice.id}`);
  };

  const handleDuplicate = () => {
    // TODO: Implement duplication logic
    toast.success("Fonctionnalité de duplication à venir");
  };

  const handleDownload = () => {
    // TODO: Implement PDF download
    toast.success("Téléchargement PDF à venir");
  };

  const handleSend = () => {
    if (isDraft) {
      toast.error("Impossible d'envoyer une facture en brouillon");
      return;
    }

    sendInvoice({
      variables: {
        id: invoice.id,
        email: invoice.client?.email,
      },
    });
  };

  const handleMarkAsPaid = () => {
    if (!isPending) {
      toast.error("Seules les factures en attente peuvent être marquées comme payées");
      return;
    }

    markAsPaid({
      variables: {
        id: invoice.id,
        paymentDate: new Date().toISOString(),
      },
    });
  };

  const handleChangeStatus = (newStatus) => {
    changeStatus({
      variables: {
        id: invoice.id,
        status: newStatus,
      },
    });
  };

  const handleDelete = () => {
    if (!canDelete) {
      toast.error("Seules les factures en brouillon peuvent être supprimées");
      return;
    }

    deleteInvoice({
      variables: { id: invoice.id },
    });
    setShowDeleteDialog(false);
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
              aria-label="Actions"
            >
              <EllipsisIcon size={16} aria-hidden="true" />
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleView}>
              <Eye className="mr-2 h-4 w-4" />
              <span>Voir</span>
              <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
            </DropdownMenuItem>
            
            {canEdit && (
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Modifier</span>
                <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              <span>Dupliquer</span>
              <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              <span>Télécharger PDF</span>
            </DropdownMenuItem>
            
            {!isDraft && (
              <DropdownMenuItem onClick={handleSend} disabled={sending}>
                <Send className="mr-2 h-4 w-4" />
                <span>Envoyer par email</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            {isPending && (
              <DropdownMenuItem onClick={handleMarkAsPaid} disabled={marking}>
                <CheckCircle className="mr-2 h-4 w-4" />
                <span>Marquer comme payée</span>
              </DropdownMenuItem>
            )}

            {isDraft && (
              <DropdownMenuItem 
                onClick={() => handleChangeStatus("PENDING")}
                disabled={changing}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                <span>Valider la facture</span>
              </DropdownMenuItem>
            )}

            {isPending && (
              <DropdownMenuItem 
                onClick={() => handleChangeStatus("CANCELED")}
                disabled={changing}
              >
                <XCircle className="mr-2 h-4 w-4" />
                <span>Annuler</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Supprimer</span>
                <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la facture "{invoice.number || 'Brouillon'}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
