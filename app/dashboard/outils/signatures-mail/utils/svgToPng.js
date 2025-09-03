/**
 * Utilitaire pour convertir SVG en PNG avec couleur personnalisée
 * et uploader sur Cloudflare
 */

// SVG templates des logos sociaux
const SVG_TEMPLATES = {
  facebook: {
    viewBox: "0 0 50 50",
    path: "M41,4H9C6.24,4,4,6.24,4,9v32c0,2.76,2.24,5,5,5h32c2.76,0,5-2.24,5-5V9C46,6.24,43.76,4,41,4z M37,19h-2c-2.14,0-3,0.5-3,2 v3h5l-1,5h-4v15h-5V29h-4v-5h4v-3c0-4,2-7,6-7c2.9,0,4,1,4,1V19z"
  },
  linkedin: {
    viewBox: "0 0 24 24",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
  },
  twitter: {
    viewBox: "0 0 24 24",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
  },
  instagram: {
    viewBox: "0 0 24 24",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
  }
};

/**
 * Génère une clé unique pour le cache basée sur le logo et la couleur
 */
const generateCacheKey = (logoType, color, size) => {
  return `${logoType}-${color.replace('#', '')}-${size}`;
};

/**
 * Récupère le SVG Facebook et change sa couleur
 * Utilise directement le SVG local pour éviter les problèmes CORS
 */
const fetchAndColorSvg = (color, size = 24) => {
  // SVG inline comme source unique pour éviter les appels réseau
  const facebookSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 50 50">
  <path fill="${color}" d="M41,4H9C6.24,4,4,6.24,4,9v32c0,2.76,2.24,5,5,5h32c2.76,0,5-2.24,5-5V9C46,6.24,43.76,4,41,4z M37,19h-2c-2.14,0-3,0.5-3,2v3h5l-1,5h-4v15h-5V29h-4v-5h4v-3c0-4,2-7,6-7c2.9,0,4,1,4,1V19z"/>
</svg>`;
  
  try {
    // Vérifier que le SVG est valide
    if (!facebookSvg || !facebookSvg.includes('<svg')) {
      throw new Error('SVG invalide');
    }
    
    console.log('✅ SVG généré avec succès');
    return facebookSvg;
  } catch (error) {
    console.error('❌ Erreur avec le SVG:', error);
    // En cas d'erreur, on retourne quand même le SVG de base
    return facebookSvg;
  }
};

/**
 * Convertit un SVG en PNG avec une couleur spécifique
 */
const svgToPng = async (logoType, color, size = 24) => {
  return new Promise(async (resolve, reject) => {
    try {
      let svgString;
      
      if (logoType === 'facebook') {
        // Utiliser le SVG Facebook depuis Cloudflare
        svgString = await fetchAndColorSvg(color, size);
      } else {
        // Utiliser les templates locaux pour les autres logos
        const template = SVG_TEMPLATES[logoType];
        if (!template) {
          reject(new Error(`Logo type "${logoType}" not found`));
          return;
        }
        
        svgString = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${template.viewBox}">
            <path fill="${color}" d="${template.path}"/>
          </svg>
        `;
      }

    // Créer un canvas pour la conversion
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;

    // Créer une image à partir du SVG
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Dessiner l'image sur le canvas
      ctx.drawImage(img, 0, 0, size, size);
      
      // Convertir en PNG
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        resolve(blob);
      }, 'image/png', 1.0);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image'));
    };

    img.src = url;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Upload une image PNG sur Cloudflare et retourne l'URL
 */
const uploadToCloudflare = async (blob, filename, logoType, color) => {
  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('type', 'social-logo');
  formData.append('logoType', logoType);
  formData.append('color', color);

  try {
    console.log('🚀 Sending upload request to /api/upload-image');
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    console.log('📡 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
      throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Upload response:', result);
    return result.url;
  } catch (error) {
    console.error('Cloudflare upload error:', error);
    throw error;
  }
};

/**
 * Cache en mémoire pour éviter les re-générations
 */
const imageCache = new Map();

/**
 * Fonction principale : génère une PNG colorée et la met en cache sur Cloudflare
 */
export const generateColoredSocialLogo = async (logoType, color, size = 24) => {
  const cacheKey = generateCacheKey(logoType, color, size);
  
  // Vérifier le cache local
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  try {
    console.log(`🎨 Génération PNG pour ${logoType} couleur ${color} taille ${size}`);
    
    // Générer la PNG
    const pngBlob = await svgToPng(logoType, color, size);
    
    // Upload sur Cloudflare
    const filename = `${cacheKey}.png`;
    const cloudflareUrl = await uploadToCloudflare(pngBlob, filename, logoType, color);
    
    // Mettre en cache
    imageCache.set(cacheKey, cloudflareUrl);
    
    console.log(`✅ PNG générée et uploadée: ${cloudflareUrl}`);
    return cloudflareUrl;
    
  } catch (error) {
    console.error(`❌ Erreur génération PNG ${logoType}:`, error);
    throw error;
  }
};

/**
 * Fonction utilitaire pour pré-générer tous les logos avec une couleur
 */
export const preGenerateLogos = async (color, size = 24) => {
  const logos = ['facebook', 'linkedin', 'twitter', 'instagram'];
  const promises = logos.map(logo => generateColoredSocialLogo(logo, color, size));
  
  try {
    const urls = await Promise.all(promises);
    return Object.fromEntries(logos.map((logo, index) => [logo, urls[index]]));
  } catch (error) {
    console.error('Erreur pré-génération logos:', error);
    throw error;
  }
};
