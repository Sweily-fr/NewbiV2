/**
 * Utilitaire pour appliquer un filigrane sur les images et PDFs
 * Utilisé dans le système de transfert de fichiers
 */

import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

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
 * Vérifie si un fichier est un PDF
 * @param {File} file - Le fichier à vérifier
 * @returns {boolean}
 */
export function isPdfFile(file) {
  if (!file) return false;
  if (file.type === "application/pdf") return true;
  const ext = (file.name || "").split(".").pop()?.toLowerCase();
  return ext === "pdf";
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
            drawCenterWatermark(ctx, text, canvas.width, canvas.height, fontSize);
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
 * Calcule une taille de police adaptée aux dimensions de l'image
 * @param {number} width - Largeur de l'image
 * @param {number} height - Hauteur de l'image
 * @param {number} textLength - Nombre de caractères du texte
 * @param {number} targetWidthRatio - Ratio cible de la largeur (ex: 0.7 = 70% de la largeur)
 * @returns {number}
 */
function getAdaptedFontSize(width, height, textLength, targetWidthRatio = 0.7) {
  // Estimer la largeur d'un caractère à ~0.6 * fontSize en bold Arial
  const charWidthRatio = 0.6;
  // fontSize = targetWidth / (textLength * charWidthRatio)
  const targetWidth = width * targetWidthRatio;
  return Math.max(32, Math.round(targetWidth / (textLength * charWidthRatio)));
}

/**
 * Dessine un texte avec contour pour meilleure visibilité sur tout type de fond
 */
function drawTextWithStroke(ctx, text, x, y) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

/**
 * Dessine le filigrane au centre de l'image
 */
function drawCenterWatermark(ctx, text, width, height, fontSize) {
  ctx.save();
  ctx.translate(width / 2, height / 2);

  // Le texte prend ~70% de la largeur de l'image
  const adaptedFontSize = getAdaptedFontSize(width, height, text.length, 0.7);
  ctx.font = `bold ${adaptedFontSize}px Arial, sans-serif`;

  drawTextWithStroke(ctx, text, 0, 0);
  ctx.restore();
}

/**
 * Dessine le filigrane en bas à droite
 */
function drawBottomRightWatermark(ctx, text, width, height, padding, fontSize) {
  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";

  // Le texte prend ~35% de la largeur de l'image
  const adaptedFontSize = getAdaptedFontSize(width, height, text.length, 0.35);
  const adaptedPadding = Math.max(padding, adaptedFontSize * 0.6);
  ctx.font = `bold ${adaptedFontSize}px Arial, sans-serif`;

  drawTextWithStroke(ctx, text, width - adaptedPadding, height - adaptedPadding);
  ctx.restore();
}

/**
 * Dessine le filigrane en diagonale (une seule fois, centré)
 */
function drawDiagonalWatermark(ctx, text, width, height, fontSize, rotation) {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((rotation * Math.PI) / 180);

  // Le texte prend ~80% de la largeur de l'image (la rotation le réduit visuellement)
  const adaptedFontSize = getAdaptedFontSize(width, height, text.length, 0.8);
  ctx.font = `bold ${adaptedFontSize}px Arial, sans-serif`;

  drawTextWithStroke(ctx, text, 0, 0);
  ctx.restore();
}

/**
 * Dessine le filigrane en mosaïque (répété sur toute l'image)
 */
function drawTileWatermark(ctx, text, width, height, fontSize, rotation) {
  ctx.save();

  // Adapter la taille de police pour la mosaïque (~20% de la largeur par texte)
  const adaptedFontSize = getAdaptedFontSize(width, height, text.length, 0.2);
  ctx.font = `bold ${adaptedFontSize}px Arial, sans-serif`;

  // Calculer l'espacement entre les filigranes
  const textWidth = ctx.measureText(text).width;
  const spacingX = textWidth + adaptedFontSize * 2;
  const spacingY = adaptedFontSize * 3;

  // Dessiner le filigrane en grille
  for (let y = -height; y < height * 2; y += spacingY) {
    for (let x = -width; x < width * 2; x += spacingX) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      drawTextWithStroke(ctx, text, 0, 0);
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Convertit une couleur hex en composants rgb (0-1)
 */
function hexToRgb01(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255,
  };
}

/**
 * Calcule une taille de police adaptée pour un PDF
 */
function getPdfAdaptedFontSize(width, height, textLength, targetWidthRatio = 0.7) {
  const charWidthRatio = 0.5;
  const targetWidth = width * targetWidthRatio;
  return Math.max(24, Math.round(targetWidth / (textLength * charWidthRatio)));
}

/**
 * Applique un filigrane sur un fichier PDF
 * @param {File} file - Le fichier PDF original
 * @param {Object} options - Options du filigrane
 * @returns {Promise<File>} - Le fichier PDF avec filigrane
 */
export async function applyWatermarkToPdf(file, options = {}) {
  const {
    text = DEFAULT_WATERMARK_OPTIONS.text,
    opacity = DEFAULT_WATERMARK_OPTIONS.opacity,
    color = DEFAULT_WATERMARK_OPTIONS.color,
    position = DEFAULT_WATERMARK_OPTIONS.position,
    rotation = DEFAULT_WATERMARK_OPTIONS.rotation,
    padding = DEFAULT_WATERMARK_OPTIONS.padding,
  } = options;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const { r, g, b } = hexToRgb01(color);

    for (const page of pages) {
      const { width, height } = page.getSize();

      switch (position) {
        case "center": {
          const fontSize = getPdfAdaptedFontSize(width, height, text.length, 0.7);
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          page.drawText(text, {
            x: (width - textWidth) / 2,
            y: height / 2,
            size: fontSize,
            font,
            color: rgb(r, g, b),
            opacity,
          });
          break;
        }
        case "bottom-right": {
          const fontSize = getPdfAdaptedFontSize(width, height, text.length, 0.35);
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          const adaptedPadding = Math.max(padding, fontSize * 0.6);
          page.drawText(text, {
            x: width - textWidth - adaptedPadding,
            y: adaptedPadding,
            size: fontSize,
            font,
            color: rgb(r, g, b),
            opacity,
          });
          break;
        }
        case "tile": {
          const fontSize = getPdfAdaptedFontSize(width, height, text.length, 0.2);
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          const spacingX = textWidth + fontSize * 2;
          const spacingY = fontSize * 3;
          const rotRad = (rotation * Math.PI) / 180;

          for (let y = -height; y < height * 2; y += spacingY) {
            for (let x = -width * 0.5; x < width * 1.5; x += spacingX) {
              page.drawText(text, {
                x,
                y,
                size: fontSize,
                font,
                color: rgb(r, g, b),
                opacity,
                rotate: degrees(rotation),
              });
            }
          }
          break;
        }
        case "diagonal":
        default: {
          const fontSize = getPdfAdaptedFontSize(width, height, text.length, 0.8);
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          page.drawText(text, {
            x: (width - textWidth * Math.cos(Math.abs(rotation * Math.PI / 180))) / 2,
            y: height / 2,
            size: fontSize,
            font,
            color: rgb(r, g, b),
            opacity,
            rotate: degrees(rotation),
          });
          break;
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    const watermarkedFile = new File([pdfBytes], file.name, {
      type: "application/pdf",
      lastModified: Date.now(),
    });
    return watermarkedFile;
  } catch (error) {
    console.error("❌ Erreur lors de l'application du filigrane PDF:", error);
    return file;
  }
}

/**
 * Applique le filigrane sur plusieurs fichiers (images et PDFs)
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
    } else if (isPdfFile(fileData.file)) {
      const watermarkedFile = await applyWatermarkToPdf(fileData.file, options);
      processedFiles.push({
        ...fileData,
        file: watermarkedFile,
      });
    } else {
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

/**
 * Compte le nombre de fichiers supportés pour le filigrane (images + PDFs)
 * @param {Array<{file: File}>} files - Liste des fichiers
 * @returns {number}
 */
export function countWatermarkableFiles(files) {
  return files.filter((f) => isImageFile(f.file) || isPdfFile(f.file)).length;
}
