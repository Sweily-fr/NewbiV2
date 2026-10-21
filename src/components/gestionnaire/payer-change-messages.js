// Messages affichés au cabinet après un changement de payeur (reprise de
// l'abonnement d'un client, ou fin de sa prise en charge)

const longDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Paris",
      })
    : null;

export const euros = (cents) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    (Number(cents) || 0) / 100,
  );

/**
 * @param {string} name nom du client
 * @param {{ mode?: string, effectiveAt?: string, refund?: { amount: number, error?: boolean }, trialEndsAt?: string, nextChargeAt?: string }} result
 * @returns {{ tone: "success"|"warning", text: string }}
 */
export function payerChangeMessage(name, result = {}) {
  const client = name || "votre client";
  const date = longDate(result.effectiveAt);
  switch (result.mode) {
    case "now":
      if (result.refund?.error) {
        return {
          tone: "warning",
          text: `Vous payez l'abonnement de ${client} dès aujourd'hui. Son remboursement n'a pas pu être fait automatiquement : l'équipe Newbi s'en charge.`,
        };
      }
      return {
        tone: "success",
        text:
          result.refund?.amount > 0
            ? `Vous payez l'abonnement de ${client} dès aujourd'hui. Votre client est remboursé de ${euros(result.refund.amount)}.`
            : `Vous payez l'abonnement de ${client} dès aujourd'hui.`,
      };
    case "renewal":
      return {
        tone: "success",
        text: `Vous paierez l'abonnement de ${client} à partir du ${date}, à la fin de la période déjà payée par votre client.`,
      };
    case "unpaid":
      return {
        tone: "success",
        text: `Vous payez l'abonnement de ${client} dès aujourd'hui. Sa facture en attente est annulée.`,
      };
    case "resumed":
      return {
        tone: "success",
        text: `Vous continuez de payer l'abonnement de ${client}.`,
      };
    case "scheduled":
      return {
        tone: "success",
        text: `Vous ne paierez plus l'abonnement de ${client} après le ${date}. Votre client est prévenu par e-mail.`,
      };
    case "restored":
      return {
        tone: "success",
        text: `${client} retrouve son propre abonnement. Rien ne vous est prélevé.`,
      };
    case "trial-restored":
      return {
        tone: "success",
        text: `${client} reprend son essai jusqu'au ${longDate(result.trialEndsAt)} et choisira son offre. Rien ne vous est prélevé.`,
      };
    case "ended":
      return {
        tone: "success",
        text: `Vous ne payez plus l'abonnement de ${client}. Votre client est prévenu par e-mail.`,
      };
    default:
      return {
        tone: "success",
        text: `Vous payez désormais l'abonnement de ${client}.`,
      };
  }
}
