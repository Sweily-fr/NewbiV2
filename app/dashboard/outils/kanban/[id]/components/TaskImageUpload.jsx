import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Paperclip, X, Loader2, Upload, ZoomIn, FileText } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { cn } from '@/src/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

const VALID_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv'
];

const ACCEPT_STRING = "image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv,.doc,.docx,.xls,.xlsx,.pdf,.txt,.csv";

/**
 * Vérifie si un type MIME correspond à une image
 */
function isImageType(contentType) {
  return contentType?.startsWith('image/');
}

/**
 * Formate une taille de fichier en texte lisible
 */
function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * Composant pour afficher un fichier (image ou document) avec possibilité de suppression
 */
function FilePreview({ file, onDelete, isDeleting }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const isImage = isImageType(file.contentType || file.type);

  if (isImage) {
    return (
      <div className="relative group">
        <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
          <DialogTrigger asChild>
            <div className="relative cursor-pointer overflow-hidden rounded-lg border border-border hover:border-primary/50 transition-colors">
              <img
                src={file.url || file._localUrl}
                alt={file.fileName || file.name}
                className="w-full h-24 object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <VisuallyHidden>
              <DialogTitle>Aperçu de l&apos;image</DialogTitle>
            </VisuallyHidden>
            <img
              src={file.url || file._localUrl}
              alt={file.fileName || file.name}
              className="w-full h-auto max-h-[80vh] object-contain"
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
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-black border border-gray-200 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 disabled:opacity-50"
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

  // Document (non-image) preview
  return (
    <div className="relative group">
      <div className="relative overflow-hidden rounded-lg border border-border hover:border-primary/50 transition-colors p-3 h-24 flex flex-col items-center justify-center gap-1 bg-muted/30">
        <FileText className="h-8 w-8 text-muted-foreground" />
        <p className="text-xs text-muted-foreground truncate max-w-full text-center">
          {file.fileName || file.name}
        </p>
        {(file.fileSize || file.size) && (
          <p className="text-[10px] text-muted-foreground/70">
            {formatFileSize(file.fileSize || file.size)}
          </p>
        )}
      </div>

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(file.id ?? file._localIndex);
          }}
          disabled={isDeleting}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-black border border-gray-200 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Composant d'upload de fichiers (images + documents) avec drag-and-drop
 * Utilisable dans la description des tâches et les commentaires
 *
 * Modes :
 * - Standard (par défaut) : upload immédiat via onUpload callback
 * - Local (localMode=true) : buffer les fichiers localement pour upload différé (mode création)
 */
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
  // Props pour le mode local (création de tâche)
  localMode = false,
  pendingFiles = [],
  onAddFiles,
  onRemoveFile
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [localPreviews, setLocalPreviews] = useState([]);
  const fileInputRef = useRef(null);
  const prevPendingFilesRef = useRef(pendingFiles);

  // Calculer le nombre total de fichiers (serveur + local)
  const totalFiles = localMode ? pendingFiles.length : images.length;
  const canAddMore = totalFiles < maxImages;

  // Générer les previews locales pour les fichiers en attente
  useEffect(() => {
    if (!localMode) {
      if (localPreviews.length > 0) setLocalPreviews([]);
      return;
    }

    // Éviter les re-renders inutiles si la référence n'a pas changé
    if (pendingFiles === prevPendingFilesRef.current && localPreviews.length === pendingFiles.length) {
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

      if (isImageType(file.type)) {
        preview._localUrl = URL.createObjectURL(file);
      }

      return preview;
    });

    setLocalPreviews(previews);

    // Cleanup object URLs on unmount or when files change
    return () => {
      previews.forEach(p => {
        if (p._localUrl) URL.revokeObjectURL(p._localUrl);
      });
    };
  }, [localMode, pendingFiles]); // eslint-disable-line react-hooks/exhaustive-deps

  const filterValidFiles = useCallback((files) => {
    return Array.from(files).filter(file => VALID_TYPES.includes(file.type));
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
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
  }, [disabled, isUploading, totalFiles, maxImages, onUpload, localMode, onAddFiles, filterValidFiles]);

  const handleFileSelect = useCallback(async (e) => {
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

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [totalFiles, maxImages, onUpload, localMode, onAddFiles, filterValidFiles]);

  const handleDelete = useCallback(async (idOrIndex) => {
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
  }, [onDelete, localMode, onRemoveFile]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled, isUploading]);

  // Fichiers à afficher
  const displayFiles = localMode ? localPreviews : images;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Zone de drop */}
      {canAddMore && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            "relative border-2 border-dashed rounded-lg transition-all cursor-pointer",
            compact ? "p-3" : "p-6",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent/5",
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

          <div className={cn(
            "flex items-center justify-center gap-3",
            compact ? "flex-row" : "flex-col"
          )}>
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <div className="flex-1 max-w-xs">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    Upload en cours... {uploadProgress}%
                  </p>
                </div>
              </>
            ) : (
              <>
                {isDragging ? (
                  <Upload className="h-8 w-8 text-primary" />
                ) : (
                  <Paperclip className={cn(
                    "text-muted-foreground",
                    compact ? "h-5 w-5" : "h-8 w-8"
                  )} />
                )}
                <p className={cn(
                  "text-muted-foreground text-center",
                  compact ? "text-xs" : "text-sm"
                )}>
                  {isDragging ? "Déposez les fichiers ici" : placeholder}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Grille de fichiers */}
      {displayFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {displayFiles.map((file, index) => (
            <FilePreview
              key={file.id ?? file._localIndex ?? index}
              file={file}
              onDelete={localMode ? handleDelete : (onDelete ? handleDelete : null)}
              isDeleting={deletingImageId === (file.id ?? file._localIndex)}
            />
          ))}
        </div>
      )}

      {/* Message si limite atteinte */}
      {!canAddMore && (
        <p className="text-xs text-muted-foreground text-center">
          Limite de {maxImages} fichiers atteinte
        </p>
      )}
    </div>
  );
}

/**
 * Version inline pour les champs de texte (description, commentaires)
 * Permet le paste d'images et affiche un bouton d'ajout
 */
export function TaskImageUploadInline({
  onUpload,
  isUploading = false,
  disabled = false,
  className
}) {
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files || []).filter(
      file => VALID_TYPES.includes(file.type)
    );

    if (files.length > 0 && onUpload) {
      await onUpload(files);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onUpload]);

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
