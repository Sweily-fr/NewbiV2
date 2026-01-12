import React, { useState, useCallback, useRef } from 'react';
import { ImagePlus, X, Loader2, Upload, ZoomIn } from 'lucide-react';
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

/**
 * Composant pour afficher une image avec possibilité de suppression et zoom
 */
function ImagePreview({ image, onDelete, isDeleting }) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div className="relative group">
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogTrigger asChild>
          <div className="relative cursor-pointer overflow-hidden rounded-lg border border-border hover:border-primary/50 transition-colors">
            <img
              src={image.url}
              alt={image.fileName}
              className="w-full h-24 object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>Aperçu de l'image</DialogTitle>
          </VisuallyHidden>
          <img
            src={image.url}
            alt={image.fileName}
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        </DialogContent>
      </Dialog>
      
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(image.id);
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
        {image.fileName}
      </p>
    </div>
  );
}

/**
 * Composant d'upload d'images avec drag-and-drop
 * Utilisable dans la description des tâches et les commentaires
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
  placeholder = "Glissez des images ici ou cliquez pour sélectionner"
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const fileInputRef = useRef(null);

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

    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );

    if (files.length === 0) return;

    // Limiter le nombre d'images
    const remainingSlots = maxImages - images.length;
    const filesToUpload = files.slice(0, remainingSlots);

    if (onUpload && filesToUpload.length > 0) {
      await onUpload(filesToUpload);
    }
  }, [disabled, isUploading, images.length, maxImages, onUpload]);

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files || []).filter(
      file => file.type.startsWith('image/')
    );

    if (files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    const filesToUpload = files.slice(0, remainingSlots);

    if (onUpload && filesToUpload.length > 0) {
      await onUpload(filesToUpload);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [images.length, maxImages, onUpload]);

  const handleDelete = useCallback(async (imageId) => {
    if (!onDelete) return;
    
    setDeletingImageId(imageId);
    try {
      await onDelete(imageId);
    } finally {
      setDeletingImageId(null);
    }
  }, [onDelete]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled, isUploading]);

  const canAddMore = images.length < maxImages;

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
            accept="image/jpeg,image/png,image/gif,image/webp"
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
                  <ImagePlus className={cn(
                    "text-muted-foreground",
                    compact ? "h-5 w-5" : "h-8 w-8"
                  )} />
                )}
                <p className={cn(
                  "text-muted-foreground text-center",
                  compact ? "text-xs" : "text-sm"
                )}>
                  {isDragging ? "Déposez les images ici" : placeholder}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Grille d'images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((image) => (
            <ImagePreview
              key={image.id}
              image={image}
              onDelete={onDelete ? handleDelete : null}
              isDeleting={deletingImageId === image.id}
            />
          ))}
        </div>
      )}

      {/* Message si limite atteinte */}
      {!canAddMore && (
        <p className="text-xs text-muted-foreground text-center">
          Limite de {maxImages} images atteinte
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
      file => file.type.startsWith('image/')
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
        accept="image/jpeg,image/png,image/gif,image/webp"
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
          <ImagePlus className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export default TaskImageUpload;
