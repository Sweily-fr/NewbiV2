"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { RoleRouteGuard } from "@/src/components/rbac/RBACRouteGuard";
import { Button } from "@/src/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/src/components/ui/button-group";
import { Input } from "@/src/components/ui/input";
import {
  Plus,
  Settings,
  Download,
  Info,
  Search,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  X,
  Trash2,
  Link2,
  ExternalLink,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { Skeleton } from "@/src/components/ui/skeleton";
import { QrCode } from "@ark-ui/react/qr-code";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/src/components/ui/dialog";
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
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { toast } from "@/src/components/ui/sonner";
import TransferTable from "./components/transfer-table";
import FileUploadNew from "./components/file-upload-new";
import { useFileTransfer } from "./hooks/useFileTransfer";
import { cn } from "@/src/lib/utils";

function TransfertsContent() {
  const { transfers, transfersLoading, refetchTransfers, formatFileSize } =
    useFileTransfer();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [transferLink, setTransferLink] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectionState, setSelectionState] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Calculer les statistiques des transferts
  const transferStats = useMemo(() => {
    if (!transfers || transfers.length === 0) {
      return {
        totalTransfers: 0,
        activeTransfers: 0,
        downloadedTransfers: 0,
        expiredTransfers: 0,
        totalSize: 0,
      };
    }

    let activeTransfers = 0;
    let downloadedTransfers = 0;
    let expiredTransfers = 0;
    let totalSize = 0;

    transfers.forEach((transfer) => {
      const size =
        transfer.files?.reduce((acc, f) => acc + (f.size || 0), 0) || 0;
      totalSize += size;

      if (transfer.status === "expired") {
        expiredTransfers++;
      } else if (transfer.downloadCount > 0) {
        downloadedTransfers++;
      } else {
        activeTransfers++;
      }
    });

    return {
      totalTransfers: transfers.length,
      activeTransfers,
      downloadedTransfers,
      expiredTransfers,
      totalSize,
    };
  }, [transfers]);

  // Compter les transferts par statut pour les tabs
  const transferCounts = useMemo(() => {
    const counts = {
      all: transfers?.length || 0,
      active: 0,
      downloaded: 0,
      expired: 0,
    };
    transfers?.forEach((t) => {
      if (t.status === "expired") counts.expired++;
      else if (t.downloadCount > 0) counts.downloaded++;
      else counts.active++;
    });
    return counts;
  }, [transfers]);

  // Vérifier si on revient d'une création de transfert
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareLink = urlParams.get("shareLink");
    const accessKey = urlParams.get("accessKey");

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
    window.open(transferLink, "_blank");
  };

  // Callback après création d'un transfert
  const handleTransferCreated = (shareLink, accessKey) => {
    const fullLink = `${window.location.origin}/transfer/${shareLink}?key=${accessKey}`;
    setTransferLink(fullLink);
    setShowSuccessDialog(true);
    setShowUploadModal(false);

    // Rafraîchir la liste des transferts
    refetchTransfers();
  };

  // Gérer le changement de tab
  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  return (
    <>
      {/* Desktop Layout - Full height avec scroll uniquement sur le tableau */}
      <div className="hidden md:flex md:flex-col md:h-[calc(100vh-64px)] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6">
          <div>
            <h1 className="text-2xl font-medium mb-2">
              Transferts de fichiers
            </h1>
          </div>
          <div className="flex gap-2">
            {/* <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => refetchTransfers()}
                  >
                    <Download className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-[#202020] text-white border-0"
                >
                  <p>Actualiser</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider> */}
            <ButtonGroup>
              <Button
                onClick={() => setShowUploadModal(true)}
                className="cursor-pointer font-normal bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                Nouveau transfert
              </Button>
              <ButtonGroupSeparator />
              <Button
                onClick={() => setShowUploadModal(true)}
                size="icon"
                className="cursor-pointer bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                <Plus size={16} aria-hidden="true" />
              </Button>
            </ButtonGroup>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex gap-3 px-4 sm:px-6 py-3">
          {/* Transferts actifs + Téléchargés */}
          <div className="bg-background border rounded-lg px-4 py-3 flex items-center gap-0">
            {/* Transferts actifs */}
            <div className="pr-4">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs text-muted-foreground">
                  En attente
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="bg-[#202020] text-white border-0"
                    >
                      <p>Transferts en attente de téléchargement</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-medium tracking-tight">
                  {transfersLoading ? "..." : transferStats.activeTransfers}
                </span>
                <span className="text-xs text-muted-foreground">
                  transfert(s)
                </span>
              </div>
            </div>

            {/* Separator */}
            <div className="w-px h-10 bg-border mx-4" />

            {/* Téléchargés */}
            <div className="pl-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs text-muted-foreground">
                  Téléchargés
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="bg-[#202020] text-white border-0"
                    >
                      <p>Transferts téléchargés au moins une fois</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-medium tracking-tight">
                  {transfersLoading ? "..." : transferStats.downloadedTransfers}
                </span>
                <span className="text-xs text-muted-foreground">
                  transfert(s)
                </span>
              </div>
            </div>
          </div>

          {/* Transferts expirés */}
          <div className="bg-background border rounded-lg px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs text-muted-foreground">Expirés</span>
              {transferStats.expiredTransfers > 0 && (
                <span className="h-4 w-4 flex items-center justify-center rounded-full bg-red-100 text-red-500 text-[10px] font-medium">
                  {transferStats.expiredTransfers}
                </span>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-[#202020] text-white border-0"
                  >
                    <p>Transferts dont la date d'expiration est dépassée</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-medium tracking-tight">
                {transfersLoading ? "..." : transferStats.expiredTransfers}
              </span>
              <span className="text-xs text-muted-foreground">
                transfert(s)
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <Suspense fallback={<TransferTableSkeleton />}>
          <TransferTable
            transfers={transfers}
            onRefresh={refetchTransfers}
            loading={transfersLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            transferCounts={transferCounts}
            onSelectionChange={setSelectionState}
            selectionState={selectionState}
            onShowDeleteDialog={() => setShowDeleteDialog(true)}
          />
        </Suspense>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Header - Style mobile */}
        <div className="px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-medium mb-2">Transferts</h1>
              <p className="text-muted-foreground text-sm">
                Partagez des fichiers volumineux
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchTransfers()}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <Suspense fallback={<TransferTableSkeleton />}>
          <TransferTable
            transfers={transfers}
            onRefresh={refetchTransfers}
            loading={transfersLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            transferCounts={transferCounts}
            onSelectionChange={setSelectionState}
            selectionState={selectionState}
            onShowDeleteDialog={() => setShowDeleteDialog(true)}
            isMobile={true}
          />
        </Suspense>

        {/* Bouton flottant mobile */}
        <Button
          onClick={() => setShowUploadModal(true)}
          className="fixed bottom-6 bg-[#5a50ff] right-6 h-14 w-14 rounded-full shadow-lg z-50 md:hidden"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectionState?.count || 0}{" "}
              transfert(s) ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                selectionState?.onDelete?.();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => !isUploading && setShowUploadModal(false)}
        >
          {/* Overlay */}
          <div
            className={`fixed inset-0 bg-black/50 ${isUploading ? "cursor-not-allowed" : ""}`}
          />

          {/* Modal Content */}
          <div
            className="relative z-50 max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto bg-background rounded-xl border border-border p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Caché pendant l'upload */}
            {!isUploading && (
              <button
                onClick={() => setShowUploadModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            )}

            {/* Header */}
            <div className="mb-6 pr-10">
              <h2 className="text-lg font-semibold text-foreground">
                Nouveau transfert
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isUploading
                  ? "Transfert en cours... Ne fermez pas cette fenêtre."
                  : "Partagez des fichiers volumineux jusqu'à 5GB avec vos clients ou collaborateurs"}
              </p>
            </div>

            {/* Content */}
            <FileUploadNew
              onTransferCreated={handleTransferCreated}
              refetchTransfers={refetchTransfers}
              onUploadingChange={setIsUploading}
            />
          </div>
        </div>
      )}

      {/* Dialog de succès après création */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-xs p-6 gap-0">
          <div className="flex flex-col items-center space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Transfert créé
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                Scannez pour accéder aux fichiers
              </DialogDescription>
            </div>

            {/* QR Code */}
            <QrCode.Root value={transferLink} encoding={{ ecc: "M" }}>
              <QrCode.Frame className="w-48 h-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-lg">
                <QrCode.Pattern className="fill-gray-900 dark:fill-white" />
              </QrCode.Frame>
            </QrCode.Root>

            {/* Lien */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                <span className="font-mono text-xs break-all">
                  {transferLink.replace(/^https?:\/\//, "")}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pointez votre caméra sur le QR code
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={copyToClipboard}
                className="flex-1 font-normal h-9 text-sm"
              >
                <Link2 className="w-4 h-4 mr-1.5" />
                Copier
              </Button>
              <Button
                onClick={() => {
                  openInNewTab();
                  setShowSuccessDialog(false);
                }}
                className="flex-1 font-normal h-9 text-sm bg-[#5a50ff] hover:bg-[#5a50ff]/90"
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                Ouvrir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TransferTableSkeleton() {
  return (
    <>
      {/* Desktop Skeleton */}
      <div className="hidden md:block space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[300px]" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
        </div>
        <div className="rounded-md border">
          <div className="p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Skeleton */}
      <div className="md:hidden">
        {/* Header */}
        <div className="px-4 py-6 space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Toolbar */}
        <div className="px-4 py-3">
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Table rows */}
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b border-gray-50 px-4 py-3">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
