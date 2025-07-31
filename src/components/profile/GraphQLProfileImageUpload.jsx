/**
 * Composant d'upload d'image de profil via GraphQL
 * Utilise Cloudflare R2 au lieu du base64 via Better Auth
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { User, X, Loader2, Upload, Trash2 } from 'lucide-react';
import { useGraphQLImageUpload } from '@/src/hooks/useGraphQLImageUpload';
import { cn } from '@/src/lib/utils';

export function GraphQLProfileImageUpload({ 
  currentImageUrl = null,
  onImageChange = () => {},
  onImageDelete = () => {},
  className = '',
  showDescription = true,
  size = 'default' // 'sm', 'default', 'lg'
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
    cleanup
  } = useGraphQLImageUpload({
    onUploadSuccess: (imageUrl, uploadData) => {
      onImageChange(imageUrl, uploadData);
    },
    onUploadError: (error) => {
      console.error('Erreur upload:', error);
    },
    onDeleteSuccess: () => {
      onImageDelete();
    },
    onDeleteError: (error) => {
      console.error('Erreur suppression:', error);
    }
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

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const fakeEvent = {
        target: { files: [files[0]] }
      };
      handleFileSelect(fakeEvent);
    }
  }, [handleFileSelect]);

  // Gestion de la suppression
  const handleDelete = useCallback(async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer votre image de profil ?')) {
      await deleteImage();
    }
  }, [deleteImage]);

  // Tailles du composant
  const sizeClasses = {
    sm: 'w-16 h-16',
    default: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    default: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Zone d'upload */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors',
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400',
          'cursor-pointer group'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        <div className="p-6 text-center">
          {displayImageUrl ? (
            // Affichage de l'image
            <div className={cn('relative mx-auto', sizeClasses[size])}>
              <img
                src={displayImageUrl}
                alt="Image de profil"
                className="w-full h-full rounded-full object-cover border-2 border-gray-200"
              />
              
              {/* Overlay au survol */}
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="h-6 w-6 text-white" />
              </div>
              
              {/* Indicateur de nouvelle image */}
              {isNewImage && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
          ) : (
            // État vide
            <div className={cn('mx-auto bg-gray-100 rounded-full flex items-center justify-center', sizeClasses[size])}>
              <User className={cn('text-gray-400', iconSizes[size])} />
            </div>
          )}
          
          {showDescription && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                {displayImageUrl 
                  ? 'Cliquez ou glissez pour changer l\'image'
                  : 'Cliquez ou glissez une image ici'
                }
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, WebP jusqu'à 5MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Barre de progression */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Upload en cours...</span>
            <span className="text-gray-600">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Actions */}
      {hasImage && !isUploading && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openFileSelector}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Changer
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

export default GraphQLProfileImageUpload;
