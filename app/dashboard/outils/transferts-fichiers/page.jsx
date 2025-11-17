"use client";

import { useState, useEffect } from "react";
import { RoleRouteGuard } from "@/src/components/rbac/RBACRouteGuard";
import { Button } from "@/src/components/ui/button";
import {
  IconCopy,
  IconExternalLink,
  IconUpload,
  IconList,
} from "@tabler/icons-react";
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
import FileUploadNew from "./components/file-upload-new";
import { useFileTransfer } from "./hooks/useFileTransfer";
import { useFileTransferR2Direct } from "./hooks/useFileTransferR2Direct";
import { cn } from "@/src/lib/utils";

function TransfertsContent() {
  const { transfers, transfersLoading, refetchTransfers } = useFileTransfer();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [transferLink, setTransferLink] = useState("");
  const [activeTab, setActiveTab] = useState("upload"); // "upload" ou "list"

  // Vérifier si on revient d'une création de transfert
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareLink = urlParams.get("shareLink");
    const accessKey = urlParams.get("accessKey");

    if (shareLink && accessKey) {
      const fullLink = `${window.location.origin}/transfer/${shareLink}?key=${accessKey}`;
      setTransferLink(fullLink);
      setShowSuccessDialog(true);

      // Changer vers l'onglet "Mes transferts"
      setActiveTab("list");

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
    window.open(transferLink, "_blank");
  };

  // Callback après création d'un transfert
  const handleTransferCreated = (shareLink, accessKey) => {
    const fullLink = `${window.location.origin}/transfer/${shareLink}?key=${accessKey}`;
    setTransferLink(fullLink);
    setShowSuccessDialog(true);

    // Changer d'onglet vers "Mes transferts"
    setActiveTab("list");

    // Rafraîchir la liste des transferts
    refetchTransfers();
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:block space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium mb-2">
              Transferts de fichiers
            </h1>
            <p className="text-muted-foreground text-sm">
              Partagez des fichiers volumineux jusqu'à 5GB avec vos clients ou
              collaborateurs
            </p>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="border-b border-border">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("upload")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors relative cursor-pointer",
                activeTab === "upload"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <IconUpload className="w-4 h-4" />
                Nouveau transfert
              </div>
              {activeTab === "upload" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5a50ff]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors relative cursor-pointer",
                activeTab === "list"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <IconList className="w-4 h-4" />
                Mes transferts
              </div>
              {activeTab === "list" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5a50ff]" />
              )}
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div>
          {activeTab === "upload" ? (
            <FileUploadNew
              onTransferCreated={handleTransferCreated}
              refetchTransfers={refetchTransfers}
            />
          ) : (
            <TransferTable
              transfers={transfers}
              onRefresh={refetchTransfers}
              loading={transfersLoading}
            />
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Header */}
        <div className="px-4 py-6">
          <div>
            <h1 className="text-2xl font-medium mb-2">
              Transferts de fichiers
            </h1>
            <p className="text-muted-foreground text-sm">
              Partagez des fichiers volumineux jusqu'à 5GB
            </p>
          </div>
        </div>

        {/* Navigation par onglets mobile */}
        <div className="border-b border-border px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("upload")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors relative",
                activeTab === "upload"
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <IconUpload className="w-4 h-4" />
                Nouveau
              </div>
              {activeTab === "upload" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5a50ff]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors relative",
                activeTab === "list"
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <IconList className="w-4 h-4" />
                Liste
              </div>
              {activeTab === "list" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5a50ff]" />
              )}
            </button>
          </div>
        </div>

        {/* Contenu mobile */}
        <div className="mt-4">
          {activeTab === "upload" ? (
            <div className="px-4">
              <FileUploadNew
                onTransferCreated={handleTransferCreated}
                refetchTransfers={refetchTransfers}
              />
            </div>
          ) : (
            <TransferTable
              transfers={transfers}
              onRefresh={refetchTransfers}
              loading={transfersLoading}
            />
          )}
        </div>
      </div>

      {/* Dialog de succès après création */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Transfert créé avec succès !</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div>
                  Votre transfert de fichiers a été créé. Vous pouvez maintenant
                  partager le lien avec vos destinataires.
                </div>

                <div className="bg-muted p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground mb-2">
                    Lien de partage :
                  </div>
                  <div className="text-xs font-mono break-all p-2 rounded border bg-background">
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
              className="w-full sm:w-auto font-normal"
            >
              <IconCopy className="w-4 h-4 mr-2" />
              Copier le lien
            </Button>
            <Button
              variant="outline"
              onClick={openInNewTab}
              className="w-full sm:w-auto font-normal bg-[#5a50ff] hover:bg-[#5a50ff]/90 hover:text-white text-white"
            >
              <IconExternalLink className="w-4 h-4 mr-2" />
              Ouvrir le lien
            </Button>
            <AlertDialogAction className="w-full sm:w-auto font-normal">
              Fermer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function TransfertsPageContent() {
  return <TransfertsContent />;
}

export default function TransfertsPage() {
  return (
    <RoleRouteGuard
      roles={["owner", "admin", "member", "viewer"]}
      fallbackUrl="/dashboard"
      toastMessage="Vous n'avez pas accès aux transferts de fichiers. Cette fonctionnalité est réservée aux membres de l'équipe."
    >
      <TransfertsPageContent />
    </RoleRouteGuard>
  );
}
