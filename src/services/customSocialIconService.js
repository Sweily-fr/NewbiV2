class CustomSocialIconService {
  constructor() {
    // SVG par défaut pour chaque plateforme avec couleurs personnalisables
    this.defaultSvgs = {
      facebook: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="PLACEHOLDER_COLOR"/>
      </svg>`,
      instagram: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="PLACEHOLDER_COLOR"/>
      </svg>`,
      linkedin: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="PLACEHOLDER_COLOR"/>
      </svg>`,
      x: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" fill="PLACEHOLDER_COLOR"/>
      </svg>`
    };
  }

  /**
   * Génère un SVG coloré pour une plateforme
   * @param {string} platform - La plateforme (facebook, instagram, linkedin, x)
   * @param {string} color - La couleur hexadécimale (ex: #FF0000)
   * @returns {Promise<string>} Le SVG modifié
   */
  async generateColoredSvg(platform, color) {
    try {
      // Utiliser le SVG par défaut intégré
      let svgContent = this.defaultSvgs[platform];
      if (!svgContent) {
        throw new Error(`Plateforme ${platform} non supportée`);
      }

      // Remplacer le placeholder par la couleur
      svgContent = svgContent.replace(/PLACEHOLDER_COLOR/g, color);

      return svgContent;
    } catch (error) {
      console.error(`❌ Erreur lors de la génération du SVG coloré pour ${platform}:`, error.message);
      throw new Error(`Impossible de générer le SVG coloré pour ${platform}: ${error.message}`);
    }
  }

  /**
   * Génère toutes les icônes personnalisées pour une signature
   * @param {string} userId - ID de l'utilisateur
   * @param {string} signatureId - ID de la signature
   * @param {Object} socialColors - Objet contenant les couleurs pour chaque plateforme
   * @param {Object} socialNetworks - Objet contenant les URLs des réseaux sociaux
   * @returns {Promise<Object>} Objet contenant les URLs des icônes générées
   */
  async generateAllCustomIcons(userId, signatureId, socialColors, socialNetworks) {
    try {
      const customIcons = {};
      const platforms = ['facebook', 'instagram', 'linkedin', 'x'];
      
      for (const platform of platforms) {
        // Ne générer que si l'utilisateur a une URL pour ce réseau social
        if (socialNetworks[platform] && socialNetworks[platform].trim() !== '') {
          const color = socialColors[platform] || this.getDefaultColor(platform);
          
          try {
            // Générer le SVG coloré
            const coloredSvg = await this.generateColoredSvg(platform, color);
            // Convertir en Data URL (encodage URI au lieu de base64)
            const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(coloredSvg)}`;
            customIcons[platform] = dataUrl;
          } catch (error) {
            console.error(`⚠️ Erreur pour ${platform}:`, error.message);
            // Continuer avec les autres plateformes même si une échoue
          }
        }
      }
      
      return customIcons;
      
    } catch (error) {
      console.error(`❌ Erreur lors de la génération des icônes personnalisées:`, error.message);
      throw error;
    }
  }

  /**
   * Supprime toutes les icônes personnalisées d'une signature
   * @param {string} userId - ID de l'utilisateur
   * @param {string} signatureId - ID de la signature
   */
  async deleteCustomIcons(userId, signatureId) {
    try {
      // Pour cette version simplifiée, pas besoin de supprimer des fichiers
      return true;
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression des icônes personnalisées:`, error.message);
      throw error;
    }
  }

  /**
   * Retourne la couleur par défaut pour une plateforme
   * @param {string} platform - La plateforme
   * @returns {string} La couleur hexadécimale par défaut
   */
  getDefaultColor(platform) {
    const defaultColors = {
      facebook: '#1877F2',
      instagram: '#E4405F',
      linkedin: '#0077B5',
      x: '#000000'
    };
    return defaultColors[platform] || '#000000';
  }
}

// Créer une instance et l'exporter
const customSocialIconService = new CustomSocialIconService();
export default customSocialIconService;
