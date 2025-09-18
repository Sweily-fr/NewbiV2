/**
 * Utilitaire pour gérer les URLs d'images en fonction de l'environnement
 */

/**
 * Génère l'URL complète pour une image en fonction de l'environnement
 * @param {string} imagePath - Le chemin relatif de l'image (ex: "/newbiLogo.png")
 * @returns {string} - L'URL complète de l'image
 */
export function getImageUrl(imagePath) {
  // Assurer que le chemin commence par "/"
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // En production, utiliser l'URL de l'app, sinon localhost:3000
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  return `${baseUrl}${cleanPath}`;
}

/**
 * Génère l'URL pour les assets statiques (images dans /public)
 * @param {string} assetPath - Le chemin de l'asset (ex: "newbiLogo.png" ou "/newbiLogo.png")
 * @returns {string} - L'URL complète de l'asset
 */
export function getAssetUrl(assetPath) {
  return getImageUrl(assetPath);
}

/**
 * Génère l'URL pour les icônes
 * @param {string} iconName - Le nom de l'icône (ex: "outlook-svgrepo-com.svg")
 * @returns {string} - L'URL complète de l'icône
 */
export function getIconUrl(iconName) {
  return getImageUrl(`/${iconName}`);
}
