import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Paperclip,
  X,
  Loader2,
  Upload,
  ZoomIn,
  FileText,
  FileSpreadsheet,
  Play,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { PreviewImage } from "@/src/components/ui/preview-image";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const VALID_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  // Vidéos
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
];

const ACCEPT_STRING =
  "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv,.doc,.docx,.xls,.xlsx,.pdf,.txt,.csv,.mp4,.webm,.mov,.avi,.mkv";

function isImageType(contentType) {
  return contentType?.startsWith("image/");
}

function isVideoType(contentType) {
  return contentType?.startsWith("video/");
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getFileExtension(fileName) {
  return fileName?.split(".").pop()?.toLowerCase() || "";
}

function getFileIcon(file) {
  const contentType = file.contentType || file.type || "";
  const ext = getFileExtension(file.fileName || file.name);
  if (
    contentType.includes("excel") ||
    contentType.includes("spreadsheet") ||
    ["xls", "xlsx", "csv"].includes(ext)
  ) {
    return FileSpreadsheet;
  }
  return FileText;
}

function ImagePreview({ file, onDelete, isDeleting }) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div className="relative group">
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogTrigger asChild>
          <div className="relative cursor-pointer overflow-hidden rounded-lg border border-border hover:border-primary/50 transition-colors">
            <PreviewImage
              src={file.url || file._localUrl}
              alt={file.fileName || file.name}
              className="w-full h-24 object-cover"
              containerClassName="w-full h-24"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>Aperçu de l&apos;image</DialogTitle>
          </VisuallyHidden>
          <PreviewImage
            src={file.url || file._localUrl}
            alt={file.fileName || file.name}
            className="w-full h-auto max-h-[80vh] object-contain"
            containerClassName="w-full flex items-center justify-center"
            loaderSize="h-8 w-8"
          />
        </DialogContent>
      </Dialog>

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(file.id ?? file._localIndex);
          }}
          disabled={isDeleting}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-gray-800 text-muted-foreground border border-border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </button>
      )}

      <p className="text-xs text-muted-foreground mt-1 truncate max-w-[120px]">
        {file.fileName || file.name}
      </p>
    </div>
  );
}

function VideoPreview({ file, onDelete, isDeleting }) {
  const [isOpen, setIsOpen] = useState(false);
  const src = file.url || file._localUrl;

  return (
    <div className="relative group">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="relative cursor-pointer overflow-hidden rounded-lg border border-border hover:border-primary/50 transition-colors bg-black">
            <video
              src={src}
              className="w-full h-24 object-cover"
              muted
              playsInline
              preload="metadata"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="h-4 w-4 text-black fill-black ml-0.5" />
              </div>
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
          <VisuallyHidden>
            <DialogTitle>Lecture de la vidéo</DialogTitle>
          </VisuallyHidden>
          {isOpen && (
            <video
              src={src}
              className="w-full h-auto max-h-[80vh]"
              controls
              autoPlay
              playsInline
            />
          )}
        </DialogContent>
      </Dialog>

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(file.id ?? file._localIndex);
          }}
          disabled={isDeleting}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-gray-800 text-muted-foreground border border-border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </button>
      )}

      <p className="text-xs text-muted-foreground mt-1 truncate max-w-[120px]">
        {file.fileName || file.name}
      </p>
    </div>
  );
}

function DocumentPreview({ file, onDelete, isDeleting }) {
  const Icon = getFileIcon(file);
  const ext = getFileExtension(file.fileName || file.name);

  return (
    <div className="group flex items-center gap-2.5 rounded-lg border border-border hover:bg-accent/50 transition-colors px-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        <p className="text-sm text-foreground truncate">
          {file.fileName || file.name}
        </p>
        {(file.fileSize || file.size) && (
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatFileSize(file.fileSize || file.size)}
          </span>
        )}
      </div>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(file.id ?? file._localIndex);
          }}
          disabled={isDeleting}
          className="flex-shrink-0 p-1 rounded text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}

export function TaskImageUpload({
  images = [],
  onUpload,
  onDelete,
  isUploading = false,
  uploadProgress = 0,
  disabled = false,
  maxImages = 10,
  className,
  compact = false,
  placeholder = "Glissez des fichiers ici ou cliquez pour sélectionner",
  localMode = false,
  pendingFiles = [],
  onAddFiles,
  onRemoveFile,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [localPreviews, setLocalPreviews] = useState([]);
  const fileInputRef = useRef(null);
  const prevPendingFilesRef = useRef(pendingFiles);
  const dragCounterRef = useRef(0);

  const totalFiles = localMode ? pendingFiles.length : images.length;
  const canAddMore = totalFiles < maxImages;

  useEffect(() => {
    if (!localMode) {
      if (localPreviews.length > 0) setLocalPreviews([]);
      return;
    }

    if (
      pendingFiles === prevPendingFilesRef.current &&
      localPreviews.length === pendingFiles.length
    ) {
      return;
    }
    prevPendingFilesRef.current = pendingFiles;

    if (pendingFiles.length === 0) {
      if (localPreviews.length > 0) setLocalPreviews([]);
      return;
    }

    const previews = pendingFiles.map((file, index) => {
      const preview = {
        _localIndex: index,
        name: file.name,
        fileName: file.name,
        type: file.type,
        contentType: file.type,
        size: file.size,
        fileSize: file.size,
      };

      if (isImageType(file.type) || isVideoType(file.type)) {
        preview._localUrl = URL.createObjectURL(file);
      }

      return preview;
    });

    setLocalPreviews(previews);

    return () => {
      previews.forEach((p) => {
        if (p._localUrl) URL.revokeObjectURL(p._localUrl);
      });
    };
  }, [localMode, pendingFiles]); // eslint-disable-line react-hooks/exhaustive-deps

  const filterValidFiles = useCallback((files) => {
    return Array.from(files).filter((file) => VALID_TYPES.includes(file.type));
  }, []);

  const handleDragEnter = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current++;
      if (!disabled && !isUploading) {
        setIsDragging(true);
      }
    },
    [disabled, isUploading],
  );

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      if (disabled || isUploading) return;

      const files = filterValidFiles(e.dataTransfer.files);
      if (files.length === 0) return;

      const remainingSlots = maxImages - totalFiles;
      const filesToProcess = files.slice(0, remainingSlots);

      if (localMode) {
        if (onAddFiles && filesToProcess.length > 0) {
          onAddFiles(filesToProcess);
        }
      } else {
        if (onUpload && filesToProcess.length > 0) {
          await onUpload(filesToProcess);
        }
      }
    },
    [
      disabled,
      isUploading,
      totalFiles,
      maxImages,
      onUpload,
      localMode,
      onAddFiles,
      filterValidFiles,
    ],
  );

  const handleFileSelect = useCallback(
    async (e) => {
      const files = filterValidFiles(e.target.files || []);
      if (files.length === 0) return;

      const remainingSlots = maxImages - totalFiles;
      const filesToProcess = files.slice(0, remainingSlots);

      if (localMode) {
        if (onAddFiles && filesToProcess.length > 0) {
          onAddFiles(filesToProcess);
        }
      } else {
        if (onUpload && filesToProcess.length > 0) {
          await onUpload(filesToProcess);
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [totalFiles, maxImages, onUpload, localMode, onAddFiles, filterValidFiles],
  );

  const handleDelete = useCallback(
    async (idOrIndex) => {
      if (localMode) {
        if (onRemoveFile) {
          onRemoveFile(idOrIndex);
        }
        return;
      }

      if (!onDelete) return;

      setDeletingImageId(idOrIndex);
      try {
        await onDelete(idOrIndex);
      } finally {
        setDeletingImageId(null);
      }
    },
    [onDelete, localMode, onRemoveFile],
  );

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled, isUploading]);

  const displayFiles = localMode ? localPreviews : images;
  const imageFiles = displayFiles.filter((f) =>
    isImageType(f.contentType || f.type),
  );
  const videoFiles = displayFiles.filter((f) =>
    isVideoType(f.contentType || f.type),
  );
  const documentFiles = displayFiles.filter((f) => {
    const type = f.contentType || f.type;
    return !isImageType(type) && !isVideoType(type);
  });

  return (
    <div className={cn("space-y-2", className)}>
      {/* Zone de drop */}
      {canAddMore && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            "relative border-2 border-dashed rounded-lg transition-colors cursor-pointer",
            compact ? "p-3" : "p-4",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/30",
            (disabled || isUploading) && "opacity-50 cursor-not-allowed",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_STRING}
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />

          {isUploading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-[width] duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
                {uploadProgress}%
              </span>
            </div>
          ) : (
            <div
              className={cn(
                "flex items-center justify-center gap-2",
                compact ? "flex-row" : "flex-col gap-1.5",
              )}
            >
              {isDragging ? (
                <Upload className="h-5 w-5 text-primary" />
              ) : (
                <Paperclip
                  className={cn(
                    "text-muted-foreground/60",
                    compact ? "h-4 w-4" : "h-5 w-5",
                  )}
                />
              )}
              <p
                className={cn(
                  "text-muted-foreground",
                  compact ? "text-xs" : "text-sm",
                )}
              >
                {isDragging ? "Déposez les fichiers ici" : placeholder}
              </p>
              {!compact && totalFiles > 0 && (
                <p className="text-[11px] text-muted-foreground/50">
                  {totalFiles}/{maxImages}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Images en grille */}
      {imageFiles.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {imageFiles.map((file, index) => (
            <ImagePreview
              key={file.id ?? file._localIndex ?? `img-${index}`}
              file={file}
              onDelete={
                localMode ? handleDelete : onDelete ? handleDelete : null
              }
              isDeleting={deletingImageId === (file.id ?? file._localIndex)}
            />
          ))}
        </div>
      )}

      {/* Vidéos en grille */}
      {videoFiles.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {videoFiles.map((file, index) => (
            <VideoPreview
              key={file.id ?? file._localIndex ?? `vid-${index}`}
              file={file}
              onDelete={
                localMode ? handleDelete : onDelete ? handleDelete : null
              }
              isDeleting={deletingImageId === (file.id ?? file._localIndex)}
            />
          ))}
        </div>
      )}

      {/* Documents en liste */}
      {documentFiles.length > 0 && (
        <div className="space-y-1">
          {documentFiles.map((file, index) => (
            <DocumentPreview
              key={file.id ?? file._localIndex ?? `doc-${index}`}
              file={file}
              onDelete={
                localMode ? handleDelete : onDelete ? handleDelete : null
              }
              isDeleting={deletingImageId === (file.id ?? file._localIndex)}
            />
          ))}
        </div>
      )}

      {!canAddMore && (
        <p className="text-xs text-muted-foreground text-center">
          Limite de {maxImages} fichiers atteinte
        </p>
      )}
    </div>
  );
}

export function TaskImageUploadInline({
  onUpload,
  isUploading = false,
  disabled = false,
  className,
}) {
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback(
    async (e) => {
      const files = Array.from(e.target.files || []).filter((file) =>
        VALID_TYPES.includes(file.type),
      );

      if (files.length > 0 && onUpload) {
        await onUpload(files);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onUpload],
  );

  return (
    <div className={cn("inline-flex", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_STRING}
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="h-8 px-2"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export default TaskImageUpload;
