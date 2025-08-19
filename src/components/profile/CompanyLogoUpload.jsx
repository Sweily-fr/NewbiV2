/**
 * Composant d'upload de logo d'entreprise vers Cloudflare R2
 * Upload avec structure de dossiers par utilisateur : user/{userID}/imgCompany
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { Building2, X, Loader2, AlertCircle } from 'lucide-react';
import { useCompanyLogoUpload } from '@/src/hooks/useCompanyLogoUpload';
import { cn } from '@/src/lib/utils';

export function CompanyLogoUpload({ 
  currentImageUrl = null,
  onImageChange = () => {},
  className = '',
  showDescription = true
}) {
  const [isDragging, setIsDragging] = useState(false);
  
  const {
    isUploading,
    uploadProgress,
    previewUrl,
    hasImage,
    isNewImage,
    fileInputRef,
    openFileDialog,
    handleFileSelect,
    removeImage,
    setExistingImage,
    getDisplayImageUrl,
    isAuthenticated
  } = useCompanyLogoUpload({
    onUploadSuccess: (imageUrl) => {
      onImageChange(imageUrl);
    }
  });

  // Initialiser avec l'image existante
  React.useEffect(() => {
    if (currentImageUrl) {
      setExistingImage(currentImageUrl);
    }
  }, [currentImageUrl, setExistingImage]);

  const displayImageUrl = getDisplayImageUrl();

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      // Simuler un événement de changement de fichier
      const fakeEvent = {
        target: {
          files: files
        }
      };
      handleFileSelect(fakeEvent);
    }
  }, [handleFileSelect]);

  const handleRemove = () => {
    removeImage();
    onImageChange(null);
  };

  // Afficher un message si l'utilisateur n'est pas connecté
  if (!isAuthenticated) {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div className="relative inline-flex">
          <div className="border-input relative flex size-24 items-center justify-center overflow-hidden rounded-lg border border-dashed opacity-50">
            <AlertCircle className="size-8 text-muted-foreground" />
          </div>
        </div>
        <p className="text-muted-foreground text-xs text-center">
          Connectez-vous pour uploader un logo
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative inline-flex">
        {/* Drop area */}
        <button
          type="button"
          className={cn(
            "border-input hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-ring/50 relative flex size-24 items-center justify-center overflow-hidden rounded-lg border border-dashed transition-colors outline-none focus-visible:ring-[3px] has-disabled:pointer-events-none has-disabled:opacity-50",
            isDragging && "bg-accent/50",
            displayImageUrl && "border-none",
            isUploading && "pointer-events-none opacity-50"
          )}
          onClick={openFileDialog}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          disabled={isUploading}
          aria-label={displayImageUrl ? "Changer le logo" : "Uploader un logo"}
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin opacity-60" />
          ) : displayImageUrl ? (
            <img
              className="size-full object-contain"
              src={displayImageUrl}
              alt="Logo de l'entreprise"
              width={96}
              height={96}
              style={{ objectFit: "contain" }}
            />
          ) : (
            <div aria-hidden="true">
              <Building2 className="size-8 opacity-60" />
            </div>
          )}
        </button>
        
        {/* Bouton de suppression */}
        {displayImageUrl && !isUploading && (
          <Button
            type="button"
            onClick={handleRemove}
            size="icon"
            className="border-background focus-visible:border-background absolute -top-1 -right-1 size-6 rounded-full border-2 shadow-none"
            aria-label="Supprimer le logo"
          >
            <X className="size-3.5" />
          </Button>
        )}
        
        {/* Input file caché */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="sr-only"
          accept="image/*"
          disabled={isUploading}
          aria-label="Uploader un fichier image"
          tabIndex={-1}
        />
      </div>
      
      {/* Barre de progression */}
      {isUploading && (
        <div className="w-full max-w-xs">
          <Progress value={uploadProgress} className="h-1" />
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Upload en cours... {uploadProgress}%
          </p>
        </div>
      )}
      
      {/* Description */}
      {showDescription && (
        <div className="flex flex-col items-center gap-1">
          <p
            role="region"
            className="text-muted-foreground text-xs text-center"
          >
            {isNewImage 
              ? "Nouveau logo sélectionné. Sauvegardez pour confirmer."
              : "Glissez un logo ou cliquez pour uploader"
            }
          </p>
          {userId && (
            <p className="text-muted-foreground text-xs text-center opacity-75">
              Stockage : user/{userId}/imgCompany
            </p>
          )}
        </div>
      )}
    </div>
  );
}
