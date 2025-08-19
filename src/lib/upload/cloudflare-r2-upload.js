/**
 * Service d'upload vers Cloudflare R2
 * Utilise le système GraphQL existant avec structure de dossiers par utilisateur
 */

// Configuration pour les uploads d'images
const IMAGE_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
};

/**
 * Valide un fichier image
 * @param {File} file - Le fichier à valider
 * @returns {Object} - Résultat de la validation
 */
export function validateImageFileForR2(file) {
  if (!file) {
    return { isValid: false, error: 'Aucun fichier sélectionné' };
  }

  if (!IMAGE_CONFIG.allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.' 
    };
  }

  if (file.size > IMAGE_CONFIG.maxFileSize) {
    return { 
      isValid: false, 
      error: `Le fichier est trop volumineux. Taille maximum: ${IMAGE_CONFIG.maxFileSize / (1024 * 1024)}MB` 
    };
  }

  return { isValid: true };
}

/**
 * Upload une image vers Cloudflare R2 via GraphQL
 * Utilise le système d'upload existant qui gère déjà la structure de dossiers
 * @param {File} file - Le fichier à uploader
 * @param {Function} uploadMutation - La mutation GraphQL d'upload
 * @param {Function} onProgress - Callback pour le progrès d'upload
 * @returns {Promise<Object>} - Résultat de l'upload avec URL
 */
export async function uploadToCloudflareR2(file, uploadMutation, onProgress = () => {}) {
  // Validation du fichier
  const validation = validateImageFileForR2(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  try {
    // Simuler le progrès d'upload
    onProgress(10);

    // Utiliser la mutation GraphQL existante
    const result = await uploadMutation({
      variables: { file }
    });

    onProgress(100);

    if (result.data?.uploadDocument?.success) {
      return {
        url: result.data.uploadDocument.url,
        key: result.data.uploadDocument.key,
        fileName: result.data.uploadDocument.fileName
      };
    } else {
      throw new Error(result.data?.uploadDocument?.message || 'Erreur lors de l\'upload');
    }

  } catch (error) {
    console.error('Erreur upload Cloudflare:', error);
    throw new Error(error.message || 'Échec de l\'upload de l\'image');
  }
}

/**
 * Supprime une image de Cloudflare R2
 * Note: La suppression devrait être implémentée côté backend si nécessaire
 * @param {string} key - Clé du fichier à supprimer
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<boolean>} - Succès de la suppression
 */
export async function deleteFromCloudflareR2(key, userId) {
  try {
    // Pour l'instant, on simule la suppression
    // Dans une implémentation complète, il faudrait une mutation GraphQL de suppression
    console.log('Suppression simulée pour:', key, 'utilisateur:', userId);
    return true;
  } catch (error) {
    console.error('Erreur suppression Cloudflare:', error);
    return false;
  }
}
