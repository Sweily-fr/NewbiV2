/**
 * Génère les styles de typographie pour forcer l'application
 * @param {Object} typography - Objet de typographie du champ
 * @param {Object} fallbacks - Valeurs par défaut
 * @returns {Object} - Styles inline (React n'accepte pas !important dans les objets de style)
 */
export const getTypographyStyles = (typography, fallbacks = {}) => {
  const {
    fontFamily: fallbackFont = "Arial, sans-serif",
    fontSize: fallbackSize = 14,
    fontWeight: fallbackWeight = "normal",
    fontStyle: fallbackStyle = "normal",
    textDecoration: fallbackDecoration = "none",
    color: fallbackColor = "#666666",
  } = fallbacks;

  return {
    fontFamily: typography?.fontFamily || fallbackFont,
    fontSize: `${typography?.fontSize || fallbackSize}px`,
    fontWeight: typography?.fontWeight || fallbackWeight,
    fontStyle: typography?.fontStyle || fallbackStyle,
    textDecoration: typography?.textDecoration || fallbackDecoration,
    color: typography?.color || fallbackColor,
  };
};
