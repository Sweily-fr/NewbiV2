// Template pour le code 2FA - Style Qonto/Vercel
export const twoFactor = (otp) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Code de vérification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1a1a1a;">
      <div style="max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="https://pub-866a54f5560d449cb224411e60410621.r2.dev/Logo_Texte_Black.png" alt="Newbi" style="height: 28px; width: auto;">
        </div>
        
        <!-- Carte principale avec bordure -->
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px 24px; text-align: center;">
          
          <!-- Titre -->
          <h1 style="font-size: 18px; font-weight: 500; color: #1a1a1a; margin: 0 0 16px 0; line-height: 1.4;">
            Confirmez votre connexion à <strong>Newbi</strong>
          </h1>
          
          <!-- Message -->
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px 0; line-height: 1.6;">
            Entrez ce code à 6 chiffres dans la fenêtre de connexion :
          </p>
          
          <!-- Code OTP - Style Vercel -->
          <div style="background-color: #fafafa; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px 24px; margin: 0 0 24px 0;">
            <span style="font-size: 32px; font-weight: 600; letter-spacing: 6px; color: #1a1a1a; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">
              ${otp}
            </span>
          </div>
          
          <!-- Note CGU -->
          <p style="font-size: 12px; color: #9ca3af; margin: 0; line-height: 1.6;">
            En vous connectant, vous acceptez nos <a href="https://newbi.fr/cgu" style="color: #9ca3af; text-decoration: underline;">Conditions d'utilisation</a> et notre <a href="https://newbi.fr/confidentialite" style="color: #9ca3af; text-decoration: underline;">Politique de confidentialité</a>.
          </p>
        </div>
        
        <!-- Avertissement sécurité -->
        <div style="margin-top: 24px; padding: 16px; background-color: #fafafa; border-radius: 6px;">
          <p style="font-size: 11px; color: #6b7280; margin: 0; line-height: 1.7; text-align: left;">
            Si vous n'avez pas tenté de vous connecter, ignorez cet e-mail. Ne partagez jamais ce code avec quiconque. Notre équipe ne vous le demandera jamais. Ce code expire dans <strong>10 minutes</strong>.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 32px; text-align: center;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0;">
            SWEILY (SAS) • 229 rue Saint-Honoré, 75001 Paris
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
