/**
 * Composant d'upload d'image de profil via GraphQL
 * Utilise Cloudflare R2 au lieu du base64 via Better Auth
 */

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import { CircleUserRound, X, Loader2, Upload, Trash2 } from "lucide-react";
import { useGraphQLImageUpload } from "@/src/hooks/useGraphQLImageUpload";
import { cn } from "@/src/lib/utils";

export function GraphQLProfileImageUpload({
  currentImageUrl = null,
  onImageChange = () => {},
  onImageDelete = () => {},
  className = "",
  showDescription = false,
  size = "default", // 'sm', 'default', 'lg'
}) {
  const [isDragging, setIsDragging] = useState(false);

  const {
    isUploading,
    isDeleting,
    uploadProgress,
    fileInputRef,
    openFileSelector,
    handleFileSelect,
    deleteImage,
    setExistingImage,
    getDisplayImageUrl,
    hasImage,
    isNewImage,
    cleanup,
  } = useGraphQLImageUpload({
    onUploadSuccess: (imageUrl, uploadData) => {
      onImageChange(imageUrl, uploadData);
    },
    onUploadError: (error) => {
      console.error("Erreur upload:", error);
    },
    onDeleteSuccess: () => {
      onImageDelete();
    },
    onDeleteError: (error) => {
      console.error("Erreur suppression:", error);
    },
  });

  // Initialiser avec l'image existante
  useEffect(() => {
    if (currentImageUrl && !hasImage) {
      setExistingImage(currentImageUrl);
    }
  }, [currentImageUrl, hasImage, setExistingImage]);

  // Nettoyage lors du démontage
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const displayImageUrl = getDisplayImageUrl();

  // Gestion du drag & drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const fakeEvent = {
          target: { files: [files[0]] },
        };
        handleFileSelect(fakeEvent);
      }
    },
    [handleFileSelect]
  );

  // Gestion de la suppression avec le nouveau design
  const handleRemove = useCallback(async () => {
    await deleteImage();
  }, [deleteImage]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <div className="relative inline-flex">
        {/* Drop area */}
        <div
          className="border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 focus-visible:border-ring focus-visible:ring-ring/50 relative flex size-26 items-center justify-center overflow-hidden rounded-full border border-dashed transition-colors outline-none focus-visible:ring-[3px] has-disabled:pointer-events-none has-disabled:opacity-50 has-[img]:border-none cursor-pointer"
          onClick={openFileSelector}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          aria-label={displayImageUrl ? "Change image" : "Upload image"}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openFileSelector();
            }
          }}
        >
          {displayImageUrl ? (
            <img
              className="size-full object-cover"
              src={displayImageUrl}
              alt="Uploaded image"
              width={64}
              height={64}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div aria-hidden="true">
              <CircleUserRound className="size-7 opacity-40" />
            </div>
          )}
        </div>
        {displayImageUrl && !isUploading && (
          <Button
            type="button"
            onClick={handleRemove}
            size="icon"
            className="border-background focus-visible:border-background absolute -top-0 -right-0 size-6 rounded-full border-2 shadow-none"
            aria-label="Remove image"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <X className="size-3.5" />
            )}
          </Button>
        )}
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          aria-label="Upload image file"
          tabIndex={-1}
        />
      </div>

      {/* Barre de progression */}
      {isUploading && (
        <div className="w-full space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Upload en cours...</span>
            <span className="text-muted-foreground">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1" />
        </div>
      )}

      {/* {showDescription && (
        <p
          aria-live="polite"
          role="region"
          className="text-muted-foreground mt-2 text-xs"
        >
          Format recommandé : PNG ou JPG, max 2MB{" "}
        </p>
      )} */}
    </div>
  );
}

export default GraphQLProfileImageUpload;
