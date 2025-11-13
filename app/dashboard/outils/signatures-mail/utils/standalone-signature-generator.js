/**
 * Générateur de signature standalone - reproduction exacte de useSignatureGenerator
 * sans dépendance au contexte SignatureProvider
 */

export function generateSignatureHTML(signatureData) {
  console.log("🔧 generateSignatureHTML appelée avec:", signatureData);
  
  // Fonction helper pour obtenir l'espacement approprié
  const getSpacing = (specificSpacing, fallbackSpacing = 8) => {
    let result;
    // Priorité: valeur spécifique > espacement global > fallback
    if (specificSpacing !== undefined) {
      result = specificSpacing;
    } else if (signatureData.spacings?.global !== undefined) {
      result = signatureData.spacings?.global;
    } else {
      result = fallbackSpacing;
    }
    return result;
  };

  // Fonction helper pour obtenir les valeurs de typographie
  const getTypography = (field, property, fallback) => {
    // Priorité absolue à la nouvelle structure détaillée
    const detailedValue = signatureData.typography?.[field]?.[property];
    if (detailedValue !== undefined && detailedValue !== null && detailedValue !== "") {
      return detailedValue;
    }

    // Fallback vers l'ancienne structure ou valeur par défaut
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
    } else if (property === "fontStyle") {
      return fallback;
    } else if (property === "textDecoration") {
      return fallback;
    }

    return fallback;
  };

  const profileImageHTML = signatureData.photo && signatureData.photoVisible !== false
    ? (() => {
        const size = signatureData.imageSize || 70;
        const mask = signatureData.imageShape === "square" ? "square" : "circle";
        
        let imageUrl = signatureData.photo;
        
        // Si c'est une data URL, ne pas l'utiliser (elle ne fonctionne pas bien dans Gmail)
        if (imageUrl && imageUrl.startsWith('data:')) {
          return ''; // Ne pas inclure les data URLs dans le HTML copié
        }
        
        // ✅ Utiliser l'URL Cloudflare directement (image déjà optimisée et recadrée en carré côté client)
        return `<img src="${imageUrl}" alt="Photo de profil" width="${size}" height="${size}" style="width: ${size}px; height: ${size}px; display: block; border: 0; margin: 0; padding: 0; border-radius: ${mask === 'circle' ? '50%' : '8px'};" />`;
      })()
    : "";

  const logoHTML = signatureData.logo
    ? (() => {
        const logoSize = signatureData.logoSize || 60;
        const optimizedLogoUrl = `https://wsrv.nl/?url=${encodeURIComponent(signatureData.logo)}&w=${logoSize * 2}&h=${logoSize * 2}&fit=contain&sharp=2&q=90`;
        return `<img src="${optimizedLogoUrl}" alt="Logo entreprise" style="max-width: ${logoSize}px; height: auto; display: block; margin: 0;" />`;
      })()
    : "";

  // Fonction pour mapper le nom du platform vers le nom Cloudflare
  const getPlatformName = (platform) => {
    const platformMap = {
      x: "twitter",
    };
    return platformMap[platform] || platform;
  };

  // Fonction pour convertir une couleur hex ou nom en nom Cloudflare
  const getColorName = (colorInput) => {
    if (!colorInput) return null;
    
    const color = colorInput.toLowerCase().trim();
    
    // Si c'est déjà un nom de couleur, le retourner directement
    const validColorNames = ["blue", "pink", "purple", "black", "red", "green", "yellow", "orange", "indigo", "sky"];
    if (validColorNames.includes(color)) {
      return color;
    }
    
    // Sinon, convertir le hex en nom
    const hexColor = color.replace("#", "");
    
    const colorMap = {
      "0077b5": "blue",
      "1877f2": "blue",
      "e4405f": "pink",
      "833ab4": "purple",
      "000000": "black",
      "1da1f2": "blue",
      "ff0000": "red",
      "333333": "black",
      "00ff00": "green",
      "ff00ff": "purple",
      "ffff00": "yellow",
      "ff6600": "orange",
    };
    
    return colorMap[hexColor] || null;
  };

  // 🔥 Fonction helper pour optimiser les icônes
  const getOptimizedIconUrl = (baseUrl, size = 16) => {
    return `https://wsrv.nl/?url=${encodeURIComponent(baseUrl)}&w=${size * 2}&h=${size * 2}&fit=cover&sharp=2&q=90`;
  };

  // Générer les icônes sociales depuis Cloudflare
  const generateSocialIconsHTML = () => {
    // Fonction pour obtenir l'URL de l'icône depuis Cloudflare
    const getSocialIconUrl = (platform) => {
      // Utiliser l'icône personnalisée si disponible
      if (signatureData.customSocialIcons?.[platform]) {
        return signatureData.customSocialIcons[platform];
      }

      // Récupérer la couleur pour ce réseau (priorité: couleur spécifique > couleur globale)
      const color = signatureData.socialColors?.[platform] || signatureData.socialGlobalColor;
      
      // Construire l'URL Cloudflare avec la couleur si disponible
      if (color) {
        const colorName = getColorName(color);
        if (colorName) {
          // Utiliser le nom Cloudflare du platform (x -> twitter)
          const cloudflareplatform = getPlatformName(platform);
          return `https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/${cloudflareplatform}/${cloudflareplatform}-${colorName}.png`;
        }
      }

      // Fallback vers l'icône par défaut
      const defaultIconUrls = {
        linkedin: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/linkedin/linkedin.png",
        facebook: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/facebook/facebook.png",
        instagram: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/instagram/instagram.png",
        x: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/twitter/twitter.png",
        youtube: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/youtube/youtube.png",
        github: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/github/github.png",
      };
      return defaultIconUrls[platform];
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
        const iconUrl = getSocialIconUrl(social.key);
        const iconSize = signatureData.socialSize || 24;
        // 🔥 OPTIMISATION: Utiliser wsrv.nl pour les icônes
        const optimizedIconUrl = `https://wsrv.nl/?url=${encodeURIComponent(iconUrl)}&w=${iconSize * 2}&h=${iconSize * 2}&fit=cover&sharp=2&q=90`;
        return `
        <a href="${signatureData.socialNetworks[social.key]}" style="text-decoration: none; margin-right: ${index < activeNetworks.length - 1 ? "8px" : "0"}; display: inline-block;">
          <img src="${optimizedIconUrl}" alt="${social.label}" style="width: ${iconSize}px; height: ${iconSize}px; display: block;" />
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
<td style="width: ${signatureData.photo ? (signatureData.imageSize || 80) + 16 : 120}px; padding-right: ${getSpacing(signatureData.spacings?.global, 8)}px; vertical-align: top;">
${signatureData.photo ? profileImageHTML : ""}
</td>
<td style="border-left: 1px solid ${signatureData.colors?.separatorVertical || "#e0e0e0"}; padding: 0; margin: 0; font-size: 1px; line-height: 1px;">
&nbsp;
</td>
<td style="padding-left: ${getSpacing(signatureData.spacings?.global, 8)}px;">
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
<td colspan="2" style="padding-bottom: ${getSpacing(signatureData.spacings?.positionBottom, 8)}px; text-align: ${signatureData.nameAlignment || "left"};">
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
<td style="padding-right: ${getSpacing(signatureData.spacings?.global, 8)}px; vertical-align: middle; width: 16px;">
<img src="${getOptimizedIconUrl('https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/smartphone.png', 16)}" alt="Téléphone" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block;" />
</td>
<td style="font-size: ${getTypography("phone", "fontSize", 12)}px; color: ${getTypography("phone", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("phone", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("phone", "fontFamily", "Arial, sans-serif")}; font-style: ${getTypography("phone", "fontStyle", "normal")}; text-decoration: ${getTypography("phone", "textDecoration", "none")};">
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
<td style="padding-right: ${getSpacing(signatureData.spacings?.global, 8)}px; vertical-align: middle; width: 16px;">
<img src="${getOptimizedIconUrl('https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/phone.png', 16)}" alt="Mobile" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block;" />
</td>
<td style="font-size: ${getTypography("mobile", "fontSize", 12)}px; color: ${getTypography("mobile", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("mobile", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("mobile", "fontFamily", "Arial, sans-serif")}; font-style: ${getTypography("mobile", "fontStyle", "normal")}; text-decoration: ${getTypography("mobile", "textDecoration", "none")};">
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
<td style="padding-right: ${getSpacing(signatureData.spacings?.global, 8)}px; vertical-align: middle; width: 16px;">
<img src="${getOptimizedIconUrl('https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/mail.png', 16)}" alt="Email" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block;" />
</td>
<td style="font-size: ${getTypography("email", "fontSize", 12)}px; color: ${getTypography("email", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("email", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("email", "fontFamily", "Arial, sans-serif")}; font-style: ${getTypography("email", "fontStyle", "normal")}; text-decoration: ${getTypography("email", "textDecoration", "none")};">
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
<td style="padding-right: ${getSpacing(signatureData.spacings?.global, 8)}px; vertical-align: middle; width: 16px;">
<img src="${getOptimizedIconUrl('https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/globe.png', 16)}" alt="Site web" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block;" />
</td>
<td style="font-size: ${getTypography("website", "fontSize", 12)}px; color: ${getTypography("website", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("website", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("website", "fontFamily", "Arial, sans-serif")}; font-style: ${getTypography("website", "fontStyle", "normal")}; text-decoration: ${getTypography("website", "textDecoration", "none")};">
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
<td style="padding-bottom: ${getSpacing(signatureData.spacings?.addressBottom, 8)}px;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
<tbody>
<tr>
<td style="padding-right: ${getSpacing(signatureData.spacings?.global, 8)}px; vertical-align: top; width: 16px;">
<img src="${getOptimizedIconUrl('https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/map-pin.png', 16)}" alt="Adresse" width="16" height="16" style="width: 16px !important; height: 16px !important; display: block; margin-top: 1px;" />
</td>
<td style="font-size: ${getTypography("address", "fontSize", 12)}px; color: ${getTypography("address", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("address", "fontWeight", "normal")}; vertical-align: top; font-family: ${getTypography("address", "fontFamily", "Arial, sans-serif")}; font-style: ${getTypography("address", "fontStyle", "normal")}; text-decoration: ${getTypography("address", "textDecoration", "none")};">
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
<td colspan="3" style="padding-top: ${getSpacing(signatureData.spacings?.separatorTop, 8)}px; padding-bottom: ${getSpacing(signatureData.spacings?.separatorBottom, 8)}px; padding-left: 0; padding-right: 0;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
<tbody>
<tr>
<td style="border-top: ${signatureData.separatorHorizontalWidth || 1}px solid ${signatureData.colors?.separatorHorizontal || "#e0e0e0"}; line-height: 1px; font-size: 1px; padding: 0; margin: 0;">&nbsp;</td>
</tr>
</tbody>
</table>
</td>
</tr>
${logoHTML ? `
<tr>
<td style="padding-top: ${getSpacing(signatureData.spacings?.logoBottom, 8)}px; text-align: left;" colspan="1">
${logoHTML}
</td>
<td colspan="2"></td>
</tr>
` : ""}
${socialIconsHTML ? `
<tr>
<td style="padding-top: ${getSpacing(signatureData.spacings?.logoToSocial, 8)}px; text-align: left;" colspan="1">
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
