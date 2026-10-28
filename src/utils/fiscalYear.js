import { addYears, subDays } from "date-fns";

/**
 * Clôture proposée quand on choisit le début de l'exercice comptable : un
 * exercice de douze mois se termine la veille de la date anniversaire
 * (1er janvier 2026 → 31 décembre 2026). L'utilisateur peut la modifier.
 */
export function defaultFiscalYearEnd(startDate) {
  return subDays(addYears(startDate, 1), 1);
}
