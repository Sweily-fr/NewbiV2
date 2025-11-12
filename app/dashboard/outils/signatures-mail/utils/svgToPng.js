/**
 * Utilitaire pour convertir SVG en PNG avec couleur personnalisée
 * et uploader sur Cloudflare
 */

// SVG templates des logos sociaux
const SVG_TEMPLATES = {
  facebook: {
    viewBox: "0 0 50 50",
    path: "M41,4H9C6.24,4,4,6.24,4,9v32c0,2.76,2.24,5,5,5h32c2.76,0,5-2.24,5-5V9C46,6.24,43.76,4,41,4z M37,19h-2c-2.14,0-3,0.5-3,2 v3h5l-1,5h-4v15h-5V29h-4v-5h4v-3c0-4,2-7,6-7c2.9,0,4,1,4,1V19z",
  },
  linkedin: {
    viewBox: "0 0 24 24",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  twitter: {
    viewBox: "0 0 24 24",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  x: {
    viewBox: "0 0 24 24",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  instagram: {
    viewBox: "0 0 24 24",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  },
  youtube: {
    viewBox: "0 0 24 24",
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  github: {
    viewBox: "0 0 24 24",
    path: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z",
  },
};

/**
 * Génère une clé unique pour le cache basée sur le logo et la couleur
 */
const generateCacheKey = (logoType, color, size) => {
  // Si color est null (URL personnalisée), utiliser "custom" comme clé
  const colorKey = color ? color.replace("#", "") : "custom";
  return `${logoType}-${colorKey}-${size}`;
};

/**
 * Récupère le SVG Facebook depuis Cloudflare et change sa couleur
 */
const fetchAndColorSvg = async (color, size = 24) => {
  try {
    // Récupérer le SVG Facebook depuis Cloudflare
    const response = await fetch(
      "https://pub-6b0b1b6c4cfc4d8b8f5c5e5c5e5c5e5c.r2.dev/5b0ed97f-7efb-4be0-9c8b-dda5920042a7.svg"
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch SVG: ${response.statusText}`);
    }

    let svgText = await response.text();

    // Remplacer la couleur dans le SVG
    // Chercher les attributs fill et les remplacer par la nouvelle couleur
    svgText = svgText.replace(/fill="[^"]*"/g, `fill="${color}"`);
    svgText = svgText.replace(/fill:[^;]*/g, `fill:${color}`);

    // Ajuster la taille si nécessaire
    svgText = svgText.replace(/width="[^"]*"/g, `width="${size}"`);
    svgText = svgText.replace(/height="[^"]*"/g, `height="${size}"`);

    return svgText;
  } catch (error) {
    console.error("❌ Erreur récupération SVG Cloudflare:", error);
    // Fallback vers le SVG local
    const facebookSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 50 50">
  <path fill="${color}" d="M41,4H9C6.24,4,4,6.24,4,9v32c0,2.76,2.24,5,5,5h32c2.76,0,5-2.24,5-5V9C46,6.24,43.76,4,41,4z M37,19h-2c-2.14,0-3,0.5-3,2v3h5l-1,5h-4v15h-5V29h-4v-5h4v-3c0-4,2-7,6-7c2.9,0,4,1,4,1V19z"/>
</svg>`;
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

      if (logoType === "facebook") {
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
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = size;
      canvas.height = size;

      // Créer une image à partir du SVG
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        // Dessiner l'image sur le canvas
        ctx.drawImage(img, 0, 0, size, size);

        // Convertir en PNG
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            resolve(blob);
          },
          "image/png",
          1.0
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load SVG image"));
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
  formData.append("file", blob, filename);
  formData.append("type", "social-logo");
  formData.append("logoType", logoType);
  formData.append("color", color);

  try {
    const response = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Response error:", errorText);
      throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result.url;
  } catch (error) {
    console.error("Cloudflare upload error:", error);
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
    // Générer la PNG
    const pngBlob = await svgToPng(logoType, color, size);

    // Upload sur Cloudflare
    const filename = `${cacheKey}.png`;
    const cloudflareUrl = await uploadToCloudflare(
      pngBlob,
      filename,
      logoType,
      color
    );

    // Mettre en cache
    imageCache.set(cacheKey, cloudflareUrl);

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
  const logos = ["facebook", "linkedin", "twitter", "x", "instagram", "youtube", "github"];
  const promises = logos.map((logo) =>
    generateColoredSocialLogo(logo, color, size)
  );

  try {
    const urls = await Promise.all(promises);
    return Object.fromEntries(logos.map((logo, index) => [logo, urls[index]]));
  } catch (error) {
    console.error("Erreur pré-génération logos:", error);
    throw error;
  }
};
