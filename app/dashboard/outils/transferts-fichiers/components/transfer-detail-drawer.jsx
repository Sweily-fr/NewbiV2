"use client";

import { useState, useRef } from "react";
import { Drawer, DrawerClose, DrawerContent } from "@/src/components/ui/drawer";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
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

// Formater la taille du fichier
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 ko";
  const k = 1024;
  if (bytes < k) return `${bytes} o`;
  if (bytes < k * k) return `${(bytes / k).toFixed(1)} ko`;
  if (bytes < k * k * k) return `${(bytes / (k * k)).toFixed(1)} Mo`;
  return `${(bytes / (k * k * k)).toFixed(1)} Go`;
}

export function TransferDetailDrawer({
  transfer,
  open,
  onOpenChange,
  onDelete,
  onRename,
}) {
  if (!transfer) return null;

  const firstFile = transfer.files?.[0];
  const fileName = firstFile?.originalName || firstFile?.fileName || "Fichier";
  const totalSize =
    transfer.files?.reduce((acc, file) => acc + (file.size || 0), 0) || 0;
  const fileCount = transfer.files?.length || 0;

  // Construire le lien de partage
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/transfer/${transfer.shareLink}${transfer.accessKey ? `?key=${transfer.accessKey}` : ""}`;

  // Copier le lien
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Lien copié dans le presse-papiers");
    setTimeout(() => setCopied(false), 1500);
  };

  // Télécharger un fichier
  const downloadFile = async (file) => {
    try {
      const apiUrl = (
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      ).replace(/\/$/, "");
      const downloadUrl = `${apiUrl}/api/files/download/${transfer.id}/${file.fileId || file.id}`;

      // Ouvrir le lien de téléchargement
      window.open(downloadUrl, "_blank");
      toast.success("Téléchargement démarré");
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
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className="h-full md:w-[800px] md:max-w-[800px] md:min-w-[800px]"
        style={{ height: "100vh" }}
      >
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
                    {transfer.downloadCount || 0}
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
                <button className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-700">
                      Prévisualiser et télécharger
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Mot de passe */}
                <button className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-700">
                      {transfer.password
                        ? "Protégé par mot de passe"
                        : "Aucun mot de passe défini"}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Prix */}
                <button className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Euro className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-700">
                      {transfer.paymentAmount
                        ? `${transfer.paymentAmount} ${transfer.paymentCurrency || "EUR"}`
                        : "Aucun prix défini"}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Prévisualisation */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <p className="px-5 py-3 text-xs text-gray-500 border-b border-gray-200">
                  Prévisualiser
                </p>
                <div className="p-4 flex gap-3 overflow-x-auto">
                  {transfer.files?.map((file, index) => {
                    const isImage =
                      file.mimeType?.startsWith("image/") ||
                      ["jpg", "jpeg", "png", "gif", "webp"].includes(
                        getFileExtension(file.originalName)
                      );
                    const apiUrl = (
                      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
                    ).replace(/\/$/, "");
                    const previewUrl = `${apiUrl}/api/files/preview/${transfer.id}/${file.fileId || file.id}`;

                    return (
                      <div
                        key={file.id || index}
                        className="w-24 h-32 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0"
                      >
                        {isImage ? (
                          <img
                            src={previewUrl}
                            alt={file.originalName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="text-center p-2 items-center justify-center"
                          style={{ display: isImage ? "none" : "flex" }}
                        >
                          {getFileIcon(file.originalName, "w-8 h-8")}
                        </div>
                      </div>
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
  );
}
