/**
 * Hook personnalisé pour l'upload de documents vers Cloudflare
 */

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { UPLOAD_DOCUMENT } from '../graphql/mutations/documentUpload';

export const useDocumentUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const [uploadDocumentMutation] = useMutation(UPLOAD_DOCUMENT, {
    onCompleted: (data) => {
      console.log('✅ Upload terminé:', data.uploadDocument);
      setIsUploading(false);
      setUploadProgress(100);
      
      if (data.uploadDocument.success) {
        setUploadResult(data.uploadDocument);
        setUploadError(null);
      } else {
        setUploadError(data.uploadDocument.message || 'Erreur lors de l\'upload');
        setUploadResult(null);
      }
    },
    onError: (error) => {
      console.error('❌ Erreur upload:', error);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadError(error.message || 'Erreur lors de l\'upload');
      setUploadResult(null);
    }
  });

  const uploadDocument = async (file) => {
    try {
      console.log('📤 Début upload document:', file.name);
      
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      setUploadResult(null);

      // Simulation de progression (GraphQL upload ne fournit pas de progression réelle)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90; // On s'arrête à 90%, le reste sera complété par onCompleted
          }
          return prev + 10;
        });
      }, 200);

      await uploadDocumentMutation({
        variables: { file }
      });

      clearInterval(progressInterval);

    } catch (error) {
      console.error('❌ Erreur lors de l\'upload:', error);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadError(error.message || 'Erreur lors de l\'upload');
      setUploadResult(null);
    }
  };

  const resetUpload = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    setUploadResult(null);
  };

  return {
    // États
    isUploading,
    uploadProgress,
    uploadError,
    uploadResult,
    
    // Actions
    uploadDocument,
    resetUpload
  };
};
