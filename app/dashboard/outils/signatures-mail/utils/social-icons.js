/**
 * Icônes de réseaux sociaux hébergées sur Cloudflare R2.
 * Source unique pour l'éditeur (BlockSettings, BlockElement) et le
 * générateur HTML : la liste des couleurs doit refléter exactement les
 * fichiers présents sur R2 (`<réseau>/<réseau>-<couleur>.png`).
 */

export const CLOUDFLARE_ICONS_BASE =
  "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev";
export const CLOUDFLARE_SOCIAL_BASE = `${CLOUDFLARE_ICONS_BASE}/social`;
export const CLOUDFLARE_CONTACT_BASE = `${CLOUDFLARE_ICONS_BASE}/info`;

/**
 * Couleurs disponibles sur R2 pour chaque réseau (vérifié le 21/09/2026).
 * Chaque variante est un carré arrondi de cette couleur avec le pictogramme
 * en blanc. En mode sombre, les clients mail qui inversent les images
 * (Outlook) transforment le noir en blanc ; une couleur donne un rendu
 * identique dans les deux thèmes.
 */
export const SOCIAL_ICON_COLORS = [
  "black",
  "blue",
  "sky",
  "indigo",
  "purple",
  "pink",
  "red",
  "orange",
  "yellow",
  "green",
];

/** Couleur d'aperçu (pastille) pour chaque variante */
export const SOCIAL_ICON_COLOR_PREVIEW = {
  black: "#171717",
  blue: "#3b82f6",
  sky: "#0ea5e9",
  indigo: "#6366f1",
  purple: "#a855f7",
  pink: "#ec4899",
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
};

/** Libellés français des couleurs */
export const SOCIAL_ICON_COLOR_LABELS = {
  black: "Noir",
  blue: "Bleu",
  sky: "Bleu ciel",
  indigo: "Indigo",
  purple: "Violet",
  pink: "Rose",
  red: "Rouge",
  orange: "Orange",
  yellow: "Jaune",
  green: "Vert",
};

// Anciennes valeurs hexadécimales stockées dans des signatures existantes
const HEX_TO_COLOR_NAME = {
  "0077b5": "blue",
  "1877f2": "blue",
  "1da1f2": "blue",
  "3b82f6": "blue",
  "0ea5e9": "sky",
  "6366f1": "indigo",
  "833ab4": "purple",
  "5a50ff": "purple",
  a855f7: "purple",
  e4405f: "pink",
  ec4899: "pink",
  ff0000: "red",
  ef4444: "red",
  f97316: "orange",
  f59e0b: "orange",
  eab308: "yellow",
  "22c55e": "green",
  "000000": "black",
  "171717": "black",
  "333333": "black",
};

/**
 * Icônes de contact (téléphone, mobile, mail, site, adresse) : glyphe Lucide
 * sur fond transparent, déclinées dans la palette sociale + gris (couleur de
 * texte par défaut) + blanc. Fichiers `info/<icône>-<couleur>.png` sur R2.
 */
export const CONTACT_ICON_COLOR_PREVIEW = {
  ...SOCIAL_ICON_COLOR_PREVIEW,
  gray: "#666666",
  white: "#ffffff",
};

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/**
 * Couleur de la palette la plus proche d'une couleur libre (hex ou nom).
 * Sert à choisir un fichier existant sur R2 pour une couleur de texte
 * quelconque prise dans le sélecteur de l'éditeur.
 */
export const getNearestColorName = (colorInput, palette, fallback) => {
  if (!colorInput) return fallback;
  const color = String(colorInput).toLowerCase().trim();
  if (palette[color]) return color;
  const rgb = hexToRgb(color);
  if (!rgb) return fallback;
  let best = fallback;
  let bestDist = Infinity;
  for (const [name, hex] of Object.entries(palette)) {
    const [r, g, b] = hexToRgb(hex);
    const dist = (r - rgb[0]) ** 2 + (g - rgb[1]) ** 2 + (b - rgb[2]) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = name;
    }
  }
  return best;
};

/** URL de l'icône de contact (phone, smartphone, mail, globe, map-pin) */
export const getContactIconUrl = (icon, color) => {
  const name = getNearestColorName(color, CONTACT_ICON_COLOR_PREVIEW, "gray");
  return `${CLOUDFLARE_CONTACT_BASE}/${icon}-${name}.png`;
};

/** Nom Cloudflare du réseau (x -> twitter) */
export const getSocialPlatformName = (platform) =>
  platform === "x" ? "twitter" : platform;

/**
 * Convertit une couleur (nom ou hex) en nom de variante existant sur R2.
 * Retourne "black" pour toute valeur inconnue (évite une image 404).
 */
export const getSocialColorName = (colorInput) => {
  if (!colorInput) return "black";
  const color = String(colorInput).toLowerCase().trim();
  if (SOCIAL_ICON_COLORS.includes(color)) return color;
  return (
    HEX_TO_COLOR_NAME[color.replace("#", "")] ||
    getNearestColorName(color, SOCIAL_ICON_COLOR_PREVIEW, "black")
  );
};

/** URL de l'icône sur R2 pour un réseau et une couleur */
export const getSocialIconUrl = (platform, color = "black") => {
  const name = getSocialPlatformName(String(platform).toLowerCase());
  return `${CLOUDFLARE_SOCIAL_BASE}/${name}/${name}-${getSocialColorName(color)}.png`;
};
