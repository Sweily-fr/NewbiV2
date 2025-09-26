/**
 * Service pour uploader les icônes sociales personnalisées sur Cloudflare R2
 */
class CloudflareIconUploadService {
  constructor() {
    this.baseUrl = 'https://pub-4ab56834c87d44b9a4fee1c84196b095.r2.dev';
  }

  /**
   * Convertit une Data URL en Blob
   * @param {string} dataUrl - La Data URL à convertir
   * @returns {Blob} Le blob correspondant
   */
  dataUrlToBlob(dataUrl) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  /**
   * Génère un nom de fichier unique pour l'icône
   * @param {string} userId - ID de l'utilisateur
   * @param {string} signatureId - ID de la signature
   * @param {string} platform - Plateforme (facebook, linkedin, etc.)
   * @param {string} color - Couleur hex (sans #)
   * @returns {string} Nom de fichier unique
   */
  generateFileName(userId, signatureId, platform, color) {
    const cleanColor = color.replace('#', '');
    const timestamp = Date.now();
    return `custom-icons/${userId}/${signatureId}/${platform}-${cleanColor}-${timestamp}.svg`;
  }

  /**
   * Upload une icône personnalisée sur Cloudflare R2
   * @param {string} dataUrl - Data URL de l'icône SVG
   * @param {string} userId - ID de l'utilisateur
   * @param {string} signatureId - ID de la signature
   * @param {string} platform - Plateforme
   * @param {string} color - Couleur hex
   * @returns {Promise<string>} URL publique de l'icône uploadée
   */
  async uploadCustomIcon(dataUrl, userId, signatureId, platform, color) {
    try {
      console.log(`📤 Upload icône ${platform} couleur ${color} sur Cloudflare...`);

      // Convertir la Data URL en Blob
      const blob = this.dataUrlToBlob(dataUrl);
      const fileName = this.generateFileName(userId, signatureId, platform, color);

      // Créer FormData pour l'upload
      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('userId', userId);
      formData.append('signatureId', signatureId);
      formData.append('platform', platform);
      formData.append('color', color);

      // Appeler l'API d'upload
      const response = await fetch('/api/cloudflare/upload-icon', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erreur upload: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de l\'upload');
      }

      const publicUrl = `${this.baseUrl}/${fileName}`;
      console.log(`✅ Icône ${platform} uploadée: ${publicUrl}`);
      
      return publicUrl;

    } catch (error) {
      console.error(`❌ Erreur upload icône ${platform}:`, error);
      throw error;
    }
  }

  /**
   * Upload toutes les icônes personnalisées d'une signature
   * @param {Object} customSocialIcons - Objet contenant les Data URLs des icônes
   * @param {string} userId - ID de l'utilisateur
   * @param {string} signatureId - ID de la signature
   * @param {Object} socialColors - Couleurs pour chaque plateforme
   * @returns {Promise<Object>} Objet contenant les URLs publiques
   */
  async uploadAllCustomIcons(customSocialIcons, userId, signatureId, socialColors) {
    try {
      console.log(`📤 Upload de toutes les icônes personnalisées pour signature ${signatureId}`);
      
      const uploadedIcons = {};
      const platforms = ['facebook', 'instagram', 'linkedin', 'x'];

      for (const platform of platforms) {
        if (customSocialIcons[platform]) {
          const color = socialColors[platform] || '#000000';
          
          try {
            const publicUrl = await this.uploadCustomIcon(
              customSocialIcons[platform],
              userId,
              signatureId,
              platform,
              color
            );
            uploadedIcons[platform] = publicUrl;
          } catch (error) {
            console.error(`⚠️ Erreur upload ${platform}:`, error.message);
            // Continuer avec les autres plateformes
          }
        }
      }

      console.log(`✅ Icônes uploadées sur Cloudflare:`, Object.keys(uploadedIcons));
      return uploadedIcons;

    } catch (error) {
      console.error(`❌ Erreur upload global:`, error.message);
      throw error;
    }
  }

  /**
   * Supprime les icônes personnalisées d'une signature
   * @param {string} userId - ID de l'utilisateur
   * @param {string} signatureId - ID de la signature
   * @returns {Promise<boolean>} Succès de la suppression
   */
  async deleteCustomIcons(userId, signatureId) {
    try {
      console.log(`🗑️ Suppression des icônes personnalisées pour signature ${signatureId}`);

      const response = await fetch('/api/cloudflare/delete-icons', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, signatureId }),
      });

      if (!response.ok) {
        throw new Error(`Erreur suppression: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la suppression');
      }

      console.log(`✅ Icônes personnalisées supprimées`);
      return true;

    } catch (error) {
      console.error(`❌ Erreur suppression icônes:`, error.message);
      throw error;
    }
  }
}

// Créer une instance et l'exporter
const cloudflareIconUploadService = new CloudflareIconUploadService();
export default cloudflareIconUploadService;
