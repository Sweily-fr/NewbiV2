/**
 * Reconstructeur de HTML de signature basé sur sectionsOrder
 * Garde la compatibilité Gmail/Outlook tout en permettant le drag & drop
 */

/**
 * Reconstruit le HTML de la signature en respectant l'ordre de sectionsOrder
 * @param {Object} signatureData - Les données de la signature
 * @param {Function} getSpacing - Fonction helper pour les espacements
 * @param {Function} getTypography - Fonction helper pour la typographie
 * @param {string} profileImageHTML - HTML de la photo de profil
 * @param {string} logoHTML - HTML du logo
 * @param {string} socialIconsHTML - HTML des réseaux sociaux
 * @returns {string} HTML reconstruit
 */
export function rebuildSignatureHTML(
  signatureData,
  getSpacing,
  getTypography,
  profileImageHTML,
  logoHTML,
  socialIconsHTML
) {
  const sectionsOrder = signatureData.sectionsOrder || [];

  // Si pas de sectionsOrder, retourner null pour utiliser le fallback
  if (sectionsOrder.length === 0) {
    console.log("📋 [REBUILDER] Pas de sectionsOrder, utilisation du fallback");
    return null;
  }

  console.log("🔄 [REBUILDER] Reconstruction avec sectionsOrder:", sectionsOrder.length, "blocs");

  // Fonction pour générer le HTML d'un item individuel
  const generateItemHTML = (item) => {
    // Matcher l'item avec les données de signatureData basé sur le type et le contenu

    // Photo de profil
    if (item.type === "media" && item.label === "Photo de profil") {
      return `<tr>
<td style="padding-bottom: ${getSpacing(signatureData.spacings?.photoToName, 8)}px;">
${profileImageHTML}
</td>
</tr>`;
    }

    // Nom complet
    if (item.type === "personal" && signatureData.fullName && item.textContent.includes(signatureData.fullName)) {
      return `<tr>
<td style="padding-bottom: ${getSpacing(signatureData, undefined, 8)}px; text-align: ${signatureData.nameAlignment || "left"}; font-size: ${getTypography("fullName", "fontSize", 16)}px; font-weight: ${getTypography("fullName", "fontWeight", "bold")}; color: ${getTypography("fullName", "color", signatureData.primaryColor || "#2563eb")}; line-height: 1.2; font-family: ${getTypography("fullName", "fontFamily", "Arial, sans-serif")}; font-style: ${getTypography("fullName", "fontStyle", "normal")}; text-decoration: ${getTypography("fullName", "textDecoration", "none")}; white-space: nowrap;">
${signatureData.fullName}
</td>
</tr>`;
    }

    // Poste
    if (item.type === "personal" && signatureData.position && item.textContent.includes(signatureData.position)) {
      return `<tr>
<td style="padding-bottom: ${getSpacing(signatureData.spacings?.positionBottom, 8)}px; text-align: ${signatureData.nameAlignment || "left"}; white-space: nowrap; font-size: ${getTypography("position", "fontSize", 14)}px; color: ${getTypography("position", "color", "rgb(102,102,102)")}; font-family: ${getTypography("position", "fontFamily", "Arial, sans-serif")}; font-weight: ${getTypography("position", "fontWeight", "normal")}; font-style: ${getTypography("position", "fontStyle", "normal")}; text-decoration: ${getTypography("position", "textDecoration", "none")}">
${signatureData.position}
</td>
</tr>`;
    }

    // Téléphone
    if (item.type === "contact" && signatureData.phone && item.textContent.includes(signatureData.phone)) {
      return `<tr>
<td style="padding-bottom: ${getSpacing(signatureData.spacings?.phoneToMobile, 8)}px;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
<tbody>
<tr>
<td style="padding-right: ${getSpacing(signatureData.spacings?.global, 8)}px; vertical-align: middle; width: 16px;">
<img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/smartphone.png" alt="Téléphone" width="16" height="16" style="width:16px!important;height:16px!important;display:block;" />
</td>
<td style="font-size: ${getTypography("phone", "fontSize", 12)}px; color: ${getTypography("phone", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("phone", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("phone", "fontFamily", "Arial, sans-serif")};">
<a href="tel:${signatureData.phone}" style="color: ${getTypography("phone", "color", "rgb(102,102,102)")}; text-decoration: none;">${signatureData.phone}</a>
</td>
</tr>
</tbody>
</table>
</td>
</tr>`;
    }

    // Mobile
    if (item.type === "contact" && signatureData.mobile && item.textContent.includes(signatureData.mobile)) {
      return `<tr>
<td style="padding-bottom: ${getSpacing(signatureData.spacings?.mobileToEmail, 8)}px;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
<tbody>
<tr>
<td style="padding-right: ${getSpacing(signatureData.spacings?.global, 8)}px; vertical-align: middle; width: 16px;">
<img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/phone.png" alt="Mobile" width="16" height="16" style="width:16px!important;height:16px!important;display:block;" />
</td>
<td style="font-size: ${getTypography("mobile", "fontSize", 12)}px; color: ${getTypography("mobile", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("mobile", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("mobile", "fontFamily", "Arial, sans-serif")};">
<a href="tel:${signatureData.mobile}" style="color: ${getTypography("mobile", "color", "rgb(102,102,102)")}; text-decoration: none;">${signatureData.mobile}</a>
</td>
</tr>
</tbody>
</table>
</td>
</tr>`;
    }

    // Email
    if (item.type === "contact" && signatureData.email && item.textContent.includes(signatureData.email)) {
      return `<tr>
<td style="padding-bottom: ${getSpacing(signatureData.spacings?.emailToWebsite, 8)}px;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
<tbody>
<tr>
<td style="padding-right: ${getSpacing(signatureData.spacings?.global, 8)}px; vertical-align: middle; width: 16px;">
<img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/mail.png" alt="Email" width="16" height="16" style="width:16px!important;height:16px!important;display:block;" />
</td>
<td style="font-size: ${getTypography("email", "fontSize", 12)}px; color: ${getTypography("email", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("email", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("email", "fontFamily", "Arial, sans-serif")};">
<a href="mailto:${signatureData.email}" style="color: ${getTypography("email", "color", "rgb(102,102,102)")}; text-decoration: none;">${signatureData.email}</a>
</td>
</tr>
</tbody>
</table>
</td>
</tr>`;
    }

    // Site web
    if (item.type === "contact" && signatureData.website && item.textContent.includes(signatureData.website)) {
      return `<tr>
<td style="padding-bottom: ${getSpacing(signatureData.spacings?.websiteToAddress, 8)}px;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
<tbody>
<tr>
<td style="padding-right: ${getSpacing(signatureData.spacings?.global, 8)}px; vertical-align: middle; width: 16px;">
<img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/globe.png" alt="Site web" width="16" height="16" style="width:16px!important;height:16px!important;display:block;" />
</td>
<td style="font-size: ${getTypography("website", "fontSize", 12)}px; color: ${getTypography("website", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("website", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("website", "fontFamily", "Arial, sans-serif")};">
<a href="${signatureData.website}" style="color: ${getTypography("website", "color", "rgb(102,102,102)")}; text-decoration: none;">${signatureData.website}</a>
</td>
</tr>
</tbody>
</table>
</td>
</tr>`;
    }

    // Adresse
    if (item.type === "contact" && signatureData.address && item.textContent.includes(signatureData.address.substring(0, 20))) {
      return `<tr>
<td style="padding-bottom: ${getSpacing(signatureData.spacings?.addressBottom, 8)}px;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
<tbody>
<tr>
<td style="padding-right: ${getSpacing(signatureData.spacings?.global, 8)}px; vertical-align: top; width: 16px;">
<img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/map-pin.png" alt="Adresse" width="16" height="16" style="width:16px!important;height:16px!important;display:block;margin-top:1px;" />
</td>
<td style="font-size: ${getTypography("address", "fontSize", 12)}px; color: ${getTypography("address", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("address", "fontWeight", "normal")}; vertical-align: top; font-family: ${getTypography("address", "fontFamily", "Arial, sans-serif")};">
${signatureData.address}
</td>
</tr>
</tbody>
</table>
</td>
</tr>`;
    }

    // Séparateur horizontal
    if (item.type === "separator") {
      return `<tr>
<td colspan="3" style="padding-top: ${getSpacing(signatureData.spacings?.separatorTop, 8)}px; padding-bottom: ${getSpacing(signatureData.spacings?.separatorBottom, 8)}px; padding-left: 0; padding-right: 0;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
<tbody>
<tr>
<td style="border-top: ${signatureData.separatorHorizontalWidth || 1}px solid ${signatureData.colors?.separatorHorizontal || "#e0e0e0"}; line-height: 1px; font-size: 1px; padding: 0; margin: 0;">&nbsp;</td>
</tr>
</tbody>
</table>
</td>
</tr>`;
    }

    // Logo
    if (item.type === "media" && item.label === "Logo entreprise" && logoHTML) {
      return `<tr>
<td style="padding-top: ${getSpacing(signatureData.spacings?.logoBottom, 8)}px; text-align: left;" colspan="1">
${logoHTML}
</td>
<td colspan="2"></td>
</tr>`;
    }

    return ""; // Item non reconnu
  };

  // Générer le HTML pour chaque bloc
  const blocksHTML = sectionsOrder.map((block, blockIndex) => {
    console.log(`📦 [REBUILDER] Bloc ${blockIndex + 1}:`, block.columns.length, "colonnes");
    
    const columnsHTML = block.columns.map((column, colIndex) => {
      const itemsHTML = column.items.map(generateItemHTML).filter(html => html).join("\n");
      
      console.log(`  📋 [REBUILDER] Colonne ${colIndex + 1}:`, column.items.length, "items →", itemsHTML ? "HTML généré" : "vide");
      
      if (!itemsHTML) return "";

      return `<td style="width: auto; padding-right: ${getSpacing(signatureData.spacings?.global, 8)}px; vertical-align: ${signatureData.contactAlignment || "top"};">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
<tbody>
${itemsHTML}
</tbody>
</table>
</td>`;
    }).filter(html => html);

    // Ajouter le séparateur vertical entre les colonnes
    const columnsWithSeparator = columnsHTML.flatMap((col, index) => {
      if (index === columnsHTML.length - 1) return [col];
      return [
        col,
        `<td style="border-left: 1px solid ${signatureData.colors?.separatorVertical || "#e0e0e0"}; padding: 0; margin: 0; font-size: 1px; line-height: 1px;">
&nbsp;
</td>`
      ];
    });

    return `<tr>
${columnsWithSeparator.join("\n")}
</tr>`;
  }).join("\n");

  // Ajouter les réseaux sociaux à la fin si présents
  const socialHTML = socialIconsHTML ? `<tr>
<td style="padding-top: ${getSpacing(signatureData.spacings?.logoToSocial, 8)}px; text-align: left;" colspan="3">
${socialIconsHTML}
</td>
</tr>` : "";

  // Construire le HTML final
  const finalHTML = `
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 500px; font-family: ${signatureData.fontFamily || "Arial, sans-serif"}; width: auto;">
<tbody>
${blocksHTML}
${socialHTML}
</tbody>
</table>
`;

  console.log("✅ [REBUILDER] HTML reconstruit:", finalHTML.length, "caractères");
  return finalHTML;
}
