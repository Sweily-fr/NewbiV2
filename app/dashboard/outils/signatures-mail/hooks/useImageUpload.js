/**
 * Hook personnalisé pour la gestion d'upload d'images dans les signatures
 * Utilise Cloudflare R2 pour le stockage
 */

import { useState, useCallback } from 'react';
import { CloudflareImageService } from '@/src/lib/graphql/imageUpload';

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadImageFile = useCallback(async (file, imageType = 'imgProfil', signatureId, onSuccess) => {
    if (!file) return;

    if (!signatureId) {
      const errorMsg = 'signatureId est requis pour l\'upload d\'images de signature';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const result = await CloudflareImageService.uploadImage(file, imageType, signatureId, (progress) => {
        setUploadProgress(progress);
      });

      if (onSuccess) {
        onSuccess(result.url, result.key);
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
  }, []);

  const deleteImageFile = useCallback(async (key) => {
    if (!key) return;

    setError(null);

    try {
      const result = await CloudflareImageService.deleteImage(key);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getImageUrl = useCallback(async (key) => {
    if (!key) return null;

    setError(null);

    try {
      const result = await CloudflareImageService.getImageUrl(key);
      return result.url;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    uploadImageFile,
    deleteImageFile,
    getImageUrl,
    isUploading,
    uploadProgress,
    error,
    resetUpload,
  };
}
