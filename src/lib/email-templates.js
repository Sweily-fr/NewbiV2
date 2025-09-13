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
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px;">
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
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            Ce lien expire dans 24 heures. Si vous n'avez pas demandé cette réactivation, ignorez cet e-mail.
          </p>
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
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px;">
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
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px;">
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
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail.
          </p>
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
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px;">
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
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            Ce lien expire dans 1 heure. Si vous n'avez pas créé de compte, ignorez cet e-mail.
          </p>
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
          <img src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png" alt="Newbi" style="height: 100px;">
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
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            Si vous ne souhaitez pas rejoindre cette organisation, vous pouvez ignorer cet e-mail en toute sécurité.
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `,
};
