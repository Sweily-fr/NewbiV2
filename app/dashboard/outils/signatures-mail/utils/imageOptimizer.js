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

      dst[dstOff] = Math.max(0, Math.min(255, r));
      dst[dstOff + 1] = Math.max(0, Math.min(255, g));
      dst[dstOff + 2] = Math.max(0, Math.min(255, b));
      dst[dstOff + 3] = data[dstOff + 3];
    }
  }

  ctx.putImageData(output, 0, 0);
}

/**
 * Traite et optimise une image avant upload
 */
export async function processImageBeforeUpload(file, options = {}) {
  const {
    maxWidth = 210,
    maxHeight = 210,
    quality = 0.95,
    format = 'jpeg',
    sharpen = true,
    fit = 'cover'  // 'cover' ou 'contain'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;
      let destWidth = maxWidth;
      let destHeight = maxHeight;

      if (fit === 'cover') {
        // MODE COVER : Recadrage CARRÉ pour remplir tout l'espace
        // Prendre la plus petite dimension et centrer
        const minDimension = Math.min(img.width, img.height);
        sourceWidth = minDimension;
        sourceHeight = minDimension;
        sourceX = (img.width - minDimension) / 2;
        sourceY = (img.height - minDimension) / 2;
        
        console.log("🔥 MODE COVER - Recadrage carré:", {
          original: { width: img.width, height: img.height },
          source: { x: sourceX, y: sourceY, width: sourceWidth, height: sourceHeight },
          destination: { width: maxWidth, height: maxHeight }
        });
      } else if (fit === 'contain') {
        // MODE CONTAIN : Contenir toute l'image
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        destWidth = img.width * ratio;
        destHeight = img.height * ratio;
      }

      // Définir les dimensions du canvas
      canvas.width = maxWidth;
      canvas.height = maxHeight;

      // Fond blanc pour les JPEGs (évite le fond noir)
      if (format === 'jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, maxWidth, maxHeight);
      }

      // Activer l'anti-aliasing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Centrer l'image si contain
      const offsetX = fit === 'contain' ? (maxWidth - destWidth) / 2 : 0;
      const offsetY = fit === 'contain' ? (maxHeight - destHeight) / 2 : 0;

      // Dessiner l'image
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        offsetX, offsetY, destWidth, destHeight
      );

      // Appliquer le sharpen
      if (sharpen) {
        applySharpenFilter(ctx, canvas.width, canvas.height);
      }

      console.log("🎨 Image optimisée:", {
        original: { width: img.width, height: img.height },
        source: { x: sourceX, y: sourceY, width: sourceWidth, height: sourceHeight },
        canvas: { width: canvas.width, height: canvas.height },
        destination: { x: offsetX, y: offsetY, width: destWidth, height: destHeight },
        fit: fit
      });

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
 * Préconfigurations optimales
 */
export const IMAGE_PRESETS = {
  profile: {
    maxWidth: 210,     // 70px × 3
    maxHeight: 210,
    quality: 0.95,
    format: 'jpeg',
    sharpen: true,
    fit: 'cover'       // Recadrage automatique
  },
  profileHD: {
    maxWidth: 280,     // 70px × 4 pour @4x (très haute résolution)
    maxHeight: 280,
    quality: 0.98,
    format: 'jpeg',
    sharpen: true,
    fit: 'cover'
  },
  logo: {
    maxWidth: 180,     // 60px × 3
    maxHeight: 180,
    quality: 0.95,
    format: 'png',
    sharpen: true,
    fit: 'contain'     // Contenir le logo sans recadrage
  },
  icon: {
    maxWidth: 48,      // 16px × 3
    maxHeight: 48,
    quality: 0.90,
    format: 'png',
    sharpen: true,
    fit: 'contain'
  }
};

/**
 * Helper pour optimiser selon un preset
 */
export async function optimizeImage(file, presetName = 'profile') {
  const preset = IMAGE_PRESETS[presetName] || IMAGE_PRESETS.profile;
  return processImageBeforeUpload(file, preset);
}

/**
 * Génère plusieurs versions d'une image (standard + Retina)
 */
export async function generateImageVersions(file, type = 'profile') {
  const versions = {};

  switch (type) {
    case 'profile':
      // Version @2x (140×140)
      versions.standard = await processImageBeforeUpload(file, {
        maxWidth: 140,
        maxHeight: 140,
        quality: 0.92,
        format: 'jpeg',
        sharpen: true,
        fit: 'cover'
      });

      // Version @3x (210×210)
      versions.retina = await processImageBeforeUpload(file, {
        maxWidth: 210,
        maxHeight: 210,
        quality: 0.95,
        format: 'jpeg',
        sharpen: true,
        fit: 'cover'
      });
      break;

    case 'logo':
      versions.standard = await processImageBeforeUpload(file, {
        maxWidth: 120,
        maxHeight: 120,
        quality: 0.90,
        format: 'png',
        sharpen: true,
        fit: 'contain'
      });

      versions.retina = await processImageBeforeUpload(file, {
        maxWidth: 180,
        maxHeight: 180,
        quality: 0.95,
        format: 'png',
        sharpen: true,
        fit: 'contain'
      });
      break;
  }

  return versions;
}
