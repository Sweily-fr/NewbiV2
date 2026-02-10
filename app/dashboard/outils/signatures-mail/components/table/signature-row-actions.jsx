"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  CopyIcon,
  StarIcon,
  EyeIcon,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import SignaturePreviewModal from "../preview/signature-preview-modal";

export default function SignatureRowActions({
  signature,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
}) {
  const router = useRouter();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleEdit = (e) => {
    e?.stopPropagation();
    onEdit?.(signature);
  };

  const handleView = (e) => {
    e?.stopPropagation();
    setShowPreviewModal(true);
  };

  const handleDuplicate = (e) => {
    e?.stopPropagation();
    onDuplicate?.(signature);
  };

  const handleSetDefault = (e) => {
    e?.stopPropagation();
    onToggleFavorite?.(signature);
  };

  const handleDelete = (e) => {
    e?.stopPropagation(); // Empêcher la propagation vers la ligne du tableau
    onDelete?.(signature);
    setShowDeleteAlert(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Ouvrir le menu</span>
            <MoreHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleView}>
            <EyeIcon className="mr-2 h-4 w-4" />
            Voir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>
            <EditIcon className="mr-2 h-4 w-4" />
            Modifier
          </DropdownMenuItem>
          {/* <DropdownMenuItem onClick={handleDuplicate}>
            <CopyIcon className="mr-2 h-4 w-4" />
            Dupliquer
          </DropdownMenuItem> */}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteAlert(true);
            }}
            className="text-red-600"
          >
            <TrashIcon className="mr-2 h-4 w-4 text-red-600" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir <span className="font-semibold text-destructive">supprimer</span> la signature "{signature.signatureName}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SignaturePreviewModal
        signatureId={signature.id}
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
      />
    </>
  );
}
