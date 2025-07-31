/**
 * Hook personnalisé pour l'upload d'image de profil via GraphQL
 * Remplace l'upload base64 par l'upload vers Cloudflare R2
 */

import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@apollo/client';
import { UPLOAD_USER_PROFILE_IMAGE, DELETE_USER_PROFILE_IMAGE } from '@/src/graphql/mutations/user';
import { validateImageFile, resizeImage } from '@/src/lib/upload/image-upload';
import { syncUserAvatar, syncUserAvatarDeletion } from '@/src/lib/auth/user-sync';
import { toast } from 'sonner';

export function useGraphQLImageUpload({ 
  onUploadSuccess = () => {},
  onUploadError = () => {},
  onDeleteSuccess = () => {},
  onDeleteError = () => {},
  autoResize = true,
  maxWidth = 400,
  maxHeight = 400 
} = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Mutations GraphQL
  const [uploadImageMutation] = useMutation(UPLOAD_USER_PROFILE_IMAGE, {
    onCompleted: async (data) => {
      if (data.uploadUserProfileImage.success) {
        const imageUrl = data.uploadUserProfileImage.url;
        setCurrentImageUrl(imageUrl);
        setPreviewUrl(null); // Nettoyer la prévisualisation
        
        // Synchroniser avec Better Auth
        try {
          await syncUserAvatar(imageUrl);
          toast.success('Image de profil mise à jour avec succès');
          onUploadSuccess(imageUrl, data.uploadUserProfileImage);
        } catch (syncError) {
          console.warn('Erreur synchronisation Better Auth:', syncError);
          // L'upload GraphQL a réussi, mais la sync Better Auth a échoué
          toast.success('Image uploadée (synchronisation partielle)');
          onUploadSuccess(imageUrl, data.uploadUserProfileImage);
        }
      } else {
        toast.error(data.uploadUserProfileImage.message || 'Erreur lors de l\'upload');
        onUploadError(new Error(data.uploadUserProfileImage.message));
      }
      setIsUploading(false);
      setUploadProgress(0);
    },
    onError: (error) => {
      console.error('Erreur GraphQL upload:', error);
      toast.error('Erreur lors de l\'upload de l\'image');
      onUploadError(error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  });

  const [deleteImageMutation] = useMutation(DELETE_USER_PROFILE_IMAGE, {
    onCompleted: async (data) => {
      if (data.deleteUserProfileImage.success) {
        setCurrentImageUrl(null);
        setPreviewUrl(null);
        
        // Synchroniser avec Better Auth
        try {
          await syncUserAvatarDeletion();
          toast.success('Image de profil supprimée');
          onDeleteSuccess();
        } catch (syncError) {
          console.warn('Erreur synchronisation Better Auth:', syncError);
          // La suppression GraphQL a réussi, mais la sync Better Auth a échoué
          toast.success('Image supprimée (synchronisation partielle)');
          onDeleteSuccess();
        }
      } else {
        toast.error(data.deleteUserProfileImage.message || 'Erreur lors de la suppression');
        onDeleteError(new Error(data.deleteUserProfileImage.message));
      }
      setIsDeleting(false);
    },
    onError: (error) => {
      console.error('Erreur GraphQL suppression:', error);
      toast.error('Erreur lors de la suppression de l\'image');
      onDeleteError(error);
      setIsDeleting(false);
    }
  });

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
      setUploadProgress(10);

      // Créer une prévisualisation immédiate
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);

      let fileToUpload = file;

      // Redimensionner l'image si nécessaire
      if (autoResize) {
        setUploadProgress(30);
        fileToUpload = await resizeImage(file, maxWidth, maxHeight);
      }

      setUploadProgress(50);

      // Upload via GraphQL
      await uploadImageMutation({
        variables: {
          file: fileToUpload
        }
      });

    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast.error('Erreur lors de l\'upload de l\'image');
      onUploadError(error);
      setIsUploading(false);
      setUploadProgress(0);
      
      // Nettoyer la prévisualisation en cas d'erreur
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }

    // Réinitialiser l'input file
    if (event.target) {
      event.target.value = '';
    }
  }, [uploadImageMutation, autoResize, maxWidth, maxHeight, onUploadError, previewUrl]);

  /**
   * Supprime l'image de profil
   */
  const deleteImage = useCallback(async () => {
    try {
      setIsDeleting(true);
      await deleteImageMutation();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de l\'image');
      onDeleteError(error);
      setIsDeleting(false);
    }
  }, [deleteImageMutation, onDeleteError]);

  /**
   * Définit une image existante (pour l'initialisation)
   */
  const setExistingImage = useCallback((imageUrl) => {
    setCurrentImageUrl(imageUrl);
    setPreviewUrl(null);
  }, []);

  /**
   * Nettoie les ressources (prévisualisation)
   */
  const cleanup = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  /**
   * Retourne l'URL de l'image à afficher (prévisualisation ou image actuelle)
   */
  const getDisplayImageUrl = useCallback(() => {
    return previewUrl || currentImageUrl;
  }, [previewUrl, currentImageUrl]);

  /**
   * Indique si une image est présente
   */
  const hasImage = Boolean(previewUrl || currentImageUrl);

  /**
   * Indique si l'image est nouvelle (en prévisualisation)
   */
  const isNewImage = Boolean(previewUrl);

  return {
    // État
    isUploading,
    isDeleting,
    uploadProgress,
    previewUrl,
    currentImageUrl,
    hasImage,
    isNewImage,
    
    // Références
    fileInputRef,
    
    // Actions
    openFileSelector,
    handleFileSelect,
    deleteImage,
    setExistingImage,
    cleanup,
    getDisplayImageUrl
  };
}
