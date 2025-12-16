/**
 * Utilitaire pour appliquer un filigrane sur les images
 * Utilisé dans le système de transfert de fichiers
 */

/**
 * Vérifie si un fichier est une image
 * @param {File} file - Le fichier à vérifier
 * @returns {boolean}
 */
export function isImageFile(file) {
  if (!file || !file.type) return false;
  return file.type.startsWith("image/");
}

/**
 * Types d'images supportés pour le filigrane
 */
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
];

/**
 * Vérifie si le type d'image est supporté pour le filigrane
 * @param {File} file - Le fichier à vérifier
 * @returns {boolean}
 */
export function isSupportedImageType(file) {
  if (!file || !file.type) return false;
  return SUPPORTED_IMAGE_TYPES.includes(file.type.toLowerCase());
}

/**
 * Options par défaut pour le filigrane
 */
export const DEFAULT_WATERMARK_OPTIONS = {
  text: "CONFIDENTIEL",
  opacity: 0.25,
  fontSize: 48,
  fontFamily: "Arial, sans-serif",
  color: "#000000",
  position: "diagonal", // 'center', 'bottom-right', 'diagonal', 'tile'
  rotation: -45, // Rotation en degrés (pour diagonal)
  padding: 20, // Padding pour bottom-right
};

/**
 * Applique un filigrane sur une image
 * @param {File} file - Le fichier image original
 * @param {Object} options - Options du filigrane
 * @returns {Promise<File>} - Le fichier image avec filigrane
 */
export async function applyWatermark(file, options = {}) {
  const {
    text = DEFAULT_WATERMARK_OPTIONS.text,
    opacity = DEFAULT_WATERMARK_OPTIONS.opacity,
    fontSize = DEFAULT_WATERMARK_OPTIONS.fontSize,
    fontFamily = DEFAULT_WATERMARK_OPTIONS.fontFamily,
    color = DEFAULT_WATERMARK_OPTIONS.color,
    position = DEFAULT_WATERMARK_OPTIONS.position,
    rotation = DEFAULT_WATERMARK_OPTIONS.rotation,
    padding = DEFAULT_WATERMARK_OPTIONS.padding,
  } = options;

  return new Promise((resolve, reject) => {
    // Vérifier que c'est une image supportée
    if (!isSupportedImageType(file)) {
      console.log(
        `⚠️ Type d'image non supporté pour le filigrane: ${file.type}`
      );
      resolve(file); // Retourner le fichier original
      return;
    }

    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      try {
        // Définir les dimensions du canvas
        canvas.width = img.width;
        canvas.height = img.height;

        // Dessiner l'image originale
        ctx.drawImage(img, 0, 0);

        // Configurer le style du texte
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Appliquer le filigrane selon la position
        switch (position) {
          case "center":
            drawCenterWatermark(ctx, text, canvas.width, canvas.height);
            break;
          case "bottom-right":
            drawBottomRightWatermark(
              ctx,
              text,
              canvas.width,
              canvas.height,
              padding,
              fontSize
            );
            break;
          case "tile":
            drawTileWatermark(
              ctx,
              text,
              canvas.width,
              canvas.height,
              fontSize,
              rotation
            );
            break;
          case "diagonal":
          default:
            drawDiagonalWatermark(
              ctx,
              text,
              canvas.width,
              canvas.height,
              fontSize,
              rotation
            );
            break;
        }

        // Réinitialiser l'opacité
        ctx.globalAlpha = 1;

        // Déterminer le format de sortie
        const outputType =
          file.type === "image/png" ? "image/png" : "image/jpeg";
        const quality = outputType === "image/jpeg" ? 0.92 : undefined;

        // Convertir en blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const watermarkedFile = new File([blob], file.name, {
                type: outputType,
                lastModified: Date.now(),
              });
              console.log(`✅ Filigrane appliqué sur: ${file.name}`);
              resolve(watermarkedFile);
            } else {
              console.error("❌ Échec de la conversion en blob");
              resolve(file); // Retourner le fichier original en cas d'erreur
            }
          },
          outputType,
          quality
        );
      } catch (error) {
        console.error("❌ Erreur lors de l'application du filigrane:", error);
        resolve(file); // Retourner le fichier original en cas d'erreur
      }
    };

    img.onerror = () => {
      console.error("❌ Erreur de chargement de l'image pour le filigrane");
      resolve(file); // Retourner le fichier original en cas d'erreur
    };

    // Charger l'image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Dessine le filigrane au centre de l'image
 */
function drawCenterWatermark(ctx, text, width, height) {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/**
 * Dessine le filigrane en bas à droite
 */
function drawBottomRightWatermark(ctx, text, width, height, padding, fontSize) {
  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.font = `bold ${fontSize * 0.6}px Arial, sans-serif`; // Plus petit pour le coin
  ctx.fillText(text, width - padding, height - padding);
  ctx.restore();
}

/**
 * Dessine le filigrane en diagonale (une seule fois, centré)
 */
function drawDiagonalWatermark(ctx, text, width, height, fontSize, rotation) {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((rotation * Math.PI) / 180);

  // Calculer la taille de police adaptée à l'image
  const diagonal = Math.sqrt(width * width + height * height);
  const adaptedFontSize = Math.min(
    fontSize * 2,
    (diagonal / text.length) * 1.5
  );
  ctx.font = `bold ${adaptedFontSize}px Arial, sans-serif`;

  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/**
 * Dessine le filigrane en mosaïque (répété sur toute l'image)
 */
function drawTileWatermark(ctx, text, width, height, fontSize, rotation) {
  ctx.save();

  // Calculer l'espacement entre les filigranes
  const textWidth = ctx.measureText(text).width;
  const spacingX = textWidth + 100;
  const spacingY = fontSize + 80;

  // Dessiner le filigrane en grille
  for (let y = -height; y < height * 2; y += spacingY) {
    for (let x = -width; x < width * 2; x += spacingX) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Applique le filigrane sur plusieurs fichiers
 * @param {Array<{id: string, file: File}>} files - Liste des fichiers
 * @param {Object} options - Options du filigrane
 * @returns {Promise<Array<{id: string, file: File}>>} - Liste des fichiers traités
 */
export async function applyWatermarkToFiles(files, options = {}) {
  const processedFiles = [];

  for (const fileData of files) {
    if (isImageFile(fileData.file)) {
      const watermarkedFile = await applyWatermark(fileData.file, options);
      processedFiles.push({
        ...fileData,
        file: watermarkedFile,
      });
    } else {
      // Fichier non-image, le garder tel quel
      processedFiles.push(fileData);
    }
  }

  return processedFiles;
}

/**
 * Compte le nombre d'images dans une liste de fichiers
 * @param {Array<{file: File}>} files - Liste des fichiers
 * @returns {number}
 */
export function countImageFiles(files) {
  return files.filter((f) => isImageFile(f.file)).length;
}
