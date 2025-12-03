"use client";

import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { File, Download, Eye, Lock } from "lucide-react";

// Fonction pour formater la taille des fichiers
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Fonction pour vérifier si un fichier peut être prévisualisé
const canPreview = (file, allowPreview) => {
  if (!allowPreview) return false;

  const previewableMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "text/plain",
    "text/html",
    "text/css",
    "text/javascript",
    "application/json",
  ];

  // Vérifier par type MIME
  if (previewableMimeTypes.includes(file.mimeType)) return true;

  // Fallback: vérifier par extension de fichier
  const fileName = file.originalName || file.fileName || "";
  const ext = fileName.split(".").pop()?.toLowerCase();
  const previewableExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "svg",
    "pdf",
    "txt",
    "html",
    "css",
    "js",
    "json",
  ];

  return previewableExtensions.includes(ext);
};

export function FileList({
  files,
  isExpired,
  isPaymentRequired,
  allowPreview,
  isDownloading,
  onDownloadFile,
  onDownloadAll,
  onPreview,
}) {
  return (
    <Card className="shadow-none border-none flex-1 flex flex-col overflow-hidden">
      <CardHeader className="p-0 flex-shrink-0">
        <CardTitle className="flex flex-col lg:flex-row lg:items-center font-normal lg:justify-between gap-4">
          <span className="flex items-center space-x-2">
            <span>Fichiers ({files?.length || 0})</span>
            <div className="w-2 h-2 bg-[#5b4fff]/20 rounded-full"></div>
          </span>
          {files?.length > 1 && !isExpired && (
            <Button
              onClick={onDownloadAll}
              disabled={isDownloading || isPaymentRequired}
              className="font-normal cursor-pointer bg-[#5b4fff] border-[#5b4fff]/80 hover:bg-[#5b4fff]/90 disabled:opacity-50 disabled:cursor-not-allowed w-full lg:w-auto"
            >
              {isDownloading ? "Téléchargement..." : "Tout télécharger"}
              <Download size={16} />
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-y-auto">
        {files?.length > 0 ? (
          <div className="space-y-3 pr-2">
            {files.map((file, index) => (
              <div
                key={file.id || index}
                className={`flex items-center justify-between p-4 border rounded-xl transition-all duration-200 ${
                  isPaymentRequired
                    ? "border-gray-200 bg-gray-50/50"
                    : "border-gray-200 hover:bg-[#5b4fff]/5 hover:border-[#5b4fff]/20"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isPaymentRequired ? "bg-gray-100" : "bg-[#5b4fff]/10"
                    }`}
                  >
                    <File
                      size={16}
                      className={
                        isPaymentRequired
                          ? "text-gray-400"
                          : "text-[#5b4fff]/70"
                      }
                    />
                  </div>
                  <div>
                    <p
                      className={`font-normal text-sm ${
                        isPaymentRequired ? "text-gray-400" : "text-gray-900"
                      }`}
                    >
                      {file.originalName}
                    </p>
                    <p
                      className={`text-xs font-normal ${
                        isPaymentRequired ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {formatFileSize(file.size)} • {file.mimeType}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Bouton de prévisualisation */}
                  {canPreview(file, allowPreview) &&
                    !isPaymentRequired &&
                    !isExpired && (
                      <Button
                        variant="ghost"
                        onClick={() => onPreview(file)}
                        size="sm"
                        className="hover:bg-[#5b4fff]/10 hover:text-[#5b4fff]"
                        title="Prévisualiser"
                      >
                        <Eye size={16} />
                      </Button>
                    )}

                  {/* Bouton de téléchargement */}
                  <Button
                    variant="ghost"
                    onClick={() => onDownloadFile(file.id, file.originalName)}
                    disabled={isDownloading || isExpired || isPaymentRequired}
                    size="sm"
                    className={`${
                      isPaymentRequired
                        ? "cursor-not-allowed opacity-50"
                        : "hover:bg-[#5b4fff]/10 hover:text-[#5b4fff]"
                    }`}
                    title="Télécharger"
                  >
                    {isPaymentRequired ? (
                      <Lock size={16} className="text-gray-400" />
                    ) : (
                      <Download size={16} className="cursor-pointer" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            Aucun fichier disponible
          </p>
        )}
      </CardContent>
    </Card>
  );
}
