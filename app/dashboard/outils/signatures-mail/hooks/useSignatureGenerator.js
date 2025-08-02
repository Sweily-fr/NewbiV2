/**
 * Hook personnalisé pour la génération de signatures HTML
 */

import { useSignatureData } from '@/src/hooks/use-signature-data';

export function useSignatureGenerator() {
  const { signatureData } = useSignatureData();

  // Générer le HTML de la signature
  const generateHTML = () => {
    const profileImageHTML = signatureData.photo 
      ? `<img src="${signatureData.photo}" alt="Profile" style="width: ${signatureData.imageSize || 80}px; height: ${signatureData.imageSize || 80}px; border-radius: ${signatureData.imageShape === 'square' ? '8px' : '50%'}; background: url('${signatureData.photo}') center center / cover no-repeat; display: block;" />`
      : '';

    const logoHTML = signatureData.logo 
      ? `<img src="${signatureData.logo}" alt="Logo entreprise" style="max-width: ${signatureData.logoSize || 60}px; height: auto; display: block; margin: 0 auto;" />`
      : '';

    const isHorizontal = signatureData.layout === 'horizontal';

    if (isHorizontal) {
      // Structure horizontale
      return `
        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 500px; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
          <tbody>
            <tr>
              ${profileImageHTML ? `<td style="width: ${signatureData.imageSize || 80}px; padding-right: 16px; vertical-align: top;">${profileImageHTML}</td>` : ''}
              <td style="vertical-align: top;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; table-layout: auto; width: auto;">
                  <tbody>
                    <tr>
                      <td colspan="2" style="text-align: ${signatureData.nameAlignment || 'left'}; padding-bottom: 2px;">
                        <span style="font-size: ${signatureData.fontSize?.name || 16}px; font-weight: bold; color: ${signatureData.colors?.name || signatureData.primaryColor || '#2563eb'}; line-height: 1.2; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                          ${signatureData.firstName} ${signatureData.lastName}
                        </span>
                      </td>
                    </tr>
                    ${signatureData.position ? `
                      <tr>
                        <td colspan="2" style="padding-bottom: 8px;">
                          <span style="font-size: ${signatureData.fontSize?.position || 14}px; color: ${signatureData.colors?.position || 'rgb(102,102,102)'}; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">${signatureData.position}</span>
                        </td>
                      </tr>
                    ` : ''}
                    ${signatureData.phone ? `
                      <tr>
                        <td style="padding-bottom: 4px; padding-right: 10px; vertical-align: top; width: 20px;">
                          <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block; margin-top: 2px; min-width: 16px;" />
                        </td>
                        <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; vertical-align: top; padding-bottom: 4px; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                          <a href="tel:${signatureData.phone}" style="color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; text-decoration: none;">${signatureData.phone}</a>
                        </td>
                      </tr>
                    ` : ''}
                    ${signatureData.email ? `
                      <tr>
                        <td style="padding-bottom: 4px; padding-right: 10px; vertical-align: top; width: 20px;">
                          <img src="https://cdn-icons-png.flaticon.com/512/542/542689.png" alt="Email" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block; margin-top: 2px; min-width: 16px;" />
                        </td>
                        <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; vertical-align: top; padding-bottom: 4px; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                          <a href="mailto:${signatureData.email}" style="color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; text-decoration: none;">${signatureData.email}</a>
                        </td>
                      </tr>
                    ` : ''}
                    ${signatureData.website ? `
                      <tr>
                        <td style="padding-bottom: 4px; padding-right: 10px; vertical-align: top; width: 20px;">
                          <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Site web" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block; margin-top: 2px; min-width: 16px;" />
                        </td>
                        <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; vertical-align: top; padding-bottom: 4px; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                          <a href="${signatureData.website}" style="color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; text-decoration: none;">${signatureData.website}</a>
                        </td>
                      </tr>
                    ` : ''}
                    ${signatureData.address ? `
                      <tr>
                        <td style="padding-bottom: 4px; padding-right: 10px; vertical-align: top; width: 20px;">
                          <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block; margin-top: 2px; min-width: 16px;" />
                        </td>
                        <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; vertical-align: top; padding-bottom: 4px; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                          ${signatureData.address}
                        </td>
                      </tr>
                    ` : ''}
                    <tr>
                      <td colspan="2" style="padding-top: ${signatureData.spacings?.separatorTop || 12}px; padding-bottom: ${signatureData.spacings?.separatorBottom || 12}px;">
                        <hr style="border: none; border-top: ${signatureData.separatorHorizontalWidth || 1}px solid ${signatureData.colors?.separatorHorizontal || '#e0e0e0'}; margin: 0; width: 100%;" />
                      </td>
                    </tr>
                    ${logoHTML ? `
                      <tr>
                        <td colspan="2" style="padding-top: ${signatureData.spacings?.separatorBottom || 12}px; text-align: center;">
                          ${logoHTML}
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
        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 500px; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
          <tbody>
            <tr>
              <!-- Colonne de gauche : Informations personnelles -->
              <td style="width: 200px; padding-right: 15px; vertical-align: top;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
                  <tbody>
                    ${profileImageHTML ? `
                      <tr>
                        <td style="padding-bottom: ${signatureData.spacings?.photoBottom || 12}px; text-align: ${signatureData.nameAlignment || 'left'};">
                          ${profileImageHTML}
                        </td>
                      </tr>
                    ` : ''}
                    <tr>
                      <td style="padding-bottom: ${signatureData.spacings?.nameBottom || 8}px; text-align: ${signatureData.nameAlignment || 'left'};">
                        <div style="font-size: ${signatureData.fontSize?.name || 16}px; font-weight: bold; color: ${signatureData.colors?.name || signatureData.primaryColor || '#2563eb'}; line-height: 1.2; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                          ${signatureData.firstName} ${signatureData.lastName}
                        </div>
                      </td>
                    </tr>
                    ${signatureData.position ? `
                      <tr>
                        <td style="padding-bottom: ${signatureData.spacings?.positionBottom || 8}px; text-align: ${signatureData.nameAlignment || 'left'};">
                          <div style="font-size: ${signatureData.fontSize?.position || 14}px; color: ${signatureData.colors?.position || 'rgb(102,102,102)'}; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                            ${signatureData.position}
                          </div>
                        </td>
                      </tr>
                    ` : ''}
                    ${signatureData.companyName ? `
                      <tr>
                        <td style="padding-bottom: 8px; text-align: ${signatureData.nameAlignment || 'left'};">
                          <div style="font-size: ${signatureData.fontSize?.position || 14}px; font-weight: bold; color: ${signatureData.colors?.company || signatureData.primaryColor || '#2563eb'}; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                            ${signatureData.companyName}
                          </div>
                        </td>
                      </tr>
                    ` : ''}
                  </tbody>
                </table>
              </td>
              
              <!-- Séparateur vertical -->
              <td style="width: ${signatureData.separatorVerticalWidth || 1}px; background-color: ${signatureData.colors?.separatorVertical || '#e0e0e0'}; padding: 0; font-size: 1px; line-height: 1px;">
                &nbsp;
              </td>
              
              <!-- Colonne de droite : Informations de contact -->
              <td style="padding-left: 15px; vertical-align: top; width: 200px;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
                  <tbody>
                    ${signatureData.phone ? `
                      <tr>
                        <td style="padding-bottom: ${signatureData.spacings?.contactBottom || 6}px;">
                          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="padding-right: 8px; vertical-align: middle; width: 12px;">
                                  <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="12" height="12" style="width: 12px !important; height: 12px !important; display: block;" />
                                </td>
                                <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; vertical-align: middle; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                                  <a href="tel:${signatureData.phone}" style="color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; text-decoration: none;">${signatureData.phone}</a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ` : ''}
                    ${signatureData.mobile ? `
                      <tr>
                        <td style="padding-bottom: ${signatureData.spacings?.contactBottom || 6}px;">
                          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="padding-right: 8px; vertical-align: middle; width: 12px;">
                                  <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Mobile" width="12" height="12" style="width: 12px !important; height: 12px !important; display: block;" />
                                </td>
                                <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; vertical-align: middle; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                                  <a href="tel:${signatureData.mobile}" style="color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; text-decoration: none;">${signatureData.mobile}</a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ` : ''}
                    ${signatureData.email ? `
                      <tr>
                        <td style="padding-bottom: ${signatureData.spacings?.contactBottom || 6}px;">
                          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="padding-right: 8px; vertical-align: middle; width: 12px;">
                                  <img src="https://cdn-icons-png.flaticon.com/512/542/542689.png" alt="Email" width="12" height="12" style="width: 12px !important; height: 12px !important; display: block;" />
                                </td>
                                <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; vertical-align: middle; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                                  <a href="mailto:${signatureData.email}" style="color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; text-decoration: none;">${signatureData.email}</a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ` : ''}
                    ${signatureData.website ? `
                      <tr>
                        <td style="padding-bottom: ${signatureData.spacings?.contactBottom || 6}px;">
                          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="padding-right: 8px; vertical-align: middle; width: 12px;">
                                  <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Site web" width="12" height="12" style="width: 12px !important; height: 12px !important; display: block;" />
                                </td>
                                <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; vertical-align: middle; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                                  <a href="${signatureData.website}" style="color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; text-decoration: none;">${signatureData.website}</a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ` : ''}
                    ${signatureData.address ? `
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="padding-right: 8px; vertical-align: top; width: 12px;">
                                  <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="12" height="12" style="width: 12px !important; height: 12px !important; display: block; margin-top: 1px;" />
                                </td>
                                <td style="font-size: ${signatureData.fontSize?.contact || 12}px; color: ${signatureData.colors?.contact || 'rgb(102,102,102)'}; vertical-align: top; font-family: ${signatureData.fontFamily || 'Arial, sans-serif'};">
                                  ${signatureData.address}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ` : ''}
                    
                    <!-- Séparateur horizontal après tous les contacts -->
                    <tr>
                      <td style="padding-top: ${signatureData.spacings?.separatorTop || 12}px; padding-bottom: ${signatureData.spacings?.separatorBottom || 12}px;">
                        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
                          <tbody>
                            <tr>
                              <td style="border-top: ${signatureData.separatorHorizontalWidth || 1}px solid ${signatureData.colors?.separatorHorizontal || '#e0e0e0'}; line-height: 1px; font-size: 1px;">&nbsp;</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Logo entreprise après le séparateur -->
                    ${logoHTML ? `
                      <tr>
                        <td style="padding-top: ${signatureData.spacings?.separatorBottom || 12}px; text-align: center;">
                          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0 auto;">
                            <tbody>
                              <tr>
                                <td style="text-align: center;">
                                  ${logoHTML}
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
