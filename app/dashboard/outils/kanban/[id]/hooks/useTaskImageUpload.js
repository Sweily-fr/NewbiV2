import { useState, useCallback } from 'react';
import { useMutation, useApolloClient, gql } from '@apollo/client';
import { toast } from 'sonner';
import { GET_BOARD } from '@/src/graphql/kanbanQueries';

// Mutations GraphQL pour les images de tâches
const UPLOAD_TASK_IMAGE = gql`
  mutation UploadTaskImage($taskId: ID!, $file: Upload!, $imageType: String, $workspaceId: ID) {
    uploadTaskImage(taskId: $taskId, file: $file, imageType: $imageType, workspaceId: $workspaceId) {
      success
      image {
        id
        key
        url
        fileName
        fileSize
        contentType
        uploadedBy
        uploadedAt
      }
      message
    }
  }
`;

const DELETE_TASK_IMAGE = gql`
  mutation DeleteTaskImage($taskId: ID!, $imageId: ID!, $workspaceId: ID) {
    deleteTaskImage(taskId: $taskId, imageId: $imageId, workspaceId: $workspaceId) {
      id
      images {
        id
        key
        url
        fileName
        fileSize
        contentType
        uploadedBy
        uploadedAt
      }
    }
  }
`;

const UPLOAD_COMMENT_IMAGE = gql`
  mutation UploadCommentImage($taskId: ID!, $commentId: ID!, $file: Upload!, $workspaceId: ID) {
    uploadCommentImage(taskId: $taskId, commentId: $commentId, file: $file, workspaceId: $workspaceId) {
      success
      image {
        id
        key
        url
        fileName
        fileSize
        contentType
        uploadedBy
        uploadedAt
      }
      message
    }
  }
`;

const DELETE_COMMENT_IMAGE = gql`
  mutation DeleteCommentImage($taskId: ID!, $commentId: ID!, $imageId: ID!, $workspaceId: ID) {
    deleteCommentImage(taskId: $taskId, commentId: $commentId, imageId: $imageId, workspaceId: $workspaceId) {
      id
      comments {
        id
        images {
          id
          key
          url
          fileName
        }
      }
    }
  }
`;

/**
 * Hook pour gérer l'upload d'images dans les tâches Kanban
 * Supporte le drag-and-drop et l'upload classique
 */
export function useTaskImageUpload(taskId, workspaceId, boardId) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const apolloClient = useApolloClient();

  const [uploadTaskImageMutation] = useMutation(UPLOAD_TASK_IMAGE);
  const [deleteTaskImageMutation] = useMutation(DELETE_TASK_IMAGE);
  const [uploadCommentImageMutation] = useMutation(UPLOAD_COMMENT_IMAGE);
  const [deleteCommentImageMutation] = useMutation(DELETE_COMMENT_IMAGE);

  /**
   * Valide un fichier avant l'upload
   */
  const validateFile = useCallback((file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Type de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP.'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Fichier trop volumineux. Maximum 10MB.'
      };
    }

    return { valid: true };
  }, []);

  /**
   * Upload une image pour la description de la tâche
   */
  const uploadImage = useCallback(async (file, imageType = 'description') => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      toast.error(validation.error);
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simuler la progression
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await uploadTaskImageMutation({
        variables: {
          taskId,
          file,
          imageType,
          workspaceId
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.data?.uploadTaskImage?.success) {
        const newImage = result.data.uploadTaskImage.image;
        
        // Mettre à jour le cache Apollo pour que l'image persiste
        if (boardId) {
          try {
            const cacheData = apolloClient.cache.readQuery({
              query: GET_BOARD,
              variables: { id: boardId, workspaceId }
            });
            
            if (cacheData?.board) {
              const updatedTasks = cacheData.board.tasks.map(task => {
                if (task.id === taskId) {
                  return {
                    ...task,
                    images: [...(task.images || []), newImage]
                  };
                }
                return task;
              });
              
              apolloClient.cache.writeQuery({
                query: GET_BOARD,
                variables: { id: boardId, workspaceId },
                data: {
                  board: {
                    ...cacheData.board,
                    tasks: updatedTasks
                  }
                }
              });
            }
          } catch (cacheError) {
            console.warn('Erreur mise à jour cache Apollo:', cacheError);
          }
        }
        
        toast.success('Image uploadée avec succès');
        return newImage;
      } else {
        const errorMsg = result.data?.uploadTaskImage?.message || 'Erreur lors de l\'upload';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }
    } catch (uploadError) {
      const errorMsg = uploadError.message || 'Erreur lors de l\'upload';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  }, [taskId, workspaceId, boardId, uploadTaskImageMutation, validateFile, apolloClient]);

  /**
   * Supprime une image de la description
   */
  const deleteImage = useCallback(async (imageId) => {
    try {
      await deleteTaskImageMutation({
        variables: {
          taskId,
          imageId,
          workspaceId
        }
      });
      
      // Mettre à jour le cache Apollo
      if (boardId) {
        try {
          const cacheData = apolloClient.cache.readQuery({
            query: GET_BOARD,
            variables: { id: boardId, workspaceId }
          });
          
          if (cacheData?.board) {
            const updatedTasks = cacheData.board.tasks.map(task => {
              if (task.id === taskId) {
                return {
                  ...task,
                  images: (task.images || []).filter(img => img.id !== imageId)
                };
              }
              return task;
            });
            
            apolloClient.cache.writeQuery({
              query: GET_BOARD,
              variables: { id: boardId, workspaceId },
              data: {
                board: {
                  ...cacheData.board,
                  tasks: updatedTasks
                }
              }
            });
          }
        } catch (cacheError) {
          console.warn('Erreur mise à jour cache Apollo:', cacheError);
        }
      }
      
      toast.success('Image supprimée');
      return true;
    } catch {
      toast.error('Erreur lors de la suppression');
      return false;
    }
  }, [taskId, workspaceId, boardId, deleteTaskImageMutation, apolloClient]);

  /**
   * Upload une image pour un commentaire
   */
  const uploadCommentImage = useCallback(async (commentId, file) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      toast.error(validation.error);
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await uploadCommentImageMutation({
        variables: {
          taskId,
          commentId,
          file,
          workspaceId
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.data?.uploadCommentImage?.success) {
        toast.success('Image uploadée avec succès');
        return result.data.uploadCommentImage.image;
      } else {
        const errorMsg = result.data?.uploadCommentImage?.message || 'Erreur lors de l\'upload';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }
    } catch (commentUploadError) {
      const errorMsg = commentUploadError.message || 'Erreur lors de l\'upload';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  }, [taskId, workspaceId, uploadCommentImageMutation, validateFile]);

  /**
   * Supprime une image d'un commentaire
   */
  const deleteCommentImage = useCallback(async (commentId, imageId) => {
    try {
      await deleteCommentImageMutation({
        variables: {
          taskId,
          commentId,
          imageId,
          workspaceId
        }
      });
      toast.success('Image supprimée');
      return true;
    } catch {
      toast.error('Erreur lors de la suppression');
      return false;
    }
  }, [taskId, workspaceId, deleteCommentImageMutation]);

  /**
   * Gère le drop de fichiers (drag and drop)
   */
  const handleDrop = useCallback(async (files, imageType = 'description', commentId = null) => {
    const uploadedImages = [];

    for (const file of files) {
      let result;
      if (commentId) {
        result = await uploadCommentImage(commentId, file);
      } else {
        result = await uploadImage(file, imageType);
      }
      if (result) {
        uploadedImages.push(result);
      }
    }

    return uploadedImages;
  }, [uploadImage, uploadCommentImage]);

  /**
   * Gère le paste d'images depuis le presse-papiers
   */
  const handlePaste = useCallback(async (event, imageType = 'description', commentId = null) => {
    const items = event.clipboardData?.items;
    if (!items) return [];

    const uploadedImages = [];

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          let result;
          if (commentId) {
            result = await uploadCommentImage(commentId, file);
          } else {
            result = await uploadImage(file, imageType);
          }
          if (result) {
            uploadedImages.push(result);
          }
        }
      }
    }

    return uploadedImages;
  }, [uploadImage, uploadCommentImage]);

  return {
    isUploading,
    uploadProgress,
    error,
    uploadImage,
    deleteImage,
    uploadCommentImage,
    deleteCommentImage,
    handleDrop,
    handlePaste,
    validateFile
  };
}

export default useTaskImageUpload;
