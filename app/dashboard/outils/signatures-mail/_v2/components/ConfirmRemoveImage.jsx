"use client";

import { useCallback } from "react";
import { useMutation } from "@apollo/client";
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
import { toast } from "@/src/components/ui/sonner";
import { REMOVE_SIGNATURE_V2_IMAGE } from "../graphql";

/** Titre de la confirmation et message de réussite, par type d'image de l'API. */
const LABELS = {
  PHOTO: { title: "Retirer la photo ?", done: "Photo retirée" },
  LOGO: { title: "Retirer le logo ?", done: "Logo retiré" },
  BANNER: { title: "Retirer l'image de la bannière ?", done: "Image retirée" },
};

/**
 * Retire une image de la signature (photo, logo, bannière). Le fichier
 * reste en ligne : les e-mails déjà envoyés gardent l'image. Renvoie la
 * signature à jour, ou null si le retrait a échoué (message affiché).
 */
export function useRemoveSignatureImage(id) {
  const [remove] = useMutation(REMOVE_SIGNATURE_V2_IMAGE);
  return useCallback(
    async (kind) => {
      try {
        const { data } = await remove({ variables: { id, kind } });
        toast.success(LABELS[kind]?.done || "Image retirée");
        return data?.removeEmailSignatureV2Image || null;
      } catch {
        toast.error("Suppression impossible");
        return null;
      }
    },
    [remove, id],
  );
}

/**
 * Confirmation avant de retirer une image, la même pour le lien « Retirer »
 * des champs d'image et pour la touche Suppr dans l'aperçu : une image
 * n'entre pas dans l'historique, ⌘Z ne la rendrait pas.
 */
export default function ConfirmRemoveImage({ kind, open, onOpenChange, onConfirm }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{LABELS[kind]?.title || "Retirer l'image ?"}</AlertDialogTitle>
          <AlertDialogDescription>
            L&apos;image sera retirée de la signature. Vos e-mails déjà envoyés la
            conservent. Si la signature est déjà installée, recopiez-la ensuite
            dans votre messagerie.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700 cursor-pointer"
          >
            Retirer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
