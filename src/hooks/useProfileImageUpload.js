/**
 * Hook personnalisé pour l'upload d'image de profil
 * Gère l'état, la validation et l'upload d'images de profil
 */

import { useState, useCallback, useRef } from 'react';
import { uploadImage, resizeImage, validateImageFile } from '@/src/lib/upload/image-upload';
import { toast } from '@/src/components/ui/sonner';

export function useProfileImageUpload({ 
  onUploadSuccess = () => {},
  onUploadError = () => {},
  autoResize = true,
  maxWidth = 400,
  maxHeight = 400 
} = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const fileInputRef = useRef(null);

  /**
   * Ouvre le sélecteur de fichier
   */
  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Gère la sélection d'un fichier
   */
  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Créer une prévisualisation immédiate
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);

      // Redimensionner l'image si nécessaire
      let fileToUpload = file;
      if (autoResize) {
        toast.info('Optimisation de l\'image...');
        fileToUpload = await resizeImage(file, maxWidth, maxHeight);
      }

      // Upload de l'image
      toast.info('Upload en cours...');
      const imageUrl = await uploadImage(fileToUpload, (progress) => {
        setUploadProgress(progress);
      });

      setUploadedImageUrl(imageUrl);
      toast.success('Image uploadée avec succès !');
      onUploadSuccess(imageUrl);

    } catch (error) {
      console.error('Erreur upload image:', error);
      toast.error(error.message || 'Erreur lors de l\'upload de l\'image');
      onUploadError(error);
      
      // Nettoyer la prévisualisation en cas d'erreur
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [autoResize, maxWidth, maxHeight, onUploadSuccess, onUploadError, previewUrl]);

  /**
   * Supprime l'image actuelle
   */
  const removeImage = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setUploadedImageUrl(null);
    setUploadProgress(0);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

  /**
   * Définit une image existante (pour l'initialisation)
   */
  const setExistingImage = useCallback((imageUrl) => {
    setUploadedImageUrl(imageUrl);
    setPreviewUrl(null); // Pas de prévisualisation pour les images existantes
  }, []);

  /**
   * Obtient l'URL de l'image à afficher (prévisualisation ou image uploadée)
   */
  const getDisplayImageUrl = useCallback(() => {
    return previewUrl || uploadedImageUrl;
  }, [previewUrl, uploadedImageUrl]);

  return {
    // État
    isUploading,
    uploadProgress,
    previewUrl,
    uploadedImageUrl,
    
    // Refs
    fileInputRef,
    
    // Actions
    openFileSelector,
    handleFileSelect,
    removeImage,
    setExistingImage,
    getDisplayImageUrl,
    
    // Utilitaires
    hasImage: !!(previewUrl || uploadedImageUrl),
    isNewImage: !!previewUrl, // True si c'est une nouvelle image en prévisualisation
  };
}
