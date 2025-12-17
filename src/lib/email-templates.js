// Templates d'emails pour l'authentification
export const emailTemplates = {
  // Template pour la réactivation de compte
  reactivation: (reactivationUrl) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Réactivez votre compte</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
      <div style="max-width: 500px; margin: 0 auto;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px; width: 100px;">
        </div>
        
        <!-- Titre principal -->
        <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: center;">
          Réactivez votre compte
        </h1>
        
        <!-- Message principal -->
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: center;">
          Votre compte a été désactivé. Cliquez sur le bouton ci-dessous pour le réactiver et retrouver l'accès à vos données.
        </p>
        
        <!-- Bouton CTA -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${reactivationUrl}" style="display: inline-block; background-color: #5B4FFF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">
            Réactiver mon compte
          </a>
        </div>
        
        <!-- Lien de secours -->
        <p style="font-size: 11px; line-height: 1.4; color: #9ca3af; margin: 32px 0 0 0; text-align: center;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
          <span style="color: #5B4FFF; word-break: break-all;">${reactivationUrl}</span>
        </p>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0 0 20px 0; text-align: center;">
            Ce lien expire dans 24 heures. Si vous n'avez pas demandé cette réactivation, ignorez cet e-mail.
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
  `,

  // Template pour le code 2FA
  twoFactor: (otp) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Code de vérification 2FA</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
      <div style="max-width: 500px; margin: 0 auto;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px; width: 100px;">
        </div>
        
        <!-- Titre principal -->
        <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: center;">
          Code de vérification 2FA
        </h1>
        
        <!-- Message principal -->
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: center;">
          Voici votre code de vérification à usage unique pour l'authentification à deux facteurs :
        </p>
        
        <!-- Code OTP -->
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px 40px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1f2937;">
            ${otp}
          </div>
        </div>
        
        <!-- Instructions -->
        <p style="font-size: 14px; line-height: 1.4; color: #6b7280; margin: 32px 0 0 0; text-align: center;">
          Ce code expire dans 10 minutes. Si vous n'avez pas demandé cette vérification, ignorez cet e-mail.
        </p>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0 0 20px 0; text-align: center;">
            Ce code expire dans 10 minutes. Si vous n'avez pas demandé cette vérification, ignorez cet e-mail.
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
  `,

  // Template pour la réinitialisation de mot de passe
  resetPassword: (url) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Réinitialisez votre mot de passe</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
      <div style="max-width: 500px; margin: 0 auto;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px; width: 100px;">
        </div>
        
        <!-- Titre principal -->
        <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: center;">
          Réinitialisez votre mot de passe
        </h1>
        
        <!-- Message principal -->
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: center;">
          Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe pour votre compte Newbi.
        </p>
        
        <!-- Bouton CTA -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${url}" style="display: inline-block; background-color: #5B4FFF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        
        <!-- Lien de secours -->
        <p style="font-size: 11px; line-height: 1.4; color: #9ca3af; margin: 32px 0 0 0; text-align: center;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
          <span style="color: #5B4FFF; word-break: break-all;">${url}</span>
        </p>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0 0 20px 0; text-align: center;">
            Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail.
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
  `,

  // Template pour la vérification d'email
  emailVerification: (url) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vérifiez votre adresse e-mail</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
      <div style="max-width: 500px; margin: 0 auto;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px; width: 100px;">
        </div>
        
        <!-- Titre principal -->
        <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: center;">
          Vérifiez votre adresse e-mail
        </h1>
        
        <!-- Message principal -->
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: center;">
          Cliquez sur le bouton ci-dessous pour vérifier votre adresse e-mail et finaliser votre inscription sur Newbi.
        </p>
        
        <!-- Bouton CTA -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${url}" style="display: inline-block; background-color: #5B4FFF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">
            Vérifier mon e-mail
          </a>
        </div>
        
        <!-- Lien de secours -->
        <p style="font-size: 11px; line-height: 1.4; color: #9ca3af; margin: 32px 0 0 0; text-align: center;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
          <span style="color: #5B4FFF; word-break: break-all;">${url}</span>
        </p>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0 0 20px 0; text-align: center;">
            Ce lien expire dans 1 heure. Si vous n'avez pas créé de compte, ignorez cet e-mail.
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
  `,

  // Template pour l'invitation d'organisation
  organizationInvitation: (data, inviteLink) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation à rejoindre ${data.organization.name}</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
      <div style="max-width: 500px; margin: 0 auto;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px; width: 100px;">
        </div>
        
        <!-- Titre principal -->
        <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: start;">
          ${data.inviter.user.name || data.inviter.user.email} vous a invité·e à travailler dans ${data.organization.name}
        </h1>
        
        <!-- Message principal -->
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: start;">
          Rejoignez ${data.inviter.user.name || data.inviter.user.email} pour
          créer devis/factures, gérer la trésorerie et piloter vos projets.
        </p>
        
        <!-- Illustration de l'interface -->
       <div style="margin: 32px 0; background-color: #fafafa; border-radius: 12px; border: 1px solid #F2F2F2; overflow: hidden;">
<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; height: 350px; border-collapse: collapse;">
  <tr>
    <!-- Zone principale avec l'image -->
    <td style="height: 290px; vertical-align: top; position: relative; padding: 0;">
      <div style="width: 100%; height: 290px; position: relative; overflow: hidden;">
        <img 
          src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/Capture%20d%E2%80%99e%CC%81cran%202025-08-27%20a%CC%80%2018.18.21.png" 
          alt="Illustration" 
          style="
            float: right;
            margin-top: 50px;
            margin-right: -10px;
            width: 430px;
            height: 240px;
            border-radius: 10px;
            border: solid 2px #F2F2F2;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
          " 
        />
      </div>
    </td>
  </tr>
  <tr>
    <!-- Footer fixé en bas -->
    <td style="height: 60px; vertical-align: bottom; padding: 0;">
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="border-top: solid 1px #F2F2F2; padding: 16px; background-color: #ffffff;">
            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="vertical-align: middle;">
                  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                    <tr>
                      <td style="vertical-align: middle; padding-right: 12px;">
                        <div style="
                          width: 28px;
                          height: 28px;
                          background-color: #fafafa;
                          border-radius: 6px;
                          text-align: center;
                          line-height: 28px;
                          color: #1f2937;
                          font-weight: 600;
                          font-size: 12px;
                        ">N</div>
                      </td>
                      <td style="vertical-align: middle;">
                        <div style="font-size: 14px; font-weight: 500; color: #454545; padding-bottom: 4px;">
                          ${data.organization.name}
                        </div>
                        <div style="font-size: 12px; color: #B0B0B0;">
                          Espace de travail • 5 Membres
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="text-align: right; vertical-align: middle;">
                  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                    <tr>
                      <td style="padding: 0 2px;">
                        <div style="
                          width: 24px;
                          height: 24px;
                          background-color: #fafafa;
                          border-radius: 50%;
                          text-align: center;
                          line-height: 24px;
                          color: #6b7280;
                          font-size: 10px;
                          font-weight: 600;
                        ">J</div>
                      </td>
                      <td style="padding: 0 2px;">
                        <div style="
                          width: 24px;
                          height: 24px;
                          background-color: #fafafa;
                          border-radius: 50%;
                          text-align: center;
                          line-height: 24px;
                          color: #6b7280;
                          font-size: 10px;
                          font-weight: 600;
                        ">D</div>
                      </td>
                      <td style="padding: 0 2px;">
                        <div style="
                          width: 24px;
                          height: 24px;
                          background-color: #fafafa;
                          border-radius: 50%;
                          text-align: center;
                          line-height: 24px;
                          color: #6b7280;
                          font-size: 10px;
                          font-weight: 600;
                        ">H</div>
                      </td>
                      <td style="padding: 0 2px;">
                        <div style="
                          width: 24px;
                          height: 24px;
                          background-color: #fafafa;
                          border-radius: 50%;
                          text-align: center;
                          line-height: 24px;
                          color: #6b7280;
                          font-size: 10px;
                          font-weight: 600;
                        ">A</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</div>

        
        <!-- Bouton CTA -->
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 32px 0;">
<tr>
  <td 
    style="
      background-color: #5b4fff;
      border-radius: 8px;
      padding: 0;
    "
  >
    <a 
      href="${inviteLink}" 
      style="
        display: block;
        width: 100%;
        box-sizing: border-box;
        color: white;
        text-decoration: none;
        padding: 16px;
        text-align: center;
        font-size: 16px;
        font-weight: 600;
        line-height: 1.4;
      "
    >
      Accepter l'invitation
    </a>
  </td>
</tr>
</table>
        
        <!-- Lien de secours -->
        <p style="font-size: 11px; line-height: 1.4; color: #9ca3af; margin: 32px 0 0 0; text-align: center;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
          <span style="color: #5B4FFF; word-break: break-all;">${inviteLink}</span>
        </p>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0 0 20px 0; text-align: center;">
            Si vous ne souhaitez pas rejoindre cette organisation, vous pouvez ignorer cet e-mail en toute sécurité.
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
  `,

  // Template pour notifier l'owner qu'un membre a rejoint
  memberJoinedNotificationOwner: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nouveau membre dans ${data.organization.name}</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
      <div style="max-width: 500px; margin: 0 auto;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px; width: 100px;">
        </div>
        
        <!-- Titre principal -->
        <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: start;">
          ${data.member.user.name || data.member.user.email} a rejoint ${data.organization.name}
        </h1>
        
        <!-- Message principal -->
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: start;">
          Bonne nouvelle ! ${data.member.user.name || data.member.user.email} a accepté l'invitation et fait maintenant partie de votre équipe.
        </p>
        
        <!-- Illustration de l'interface -->
        <div style="margin: 32px 0; background-color: #fafafa; border-radius: 12px; border: 1px solid #F2F2F2; overflow: hidden;">
          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; height: 350px; border-collapse: collapse;">
            <tr>
              <!-- Zone principale avec l'image -->
              <td style="height: 290px; vertical-align: top; position: relative; padding: 0;">
                <div style="width: 100%; height: 290px; position: relative; overflow: hidden;">
                  <img 
                    src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/Capture%20d%E2%80%99e%CC%81cran%202025-08-27%20a%CC%80%2018.18.21.png" 
                    alt="Illustration" 
                    style="
                      float: right;
                      margin-top: 50px;
                      margin-right: -10px;
                      width: 430px;
                      height: 240px;
                      border-radius: 10px;
                      border: solid 2px #F2F2F2;
                      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
                    " 
                  />
                </div>
              </td>
            </tr>
            <tr>
              <!-- Footer fixé en bas -->
              <td style="height: 60px; vertical-align: bottom; padding: 0;">
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="border-top: solid 1px #F2F2F2; padding: 16px; background-color: #ffffff;">
                      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="vertical-align: middle;">
                            <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                              <tr>
                                <td style="vertical-align: middle; padding-right: 12px;">
                                  <div style="
                                    width: 28px;
                                    height: 28px;
                                    border-radius: 50%;
                                    background-color: #5B4FFF;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: white;
                                    font-weight: 600;
                                    font-size: 14px;
                                  ">
                                    ${(data.member.user.name || data.member.user.email).charAt(0).toUpperCase()}
                                  </div>
                                </td>
                                <td style="vertical-align: middle;">
                                  <div style="font-size: 14px; font-weight: 500; color: #1f2937;">
                                    ${data.member.user.name || data.member.user.email}
                                  </div>
                                  <div style="font-size: 12px; color: #6b7280;">
                                    ${data.member.role === "admin" ? "Administrateur" : "Membre"}
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td style="text-align: right; vertical-align: middle;">
                            <span style="
                              display: inline-block;
                              padding: 4px 12px;
                              background-color: #dcfce7;
                              color: #166534;
                              border-radius: 6px;
                              font-size: 12px;
                              font-weight: 500;
                            ">
                              Nouveau membre
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0 0 20px 0; text-align: center;">
            Vous pouvez gérer les membres de votre organisation depuis les paramètres.
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
  `,

  // Template pour confirmer au nouveau membre qu'il a rejoint l'organisation
  memberJoinedConfirmation: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenue dans ${data.organization.name}</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
      <div style="max-width: 500px; margin: 0 auto;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px; width: 100px;">
        </div>
        
        <!-- Titre principal -->
        <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: start;">
          Bienvenue dans ${data.organization.name}
        </h1>
        
        <!-- Message principal -->
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: start;">
          Vous avez rejoint avec succès l'organisation <strong>${data.organization.name}</strong>. Vous pouvez maintenant collaborer avec votre équipe et accéder à tous les outils.
        </p>
        
        <!-- Illustration de l'interface -->
        <div style="margin: 32px 0; background-color: #fafafa; border-radius: 12px; border: 1px solid #F2F2F2; overflow: hidden;">
          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; height: 350px; border-collapse: collapse;">
            <tr>
              <!-- Zone principale avec l'image -->
              <td style="height: 290px; vertical-align: top; position: relative; padding: 0;">
                <div style="width: 100%; height: 290px; position: relative; overflow: hidden;">
                  <img 
                    src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/Capture%20d%E2%80%99e%CC%81cran%202025-08-27%20a%CC%80%2018.18.21.png" 
                    alt="Illustration" 
                    style="
                      float: right;
                      margin-top: 50px;
                      margin-right: -10px;
                      width: 430px;
                      height: 240px;
                      border-radius: 10px;
                      border: solid 2px #F2F2F2;
                      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
                    " 
                  />
                </div>
              </td>
            </tr>
            <tr>
              <!-- Footer fixé en bas -->
              <td style="height: 60px; vertical-align: bottom; padding: 0;">
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="border-top: solid 1px #F2F2F2; padding: 16px; background-color: #ffffff;">
                      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="vertical-align: middle;">
                            <div style="font-size: 14px; font-weight: 500; color: #1f2937;">
                              ${data.organization.name}
                            </div>
                            <div style="font-size: 12px; color: #6b7280;">
                              Votre rôle : ${data.member.role === "admin" ? "Administrateur" : "Membre"}
                            </div>
                          </td>
                          <td style="text-align: right; vertical-align: middle;">
                            <span style="
                              display: inline-block;
                              padding: 4px 12px;
                              background-color: #ede9fe;
                              color: #5B4FFF;
                              border-radius: 6px;
                              font-size: 12px;
                              font-weight: 500;
                            ">
                              Membre actif
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0 0 20px 0; text-align: center;">
            Vous pouvez maintenant créer des devis, factures et gérer vos projets avec votre équipe.
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
  `,

  // Template pour notifier l'inviter qu'un membre a rejoint
  memberJoinedNotificationInviter: (data) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.member.user.name || data.member.user.email} a accepté votre invitation</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
      <div style="max-width: 500px; margin: 0 auto;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px; width: 100px;">
        </div>
        
        <!-- Titre principal -->
        <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: start;">
          ${data.member.user.name || data.member.user.email} a accepté votre invitation
        </h1>
        
        <!-- Message principal -->
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: start;">
          Super ! ${data.member.user.name || data.member.user.email} a rejoint ${data.organization.name} et peut maintenant collaborer avec vous.
        </p>
        
        <!-- Illustration de l'interface -->
        <div style="margin: 32px 0; background-color: #fafafa; border-radius: 12px; border: 1px solid #F2F2F2; overflow: hidden;">
          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; height: 350px; border-collapse: collapse;">
            <tr>
              <!-- Zone principale avec l'image -->
              <td style="height: 290px; vertical-align: top; position: relative; padding: 0;">
                <div style="width: 100%; height: 290px; position: relative; overflow: hidden;">
                  <img 
                    src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/Capture%20d%E2%80%99e%CC%81cran%202025-08-27%20a%CC%80%2018.18.21.png" 
                    alt="Illustration" 
                    style="
                      float: right;
                      margin-top: 50px;
                      margin-right: -10px;
                      width: 430px;
                      height: 240px;
                      border-radius: 10px;
                      border: solid 2px #F2F2F2;
                      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
                    " 
                  />
                </div>
              </td>
            </tr>
            <tr>
              <!-- Footer fixé en bas -->
              <td style="height: 60px; vertical-align: bottom; padding: 0;">
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="border-top: solid 1px #F2F2F2; padding: 16px; background-color: #ffffff;">
                      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="vertical-align: middle;">
                            <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                              <tr>
                                <td style="vertical-align: middle; padding-right: 12px;">
                                  <div style="
                                    width: 28px;
                                    height: 28px;
                                    border-radius: 50%;
                                    background-color: #5B4FFF;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: white;
                                    font-weight: 600;
                                    font-size: 14px;
                                  ">
                                    ${(data.member.user.name || data.member.user.email).charAt(0).toUpperCase()}
                                  </div>
                                </td>
                                <td style="vertical-align: middle;">
                                  <div style="font-size: 14px; font-weight: 500; color: #1f2937;">
                                    ${data.member.user.name || data.member.user.email}
                                  </div>
                                  <div style="font-size: 12px; color: #6b7280;">
                                    ${data.member.user.email}
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td style="text-align: right; vertical-align: middle;">
                            <span style="
                              display: inline-block;
                              padding: 4px 12px;
                              background-color: #dcfce7;
                              color: #166534;
                              border-radius: 6px;
                              font-size: 12px;
                              font-weight: 500;
                            ">
                              Acceptée
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0 0 20px 0; text-align: center;">
            Vous pouvez maintenant travailler ensemble sur vos projets.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="text-align: left; vertical-align: middle;">
                <img src="https://pub-866a54f5560d449cb224411e60410621.r2.dev/Logo_NI_Purple.png" alt="Newbi" style="height: 24px; width: auto;">
              </td>
              <td style="text-align: right; vertical-align: middle;">
                <a href="https://www.instagram.com/newbi_fr?igsh=OXhuZHRtY3M5bW83" target="_blank" style="text-decoration: none;">
                  <img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/instagram/instagram-black.png" alt="Instagram" style="height: 24px; width: 24px; filter: brightness(0);">
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
  `,

  // Template pour paiement échoué
  paymentFailed: ({ customerName, amount, invoiceUrl, updatePaymentUrl }) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Échec du paiement</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
      <div style="max-width: 500px; margin: 0 auto;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px; width: 100px;">
        </div>
        
        <!-- Titre principal -->
        <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: center;">
          Échec du paiement
        </h1>
        
        <!-- Message principal -->
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: center;">
          Nous n'avons pas pu traiter votre paiement de <strong style="color: #1f2937;">${amount}</strong> pour votre abonnement.
        </p>
        
        <!-- Bouton CTA -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${updatePaymentUrl}" style="display: inline-block; background-color: #5B4FFF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">
            Mettre à jour mon moyen de paiement
          </a>
        </div>
        
        ${
          invoiceUrl
            ? `
        <!-- Lien facture -->
        <p style="font-size: 14px; line-height: 1.5; color: #6b7280; margin: 24px 0; text-align: center;">
          <a href="${invoiceUrl}" style="color: #5B4FFF; text-decoration: none;">Consulter la facture</a>
        </p>
        `
            : ""
        }
        
        <!-- Informations -->
        <p style="font-size: 14px; line-height: 1.5; color: #6b7280; margin: 32px 0 0 0;">
          Veuillez mettre à jour votre moyen de paiement dans les prochains jours pour éviter toute interruption de service.
        </p>
        
        <p style="font-size: 14px; line-height: 1.5; color: #6b7280; margin: 16px 0 0 0;">
          Les raisons courantes d'échec de paiement incluent : fonds insuffisants, carte bancaire expirée, limite de paiement atteinte ou problème technique avec votre banque.
        </p>
        
        <!-- Lien de secours -->
        <p style="font-size: 11px; line-height: 1.4; color: #9ca3af; margin: 32px 0 0 0; text-align: center;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
          <span style="color: #5B4FFF; word-break: break-all;">${updatePaymentUrl}</span>
        </p>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0 0 20px 0; text-align: center;">
            Cet email concerne votre abonnement Newbi. Si vous pensez qu'il s'agit d'une erreur, contactez-nous immédiatement.
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
  `,

  // Template pour changement d'abonnement
  subscriptionChanged: ({
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
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
      <div style="max-width: 500px; margin: 0 auto;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px; width: 100px;">
        </div>
        
        <!-- Titre principal -->
        <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: center;">
          Changement d'abonnement confirmé
        </h1>
        
        <!-- Message principal -->
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: center;">
          Votre abonnement a été modifié du plan <strong style="color: #1f2937;">${oldPlan}</strong> vers le plan <strong style="color: #5B4FFF;">${newPlan}</strong>.
        </p>
        
        <!-- Informations -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Nouveau plan :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #1f2937; font-weight: 600; text-align: right;">
                ${newPlan}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Tarif :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #5B4FFF; font-weight: 600; text-align: right;">
                ${newPrice}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Date d'effet :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #1f2937; text-align: right;">
                ${effectiveDate}
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Bouton CTA -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://app.newbi.fr"}/dashboard" style="display: inline-block; background-color: #5B4FFF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">
            Accéder à mon espace
          </a>
        </div>
        
        <!-- Note -->
        <p style="font-size: 14px; line-height: 1.5; color: #6b7280; margin: 24px 0 0 0;">
          ${
            isUpgrade
              ? "Le montant de votre prochaine facture a été ajusté au prorata. Vous ne payez que pour ce que vous utilisez."
              : "Le montant de votre prochaine facture a été ajusté. Un crédit au prorata vous sera appliqué sur votre prochaine facture."
          }
        </p>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0 0 20px 0; text-align: center;">
            Vous recevez cet email car vous avez modifié votre abonnement Newbi.
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
  `,

  // Template pour nouvel abonnement
  subscriptionCreated: ({
    customerName,
    plan,
    price,
    billingInterval,
    features,
  }) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenue sur Newbi</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
      <div style="max-width: 500px; margin: 0 auto;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px; width: 100px;">
        </div>
        
        <!-- Titre principal -->
        <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: center;">
          Bienvenue sur Newbi
        </h1>
        
        <!-- Message principal -->
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: center;">
          Votre abonnement au plan <strong style="color: #5B4FFF;">${plan}</strong> a été activé avec succès.
        </p>
        
        <!-- Informations d'abonnement -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Plan :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #1f2937; font-weight: 600; text-align: right;">
                ${plan}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Tarif :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #5B4FFF; font-weight: 600; text-align: right;">
                ${price}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Facturation :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #1f2937; text-align: right;">
                ${billingInterval}
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Fonctionnalités incluses -->
        <div style="margin: 32px 0;">
          <h2 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0;">
            Fonctionnalités incluses
          </h2>
          <div style="background-color: #f8fafc; border-left: 3px solid #5B4FFF; padding: 16px; border-radius: 4px;">
            ${features
              .map(
                (feature) => `
              <p style="font-size: 14px; color: #6b7280; margin: 8px 0; line-height: 1.5;">
                <span style="color: #5B4FFF; margin-right: 8px;">•</span>${feature}
              </p>
            `
              )
              .join("")}
          </div>
        </div>
        
        <!-- Bouton CTA -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://app.newbi.fr"}/dashboard" style="display: inline-block; background-color: #5B4FFF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">
            Accéder à mon espace
          </a>
        </div>
        
        <!-- Note -->
        <p style="font-size: 14px; line-height: 1.5; color: #6b7280; margin: 24px 0 0 0; text-align: center;">
          Votre premier paiement a été effectué avec succès. Vous pouvez dès maintenant profiter de toutes les fonctionnalités de votre plan.
        </p>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0 0 20px 0; text-align: center;">
            Vous recevez cet email car vous avez souscrit à un abonnement Newbi.
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
  `,

  // Template pour annulation d'abonnement
  subscriptionCancelled: ({ customerName, plan, endDate }) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Annulation d'abonnement confirmée</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
      <div style="max-width: 500px; margin: 0 auto;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px; width: 100px;">
        </div>
        
        <!-- Titre principal -->
        <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: center;">
          Annulation confirmée
        </h1>
        
        <!-- Message principal -->
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: center;">
          Votre abonnement au plan <strong style="color: #1f2937;">${plan}</strong> a été annulé.
        </p>
        
        <!-- Informations -->
        <div style="background-color: #fef3c7; border: 1px solid #fde68a; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <p style="font-size: 14px; color: #92400e; margin: 0 0 12px 0; font-weight: 600;">
            Accès jusqu'au ${endDate}
          </p>
          <p style="font-size: 14px; color: #78350f; margin: 0; line-height: 1.5;">
            Vous conservez l'accès à toutes les fonctionnalités de votre plan jusqu'à la fin de votre période de facturation actuelle.
          </p>
        </div>
        
        <!-- Ce qui se passe ensuite -->
        <div style="margin: 32px 0;">
          <h2 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0;">
            Ce qui se passe ensuite
          </h2>
          <div style="background-color: #f8fafc; border-left: 3px solid #6b7280; padding: 16px; border-radius: 4px;">
            <p style="font-size: 14px; color: #6b7280; margin: 8px 0; line-height: 1.5;">
              <span style="color: #6b7280; margin-right: 8px;">•</span>Aucun nouveau paiement ne sera effectué
            </p>
            <p style="font-size: 14px; color: #6b7280; margin: 8px 0; line-height: 1.5;">
              <span style="color: #6b7280; margin-right: 8px;">•</span>Vos données seront conservées pendant 30 jours
            </p>
            <p style="font-size: 14px; color: #6b7280; margin: 8px 0; line-height: 1.5;">
              <span style="color: #6b7280; margin-right: 8px;">•</span>Vous pouvez réactiver votre abonnement à tout moment
            </p>
          </div>
        </div>
        
        <!-- Bouton CTA -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://app.newbi.fr"}/dashboard/settings?tab=subscription" style="display: inline-block; background-color: #5B4FFF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">
            Réactiver mon abonnement
          </a>
        </div>
        
        <!-- Note -->
        <p style="font-size: 14px; line-height: 1.5; color: #6b7280; margin: 24px 0 0 0; text-align: center;">
          Nous sommes désolés de vous voir partir. Si vous avez des suggestions pour améliorer Newbi, n'hésitez pas à nous contacter.
        </p>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0 0 20px 0; text-align: center;">
            Vous recevez cet email car vous avez annulé votre abonnement Newbi.
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
  `,

  // Template pour alerte proche de la limite
  seatLimitWarning: ({
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
  `,

  // Template pour ajout de siège additionnel
  additionalSeatAdded: ({
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
          <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://app.newbi.fr"}/dashboard/settings?tab=subscription" style="display: inline-block; background-color: #5B4FFF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">
            Voir mon abonnement
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
  `,

  // Template pour rappel de renouvellement
  renewalReminder: ({ customerName, plan, price, renewalDate, amount }) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rappel de renouvellement</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
      <div style="max-width: 500px; margin: 0 auto;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px; width: 100px;">
        </div>
        
        <!-- Titre principal -->
        <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: center;">
          Renouvellement dans 7 jours
        </h1>
        
        <!-- Message principal -->
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: center;">
          Votre abonnement au plan <strong style="color: #5B4FFF;">${plan}</strong> sera renouvelé automatiquement le <strong style="color: #1f2937;">${renewalDate}</strong>.
        </p>
        
        <!-- Informations -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Plan :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #1f2937; font-weight: 600; text-align: right;">
                ${plan}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Date de renouvellement :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #1f2937; text-align: right;">
                ${renewalDate}
              </td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 12px 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Montant :</td>
              <td style="padding: 12px 0 8px 0; font-size: 16px; color: #5B4FFF; font-weight: 600; text-align: right;">
                ${amount}
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Note -->
        <p style="font-size: 14px; line-height: 1.5; color: #6b7280; margin: 24px 0; text-align: center;">
          Le paiement sera effectué automatiquement avec votre moyen de paiement enregistré. Vous pouvez modifier ou annuler votre abonnement à tout moment.
        </p>
        
        <!-- Bouton CTA -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://app.newbi.fr"}/dashboard/settings?tab=subscription" style="display: inline-block; background-color: #5B4FFF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">
            Gérer mon abonnement
          </a>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0 0 20px 0; text-align: center;">
            Vous recevez cet email car votre abonnement Newbi sera bientôt renouvelé.
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
  `,

  // Template pour paiement réussi
  paymentSucceeded: ({
    customerName,
    plan,
    amount,
    invoiceNumber,
    paymentDate,
    nextRenewalDate,
  }) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Paiement confirmé</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
      <div style="max-width: 500px; margin: 0 auto;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px; width: 100px;">
        </div>
        
        <!-- Icône succès -->
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #10b981; border-radius: 50%; padding: 16px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>
        
        <!-- Titre principal -->
        <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: center;">
          Paiement confirmé
        </h1>
        
        <!-- Message principal -->
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: center;">
          Merci pour votre paiement ! Votre abonnement <strong style="color: #5B4FFF;">${plan}</strong> est actif.
        </p>
        
        <!-- Détails du paiement -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">N° de facture :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #1f2937; text-align: right;">
                ${invoiceNumber}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Date de paiement :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #1f2937; text-align: right;">
                ${paymentDate}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Plan :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #1f2937; font-weight: 600; text-align: right;">
                ${plan}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Prochain renouvellement :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #1f2937; text-align: right;">
                ${nextRenewalDate}
              </td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 12px 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Montant payé :</td>
              <td style="padding: 12px 0 8px 0; font-size: 18px; color: #10b981; font-weight: 600; text-align: right;">
                ${amount}
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Bouton CTA -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://app.newbi.fr"}/dashboard" style="display: inline-block; background-color: #5B4FFF; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">
            Accéder à mon espace
          </a>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0 0 20px 0; text-align: center;">
            Vous recevez cet email suite à votre paiement sur Newbi.
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
  `,

  // Template pour échec de paiement
  paymentFailed: ({ customerName, plan, amount, failureReason, retryDate }) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Échec de paiement</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1f2937;">
      <div style="max-width: 500px; margin: 0 auto;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px; width: 100px;">
        </div>
        
        <!-- Icône erreur -->
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #ef4444; border-radius: 50%; padding: 16px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        </div>
        
        <!-- Titre principal -->
        <h1 style="font-size: 24px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; text-align: center;">
          Échec de paiement
        </h1>
        
        <!-- Message principal -->
        <p style="font-size: 16px; line-height: 1.5; color: #6b7280; margin: 0 0 32px 0; text-align: center;">
          Nous n'avons pas pu traiter votre paiement pour l'abonnement <strong style="color: #5B4FFF;">${plan}</strong>.
        </p>
        
        <!-- Détails de l'erreur -->
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Plan :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #1f2937; font-weight: 600; text-align: right;">
                ${plan}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Montant :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #1f2937; text-align: right;">
                ${amount}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Raison :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #ef4444; font-weight: 500; text-align: right;">
                ${failureReason}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Prochaine tentative :</td>
              <td style="padding: 8px 0; font-size: 14px; color: #1f2937; text-align: right;">
                ${retryDate}
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Instructions -->
        <p style="font-size: 14px; line-height: 1.5; color: #6b7280; margin: 24px 0; text-align: center;">
          Veuillez mettre à jour vos informations de paiement pour éviter toute interruption de service.
        </p>
        
        <!-- Bouton CTA -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://app.newbi.fr"}/dashboard/settings?tab=subscription" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">
            Mettre à jour mon paiement
          </a>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0 0 20px 0; text-align: center;">
            Si vous avez des questions, contactez notre support à support@newbi.fr
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
  `,
};
