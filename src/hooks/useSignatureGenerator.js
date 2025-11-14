// /**
//  * Hook personnalisé pour la génération de signatures HTML
//  */

// import { useSignature } from '@/src/contexts/SignatureContext';

// export function useSignatureGenerator() {
//   const signature = useSignature();

//   // Générer le HTML de la signature
//   const generateHTML = () => {
//     const { personalInfo, companyInfo, socialNetworks, appearance } = signature;
    
//     const socialIcons = {
//       linkedin: '🔗',
//       facebook: '📘',
//       instagram: '📷',
//       twitter: '🐦',
//     };

//     const socialLinksHTML = socialNetworks.showSocialIcons 
//       ? Object.entries(socialNetworks)
//           .filter(([key, value]) => key !== 'showSocialIcons' && value)
//           .map(([platform, url]) => `
//             <a href="${url}" style="text-decoration: none; margin-right: 8px; color: ${appearance.primaryColor};">
//               ${socialIcons[platform] || '🌐'}
//             </a>
//           `).join('')
//       : '';

//     const profileImageHTML = personalInfo.profileImage 
//       ? `<img src="${personalInfo.profileImage}" alt="Profile" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-right: 16px;" />`
//       : '';

//     const logoHTML = companyInfo.logo 
//       ? `<img src="${companyInfo.logo}" alt="Company Logo" style="max-width: 120px; max-height: 60px; object-fit: contain;" />`
//       : '';

//     const isHorizontal = appearance.layout === 'horizontal';

//     return `
//       <table cellpadding="0" cellspacing="0" border="0" style="font-family: ${appearance.fontFamily}; font-size: ${appearance.fontSize}; color: #333; line-height: 1.4;">
//         <tr>
//           ${profileImageHTML ? `<td valign="top" style="padding-right: 16px;">${profileImageHTML}</td>` : ''}
//           <td valign="top">
//             <table cellpadding="0" cellspacing="0" border="0">
//               <tr>
//                 <td style="padding-bottom: 8px;">
//                   <strong style="color: ${appearance.primaryColor}; font-size: 16px;">
//                     ${personalInfo.firstName} ${personalInfo.lastName}
//                   </strong>
//                 </td>
//               </tr>
//               ${personalInfo.position ? `
//                 <tr>
//                   <td style="padding-bottom: 4px; color: ${appearance.secondaryColor};">
//                     ${personalInfo.position}
//                   </td>
//                 </tr>
//               ` : ''}
//               ${personalInfo.phone ? `
//                 <tr>
//                   <td style="padding-bottom: 2px;">
//                     📞 <a href="tel:${personalInfo.phone}" style="color: #333; text-decoration: none;">${personalInfo.phone}</a>
//                   </td>
//                 </tr>
//               ` : ''}
//               ${personalInfo.email ? `
//                 <tr>
//                   <td style="padding-bottom: 2px;">
//                     ✉️ <a href="mailto:${personalInfo.email}" style="color: ${appearance.primaryColor}; text-decoration: none;">${personalInfo.email}</a>
//                   </td>
//                 </tr>
//               ` : ''}
//               ${companyInfo.website ? `
//                 <tr>
//                   <td style="padding-bottom: 8px;">
//                     🌐 <a href="${companyInfo.website}" style="color: ${appearance.primaryColor}; text-decoration: none;">${companyInfo.website}</a>
//                   </td>
//                 </tr>
//               ` : ''}
//               ${socialLinksHTML ? `
//                 <tr>
//                   <td style="padding-bottom: 8px;">
//                     ${socialLinksHTML}
//                   </td>
//                 </tr>
//               ` : ''}
//               ${companyInfo.companyName || companyInfo.address ? `
//                 <tr>
//                   <td style="border-top: 2px solid ${appearance.primaryColor}; padding-top: 8px;">
//                     ${logoHTML ? `<div style="margin-bottom: 8px;">${logoHTML}</div>` : ''}
//                     ${companyInfo.companyName ? `<div style="font-weight: bold; color: ${appearance.primaryColor};">${companyInfo.companyName}</div>` : ''}
//                     ${companyInfo.address ? `<div style="color: ${appearance.secondaryColor}; font-size: 12px;">${companyInfo.address}${companyInfo.city ? `, ${companyInfo.city}` : ''}${companyInfo.postalCode ? ` ${companyInfo.postalCode}` : ''}</div>` : ''}
//                   </td>
//                 </tr>
//               ` : ''}
//             </table>
//           </td>
//         </tr>
//       </table>
//     `;
//   };

//   // Générer le CSS pour la prévisualisation
//   const generateCSS = () => {
//     return `
//       .signature-preview {
//         font-family: ${signature.appearance.fontFamily};
//         font-size: ${signature.appearance.fontSize};
//         color: #333;
//         line-height: 1.4;
//         max-width: 600px;
//         padding: 16px;
//         border: 1px solid #e5e7eb;
//         border-radius: 8px;
//         background: white;
//       }
//     `;
//   };

//   // Copier la signature dans le presse-papiers
//   const copyToClipboard = async () => {
//     const html = generateHTML();
//     try {
//       await navigator.clipboard.writeText(html);
//       return { success: true, message: 'Signature copiée dans le presse-papiers' };
//     } catch (error) {
//       return { success: false, message: 'Erreur lors de la copie' };
//     }
//   };

//   // Télécharger la signature en HTML
//   const downloadHTML = () => {
//     const html = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="UTF-8">
//         <title>Signature Email - ${signature.personalInfo.firstName} ${signature.personalInfo.lastName}</title>
//         <style>
//           body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
//           ${generateCSS()}
//         </style>
//       </head>
//       <body>
//         <div class="signature-preview">
//           ${generateHTML()}
//         </div>
//       </body>
//       </html>
//     `;

//     const blob = new Blob([html], { type: 'text/html' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `signature-${signature.signatureName || 'email'}.html`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   };

//   // Valider si la signature est complète
//   const validateSignature = () => {
//     const errors = [];
    
//     if (!signature.personalInfo.firstName) {
//       errors.push('Le prénom est requis');
//     }
    
//     if (!signature.personalInfo.lastName) {
//       errors.push('Le nom est requis');
//     }
    
//     if (!signature.personalInfo.email) {
//       errors.push('L\'email est requis');
//     }

//     return {
//       isValid: errors.length === 0,
//       errors,
//     };
//   };

//   return {
//     generateHTML,
//     generateCSS,
//     copyToClipboard,
//     downloadHTML,
//     validateSignature,
//   };
// }
