/**
 * Hook personnalisé pour la gestion d'upload d'images dans les signatures
 */

import { useState, useCallback } from 'react';
import { uploadImage } from '@/src/lib/upload/image-upload';

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadImageFile = useCallback(async (file, onSuccess) => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const imageUrl = await uploadImage(file, (progress) => {
        setUploadProgress(progress);
      });

      if (onSuccess) {
        onSuccess(imageUrl);
      }

      return imageUrl;
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

  return {
    uploadImageFile,
    isUploading,
    uploadProgress,
    error,
    resetUpload,
  };
}
