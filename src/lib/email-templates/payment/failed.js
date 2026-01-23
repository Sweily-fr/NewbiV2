// Template pour échec de paiement - Style Qonto
export const paymentFailed = ({
  customerName,
  plan,
  amount,
  failureReason,
  retryDate,
}) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Échec de paiement</title>
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
            ÉCHEC DE PAIEMENT
          </span>
        </div>
        
        <!-- Date -->
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 12px; color: #6b7280;">
            ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
          </span>
        </div>
        
        <!-- Carte principale -->
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px 24px; margin-bottom: 32px;">
          
          <!-- Icône -->
          <div style="margin-bottom: 20px;">
            <div style="display: inline-flex; align-items: center; background-color: #fef2f2; border-radius: 6px; padding: 8px 12px;">
              <img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/mail.png" alt="Mail" style="height: 16px; width: 16px; margin-right: 8px;">
              <span style="font-size: 11px; font-weight: 500; color: #ef4444; letter-spacing: 0.3px; text-transform: uppercase;">PAIEMENT</span>
            </div>
          </div>
          
          <!-- Titre -->
          <h1 style="font-size: 26px; font-weight: 500; color: #1a1a1a; margin: 0 0 24px 0; line-height: 1.3;">
            Échec de paiement
          </h1>
          
          <!-- Salutation -->
          <p style="font-size: 15px; color: #4b5563; margin: 0 0 16px 0; line-height: 1.6;">
            Bonjour${customerName ? ` ${customerName}` : ""},
          </p>
          
          <!-- Message -->
          <p style="font-size: 15px; color: #4b5563; margin: 0 0 24px 0; line-height: 1.6;">
            Nous n'avons pas pu traiter votre paiement pour l'abonnement <strong style="color: #1a1a1a;">${plan}</strong>.
          </p>
          
          <!-- Détails -->
          <div style="background-color: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Plan</td>
                <td style="padding: 6px 0; font-size: 14px; color: #1a1a1a; font-weight: 500; text-align: right;">${plan}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Montant</td>
                <td style="padding: 6px 0; font-size: 14px; color: #1a1a1a; text-align: right;">${amount}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Raison</td>
                <td style="padding: 6px 0; font-size: 14px; color: #ef4444; font-weight: 500; text-align: right;">${failureReason}</td>
              </tr>
              <tr style="border-top: 1px solid #fecaca;">
                <td style="padding: 12px 0 6px 0; font-size: 14px; color: #6b7280;">Prochaine tentative</td>
                <td style="padding: 12px 0 6px 0; font-size: 14px; color: #1a1a1a; text-align: right;">${retryDate}</td>
              </tr>
            </table>
          </div>
          
          <!-- Instructions -->
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px 0; line-height: 1.6;">
            Veuillez mettre à jour vos informations de paiement pour éviter toute interruption de service.
          </p>
          
          <!-- Bouton CTA -->
          <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://app.newbi.fr"}/dashboard" style="display: block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 16px 24px; border-radius: 6px; font-weight: 500; font-size: 15px; text-align: center;">
            Accéder au tableau de bord
          </a>
        </div>
        
        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 32px; text-align: center;">
          <div style="margin-bottom: 16px;">
            <img src="https://pub-866a54f5560d449cb224411e60410621.r2.dev/Logo_NI_Purple.png" alt="Newbi" style="height: 28px; width: auto;">
          </div>
          <p style="font-size: 13px; font-weight: 500; color: #1a1a1a; margin: 0 0 24px 0;">
            Votre gestion, simplifiée.
          </p>
          <p style="font-size: 12px; color: #9ca3af; margin: 0 0 24px 0; line-height: 1.8;">
            Si vous avez des questions, contactez notre support à support@newbi.fr • <a href="https://newbi.fr/aide" style="color: #9ca3af; text-decoration: underline;">FAQ</a>
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
