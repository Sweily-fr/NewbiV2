// Intl.NumberFormat mis en cache par (locale, options). Construire un
// formateur coûte ~70 fois plus cher que de l'utiliser, or beaucoup de cellules
// de tableaux et de graphiques en recréaient un à chaque rendu. Même signature
// que le constructeur ; les formateurs sont immuables, donc partageables.
const numberFormats = new Map();

export function getNumberFormat(locale, options) {
  const key = `${Array.isArray(locale) ? locale.join(",") : locale}|${
    options ? JSON.stringify(options) : ""
  }`;
  let formatter = numberFormats.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormats.set(key, formatter);
  }
  return formatter;
}
