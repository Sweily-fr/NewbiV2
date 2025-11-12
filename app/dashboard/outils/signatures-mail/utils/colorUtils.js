/**
 * Utilitaires pour la gestion des couleurs
 * Fonctions de conversion et validation de couleurs
 */

/**
 * Convertit une couleur hexadécimale en HSL
 * @param {string} hex - Couleur au format hexadécimal (#RRGGBB)
 * @returns {Array<number>} - [hue, saturation, lightness]
 */
export const hexToHsl = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
};

/**
 * Convertit une couleur hexadécimale en RGB
 * @param {string} hex - Couleur au format hexadécimal
 * @returns {Object|null} - {r, g, b} ou null si invalide
 */
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Convertit une couleur HSL en hexadécimal
 * @param {string} hslString - Couleur au format HSL
 * @returns {string} - Couleur au format hexadécimal
 */
export const hslToHex = (hslString) => {
  if (!hslString || hslString.startsWith("#")) return hslString;

  const hslMatch = hslString.match(
    /hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/
  );
  if (!hslMatch) return hslString;

  const h = parseFloat(hslMatch[1]) / 360;
  const s = parseFloat(hslMatch[2]) / 100;
  const l = parseFloat(hslMatch[3]) / 100;

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (c) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Génère un filtre CSS pour approximer une couleur cible
 * @param {string} targetColor - Couleur cible au format hexadécimal
 * @returns {string} - Filtre CSS
 */
export const getColorFilter = (targetColor) => {
  if (!targetColor || targetColor === "transparent") return "none";

  const rgb = hexToRgb(targetColor);
  if (!rgb) return "none";

  const brightness = (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
  const [hue] = hexToHsl(targetColor);

  return `brightness(0) saturate(100%) invert(${brightness > 0.5 ? 0 : 1}) sepia(1) saturate(5) hue-rotate(${hue}deg) brightness(${brightness + 0.5}) contrast(1.2)`;
};

/**
 * Valide et normalise une couleur
 * @param {string} color - Couleur à valider
 * @returns {string} - Couleur normalisée au format hexadécimal
 */
export const validateColor = (color) => {
  if (!color) return "#171717";

  // Si c'est déjà au bon format
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return color;
  }

  // Si c'est rgb(r, g, b), convertir en hex
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, "0");
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, "0");
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }

  // Si c'est hsl(h, s%, l%), convertir en hex
  return hslToHex(color) || "#171717";
};
