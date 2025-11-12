/**
 * Générateur de signature standalone - reproduction exacte de useSignatureGenerator
 * sans dépendance au contexte SignatureProvider
 */

export function generateSignatureHTML(signatureData) {
  console.log("🔧 generateSignatureHTML appelée avec:", signatureData);
  
  // Fonction helper pour obtenir l'espacement approprié
  const getSpacing = (specificSpacing, fallbackSpacing = 8) => {
    let result;
    if (signatureData.detailedSpacing && specificSpacing !== undefined) {
      result = specificSpacing;
    } else {
      result = signatureData.spacings?.global || fallbackSpacing;
    }
    return result;
  };

  // Fonction helper pour obtenir les valeurs de typographie
  const getTypography = (field, property, fallback) => {
    const detailedValue = signatureData.typography?.[field]?.[property];
    if (detailedValue !== undefined) {
      return detailedValue;
    }

    if (property === "fontSize") {
      const fieldMapping = {
        fullName: "name",
        position: "position",
        email: "contact",
        phone: "contact",
        mobile: "contact",
        website: "contact",
        address: "contact",
      };
      return signatureData.fontSize?.[fieldMapping[field] || field] || fallback;
    } else if (property === "color") {
      const fieldMapping = {
        fullName: "name",
        position: "position",
        company: "company",
        email: "contact",
        phone: "contact",
        mobile: "contact",
        website: "contact",
        address: "contact",
      };
      return signatureData.colors?.[fieldMapping[field] || field] || fallback;
    } else if (property === "fontFamily") {
      return signatureData.fontFamily || fallback;
    } else if (property === "fontWeight") {
      return fallback;
    }

    return fallback;
  };

  const profileImageHTML = signatureData.photo
    ? `<img src="${signatureData.photo}" alt="Photo" style="width: ${signatureData.imageSize || 80}px; height: ${signatureData.imageSize || 80}px; border-radius: ${signatureData.imageShape === "square" ? "8px" : "50%"}; display: block; object-fit: cover;" />`
    : "";

  const logoHTML = signatureData.logo
    ? `<img src="${signatureData.logo}" alt="Logo entreprise" style="max-width: ${signatureData.logoSize || 60}px; height: auto; display: block; margin: 0;" />`
    : "";

  // Générer les icônes sociales
  const generateSocialIconsHTML = () => {
    // URLs des icônes par défaut depuis Cloudflare (avec couleurs de fond)
    const defaultIconUrls = {
      linkedin: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/linkedin/linkedin.png",
      facebook: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/facebook/facebook.png",
      instagram: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/instagram/instagram.png",
      x: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/twitter/twitter.png",
      youtube: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/youtube/youtube.png",
      github: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/github/github.png",
    };

    const getSocialIconUrl = (platform) => {
      return defaultIconUrls[platform] || null;
    };

    const availableSocialNetworks = [
      { key: "linkedin", label: "LinkedIn" },
      { key: "facebook", label: "Facebook" },
      { key: "instagram", label: "Instagram" },
      { key: "x", label: "Twitter/X" },
      { key: "github", label: "GitHub" },
      { key: "youtube", label: "YouTube" },
    ];

    const activeNetworks = availableSocialNetworks.filter(
      (social) =>
        signatureData.socialNetworks?.hasOwnProperty(social.key) &&
        signatureData.socialNetworks[social.key] &&
        signatureData.socialNetworks[social.key].trim() !== ""
    );

    if (activeNetworks.length === 0) return "";

    const iconsHTML = activeNetworks
      .map((social, index) => {
        return `
        <a href="${signatureData.socialNetworks[social.key]}" style="text-decoration: none; margin-right: ${index < activeNetworks.length - 1 ? "8px" : "0"}; display: inline-block;">
          <img src="${getSocialIconUrl(social.key)}" alt="${social.label}" style="width: ${signatureData.socialSize || 24}px; height: ${signatureData.socialSize || 24}px; display: block;" />
        </a>`;
      })
      .join("");

    return `<div style="margin-top: ${getSpacing(signatureData.spacings?.logoToSocial, 12)}px;">${iconsHTML}</div>`;
  };

  const socialIconsHTML = generateSocialIconsHTML();
  
  console.log("🔧 Avant return, socialIconsHTML:", socialIconsHTML);
  
  // Structure unique horizontale
  const htmlResult = `
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 500px; font-family: ${signatureData.fontFamily || "Arial, sans-serif"}; width: 100%;">
<tbody>
<tr>
<td style="width: ${signatureData.photo ? (signatureData.imageSize || 80) + 16 : 120}px; padding-right: 15px; vertical-align: top;">
${signatureData.photo ? profileImageHTML : ""}
</td>
<td style="width: ${1}px; background-color: ${signatureData.colors?.separatorVertical || "#e0e0e0"}; padding: 0; font-size: 1px; line-height: 1px;">
&nbsp;
</td>
<td style="padding-left: 15px; vertical-align: top;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
<tbody>
<tr>
<td colspan="2" style="padding-bottom: ${getSpacing(signatureData.spacings?.nameBottom, 8)}px; text-align: ${signatureData.nameAlignment || "left"};">
<div style="font-size: ${getTypography("fullName", "fontSize", 16)}px; font-weight: ${getTypography("fullName", "fontWeight", "bold")}; color: ${getTypography("fullName", "color", signatureData.primaryColor || "#2563eb")}; line-height: 1.2; font-family: ${getTypography("fullName", "fontFamily", "Arial, sans-serif")}; font-style: ${getTypography("fullName", "fontStyle", "normal")}; text-decoration: ${getTypography("fullName", "textDecoration", "none")};">
${signatureData.fullName || `${signatureData.firstName || ""} ${signatureData.lastName || ""}`.trim()}
</div>
</td>
</tr>
${signatureData.position ? `
<tr>
<td colspan="2" style="padding-bottom: ${getSpacing(signatureData.spacings?.positionBottom, 12)}px; text-align: ${signatureData.nameAlignment || "left"};">
<div style="font-size: ${getTypography("position", "fontSize", 14)}px; color: ${getTypography("position", "color", "rgb(102,102,102)")}; font-family: ${getTypography("position", "fontFamily", "Arial, sans-serif")}; font-weight: ${getTypography("position", "fontWeight", "normal")}; font-style: ${getTypography("position", "fontStyle", "normal")}; text-decoration: ${getTypography("position", "textDecoration", "none")}; white-space: nowrap;">
${signatureData.position}
</div>
</td>
</tr>
` : ""}
${signatureData.phone ? `
<tr>
<td style="padding-bottom: ${getSpacing(signatureData.spacings?.phoneToMobile, 6)}px;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
<tbody>
<tr>
<td style="padding-right: 8px; vertical-align: middle; width: 16px;">
<img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/smartphone.png" alt="Téléphone" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block;" />
</td>
<td style="font-size: ${getTypography("phone", "fontSize", 12)}px; color: ${getTypography("phone", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("phone", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("phone", "fontFamily", "Arial, sans-serif")};">
<a href="tel:${signatureData.phone}" style="color: ${getTypography("phone", "color", "rgb(102,102,102)")}; text-decoration: none;">${signatureData.phone}</a>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
` : ""}
${signatureData.mobile ? `
<tr>
<td style="padding-bottom: ${getSpacing(signatureData.spacings?.mobileToEmail, 6)}px;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
<tbody>
<tr>
<td style="padding-right: 8px; vertical-align: middle; width: 16px;">
<img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/phone.png" alt="Mobile" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block;" />
</td>
<td style="font-size: ${getTypography("mobile", "fontSize", 12)}px; color: ${getTypography("mobile", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("mobile", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("mobile", "fontFamily", "Arial, sans-serif")};">
<a href="tel:${signatureData.mobile}" style="color: ${getTypography("mobile", "color", "rgb(102,102,102)")}; text-decoration: none;">${signatureData.mobile}</a>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
` : ""}
${signatureData.email ? `
<tr>
<td style="padding-bottom: ${getSpacing(signatureData.spacings?.emailToWebsite, 6)}px;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
<tbody>
<tr>
<td style="padding-right: 8px; vertical-align: middle; width: 16px;">
<img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/mail.png" alt="Email" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block;" />
</td>
<td style="font-size: ${getTypography("email", "fontSize", 12)}px; color: ${getTypography("email", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("email", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("email", "fontFamily", "Arial, sans-serif")};">
<a href="mailto:${signatureData.email}" style="color: ${getTypography("email", "color", "rgb(102,102,102)")}; text-decoration: none;">${signatureData.email}</a>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
` : ""}
${signatureData.website ? `
<tr>
<td style="padding-bottom: ${getSpacing(signatureData.spacings?.websiteToAddress, 6)}px;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
<tbody>
<tr>
<td style="padding-right: 8px; vertical-align: middle; width: 16px;">
<img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/globe.png" alt="Site web" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block;" />
</td>
<td style="font-size: ${getTypography("website", "fontSize", 12)}px; color: ${getTypography("website", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("website", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("website", "fontFamily", "Arial, sans-serif")};">
<a href="${signatureData.website}" style="color: ${getTypography("website", "color", "rgb(102,102,102)")}; text-decoration: none;">${signatureData.website}</a>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
` : ""}
${signatureData.address ? `
<tr>
<td style="padding-bottom: 12px;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
<tbody>
<tr>
<td style="padding-right: 8px; vertical-align: top; width: 16px;">
<img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/map-pin.png" alt="Adresse" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block; margin-top: 1px;" />
</td>
<td style="font-size: ${getTypography("address", "fontSize", 12)}px; color: ${getTypography("address", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("address", "fontWeight", "normal")}; vertical-align: top; font-family: ${getTypography("address", "fontFamily", "Arial, sans-serif")};">
${signatureData.address}
</td>
</tr>
</tbody>
</table>
</td>
</tr>
` : ""}
</tbody>
</table>
</td>
</tr>
<tr>
<td colspan="3" style="padding-top: ${getSpacing(signatureData.spacings?.separatorTop, 12)}px; padding-bottom: ${getSpacing(signatureData.spacings?.separatorBottom, 12)}px;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
<tbody>
<tr>
<td style="border-top: ${signatureData.separatorHorizontalWidth || 1}px solid ${signatureData.colors?.separatorHorizontal || "#e0e0e0"}; line-height: 1px; font-size: 1px;">&nbsp;</td>
</tr>
</tbody>
</table>
</td>
</tr>
${logoHTML ? `
<tr>
<td style="padding-top: ${getSpacing(signatureData.spacings?.logoBottom, 15)}px; text-align: left;" colspan="1">
${logoHTML}
</td>
<td colspan="2"></td>
</tr>
` : ""}
${socialIconsHTML ? `
<tr>
<td style="padding-top: ${getSpacing(signatureData.spacings?.logoToSocial, 12)}px; text-align: left;" colspan="1">
${socialIconsHTML}
</td>
<td colspan="2"></td>
</tr>
` : ""}
</tbody>
</table>
`;
  
  console.log("🔧 HTML généré, longueur:", htmlResult.length);
  return htmlResult;
}
