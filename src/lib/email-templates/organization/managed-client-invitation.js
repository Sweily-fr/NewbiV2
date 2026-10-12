import { escapeHtml } from "../../validation.js";

// Invitation d'un client existant par un cabinet (gestionnaire) : le client
// choisit l'espace à confier puis accepte ou refuse. Même style que
// l'e-mail de bienvenue des clients créés par un cabinet.
export const managedClientInvitation = ({ managerName, url, days = 14 }) => {
  const manager = escapeHtml(managerName || "Un cabinet");
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${manager} souhaite gérer votre espace Newbi</title>
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
            ${manager} souhaite gérer votre espace Newbi
          </h1>

          <p style="font-size: 15px; color: #4b5563; margin: 0 0 16px 0; line-height: 1.6;">
            Votre cabinet vous invite à lui confier l'un de vos espaces Newbi, pour suivre vos factures, devis et votre comptabilité.
          </p>
          <p style="font-size: 15px; color: #4b5563; margin: 0 0 24px 0; line-height: 1.6;">
            En acceptant, vous choisissez l'espace concerné. ${manager} y accède avec les droits Comptable, que vous pouvez ajuster dans Paramètres &gt; Rôles. Vous restez super admin de votre espace et gardez votre abonnement.
          </p>

          <a href="${url}" style="display: block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 16px 24px; border-radius: 6px; font-weight: 500; font-size: 15px; text-align: center;">
            Voir l'invitation
          </a>
        </div>

        <!-- Lien de secours -->
        <p style="font-size: 12px; line-height: 1.5; color: #9ca3af; margin: 0 0 32px 0; text-align: center;">
          Si le bouton ne fonctionne pas, copiez ce lien :<br>
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
            Cette invitation est valable ${days} jours. Si vous ne connaissez pas ce cabinet, ignorez cet e-mail. • <a href="https://newbi.fr/aide" style="color: #9ca3af; text-decoration: underline;">FAQ</a>
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
