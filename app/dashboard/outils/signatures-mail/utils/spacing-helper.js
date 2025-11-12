/**
 * Helper pour gérer l'espacement global vs détaillé
 */

export const getSpacing = (signatureData, specificSpacing, fallbackSpacing = 8) => {
  let result;
  
  // Si le mode détaillé est activé, utiliser l'espacement spécifique
  if (signatureData.detailedSpacing && specificSpacing !== undefined) {
    result = specificSpacing;
  } else {
    // Sinon, utiliser l'espacement global (qui vaut 8 par défaut)
    result = signatureData.spacings?.global ?? fallbackSpacing;
  }

  return result;
};
