/**
 * Vrai si au moins une ligne porte une valeur numérique non nulle sur l'une
 * des clés données. L'API renvoie souvent une ligne par mois de la période
 * même quand tout est à zéro : tester la longueur du tableau ne suffit pas
 * pour savoir si un graphique a quelque chose à montrer.
 */
export function hasChartValues(rows, keys) {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  return rows.some((row) =>
    keys.some((key) => {
      const value = Number(row?.[key]);
      return Number.isFinite(value) && value !== 0;
    }),
  );
}
