"use client";

import { useState, useEffect, useMemo } from "react";
import { RoleRouteGuard } from "@/src/components/rbac/RBACRouteGuard";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  IconCopy,
  IconExternalLink,
  IconUpload,
  IconList,
  IconSearch,
  IconPlus,
} from "@tabler/icons-react";
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  FolderPlus,
  X,
  Trash2,
} from "lucide-react";
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
import TransferTable from "./components/transfer-table";
import FileUploadNew from "./components/file-upload-new";
import { useFileTransfer } from "./hooks/useFileTransfer";
import { cn } from "@/src/lib/utils";

// Filtres disponibles
const FILTERS = [
  { id: "all", label: "Voir tout" },
  { id: "documents", label: "Documents" },
  { id: "spreadsheets", label: "Tableurs" },
  { id: "pdfs", label: "PDFs" },
  { id: "images", label: "Images" },
];

function TransfertsContent() {
  const { transfers, transfersLoading, refetchTransfers, formatFileSize } =
    useFileTransfer();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [transferLink, setTransferLink] = useState("");
  const [activeTab, setActiveTab] = useState("list"); // "upload" ou "list"
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectionState, setSelectionState] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Récupérer les fichiers récents (2 derniers transferts)
  const recentTransfers = useMemo(() => {
    if (!transfers || transfers.length === 0) return [];
    return transfers
      .filter((t) => t.status === "active")
      .slice(0, 2)
      .map((t) => ({
        id: t.id,
        name: t.files?.[0]?.originalName || "Fichier",
        size: formatFileSize(
          t.files?.reduce((acc, f) => acc + (f.size || 0), 0) || 0
        ),
        type: getFileExtension(t.files?.[0]?.originalName || ""),
        shareLink: t.shareLink,
        accessKey: t.accessKey,
      }));
  }, [transfers, formatFileSize]);

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
    setShowUploadModal(false);

    // Changer d'onglet vers "Mes transferts"
    setActiveTab("list");

    // Rafraîchir la liste des transferts
    refetchTransfers();
  };

  // Obtenir l'extension du fichier
  function getFileExtension(filename) {
    if (!filename) return "";
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    return ext;
  }

  // Obtenir l'icône selon le type de fichier
  function getFileIcon(filename) {
    const ext = getFileExtension(filename);
    if (["doc", "docx", "txt", "rtf"].includes(ext)) {
      return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
    if (["xls", "xlsx", "csv"].includes(ext)) {
      return <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />;
    }
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
      return <FileImage className="w-5 h-5 text-muted-foreground" />;
    }
    return <File className="w-5 h-5 text-muted-foreground" />;
  }

  return (
    <>
      {/* Main Layout */}
      <div className="space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-medium mb-2">Mes transferts</h1>
          <p className="text-muted-foreground text-sm">
            Partagez des fichiers volumineux jusqu'à 5GB avec vos clients ou
            collaborateurs
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Nouveau transfert */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="relative p-4 rounded-xl border border-border hover:border-muted-foreground/30 transition-colors text-left cursor-pointer"
          >
            <IconPlus className="absolute top-4 right-4 w-4 h-4 text-muted-foreground" />
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-background mb-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">
              Nouveau transfert
            </span>
          </button>
        </div>

        {/* File Explorer Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-base font-medium text-foreground">
              Explorateur de fichiers
            </h2>
          </div>

          {/* Filters + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer",
                    activeFilter === filter.id
                      ? "bg-[#5a50ff] text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Delete Button + Search */}
            <div className="flex items-center gap-2">
              {selectionState?.count > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={selectionState?.isDeleting}
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 h-9"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer ({selectionState.count})
                </Button>
              )}
              <div className="relative w-full sm:w-64">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher vos fichier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 border-border"
                />
              </div>
            </div>
          </div>

          {/* Transfer Table */}
          <TransferTable
            transfers={transfers}
            onRefresh={refetchTransfers}
            loading={transfersLoading}
            searchQuery={searchQuery}
            activeFilter={activeFilter}
            onSelectionChange={setSelectionState}
          />

          {/* Delete Confirmation Dialog */}
          <AlertDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer{" "}
                  {selectionState?.count || 0} transfert(s) ? Cette action est
                  irréversible.
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
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowUploadModal(false)}
        >
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/50" />

          {/* Modal Content */}
          <div
            className="relative z-50 max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto bg-background rounded-xl border border-border p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Header */}
            <div className="mb-6 pr-10">
              <h2 className="text-lg font-semibold text-foreground">
                Nouveau transfert
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Partagez des fichiers volumineux jusqu'à 5GB avec vos clients ou
                collaborateurs
              </p>
            </div>

            {/* Content */}
            <FileUploadNew
              onTransferCreated={handleTransferCreated}
              refetchTransfers={refetchTransfers}
            />
          </div>
        </div>
      )}

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
