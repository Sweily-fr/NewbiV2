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
    try {
      formatter = new Intl.NumberFormat(locale, options);
    } catch (error) {
      // Devise enregistrée qui n'est pas un code ISO (« € », « EURO » sur
      // d'anciennes factures) : le montant s'affiche en euros plutôt que de
      // faire tomber le dialogue ou le tableau qui l'affiche.
      if (!(error instanceof RangeError) || !options?.currency) throw error;
      formatter = new Intl.NumberFormat(locale, {
        ...options,
        currency: "EUR",
      });
    }
    numberFormats.set(key, formatter);
  }
  return formatter;
}
