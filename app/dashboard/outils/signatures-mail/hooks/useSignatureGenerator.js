/**
 * Hook personnalisé pour la génération de signatures HTML
 */

import { useSignature } from '../contexts/SignatureContext';

export function useSignatureGenerator() {
  const signature = useSignature();

  // Générer le HTML de la signature
  const generateHTML = () => {
    const { personalInfo, companyInfo, socialNetworks, appearance } = signature;
    
    const socialIcons = {
      linkedin: '🔗',
      facebook: '📘',
      instagram: '📷',
      twitter: '🐦',
    };

    const socialLinksHTML = socialNetworks.showSocialIcons 
      ? Object.entries(socialNetworks)
          .filter(([key, value]) => key !== 'showSocialIcons' && value)
          .map(([platform, url]) => `
            <a href="${url}" style="text-decoration: none; margin-right: 8px; color: ${appearance.primaryColor};">
              ${socialIcons[platform] || '🌐'}
            </a>
          `).join('')
      : '';

    const profileImageHTML = personalInfo.profileImage 
      ? `<img src="${personalInfo.profileImage}" alt="Profile" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-right: 16px;" />`
      : '';

    const logoHTML = companyInfo.logo 
      ? `<img src="${companyInfo.logo}" alt="Company Logo" style="max-width: 120px; max-height: 60px; object-fit: contain;" />`
      : '';

    const isHorizontal = appearance.layout === 'horizontal';

    if (isHorizontal) {
      // Structure horizontale
      return `
        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 500px; font-family: Arial, sans-serif;">
          <tbody>
            <tr>
              ${profileImageHTML ? `<td style="width: 80px; padding-right: 16px; vertical-align: top;">${profileImageHTML}</td>` : ''}
              <td style="vertical-align: top;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; table-layout: auto; width: auto;">
                  <tbody>
                    <tr>
                      <td colspan="2" style="text-align: left; padding-bottom: 2px;">
                        <span style="font-size: 16px; font-weight: bold; color: ${appearance.primaryColor}; line-height: 1.2;">
                          ${personalInfo.firstName} ${personalInfo.lastName}
                        </span>
                      </td>
                    </tr>
                    ${personalInfo.position ? `
                      <tr>
                        <td colspan="2" style="padding-bottom: 8px;">
                          <span style="font-size: 14px; color: rgb(102,102,102);">${personalInfo.position}</span>
                        </td>
                      </tr>
                    ` : ''}
                    ${personalInfo.phone ? `
                      <tr>
                        <td style="padding-bottom: 4px; padding-right: 10px; vertical-align: top; width: 20px;">
                          <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="16" height="16" style="width: 16px; height: 16px; display: block; margin-top: 2px; min-width: 16px;" />
                        </td>
                        <td style="font-size: 12px; color: rgb(102,102,102); vertical-align: top; padding-bottom: 4px;">
                          <a href="tel:${personalInfo.phone}" style="color: rgb(102,102,102); text-decoration: none;">${personalInfo.phone}</a>
                        </td>
                      </tr>
                    ` : ''}
                    ${personalInfo.email ? `
                      <tr>
                        <td style="padding-bottom: 4px; padding-right: 10px; vertical-align: top; width: 20px;">
                          <img src="https://cdn-icons-png.flaticon.com/512/542/542689.png" alt="Email" width="16" height="16" style="width: 16px; height: 16px; display: block; margin-top: 2px; min-width: 16px;" />
                        </td>
                        <td style="font-size: 12px; color: rgb(102,102,102); vertical-align: top; padding-bottom: 4px;">
                          <a href="mailto:${personalInfo.email}" style="color: rgb(102,102,102); text-decoration: none;">${personalInfo.email}</a>
                        </td>
                      </tr>
                    ` : ''}
                    ${companyInfo.website ? `
                      <tr>
                        <td style="padding-bottom: 4px; padding-right: 10px; vertical-align: top; width: 20px;">
                          <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Site web" width="16" height="16" style="width: 16px; height: 16px; display: block; margin-top: 2px; min-width: 16px;" />
                        </td>
                        <td style="font-size: 12px; color: rgb(102,102,102); vertical-align: top; padding-bottom: 4px;">
                          <a href="${companyInfo.website}" style="color: rgb(102,102,102); text-decoration: none;">${companyInfo.website}</a>
                        </td>
                      </tr>
                    ` : ''}
                    <tr>
                      <td colspan="2" style="padding-top: 8px; padding-bottom: 4px;">
                        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 0; width: 100%;" />
                      </td>
                    </tr>
                    ${companyInfo.companyName ? `
                      <tr>
                        <td colspan="2" style="padding-top: 4px;">
                          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                ${logoHTML ? `<td style="padding-top: 12px; padding-right: 12px; padding-bottom: 4px; vertical-align: middle;">${logoHTML}</td>` : ''}
                                <td style="font-size: 14px; font-weight: bold; color: ${appearance.primaryColor}; padding-top: 8px; vertical-align: middle;">
                                  ${companyInfo.companyName}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ` : ''}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      `;
    } else {
      // Structure verticale avec séparateur
      return `
        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 500px; font-family: Arial, sans-serif;">
          <tbody>
            <tr>
              <!-- Colonne de gauche : Informations personnelles -->
              <td style="width: 200px; padding-right: 15px; vertical-align: top;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
                  <tbody>
                    ${profileImageHTML ? `
                      <tr>
                        <td style="padding-bottom: 12px; text-align: left;">
                          ${profileImageHTML}
                        </td>
                      </tr>
                    ` : ''}
                    <tr>
                      <td style="padding-bottom: 8px; text-align: left;">
                        <div style="font-size: 16px; font-weight: bold; color: ${appearance.primaryColor}; line-height: 1.2;">
                          ${personalInfo.firstName} ${personalInfo.lastName}
                        </div>
                      </td>
                    </tr>
                    ${personalInfo.position ? `
                      <tr>
                        <td style="padding-bottom: 8px; text-align: left;">
                          <div style="font-size: 14px; color: rgb(102,102,102);">
                            ${personalInfo.position}
                          </div>
                        </td>
                      </tr>
                    ` : ''}
                    ${companyInfo.companyName ? `
                      <tr>
                        <td style="padding-bottom: 8px; text-align: left;">
                          <div style="font-size: 14px; font-weight: bold; color: ${appearance.primaryColor};">
                            ${companyInfo.companyName}
                          </div>
                        </td>
                      </tr>
                    ` : ''}
                  </tbody>
                </table>
              </td>
              
              <!-- Séparateur vertical -->
              <td style="width: 1px; background-color: #e0e0e0; padding: 0; font-size: 1px; line-height: 1px;">
                &nbsp;
              </td>
              
              <!-- Colonne de droite : Informations de contact -->
              <td style="padding-left: 15px; vertical-align: top; width: 200px;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
                  <tbody>
                    ${personalInfo.phone ? `
                      <tr>
                        <td style="padding-bottom: 6px;">
                          <div style="display: flex; align-items: center; font-size: 12px; color: rgb(102,102,102);">
                            <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px;" />
                            <a href="tel:${personalInfo.phone}" style="color: rgb(102,102,102); text-decoration: none;">${personalInfo.phone}</a>
                          </div>
                        </td>
                      </tr>
                    ` : ''}
                    ${personalInfo.email ? `
                      <tr>
                        <td style="padding-bottom: 6px;">
                          <div style="display: flex; align-items: center; font-size: 12px; color: rgb(102,102,102);">
                            <img src="https://cdn-icons-png.flaticon.com/512/542/542689.png" alt="Email" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px;" />
                            <a href="mailto:${personalInfo.email}" style="color: rgb(102,102,102); text-decoration: none;">${personalInfo.email}</a>
                          </div>
                        </td>
                      </tr>
                    ` : ''}
                    ${companyInfo.website ? `
                      <tr>
                        <td style="padding-bottom: 6px;">
                          <div style="display: flex; align-items: center; font-size: 12px; color: rgb(102,102,102);">
                            <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Site web" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px;" />
                            <a href="${companyInfo.website}" style="color: rgb(102,102,102); text-decoration: none;">${companyInfo.website}</a>
                          </div>
                        </td>
                      </tr>
                    ` : ''}
                    ${companyInfo.address ? `
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <div style="display: flex; align-items: flex-start; font-size: 12px; color: rgb(102,102,102);">
                            <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="12" height="12" style="width: 12px; height: 12px; margin-right: 8px; margin-top: 1px;" />
                            <span>${companyInfo.address}${companyInfo.city ? `, ${companyInfo.city}` : ''}${companyInfo.postalCode ? ` ${companyInfo.postalCode}` : ''}</span>
                          </div>
                        </td>
                      </tr>
                    ` : ''}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      `;
    }
  };

  // Générer le CSS pour la prévisualisation
  const generateCSS = () => {
    return `
      .signature-preview {
        font-family: ${signature.appearance.fontFamily};
        font-size: ${signature.appearance.fontSize};
        color: #333;
        line-height: 1.4;
        max-width: 600px;
        padding: 16px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: white;
      }
    `;
  };

  // Copier la signature dans le presse-papiers
  const copyToClipboard = async () => {
    const html = generateHTML();
    try {
      await navigator.clipboard.writeText(html);
      return { success: true, message: 'Signature copiée dans le presse-papiers' };
    } catch (error) {
      return { success: false, message: 'Erreur lors de la copie' };
    }
  };

  // Télécharger la signature en HTML
  const downloadHTML = () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Signature Email - ${signature.personalInfo.firstName} ${signature.personalInfo.lastName}</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          ${generateCSS()}
        </style>
      </head>
      <body>
        <div class="signature-preview">
          ${generateHTML()}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signature-${signature.signatureName || 'email'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Valider si la signature est complète
  const validateSignature = () => {
    const errors = [];
    
    if (!signature.personalInfo.firstName) {
      errors.push('Le prénom est requis');
    }
    
    if (!signature.personalInfo.lastName) {
      errors.push('Le nom est requis');
    }
    
    if (!signature.personalInfo.email) {
      errors.push('L\'email est requis');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  return {
    generateHTML,
    generateCSS,
    copyToClipboard,
    downloadHTML,
    validateSignature,
  };
}
