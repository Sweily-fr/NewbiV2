/**
 * Calcul du montant d'une tâche à partir de son suivi de temps.
 *
 * Le montant n'est pas stocké : il dérive du temps passé (timeTracking) et du
 * tarif horaire. La logique est alignée sur le badge des cartes (TimerDisplay)
 * pour que la vue liste, les cartes et la modale affichent la même valeur :
 *   - on inclut le temps du timer en cours (currentStartTime) ;
 *   - le calcul est proportionnel et précis (secondes / 3600), pour qu'un petit
 *     montant reste visible ;
 *   - on applique l'arrondi (up / down) si demandé, sinon valeur exacte.
 */

/**
 * Temps effectif en secondes, timer en cours inclus.
 * @param {Object} tt - timeTracking
 * @returns {number}
 */
export function getEffectiveSeconds(tt) {
  if (!tt) return 0;
  let total = tt.totalSeconds || 0;
  if (tt.isRunning && tt.currentStartTime) {
    const elapsed = Math.floor(
      (Date.now() - new Date(tt.currentStartTime).getTime()) / 1000,
    );
    if (elapsed > 0) total += elapsed;
  }
  return Math.max(0, total);
}

/**
 * @param {Object} timeTracking - { totalSeconds, isRunning, currentStartTime, hourlyRate, roundingOption }
 * @returns {number|null} Montant en euros, ou null si non facturable.
 */
export function calculateTaskAmount(timeTracking) {
  if (!timeTracking?.hourlyRate || timeTracking.hourlyRate <= 0) return null;

  const seconds = getEffectiveSeconds(timeTracking);
  if (seconds <= 0) return null;

  // Calcul proportionnel et précis : on garde les secondes pour que les petits
  // montants restent visibles (ex. quelques minutes de suivi).
  let billableHours = seconds / 3600;

  const roundingOption = timeTracking.roundingOption || "none";
  if (roundingOption === "up") {
    billableHours = Math.ceil(billableHours);
  } else if (roundingOption === "down") {
    billableHours = Math.floor(billableHours);
  }

  const amount = billableHours * timeTracking.hourlyRate;
  return amount > 0 ? amount : null;
}

/**
 * Formate un montant en euros au format français (ex: "1 234,56 €").
 * @param {number} amount
 * @returns {string}
 */
export function formatTaskAmount(amount) {
  return amount.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
}
