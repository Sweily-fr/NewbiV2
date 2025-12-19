// Template pour alerte proche de la limite
export const seatLimitWarning = ({
  customerName,
  plan,
  currentMembers,
  includedSeats,
  availableSeats,
}) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Limite de sièges bientôt atteinte</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
      <div style="max-width: 500px; margin: 0 auto;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px; width: 100px;">
        </div>
        
        <!-- Titre principal -->
        <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: center;">
          Limite de sièges bientôt atteinte
        </h1>
        
        <!-- Message principal -->
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: center;">
          Votre organisation approche de la limite de membres de votre plan <strong style="color: #1f2937;">${plan}</strong>.
        </p>
        
        <!-- Informations -->
        <div style="background-color: #fef3c7; border: 1px solid #fde68a; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <p style="font-size: 14px; color: #92400e; margin: 0 0 12px 0; font-weight: 600;">
            ${currentMembers} membres sur ${includedSeats} inclus
          </p>
          <p style="font-size: 14px; color: #78350f; margin: 0; line-height: 1.5;">
            Il ne vous reste que <strong>${availableSeats} siège${availableSeats > 1 ? "s" : ""} disponible${availableSeats > 1 ? "s" : ""}</strong>. Au-delà, chaque membre supplémentaire sera facturé <strong>7,49€/mois</strong>.
          </p>
        </div>
        
        <!-- Options -->
        <div style="margin: 32px 0;">
          <h2 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0;">
            Que faire ?
          </h2>
          <div style="background-color: #f8fafc; border-left: 3px solid #5B4FFF; padding: 16px; border-radius: 4px;">
            <p style="font-size: 14px; color: #6b7280; margin: 8px 0; line-height: 1.5;">
              <span style="color: #5B4FFF; margin-right: 8px;">•</span>Passer au plan supérieur pour plus de sièges inclus
            </p>
            <p style="font-size: 14px; color: #6b7280; margin: 8px 0; line-height: 1.5;">
              <span style="color: #5B4FFF; margin-right: 8px;">•</span>Continuer avec des sièges additionnels (7,49€/mois chacun)
            </p>
            <p style="font-size: 14px; color: #6b7280; margin: 8px 0; line-height: 1.5;">
              <span style="color: #5B4FFF; margin-right: 8px;">•</span>Retirer des membres inactifs
            </p>
          </div>
        </div>
        
        <!-- Bouton CTA -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://app.newbi.fr"}/dashboard/settings?tab=subscription" style="display: inline-block; background-color: #5B4FFF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">
            Gérer mon abonnement
          </a>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0 0 20px 0; text-align: center;">
            Vous recevez cet email car votre organisation approche de la limite de sièges.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="text-align: left; vertical-align: middle;">
                <img src="https://pub-866a54f5560d449cb224411e60410621.r2.dev/Logo_NI_Purple.png" alt="Newbi" style="height: 24px; width: auto;">
              </td>
              <td style="text-align: right; vertical-align: middle;">
                <a href="https://www.instagram.com/newbi_fr?igsh=OXhuZHRtY3M5bW83" target="_blank" style="text-decoration: none;">
                  <img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/instagram/instagram-black.png" alt="Instagram" style="height: 24px; width: 24px;">
                </a>
              </td>
            </tr>
          </table>
          <div style="text-align: left; font-size: 10px; color: #9ca3af; line-height: 1.6;">
            <p style="margin: 0 0 4px 0; font-weight: 600;">SWEILY</p>
            <p style="margin: 0 0 4px 0;">SAS au capital de 10 000,00 €</p>
            <p style="margin: 0 0 4px 0;">SIREN : 981 576 549 • RCS Paris</p>
            <p style="margin: 0;">229 rue Saint-Honoré, 75001 Paris</p>
          </div>
        </div>
        
      </div>
    </body>
    </html>
  `;
