"use client";

import { useState } from "react";
import { Drawer, DrawerClose, DrawerContent } from "@/src/components/ui/drawer";
import { Button } from "@/src/components/ui/button";
import {
  Download,
  Eye,
  Link2,
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
  HelpCircle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "@/src/components/ui/sonner";

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
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Lien copié dans le presse-papiers");
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
              <button className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>

            {/* Sous-titre */}
            <p className="text-sm text-gray-500 mb-6">
              {fileCount} fichier{fileCount > 1 ? "s" : ""} ·{" "}
              {formatFileSize(totalSize)} ·{" "}
              {getRelativeTime(transfer.createdAt)}
            </p>

            {/* Lien + Actions */}
            <div className="flex items-center justify-between mb-8">
              {/* Lien de partage */}
              <div className="flex items-center gap-0 border border-gray-200 rounded-full overflow-hidden">
                <div className="px-4 py-2 bg-white">
                  <p className="text-sm text-gray-700 max-w-[200px] truncate">
                    {shareUrl.replace(/^https?:\/\//, "").split("?")[0]}
                  </p>
                </div>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-2 px-4 py-2 border-l border-gray-200 text-[#5a50ff] hover:bg-gray-50 transition-colors"
                >
                  <Link2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Copier</span>
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-6">
                <button className="flex flex-col items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors">
                  <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
                    <Download className="h-5 w-5" />
                  </div>
                  <span className="text-xs">Téléchargement</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#5a50ff] flex items-center justify-center">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs">Prévisualiser</span>
                </button>
              </div>
            </div>

            {/* Grid principale */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Bloc gauche - Date + Badge */}
              <div className="border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Date d'expiration
                    </p>
                    <div className="flex items-center gap-1">
                      <p className="text-base font-medium text-gray-900">
                        {formatDate(transfer.expiryDate)}
                      </p>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  {!isExpired && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f5e9] rounded-full">
                      <CheckCircle className="h-4 w-4 text-[#4caf50]" />
                      <span className="text-xs font-medium text-[#4caf50]">
                        Le transfert est récupérable
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bloc droit - Contrôle + Téléchargements */}
              <div className="border border-gray-200 rounded-2xl p-5 flex">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-gray-500">Contrôle d'accès</p>
                    <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <p className="text-base font-medium text-gray-900">Public</p>
                </div>
                <div className="border-l border-gray-200 pl-4">
                  <p className="text-xs text-gray-500 mb-1">
                    Nombre de téléchargements
                  </p>
                  <p className="text-2xl font-medium text-gray-900">
                    {transfer.downloadCount || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Grid secondaire */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Paramètres supplémentaires */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <p className="px-5 py-4 text-sm text-gray-500 border-b border-gray-200">
                  Paramètres supplémentaires
                </p>

                {/* Prévisualiser */}
                <button className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      Prévisualiser et télécharger
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Mot de passe */}
                <button className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {transfer.password
                        ? "Protégé par mot de passe"
                        : "Aucun mot de passe défini"}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Prix */}
                <button className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Euro className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
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
                <p className="px-5 py-4 text-sm text-gray-500 border-b border-gray-200">
                  Prévisualiser
                </p>
                <div className="p-4 flex gap-3">
                  {transfer.files?.slice(0, 3).map((file, index) => {
                    const isImage = file.mimeType?.startsWith("image/");
                    return (
                      <div
                        key={file.id || index}
                        className="w-24 h-32 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden"
                      >
                        {isImage && file.url ? (
                          <img
                            src={file.url}
                            alt={file.originalName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-2">
                            {getFileIcon(file.originalName, "w-8 h-8")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Liste des fichiers */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <p className="px-5 py-4 text-base font-medium text-gray-900 border-b border-gray-200">
                {fileCount} fichier{fileCount > 1 ? "s" : ""}
              </p>
              <div>
                {transfer.files?.map((file, index) => (
                  <div
                    key={file.id || index}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 truncate">
                        {file.originalName || `Fichier ${index + 1}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} ·{" "}
                        {getFileExtension(file.originalName) || "fichier"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
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
