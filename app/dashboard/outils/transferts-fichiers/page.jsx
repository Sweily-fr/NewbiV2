"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { IconPlus, IconCopy, IconExternalLink } from "@tabler/icons-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { toast } from "@/src/components/ui/sonner";
import TransferTable from "./components/transfer-table";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useFileTransfer } from "./hooks/useFileTransfer";

function TransfertsContent() {
  const { transfers, transfersLoading, refetchTransfers } = useFileTransfer();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [transferLink, setTransferLink] = useState("");

  // Vérifier si on revient d'une création de transfert
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareLink = urlParams.get('shareLink');
    const accessKey = urlParams.get('accessKey');
    
    if (shareLink && accessKey) {
      const fullLink = `${window.location.origin}/transfer/${shareLink}?key=${accessKey}`;
      setTransferLink(fullLink);
      setShowSuccessDialog(true);
      
      // Nettoyer l'URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transferLink);
    toast.success("Lien copié dans le presse-papiers !");
  };

  const openInNewTab = () => {
    window.open(transferLink, '_blank');
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:block space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium mb-2">
              Gestion des Transferts Fichiers
            </h1>
            <p className="text-muted-foreground text-sm">
              Gérez vos transferts de fichiers et suivez les téléchargements
            </p>
          </div>
          <Link href="/dashboard/outils/transferts-fichiers/new">
            <Button className="font-normal cursor-pointer w-full sm:w-auto">
              <IconPlus className="mr-2 h-4 w-4" />
              Transfert un fichier
            </Button>
          </Link>
        </div>
        
        {/* Table */}
        <TransferTable
          transfers={transfers}
          onRefresh={refetchTransfers}
          loading={transfersLoading}
        />
      </div>

      {/* Mobile Layout - Style Notion */}
      <div className="md:hidden">
        {/* Header - Style Notion sur mobile */}
        <div className="px-4 py-6">
          <div>
            <h1 className="text-2xl font-medium mb-2">
              Transferts Fichiers
            </h1>
            <p className="text-muted-foreground text-sm">
              Gérez vos transferts de fichiers et suivez les téléchargements
            </p>
          </div>
        </div>

        {/* Table */}
        <TransferTable
          transfers={transfers}
          onRefresh={refetchTransfers}
          loading={transfersLoading}
        />

        {/* Bouton flottant mobile */}
        <Link href="/dashboard/outils/transferts-fichiers/new">
          <Button
            className="fixed bottom-6 bg-[#5a50ff] right-6 h-14 w-14 rounded-full shadow-lg z-50 md:hidden"
            size="icon"
          >
            <IconPlus className="h-6 w-6" />
          </Button>
        </Link>
      </div>

      {/* Dialog de succès après création */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black">
              Transfert créé avec succès !
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div>Votre transfert de fichiers a été créé. Vous pouvez maintenant partager le lien avec vos destinataires.</div>
                
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <div className="text-xs text-gray-600 mb-2">Lien de partage :</div>
                  <div className="text-sm font-mono break-all bg-white p-2 rounded border">
                    {transferLink}
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="w-full sm:w-auto"
            >
              <IconCopy className="w-4 h-4 mr-2" />
              Copier le lien
            </Button>
            <Button
              variant="outline"
              onClick={openInNewTab}
              className="w-full sm:w-auto"
            >
              <IconExternalLink className="w-4 h-4 mr-2" />
              Ouvrir le lien
            </Button>
            <AlertDialogAction className="w-full sm:w-auto">
              Fermer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function TransfertsFichiers() {
  return (
    <ProRouteGuard pageName="Transferts de fichiers">
      <TransfertsContent />
    </ProRouteGuard>
  );
}
