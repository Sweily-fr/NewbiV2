// Template pour l'invitation d'organisation
export const organizationInvitation = (data, inviteLink) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation à rejoindre ${data.organization.name}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; color: #1a1a1a;">
      <div style="max-width: 600px; margin: 0 auto; padding: 0 20px; background-color: #fff;">
        
        <!-- Logo -->
        <div style="text-align: center; padding: 40px 0 24px 0;">
          <img src="https://pub-866a54f5560d449cb224411e60410621.r2.dev/Logo_Texte_Black.png" alt="Newbi" style="height: 32px; width: auto;">
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
<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
  <tr>
    <!-- Zone image - positionnée en bas à droite -->
    <td style="height: 220px; vertical-align: bottom; text-align: right; padding: 0;">
        <img 
          src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/Capture%20d%E2%80%99e%CC%81cran%202025-08-27%20a%CC%80%2018.18.21.png" 
          alt="Illustration" 
          style="
            display: inline-block;
            width: 85%;
            max-width: 400px;
            height: auto;
            border-radius: 10px 0 0 0;
            border: solid 2px #F2F2F2;
            border-right: none;
            border-bottom: none;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
            margin-right: -1px;
            margin-bottom: -1px;
          " 
        />
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

        
        <!-- Bouton CTA - Style Qonto (noir, border-radius réduit) -->
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 32px 0;">
<tr>
  <td 
    style="
      background-color: #1a1a1a;
      border-radius: 6px;
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
        font-size: 15px;
        font-weight: 500;
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
        
        <!-- Footer - Style Qonto -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 32px; text-align: center; margin-top: 48px;">
          
          <!-- Logo footer -->
          <div style="margin-bottom: 16px;">
            <img src="https://pub-866a54f5560d449cb224411e60410621.r2.dev/Logo_NI_Purple.png" alt="Newbi" style="height: 28px; width: auto;">
          </div>
          
          <!-- Tagline -->
          <p style="font-size: 13px; font-weight: 500; color: #1a1a1a; margin: 0 0 24px 0;">
            Votre gestion, simplifiée.
          </p>
          
          <!-- Note -->
          <p style="font-size: 12px; color: #9ca3af; margin: 0 0 24px 0; line-height: 1.8;">
            Si vous ne souhaitez pas rejoindre cette organisation, vous pouvez ignorer cet e-mail. • <a href="https://newbi.fr/aide" style="color: #9ca3af; text-decoration: underline;">FAQ</a>
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
