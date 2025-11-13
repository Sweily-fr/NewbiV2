/**
 * Utilitaire d'optimisation d'images pour signatures email
 * Traite les images côté client avant upload pour garantir une qualité optimale
 */

/**
 * Filtre de netteté (sharpen) pour améliorer la clarté
 */
function applySharpenFilter(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Matrice de convolution pour sharpen
  const weights = [
    0, -1,  0,
   -1,  5, -1,
    0, -1,  0
  ];
  
  const side = Math.round(Math.sqrt(weights.length));
  const halfSide = Math.floor(side / 2);
  const output = ctx.createImageData(width, height);
  const dst = output.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dstOff = (y * width + x) * 4;
      let r = 0, g = 0, b = 0;

      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = Math.min(height - 1, Math.max(0, y + cy - halfSide));
          const scx = Math.min(width - 1, Math.max(0, x + cx - halfSide));
          const srcOff = (scy * width + scx) * 4;
          const wt = weights[cy * side + cx];
          
          r += data[srcOff] * wt;
          g += data[srcOff + 1] * wt;
          b += data[srcOff + 2] * wt;
        }
      }

      dst[dstOff] = r;
      dst[dstOff + 1] = g;
      dst[dstOff + 2] = b;
      dst[dstOff + 3] = data[dstOff + 3]; // Alpha
    }
  }

  ctx.putImageData(output, 0, 0);
}

/**
 * Traite et optimise une image avant upload
 * @param {File} file - Fichier image à traiter
 * @param {Object} options - Options de traitement
 * @returns {Promise<Blob>} - Image optimisée en blob
 */
export async function processImageBeforeUpload(file, options = {}) {
  const {
    maxWidth = 210,      // 70px × 3 pour Retina
    maxHeight = 210,
    quality = 0.95,
    format = 'jpeg',     // ou 'png' pour transparence
    circular = false,
    sharpen = true
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // 🔥 RECADRAGE EN CARRÉ pour éviter object-fit: cover
      const sourceSize = Math.min(img.width, img.height);
      const sourceX = (img.width - sourceSize) / 2;
      const sourceY = (img.height - sourceSize) / 2;

      // Calculer la taille finale (carré)
      let finalSize = Math.min(maxWidth, maxHeight);
      
      // Si l'image source est plus petite, ne pas l'agrandir
      if (sourceSize < finalSize) {
        finalSize = sourceSize;
      }

      canvas.width = finalSize;
      canvas.height = finalSize;

      // Activer l'anti-aliasing pour une meilleure qualité
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Appliquer un masque circulaire si nécessaire
      if (circular) {
        ctx.beginPath();
        ctx.arc(finalSize / 2, finalSize / 2, finalSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
      }

      // Dessiner l'image recadrée en carré
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceSize, sourceSize,  // Source (carré centré)
        0, 0, finalSize, finalSize                  // Destination
      );

      // Appliquer un sharpen filter
      if (sharpen) {
        applySharpenFilter(ctx, finalSize, finalSize);
      }

      // Convertir en blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Échec de la conversion en blob'));
          }
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => reject(new Error('Échec du chargement de l\'image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Préconfigurations pour différents types d'images
 */
export const IMAGE_PRESETS = {
  profile: {
    maxWidth: 400,    // Beaucoup plus grand pour éviter le flou
    maxHeight: 400,
    quality: 0.98,    // Qualité maximale
    format: 'jpeg',
    circular: false,  // On garde carré, le CSS fera le cercle
    sharpen: true
  },
  logo: {
    maxWidth: 180,    // 60px × 3
    maxHeight: 180,
    quality: 0.95,
    format: 'png',    // PNG pour transparence
    sharpen: true
  },
  icon: {
    maxWidth: 48,     // 16px × 3
    maxHeight: 48,
    quality: 0.90,
    format: 'png',
    sharpen: true
  }
};

/**
 * Fonction helper pour traiter une image selon un preset
 * @param {File} file - Fichier image
 * @param {string} presetName - Nom du preset ('profile', 'logo', 'icon')
 * @returns {Promise<Blob>} - Image optimisée
 */
export async function optimizeImage(file, presetName = 'profile') {
  const preset = IMAGE_PRESETS[presetName] || IMAGE_PRESETS.profile;
  return processImageBeforeUpload(file, preset);
}
