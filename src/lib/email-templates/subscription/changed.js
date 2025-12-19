// Template pour changement d'abonnement - Style Qonto
export const subscriptionChanged = ({
  customerName,
  oldPlan,
  newPlan,
  newPrice,
  isUpgrade,
  effectiveDate,
}) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Changement d'abonnement confirmé</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; color: #1a1a1a;">
      <div style="max-width: 600px; margin: 0 auto; padding: 0 20px; background-color: #fafafa;">
        
        <!-- Logo -->
        <div style="text-align: center; padding: 40px 0 24px 0;">
          <img src="https://pub-866a54f5560d449cb224411e60410621.r2.dev/Logo_Texte_Black.png" alt="Newbi" style="height: 32px; width: auto;">
        </div>
        
        <!-- Type de notification -->
        <div style="text-align: center; margin-bottom: 8px;">
          <span style="font-size: 11px; font-weight: 600; color: #1a1a1a; letter-spacing: 0.5px; text-transform: uppercase;">
            MODIFICATION D'ABONNEMENT
          </span>
        </div>
        
        <!-- Date -->
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 12px; color: #6b7280;">
            ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
          </span>
        </div>
        
        <!-- Carte principale - fond blanc avec bordure -->
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px 24px; margin-bottom: 32px;">
          
          <!-- Icône avec image et texte - style Qonto -->
          <div style="margin-bottom: 20px;">
            <div style="display: inline-flex; align-items: center; background-color: #f3f4f6; border-radius: 6px; padding: 8px 12px;">
              <img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/mail.png" alt="Mail" style="height: 16px; width: 16px; margin-right: 8px;">
              <span style="font-size: 11px; font-weight: 500; color: #374151; letter-spacing: 0.3px; text-transform: uppercase;">ABONNEMENT</span>
            </div>
          </div>
          
          <!-- Titre -->
          <h1 style="font-size: 26px; font-weight: 500; color: #1a1a1a; margin: 0 0 24px 0; line-height: 1.3;">
            Votre abonnement a été modifié
          </h1>
          
          <!-- Salutation -->
          <p style="font-size: 15px; color: #4b5563; margin: 0 0 16px 0; line-height: 1.6;">
            Bonjour${customerName ? ` ${customerName}` : ""},
          </p>
          
          <!-- Message principal -->
          <p style="font-size: 15px; color: #4b5563; margin: 0 0 24px 0; line-height: 1.6;">
            Votre abonnement a été modifié du plan <strong style="color: #1a1a1a;">${oldPlan}</strong> vers le plan <strong style="color: #1a1a1a;">${newPlan}</strong>. Ce changement prendra effet le ${effectiveDate}.
          </p>
          
          <!-- Note prorata -->
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px 0; line-height: 1.6;">
            ${
              isUpgrade
                ? "Le montant de votre prochaine facture a été ajusté au prorata."
                : "Un crédit au prorata vous sera appliqué sur votre prochaine facture."
            }
          </p>
          
          <!-- Bouton CTA - Style Qonto (noir, border-radius réduit) -->
          <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://app.newbi.fr"}/dashboard" style="display: block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 16px 24px; border-radius: 6px; font-weight: 500; font-size: 15px; text-align: center;">
            Accéder à mon espace
          </a>
        </div>
        
        <!-- Question / Aide -->
        <p style="font-size: 14px; color: #4b5563; margin: 0 0 32px 0; padding: 0 8px; line-height: 1.6;">
          Une question ? Trouvez rapidement la réponse dans notre <a href="https://newbi.fr/aide" style="color: #5B4FFF; text-decoration: none;">centre d'aide</a>.
        </p>
        
        <!-- Signature -->
        <div style="padding: 0 8px;">
          <p style="font-size: 14px; color: #4b5563; margin: 0 0 8px 0;">Merci,</p>
          <p style="font-size: 14px; color: #4b5563; margin: 0 0 48px 0; font-weight: 500;">L'équipe Newbi</p>
        </div>
        
        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 32px; text-align: center;">
          
          <!-- Logo footer -->
          <div style="margin-bottom: 16px;">
            <img src="https://pub-866a54f5560d449cb224411e60410621.r2.dev/Logo_NI_Purple.png" alt="Newbi" style="height: 28px; width: auto;">
          </div>
          
          <!-- Tagline -->
          <p style="font-size: 13px; font-weight: 500; color: #1a1a1a; margin: 0 0 24px 0;">
            Votre gestion, simplifiée.
          </p>
          
          <!-- Liens footer -->
          <p style="font-size: 12px; color: #9ca3af; margin: 0 0 24px 0; line-height: 1.8;">
            Vous pouvez gérer vos notifications dans les paramètres de votre compte • <a href="https://newbi.fr/aide" style="color: #9ca3af; text-decoration: underline;">FAQ</a>
          </p>
          
          <!-- Infos légales -->
          <div style="font-size: 11px; color: #9ca3af; line-height: 1.6;">
            <p style="margin: 0 0 4px 0;">SWEILY (SAS),</p>
            <p style="margin: 0;">229 rue Saint-Honoré, 75001 Paris, FRANCE</p>
          </div>
        </div>
        
      </div>
    </body>
    </html>
  `;
