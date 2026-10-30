/**
 * Numérotation chronologique : une facture ne peut pas être datée avant la
 * dernière facture émise (l'API la refuse). Sa date d'émission est reportée à
 * celle de la dernière facture et, si l'échéance tombait alors avant
 * l'émission, l'échéance est décalée en gardant le délai de paiement choisi
 * (30 jours sinon). Le report se faisait sans prévenir, et l'échéance laissée
 * avant l'émission faisait échouer la création.
 *
 * @param {Object} input - données de la facture (dates au format YYYY-MM-DD)
 * @param {string|null} latestIssueDate - date de la dernière facture émise (YYYY-MM-DD)
 * @returns {{ input: Object, shiftedFrom: string|null }} données recalées et
 *   date d'émission d'origine (null si rien n'a changé)
 */
export function clampIssueDate(input, latestIssueDate) {
  if (
    !latestIssueDate ||
    !input?.issueDate ||
    input.issueDate >= latestIssueDate
  ) {
    return { input, shiftedFrom: null };
  }
  const shiftedFrom = input.issueDate;
  let next = { ...input, issueDate: latestIssueDate };

  if (input.dueDate && input.dueDate < latestIssueDate) {
    // Préserver l'écart initial (ou 30 jours par défaut)
    const diffDays = Math.max(
      0,
      Math.round(
        (new Date(`${input.dueDate}T00:00:00`) -
          new Date(`${shiftedFrom}T00:00:00`)) /
          (1000 * 60 * 60 * 24),
      ),
    );
    const newDue = new Date(`${latestIssueDate}T00:00:00`);
    newDue.setDate(newDue.getDate() + (diffDays || 30));
    const year = newDue.getFullYear();
    const month = String(newDue.getMonth() + 1).padStart(2, "0");
    const day = String(newDue.getDate()).padStart(2, "0");
    next = { ...next, dueDate: `${year}-${month}-${day}` };
  }

  return { input: next, shiftedFrom };
}

/** Message affiché quand la date d'émission a été reportée. */
export function issueDateShiftMessage(latestIssueDate) {
  const date = new Date(`${latestIssueDate}T00:00:00`).toLocaleDateString(
    "fr-FR",
  );
  return `Date d'émission reportée au ${date} : une facture ne peut pas être datée avant la dernière facture émise.`;
}
