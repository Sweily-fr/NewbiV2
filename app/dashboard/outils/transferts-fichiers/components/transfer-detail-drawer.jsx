"use client";

import { useState, useRef, useEffect } from "react";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/src/components/ui/drawer";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  VisuallyHidden,
} from "@/src/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Download,
  Eye,
  Lock,
  Euro,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  X,
  MoreVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Check,
  Copy,
  HelpCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";

// Fonction pour obtenir l'extension du fichier
function getFileExtension(filename) {
  if (!filename) return "";
  return filename.split(".").pop()?.toLowerCase() || "";
}

// Fonction pour obtenir l'icône selon le type de fichier
function getFileIcon(filename, size = "w-5 h-5") {
  const ext = getFileExtension(filename);
  if (["doc", "docx", "txt", "rtf", "pdf"].includes(ext)) {
    return <FileText className={`${size} text-gray-400`} />;
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <FileSpreadsheet className={`${size} text-gray-400`} />;
  }
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
    return <FileImage className={`${size} text-gray-400`} />;
  }
  return <File className={`${size} text-gray-400`} />;
}

// Vérifier si c'est une image
function isImageFile(file) {
  if (file?.mimeType?.startsWith("image/")) return true;
  const ext = getFileExtension(file?.originalName);
  return ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "bmp", "svg", "tiff"].includes(ext);
}

// Vérifier si c'est un PDF
function isPdfFile(file) {
  if (file?.mimeType === "application/pdf") return true;
  return getFileExtension(file?.originalName) === "pdf";
}

// Vérifier si le fichier est prévisualisable
function isPreviewable(file) {
  return isImageFile(file) || isPdfFile(file);
}

// Formater la taille du fichier
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 ko";
  const k = 1024;
  if (bytes < k) return `${bytes} o`;
  if (bytes < k * k) return `${(bytes / k).toFixed(1)} ko`;
  if (bytes < k * k * k) return `${(bytes / (k * k)).toFixed(1)} Mo`;
  return `${(bytes / (k * k * k)).toFixed(1)} Go`;
}

// Construire l'URL de preview
function getPreviewUrl(transferId, file) {
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  ).replace(/\/$/, "");
  return `${apiUrl}/api/files/preview/${transferId}/${file.fileId || file.id}`;
}

export function TransferDetailDrawer({
  transfer,
  open,
  onOpenChange,
  onDelete,
  onRename,
  onRefresh,
}) {
  // Copier le lien
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  // Download count local state (pour mise à jour instantanée)
  const [localDownloadCount, setLocalDownloadCount] = useState(0);
  useEffect(() => {
    setLocalDownloadCount(transfer?.downloadCount || 0);
  }, [transfer?.id, transfer?.downloadCount]);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Tous les hooks sont déclarés avant tout return conditionnel
  if (!transfer) return null;

  const firstFile = transfer.files?.[0];
  const fileName = firstFile?.originalName || firstFile?.fileName || "Fichier";
  const totalSize =
    transfer.files?.reduce((acc, file) => acc + (file.size || 0), 0) || 0;
  const fileCount = transfer.files?.length || 0;

  // Construire le lien de partage
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/transfer/${transfer.shareLink}${transfer.accessKey ? `?key=${transfer.accessKey}` : ""}`;

  // Fichiers prévisualisables pour la navigation dans le lightbox
  const previewableFiles = transfer.files?.filter(isPreviewable) || [];

  const openLightbox = (file, index) => {
    // Trouver l'index dans les fichiers prévisualisables
    const previewIndex = previewableFiles.findIndex(
      (f) => (f.id || f.fileId) === (file.id || file.fileId)
    );
    setLightboxIndex(previewIndex >= 0 ? previewIndex : 0);
    setLightboxOpen(true);
  };

  const lightboxFile = previewableFiles[lightboxIndex];
  const canGoPrev = lightboxIndex > 0;
  const canGoNext = lightboxIndex < previewableFiles.length - 1;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Lien copié dans le presse-papiers");
    setTimeout(() => setCopied(false), 1500);
  };

  // Télécharger un fichier via un lien <a> (plus fiable que window.open)
  const downloadFile = async (file) => {
    try {
      const apiUrl = (
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      ).replace(/\/$/, "");
      const downloadUrl = `${apiUrl}/api/files/download/${transfer.id}/${file.fileId || file.id}`;

      // Créer un lien temporaire pour déclencher le téléchargement
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Incrémenter le compteur local immédiatement
      setLocalDownloadCount((prev) => prev + 1);
      toast.success("Téléchargement démarré");

      // Rafraîchir les données serveur après un court délai
      // pour que le backend ait le temps d'incrémenter le compteur
      setTimeout(() => {
        onRefresh?.();
      }, 2000);
    } catch (error) {
      console.error("Erreur téléchargement:", error);
      toast.error("Erreur lors du téléchargement");
    }
  };

  // Formater la date
  const formatDate = (dateInput) => {
    if (!dateInput) return "Non spécifiée";
    try {
      return format(new Date(dateInput), "d MMM. yyyy", { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  // Calculer le temps relatif depuis la création
  const getRelativeTime = (dateInput) => {
    if (!dateInput) return "";
    try {
      const date = new Date(dateInput);
      const now = new Date();
      const diffMs = now - date;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return "Envoyé il y a quelques secondes";
      if (diffMins < 60)
        return `Envoyé il y a ${diffMins} minute${diffMins > 1 ? "s" : ""}`;
      if (diffHours < 24)
        return `Envoyé il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
      return `Envoyé il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
    } catch {
      return "";
    }
  };

  // Vérifier si expiré
  const isExpired =
    transfer.expiryDate && new Date(transfer.expiryDate) < new Date();

  return (
    <>
      {/* Lightbox de prévisualisation */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-w-[90vw] max-h-[90vh] w-[70vw] p-0 bg-white overflow-hidden rounded-2xl sm:max-w-[70vw]"
          showCloseButton={false}
        >
          <VisuallyHidden>
            <DialogTitle>Prévisualisation</DialogTitle>
          </VisuallyHidden>

          {lightboxFile && (
            <div className="flex flex-col h-full">
              {/* Header lightbox */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {lightboxFile.originalName}
                  </p>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatFileSize(lightboxFile.size)}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Navigation */}
                  {previewableFiles.length > 1 && (
                    <div className="flex items-center gap-1 mr-2">
                      <button
                        onClick={() => setLightboxIndex((i) => i - 1)}
                        disabled={!canGoPrev}
                        className={`p-1.5 rounded-lg transition-colors ${
                          canGoPrev
                            ? "text-gray-500 hover:bg-gray-100"
                            : "text-gray-200 cursor-not-allowed"
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-gray-400 min-w-[40px] text-center">
                        {lightboxIndex + 1}/{previewableFiles.length}
                      </span>
                      <button
                        onClick={() => setLightboxIndex((i) => i + 1)}
                        disabled={!canGoNext}
                        className={`p-1.5 rounded-lg transition-colors ${
                          canGoNext
                            ? "text-gray-500 hover:bg-gray-100"
                            : "text-gray-200 cursor-not-allowed"
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {/* Download */}
                  <button
                    onClick={() => downloadFile(lightboxFile)}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {/* Fermer */}
                  <button
                    onClick={() => setLightboxOpen(false)}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contenu */}
              <div className="flex items-center justify-center p-4 bg-gray-50" style={{ minHeight: "60vh" }}>
                {isImageFile(lightboxFile) ? (
                  <img
                    src={getPreviewUrl(transfer.id, lightboxFile)}
                    alt={lightboxFile.originalName}
                    className="max-w-full max-h-[75vh] object-contain rounded-lg"
                  />
                ) : isPdfFile(lightboxFile) ? (
                  <iframe
                    src={getPreviewUrl(transfer.id, lightboxFile)}
                    className="w-full border-0 rounded-lg bg-white"
                    style={{ height: "75vh" }}
                    title={lightboxFile.originalName}
                  />
                ) : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Drawer principal */}
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent
          className="h-full md:w-[800px] md:max-w-[800px] md:min-w-[800px]"
          style={{ height: "100vh" }}
        >
          <VisuallyHidden>
            <DrawerTitle>Détails du transfert</DrawerTitle>
          </VisuallyHidden>
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header - Fermer */}
            <div className="px-6 pt-5 pb-4">
              <DrawerClose asChild>
                <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                  <X className="h-4 w-4" />
                  <span>Fermer</span>
                </button>
              </DrawerClose>
            </div>

            {/* Content scrollable */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* Titre du fichier */}
              <div className="flex items-start justify-between mb-1">
                <h1 className="text-[28px] font-normal text-gray-900 leading-tight pr-4">
                  {fileName}
                </h1>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => onRename?.(transfer)}
                      className="cursor-pointer text-xs"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Renommer le transfert
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        onDelete?.(transfer.id);
                        onOpenChange?.(false);
                      }}
                      className="text-destructive cursor-pointer text-xs"
                    >
                      <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                      <span className="text-red-500">Supprimer le transfert</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Sous-titre */}
              <p className="text-sm text-gray-500 mb-6">
                {fileCount} fichier{fileCount > 1 ? "s" : ""} ·{" "}
                {formatFileSize(totalSize)} ·{" "}
                {getRelativeTime(transfer.createdAt)}
              </p>

              {/* Lien de partage */}
              <div className="relative mb-8 w-1/2">
                <Input
                  className="pe-9 text-xs h-9 bg-gray-50 border-gray-200 rounded-lg"
                  defaultValue={shareUrl}
                  readOnly
                  ref={inputRef}
                  type="text"
                />
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label={copied ? "Copié" : "Copier le lien"}
                        className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-none transition-[color,box-shadow] hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed"
                        disabled={copied}
                        onClick={handleCopy}
                        type="button"
                      >
                        <div
                          className={cn(
                            "transition-all",
                            copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
                          )}
                        >
                          <Check
                            aria-hidden="true"
                            className="stroke-emerald-500"
                            size={16}
                          />
                        </div>
                        <div
                          className={cn(
                            "absolute transition-all",
                            copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
                          )}
                        >
                          <Copy aria-hidden="true" size={16} />
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="px-2 py-1 text-xs">
                      Copier le lien
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Grid principale */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Bloc gauche - Date + Badge */}
                <div className="border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        Date d'expiration
                      </p>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(transfer.expiryDate)}
                        </p>
                        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                    </div>
                    {!isExpired && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-600 text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Actif
                      </span>
                    )}
                  </div>
                </div>

                {/* Bloc droit - Contrôle + Téléchargements */}
                <div className="border border-gray-200 rounded-2xl p-4 flex">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-1 mb-0.5">
                      <p className="text-xs text-gray-500">Contrôle d'accès</p>
                      <HelpCircle className="h-3 w-3 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">Public</p>
                  </div>
                  <div className="border-l border-gray-200 pl-4">
                    <p className="text-xs text-gray-500 mb-0.5">
                      Nombre de téléchargements
                    </p>
                    <p className="text-xl font-medium text-gray-900">
                      {localDownloadCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid secondaire */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Paramètres supplémentaires */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <p className="px-5 py-3 text-xs text-gray-500 border-b border-gray-200">
                    Paramètres supplémentaires
                  </p>

                  {/* Prévisualiser */}
                  <div className="w-full flex items-center px-5 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <Eye className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-700">
                        Prévisualiser et télécharger
                      </span>
                    </div>
                  </div>

                  {/* Mot de passe */}
                  <div className="w-full flex items-center px-5 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-700">
                        {transfer.passwordProtected
                          ? "Protégé par mot de passe"
                          : "Aucun mot de passe défini"}
                      </span>
                    </div>
                  </div>

                  {/* Prix */}
                  <div className="w-full flex items-center px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Euro className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-700">
                        {transfer.paymentAmount
                          ? `${transfer.paymentAmount} ${transfer.paymentCurrency || "EUR"}`
                          : "Aucun prix défini"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prévisualisation */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <p className="px-5 py-3 text-xs text-gray-500 border-b border-gray-200">
                    Prévisualiser
                  </p>
                  <div className="p-4 flex gap-3 overflow-x-auto">
                    {transfer.files?.map((file, index) => {
                      const isImg = isImageFile(file);
                      const isPdf = isPdfFile(file);
                      const canPreview = isImg || isPdf;
                      const previewUrl = getPreviewUrl(transfer.id, file);

                      return (
                        <button
                          key={file.id || index}
                          onClick={() => canPreview && openLightbox(file, index)}
                          className={cn(
                            "w-32 h-40 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all relative group",
                            canPreview
                              ? "cursor-pointer hover:border-gray-400 hover:shadow-sm"
                              : "cursor-default"
                          )}
                        >
                          {isImg ? (
                            <img
                              src={previewUrl}
                              alt={file.originalName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.parentElement.querySelector('.preview-fallback').style.display = "flex";
                              }}
                            />
                          ) : isPdf ? (
                            <iframe
                              src={previewUrl}
                              className="w-full h-full pointer-events-none border-0"
                              title={file.originalName}
                            />
                          ) : null}
                          <div
                            className="preview-fallback text-center p-2 items-center justify-center"
                            style={{ display: isImg || isPdf ? "none" : "flex" }}
                          >
                            {getFileIcon(file.originalName, "w-8 h-8")}
                          </div>
                          {/* Overlay oeil au hover */}
                          {canPreview && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <div className="w-9 h-9 rounded-full bg-white/90 items-center justify-center shadow hidden group-hover:flex transition-all">
                                <Eye className="w-4 h-4 text-gray-700" />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Liste des fichiers */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <p className="px-5 py-3 text-sm font-medium text-gray-900 border-b border-gray-200">
                  {fileCount} fichier{fileCount > 1 ? "s" : ""}
                </p>
                <div>
                  {transfer.files?.map((file, index) => (
                    <div
                      key={file.id || index}
                      className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-900 truncate">
                          {file.originalName || `Fichier ${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)} ·{" "}
                          {getFileExtension(file.originalName) || "fichier"}
                        </p>
                      </div>
                      <button
                        onClick={() => downloadFile(file)}
                        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-4"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
