"use client";

import { useState } from "react";
import { Sheet, SheetContent } from "@/src/components/ui/sheet";
import { Button } from "@/src/components/ui/button";
import {
  Download,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Fonction pour obtenir l'extension du fichier
function getFileExtension(filename) {
  if (!filename) return "";
  return filename.split(".").pop()?.toLowerCase() || "";
}

// Formater la taille du fichier
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 ko";
  const k = 1024;
  const sizes = ["octets", "ko", "Mo", "Go"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Déterminer si c'est une image
function isImage(file) {
  if (file?.mimeType?.startsWith("image/")) return true;
  const ext = getFileExtension(file?.originalName);
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
}

// Déterminer si c'est un PDF
function isPdf(file) {
  if (file?.mimeType === "application/pdf") return true;
  const ext = getFileExtension(file?.originalName);
  return ext === "pdf";
}

export function FilePreviewDrawer({
  file,
  files = [],
  currentIndex = 0,
  onClose,
  onDownload,
  onNavigate,
}) {
  const [viewMode, setViewMode] = useState("grid"); // "grid" ou "list"

  if (!file) return null;

  const ext = getFileExtension(file.originalName).toUpperCase();
  const totalFiles = files.length || 1;
  const displayIndex = currentIndex + 1;

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < totalFiles - 1;

  const handlePrev = () => {
    if (canGoPrev && onNavigate) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext && onNavigate) {
      onNavigate(currentIndex + 1);
    }
  };

  return (
    <Sheet open={!!file} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-[50%] p-0 flex flex-col bg-white border-r-0"
      >
        <div className="flex flex-col h-full">
          {/* Header - Style WeTransfer */}
          <div className="px-8 pt-16 pb-6">
            {/* Titre */}
            <div className="flex items-start justify-between gap-6">
              <h1 className="text-3xl font-bold text-gray-800 leading-tight break-all">
                {file.originalName}
              </h1>
            </div>

            {/* Infos sous le titre */}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span>
                {ext} • {formatFileSize(file.size)}
              </span>
            </div>
          </div>

          {/* Toolbar - Navigation + Toggle vue */}
          <div className="px-8 pb-4 flex items-center justify-between">
            {/* Navigation entre fichiers */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                disabled={!canGoPrev}
                className={`p-2 rounded-lg transition-colors ${
                  canGoPrev
                    ? "text-gray-400 hover:text-gray-800 hover:bg-gray-100"
                    : "text-gray-200 cursor-not-allowed"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500 min-w-[80px] text-center">
                {displayIndex}/{totalFiles} fichier{totalFiles > 1 ? "s" : ""}
              </span>
              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className={`p-2 rounded-lg transition-colors ${
                  canGoNext
                    ? "text-gray-400 hover:text-gray-800 hover:bg-gray-100"
                    : "text-gray-200 cursor-not-allowed"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle vue */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-gray-100 text-gray-800"
                    : "text-gray-400 hover:text-gray-800"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-gray-100 text-gray-800"
                    : "text-gray-400 hover:text-gray-800"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto px-8 pb-8">
            {viewMode === "grid" ? (
              /* Vue Grille - Image grande */
              <div className="relative group">
                {isImage(file) ? (
                  <div className="relative inline-block">
                    <img
                      src={file.previewUrl}
                      alt={file.originalName}
                      className="max-w-full max-h-[500px] rounded-lg object-contain"
                    />
                    {/* Bouton download sur l'image */}
                    <button
                      onClick={() => onDownload?.(file)}
                      className="absolute bottom-4 right-4 w-10 h-10 bg-black/80 hover:bg-black rounded-full flex items-center justify-center transition-colors"
                    >
                      <Download className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ) : isPdf(file) ? (
                  <iframe
                    src={file.previewUrl}
                    className="w-full h-[500px] rounded-lg bg-white"
                    title={file.originalName}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500 text-sm bg-gray-100 rounded-lg">
                    Prévisualisation non disponible
                  </div>
                )}
              </div>
            ) : (
              /* Vue Liste - Tableau */
              <div className="space-y-0">
                {/* Header tableau */}
                <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200">
                  <div className="col-span-6">Nom</div>
                  <div className="col-span-2">Format</div>
                  <div className="col-span-2">Taille</div>
                  <div className="col-span-2"></div>
                </div>
                {/* Ligne du fichier */}
                <div className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-gray-50 transition-colors border-b border-gray-200">
                  <div className="col-span-6 flex items-center gap-3">
                    {isImage(file) ? (
                      <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden shrink-0">
                        <img
                          src={file.previewUrl}
                          alt={file.originalName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center shrink-0">
                        <span className="text-gray-500 text-xs uppercase">
                          {ext}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-gray-800 truncate">
                      {file.originalName}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm text-gray-400">{ext}</div>
                  <div className="col-span-2 text-sm text-gray-400">
                    {formatFileSize(file.size)}
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button
                      onClick={() => onDownload?.(file)}
                      className="p-2 text-gray-400 hover:text-gray-800 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer avec bouton Télécharger */}
          <div className="px-8 py-4 border-t border-gray-100 flex justify-end">
            <Button
              onClick={() => onDownload?.(file)}
              className="text-white rounded-lg px-6"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
