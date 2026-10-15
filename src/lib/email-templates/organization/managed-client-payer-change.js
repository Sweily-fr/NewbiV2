import { escapeHtml } from "../../validation.js";
import { typo } from "../typo.js";

// Changement de payeur de l'abonnement d'un espace suivi par un cabinet
// (compte gestionnaire) : le cabinet reprend l'abonnement du client, ou le
// lui rend. Envoyé au super admin de l'espace. Même style que la bienvenue
// d'un client créé par son cabinet. Noms saisis par le cabinet : échappés.

const longDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Paris",
      })
    : "";

const euros = (cents) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })
    .format((Number(cents) || 0) / 100)
    .replace(/\u202f/g, "\u00a0");

const SAME_SPACE =
  "Rien ne change dans votre espace : vos documents, vos réglages et vos accès restent les mêmes.";

/**
 * Objet et paragraphes de l'e-mail selon ce qui s'est passé.
 * @param {object} p
 * @param {"takeover_now"|"takeover_renewal"|"takeover_trial"|"takeover_unpaid"|"takeover_start"|"takeover_pending"|"takeover_resumed"|"handback_scheduled"|"handback_restored"|"handback_trial"|"handback_now"} p.kind
 */
export function managedClientPayerChangeContent({
  kind,
  managerName,
  companyName,
  effectiveAt,
  refundAmount = 0,
  hadOffer = false,
  trialEndsAt,
  nextChargeAt,
}) {
  const manager = escapeHtml(managerName || "Votre cabinet");
  const company = escapeHtml(companyName || "votre entreprise");
  const subjectManager = managerName || "Votre cabinet";
  const date = longDate(effectiveAt);

  switch (kind) {
    case "takeover_now":
      return {
        subject: `${subjectManager} prend en charge votre abonnement Newbi`,
        title: "Votre abonnement est pris en charge par votre cabinet",
        paragraphs: [
          `À partir d'aujourd'hui, ${manager} paie l'abonnement Newbi de ${company}. Vous n'avez plus rien à payer.`,
          refundAmount > 0
            ? `Votre abonnement a été arrêté et la période non utilisée vous est remboursée : <strong>${euros(refundAmount)}</strong> sur votre moyen de paiement, sous 5 à 10 jours.`
            : "Votre abonnement a été arrêté.",
          SAME_SPACE,
        ],
      };
    case "takeover_renewal":
      return {
        subject: `${subjectManager} prend en charge votre abonnement Newbi`,
        title: "Votre abonnement est pris en charge par votre cabinet",
        paragraphs: [
          `À partir du <strong>${date}</strong>, ${manager} paie l'abonnement Newbi de ${company}.`,
          "Vous avez déjà payé la période en cours : votre abonnement ne sera pas renouvelé et vous ne serez plus prélevé.",
          SAME_SPACE,
        ],
      };
    case "takeover_unpaid":
      return {
        subject: `${subjectManager} prend en charge votre abonnement Newbi`,
        title: "Votre abonnement est pris en charge par votre cabinet",
        paragraphs: [
          `À partir d'aujourd'hui, ${manager} paie l'abonnement Newbi de ${company}.`,
          "Votre abonnement a été arrêté et la facture en attente de paiement a été annulée : vous n'avez rien à régler.",
          SAME_SPACE,
        ],
      };
    case "takeover_trial":
      return {
        subject: `${subjectManager} prend en charge votre abonnement Newbi`,
        title: "Votre abonnement est pris en charge par votre cabinet",
        paragraphs: [
          `${manager} paie désormais l'abonnement Newbi de ${company} : rien ne vous sera prélevé.`,
          hadOffer
            ? `L'offre que vous aviez choisie pour la fin de votre essai est annulée, c'est ${manager} qui s'en occupe.`
            : `Votre essai continue normalement, puis ${manager} prend le relais.`,
          SAME_SPACE,
        ],
      };
    case "takeover_start":
      return {
        subject: `${subjectManager} prend en charge votre abonnement Newbi`,
        title: "Votre abonnement est pris en charge par votre cabinet",
        paragraphs: [
          `À partir d'aujourd'hui, ${manager} paie l'abonnement Newbi de ${company} : vous retrouvez l'accès complet à votre espace, sans rien payer.`,
        ],
      };
    case "takeover_pending":
      return {
        subject: `${subjectManager} prend en charge votre abonnement Newbi`,
        title: "Votre abonnement est pris en charge par votre cabinet",
        paragraphs: [
          `${manager} prend en charge l'abonnement Newbi de ${company} : il choisit votre offre et la paie, vous n'avez rien à faire.`,
        ],
      };
    case "takeover_resumed":
      return {
        subject: `${subjectManager} continue de prendre en charge votre abonnement Newbi`,
        title: "Votre cabinet continue de payer votre abonnement",
        paragraphs: [
          `${manager} continue de payer l'abonnement Newbi de ${company} : vous n'avez rien à faire.`,
        ],
      };
    case "handback_scheduled":
      return {
        subject: `${subjectManager} ne prendra plus en charge votre abonnement Newbi`,
        title: "Vous reprenez votre abonnement Newbi",
        paragraphs: [
          `${manager} paie l'abonnement Newbi de ${company} jusqu'au <strong>${date}</strong>. Ensuite, c'est vous qui le payez.`,
          `Choisissez votre offre dès maintenant dans Paramètres &gt; Abonnement : le premier prélèvement aura lieu le ${date}, sans interruption. Sans offre choisie, votre espace passera en lecture seule à cette date.`,
        ],
      };
    case "handback_restored":
      return {
        subject: `${subjectManager} ne prend plus en charge votre abonnement Newbi`,
        title: "Votre abonnement continue comme avant",
        paragraphs: [
          `${manager} ne prend plus en charge l'abonnement Newbi de ${company} : votre propre abonnement continue, au même tarif.`,
          nextChargeAt
            ? `Votre prochain prélèvement aura lieu le <strong>${longDate(nextChargeAt)}</strong>.`
            : "Vous n'avez rien à faire.",
        ],
      };
    case "handback_trial":
      return {
        subject: `${subjectManager} ne prend plus en charge votre abonnement Newbi`,
        title: "Vous reprenez votre abonnement Newbi",
        paragraphs: [
          `${manager} ne prend plus en charge l'abonnement Newbi de ${company}.`,
          `Votre essai continue jusqu'au <strong>${longDate(trialEndsAt)}</strong>. Choisissez votre offre avant cette date dans Paramètres &gt; Abonnement pour ne pas être interrompu.`,
        ],
      };
    default:
      return {
        subject: `${subjectManager} ne prend plus en charge votre abonnement Newbi`,
        title: "Vous reprenez votre abonnement Newbi",
        paragraphs: [
          `${manager} ne prend plus en charge l'abonnement Newbi de ${company}.`,
          "Choisissez votre offre dans Paramètres &gt; Abonnement pour garder l'accès complet à votre espace.",
        ],
      };
  }
}

export const managedClientPayerChange = (params) => {
  const { title, paragraphs } = managedClientPayerChangeContent(params);
  const url = params.url;
  const body = paragraphs
    .map(
      (text, index) =>
        `<p style="font-size: 15px; color: #4b5563; margin: 0 0 ${index === paragraphs.length - 1 ? 24 : 16}px 0; line-height: 1.6;">
            ${typo(text)}
          </p>`,
    )
    .join("\n          ");
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; color: #1a1a1a;">
      <div style="max-width: 600px; margin: 0 auto; padding: 0 20px; background-color: #fafafa;">

        <!-- Logo -->
        <div style="text-align: center; padding: 40px 0 24px 0;">
          <img src="https://pub-866a54f5560d449cb224411e60410621.r2.dev/Logo_Texte_Black.png" alt="Newbi" style="height: 32px; width: auto;">
        </div>

        <!-- Carte principale -->
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px 24px; margin-bottom: 32px;">

          <h1 style="font-size: 26px; font-weight: 500; color: #1a1a1a; margin: 0 0 24px 0; line-height: 1.3;">
            ${typo(escapeHtml(title))}
          </h1>

          ${body}

          <a href="${url}" style="display: block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 16px 24px; border-radius: 6px; font-weight: 500; font-size: 15px; text-align: center;">
            Voir mon abonnement
          </a>
        </div>

        <!-- Lien de secours -->
        <p style="font-size: 12px; line-height: 1.5; color: #9ca3af; margin: 0 0 32px 0; text-align: center;">
          ${typo("Si le bouton ne fonctionne pas, copiez ce lien :")}<br>
          <span style="color: #5B4FFF; word-break: break-all;">${url}</span>
        </p>

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 32px; text-align: center;">
          <div style="margin-bottom: 16px;">
            <img src="https://pub-866a54f5560d449cb224411e60410621.r2.dev/Logo_NI_Purple.png" alt="Newbi" style="height: 28px; width: auto;">
          </div>
          <p style="font-size: 13px; font-weight: 500; color: #1a1a1a; margin: 0 0 24px 0;">
            Votre gestion, simplifiée.
          </p>
          <p style="font-size: 12px; color: #9ca3af; margin: 0 0 24px 0; line-height: 1.8;">
            <a href="https://newbi.fr/aide" style="color: #9ca3af; text-decoration: underline;">FAQ</a>
          </p>
          <div style="font-size: 11px; color: #9ca3af; line-height: 1.6;">
            <p style="margin: 0 0 4px 0;">SWEILY (SAS),</p>
            <p style="margin: 0;">229 rue Saint-Honoré, 75001 Paris, FRANCE</p>
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
};
