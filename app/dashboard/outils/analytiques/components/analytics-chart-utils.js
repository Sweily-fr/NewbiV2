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

const AXIS_NUMBER = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

/**
 * Libellé compact d'un montant pour les graduations d'axe : « 43 € »,
 * « 1,2k », « 12k », « 1,5M ». Le palier s'adapte à la valeur, pour que les
 * petits montants ne se lisent pas tous « 0k ».
 */
export function formatAxisAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || Math.round(n) === 0) return "0 €";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${AXIS_NUMBER.format(n / 1_000_000)}M`;
  if (abs >= 10_000) return `${Math.round(n / 1000)}k`;
  if (abs >= 1000) return `${AXIS_NUMBER.format(n / 1000)}k`;
  return `${Math.round(n)} €`;
}
