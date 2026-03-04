/**
 * Composant d'upload de logo d'entreprise vers Cloudflare R2
 * Upload avec structure de dossiers par utilisateur : user/{userID}/imgCompany
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { Building2, LoaderCircle, AlertCircle } from 'lucide-react';
import { useCompanyLogoUpload } from '@/src/hooks/useCompanyLogoUpload';
import { cn } from '@/src/lib/utils';

export function CompanyLogoUpload({ 
  currentImageUrl = null,
  onImageChange = () => {},
  onOrganizationUpdate = () => {},
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
    },
    onOrganizationUpdate: (imageUrl) => {
      if (onOrganizationUpdate) {
        onOrganizationUpdate(imageUrl);
      }
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
    onImageChange(null);
    
    if (typeof window !== 'undefined') {
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.includes('logo') || key.includes('organization') || key.includes('company')) {
            localStorage.removeItem(key);
          }
        });
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('logo') || key.includes('organization') || key.includes('company')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (e) {
      }
    }
    
    // Puis supprimer de Cloudflare/BDD
    removeImage();
  };

  // Afficher un message si l'utilisateur n'est pas connecté
  if (!isAuthenticated) {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div className="relative inline-flex">
          <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-2xl bg-muted opacity-50">
            <AlertCircle className="size-6 text-muted-foreground" />
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
            "relative flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-[#eeeff1] dark:border-[#232323] transition-colors outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] has-disabled:pointer-events-none has-disabled:opacity-50",
            !displayImageUrl && "bg-muted hover:bg-muted/80",
            isDragging && "ring-2 ring-[#5a50ff]/50",
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
            <LoaderCircle className="size-4 animate-spin opacity-60" />
          ) : displayImageUrl ? (
            <img
              className="size-full object-cover"
              src={displayImageUrl}
              alt=""
              width={80}
              height={80}
            />
          ) : (
            <div aria-hidden="true">
              <Building2 className="size-6 text-muted-foreground" />
            </div>
          )}
        </button>
        
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
        </div>
      )}
    </div>
  );
}
