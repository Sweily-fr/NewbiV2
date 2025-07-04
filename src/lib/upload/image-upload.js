/**
 * Service d'upload d'images
 * Gère l'upload d'images vers un service de stockage (Cloudinary, AWS S3, etc.)
 */

// Configuration pour l'upload d'images
const UPLOAD_CONFIG = {
  // Vous pouvez configurer ici votre service d'upload préféré
  // Pour l'exemple, nous utiliserons une simulation d'upload
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  cloudinaryUploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
};

/**
 * Valide un fichier image
 * @param {File} file - Le fichier à valider
 * @returns {Object} - Résultat de la validation
 */
export function validateImageFile(file) {
  if (!file) {
    return { isValid: false, error: 'Aucun fichier sélectionné' };
  }

  if (!UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.' 
    };
  }

  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    return { 
      isValid: false, 
      error: `Le fichier est trop volumineux. Taille maximum: ${UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB` 
    };
  }

  return { isValid: true };
}

/**
 * Upload une image vers Cloudinary
 * @param {File} file - Le fichier à uploader
 * @param {Function} onProgress - Callback pour le progrès d'upload
 * @returns {Promise<string>} - URL de l'image uploadée
 */
export async function uploadToCloudinary(file, onProgress = () => {}) {
  if (!UPLOAD_CONFIG.cloudinaryCloudName || !UPLOAD_CONFIG.cloudinaryUploadPreset) {
    throw new Error('Configuration Cloudinary manquante');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_CONFIG.cloudinaryUploadPreset);
  formData.append('folder', 'profile-avatars'); // Organiser les images dans un dossier

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${UPLOAD_CONFIG.cloudinaryCloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Erreur lors de l\'upload vers Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Erreur upload Cloudinary:', error);
    throw new Error('Échec de l\'upload de l\'image');
  }
}

/**
 * Upload simulé pour le développement local
 * @param {File} file - Le fichier à uploader
 * @param {Function} onProgress - Callback pour le progrès d'upload
 * @returns {Promise<string>} - URL simulée de l'image
 */
export async function uploadSimulated(file, onProgress = () => {}) {
  // Simulation d'un upload avec progression
  return new Promise((resolve, reject) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      onProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        // Retourner une URL de base64 pour la simulation
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
        reader.readAsDataURL(file);
      }
    }, 200);
  });
}

/**
 * Upload principal - choisit automatiquement le service d'upload
 * @param {File} file - Le fichier à uploader
 * @param {Function} onProgress - Callback pour le progrès d'upload
 * @returns {Promise<string>} - URL de l'image uploadée
 */
export async function uploadImage(file, onProgress = () => {}) {
  // Valider le fichier
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Choisir le service d'upload
  if (UPLOAD_CONFIG.cloudinaryCloudName && UPLOAD_CONFIG.cloudinaryUploadPreset) {
    return uploadToCloudinary(file, onProgress);
  } else {
    // Fallback vers l'upload simulé pour le développement
    console.warn('Configuration Cloudinary manquante, utilisation de l\'upload simulé');
    return uploadSimulated(file, onProgress);
  }
}

/**
 * Redimensionne une image avant l'upload
 * @param {File} file - Le fichier image
 * @param {number} maxWidth - Largeur maximum
 * @param {number} maxHeight - Hauteur maximum
 * @param {number} quality - Qualité de compression (0-1)
 * @returns {Promise<File>} - Fichier redimensionné
 */
export function resizeImage(file, maxWidth = 400, maxHeight = 400, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculer les nouvelles dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Dessiner l'image redimensionnée
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir en blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            reject(new Error('Erreur lors du redimensionnement'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Erreur de chargement de l\'image'));
    img.src = URL.createObjectURL(file);
  });
}
