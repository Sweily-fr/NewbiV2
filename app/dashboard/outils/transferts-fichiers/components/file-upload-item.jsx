"use client";

import { Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";

// Fonction pour formater la taille des fichiers
const formatBytes = (bytes, decimals = 0) => {
  if (!bytes) return "0 KB";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// Obtenir l'extension et la couleur du badge
const getFileTypeInfo = (file) => {
  const fileName = file.name.toLowerCase();
  const fileType = file.type;

  if (fileType.includes("pdf") || fileName.endsWith(".pdf")) {
    return { ext: "PDF", color: "bg-red-500" };
  }
  if (
    fileType.includes("word") ||
    fileName.endsWith(".doc") ||
    fileName.endsWith(".docx")
  ) {
    return { ext: "DOC", color: "bg-blue-600" };
  }
  if (
    fileType.includes("excel") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".xlsx")
  ) {
    return { ext: "XLS", color: "bg-green-600" };
  }
  if (
    fileType.includes("powerpoint") ||
    fileName.endsWith(".ppt") ||
    fileName.endsWith(".pptx")
  ) {
    return { ext: "PPT", color: "bg-orange-500" };
  }
  if (
    fileType.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/.test(fileName)
  ) {
    return { ext: "IMG", color: "bg-purple-500" };
  }
  if (fileType.startsWith("video/") || /\.(mp4|mov|avi|mkv)$/.test(fileName)) {
    return { ext: "VID", color: "bg-pink-500" };
  }
  if (fileType.startsWith("audio/") || /\.(mp3|wav|ogg)$/.test(fileName)) {
    return { ext: "AUD", color: "bg-yellow-500" };
  }
  if (fileType.includes("zip") || /\.(zip|rar|7z|tar)$/.test(fileName)) {
    return { ext: "ZIP", color: "bg-gray-600" };
  }
  if (fileType.includes("text") || /\.(txt|csv)$/.test(fileName)) {
    return { ext: "TXT", color: "bg-gray-500" };
  }
  return { ext: "FILE", color: "bg-gray-400" };
};

export function FileUploadItem({
  file,
  isUploading = false,
  uploadProgress = 0,
  isCompleted = false,
  onRemove,
}) {
  const { ext, color } = getFileTypeInfo(file);
  const uploadedSize = Math.round((file.size * uploadProgress) / 100);

  return (
    <div className="border rounded-xl p-3 bg-white">
      <div className="flex items-start gap-3">
        {/* Icône fichier avec badge */}
        <div className="relative flex-shrink-0">
          <svg
            className="w-8 h-12 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          {/* Badge type de fichier */}
          <div
            className={`absolute top-4.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[7px] font-medium text-white ${color}`}
          >
            {ext}
          </div>
        </div>

        {/* Infos fichier */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-normal text-gray-900 truncate">
            {file.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">
              {isUploading
                ? `${formatBytes(uploadedSize)} of ${formatBytes(file.size)}`
                : formatBytes(file.size)}
            </span>

            {isUploading && !isCompleted && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin text-[#5b4fff]" />
                Uploading...
              </span>
            )}

            {isCompleted && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed
              </span>
            )}
          </div>

          {/* Barre de progression */}
          {isUploading && !isCompleted && (
            <div className="mt-2">
              <Progress value={uploadProgress} className="h-1.5 bg-gray-100" />
            </div>
          )}
        </div>

        {/* Bouton supprimer */}
        {!isUploading && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
            onClick={onRemove}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}

        {isCompleted && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
            onClick={onRemove}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
