"use client";

import { useState, useEffect } from "react";
import { Eye, X, LoaderCircle, FileIcon } from "lucide-react";

export function PreviewModal({ file, onClose }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Reset quand le fichier change
  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [file?.previewUrl]);

  if (!file) return null;

  // Déterminer si c'est une image basé sur le mimeType ou l'extension
  const isImage = () => {
    if (file.mimeType?.startsWith("image/")) return true;
    const ext = file.originalName?.split(".").pop()?.toLowerCase();
    return [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "svg",
      "heic",
      "heif",
    ].includes(ext);
  };

  // Déterminer si c'est un PDF
  const isPdf = () => {
    if (file.mimeType === "application/pdf") return true;
    const ext = file.originalName?.split(".").pop()?.toLowerCase();
    return ext === "pdf";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative bg-white rounded-xl max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-[#5b4fff]" />
            <span className="font-medium truncate max-w-[300px]">
              {file.originalName}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
          {isImage() ? (
            <div className="relative">
              {imageLoading && !imageError && (
                <div className="flex items-center justify-center h-[400px] bg-gray-50 rounded-lg">
                  <div className="flex flex-col items-center gap-3">
                    <LoaderCircle className="w-8 h-8 text-gray-300 animate-spin" />
                    <p className="text-sm text-gray-400">
                      Chargement de l&apos;aperçu…
                    </p>
                  </div>
                </div>
              )}
              {imageError ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-gray-400 bg-gray-50 rounded-lg">
                  <FileIcon className="w-16 h-16 mb-3" />
                  <p className="text-sm">
                    Impossible de charger la prévisualisation
                  </p>
                </div>
              ) : (
                <img
                  src={file.previewUrl}
                  alt={file.originalName}
                  className={`max-w-full h-auto mx-auto rounded-lg transition-opacity duration-300 ${imageLoading ? "hidden" : "opacity-100"}`}
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                />
              )}
            </div>
          ) : isPdf() ? (
            <iframe
              src={file.previewUrl}
              className="w-full h-[70vh]"
              title={file.originalName}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              Prévisualisation non disponible pour ce type de fichier
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
