// Template pour ajout de siège additionnel
export const additionalSeatAdded = ({
  customerName,
  plan,
  currentMembers,
  includedSeats,
  additionalSeats,
  monthlyCost,
}) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Siège additionnel ajouté</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
      <div style="max-width: 500px; margin: 0 auto;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px; width: 100px;">
        </div>
        
        <!-- Titre principal -->
        <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: center;">
          Siège${additionalSeats > 1 ? "s" : ""} additionnel${additionalSeats > 1 ? "s" : ""} ajouté${additionalSeats > 1 ? "s" : ""}
        </h1>
        
        <!-- Message principal -->
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: center;">
          Votre organisation a dépassé la limite de <strong style="color: #1f2937;">${includedSeats} membres</strong> de votre plan ${plan}.
        </p>
        
        <!-- Informations -->
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #1e40af;">Membres actuels :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #1f2937; font-weight: 600; text-align: right;">
                ${currentMembers}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #1e40af;">Sièges inclus :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #1f2937; text-align: right;">
                ${includedSeats}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #1e40af;">Sièges additionnels :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #5B4FFF; font-weight: 600; text-align: right;">
                ${additionalSeats}
              </td>
            </tr>
            <tr style="border-top: 1px solid #bfdbfe;">
              <td style="padding: 12px 0 8px 0; font-size: 14px; color: #1e40af; font-weight: 600;">Coût additionnel :</td>
              <td style="padding: 12px 0 8px 0; font-size: 16px; color: #5B4FFF; font-weight: 600; text-align: right;">
                ${monthlyCost}
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Note -->
        <p style="font-size: 14px; line-height: 1.5; color: #6b7280; margin: 24px 0; text-align: center;">
          Le montant sera ajusté au prorata sur votre prochaine facture. Vous ne payez que pour ce que vous utilisez.
        </p>
        
        <!-- Bouton CTA -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://app.newbi.fr"}/dashboard" style="display: inline-block; background-color: #5B4FFF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">
            Accéder au tableau de bord
          </a>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0 0 20px 0; text-align: center;">
            Vous recevez cet email car un siège additionnel a été ajouté à votre abonnement.
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
