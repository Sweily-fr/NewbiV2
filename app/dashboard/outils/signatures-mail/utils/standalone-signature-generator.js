/**
 * Générateur de signature standalone - reproduction exacte de useSignatureGenerator
 * sans dépendance au contexte SignatureProvider
 */

export function generateSignatureHTML(signatureData) {
  console.log("🔥 GÉNÉRATEUR APPELÉ - standalone-signature-generator.js", { orientation: signatureData.orientation });
  
  // Fonction helper pour obtenir l'espacement approprié (identique à spacing-helper.js)
  const getSpacing = (specificSpacing, fallbackSpacing = 12) => {
    let result;
    
    // Si le mode détaillé est activé, utiliser l'espacement spécifique
    if (signatureData.detailedSpacing && specificSpacing !== undefined) {
      result = specificSpacing;
    } else {
      // Sinon, utiliser l'espacement global
      result = signatureData.spacings?.global ?? fallbackSpacing;
    }
    
    return result;
  };

  // Fonction helper pour générer le style de padding complet (top, right, bottom, left)
  const getPaddingStyle = (elementKey, defaultPadding = {}) => {
    if (signatureData.detailedSpacing && signatureData.paddings?.[elementKey]) {
      const padding = signatureData.paddings[elementKey];
      const top = padding.top ?? defaultPadding.top ?? 0;
      const right = padding.right ?? defaultPadding.right ?? 0;
      const bottom = padding.bottom ?? defaultPadding.bottom ?? 0;
      const left = padding.left ?? defaultPadding.left ?? 0;
      return `${top}px ${right}px ${bottom}px ${left}px`;
    }
    // Mode simple : utiliser defaultPadding
    const top = defaultPadding.top ?? 0;
    const right = defaultPadding.right ?? 0;
    const bottom = defaultPadding.bottom ?? 0;
    const left = defaultPadding.left ?? 0;
    return `${top}px ${right}px ${bottom}px ${left}px`;
  };

  // Helper pour échapper les caractères et éviter la détection automatique de liens par Gmail
  // Utilise Word Joiner (&#8288;) qui est invisible et empêche la détection
  const escapeForGmail = (text, type) => {
    if (!text) return text;
    
    // Word Joiner - caractère invisible qui empêche la détection de liens
    const wj = '&#8288;';
    const zwsp = '&#8203;';
    
    // Pour les emails : ajouter word joiner après @ et après chaque .
    if (type === 'email') {
      return text
        .replace(/@/g, `@${wj}`)
        .replace(/\./g, `.${wj}`);
    }
    
    // Pour les URLs : supprimer https:// et ajouter word joiner après chaque .
    if (type === 'website') {
      let cleanUrl = text.replace(/^https?:\/\//i, ''); // Supprimer https:// ou http://
      return cleanUrl.replace(/\./g, `.${wj}`);
    }
    
    // Pour les téléphones : ajouter zwsp après chaque chiffre (fonctionne déjà bien)
    if (type === 'phone') {
      return text.replace(/(\d)/g, `$1${zwsp}`);
    }
    
    return text;
  };

  // Fonction helper pour obtenir les valeurs de typographie
  const getTypography = (field, property, fallback) => {
    // Priorité absolue à la nouvelle structure détaillée
    const detailedValue = signatureData.typography?.[field]?.[property];
    if (detailedValue !== undefined && detailedValue !== null && detailedValue !== "") {
      if (property === "textDecoration") {
        console.log(` getTypography(${field}, textDecoration) = "${detailedValue}"`);
      }
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
      // Récupérer fontWeight de la structure détaillée
      return signatureData.typography?.[field]?.fontWeight || fallback;
    } else if (property === "fontStyle") {
      // Récupérer fontStyle de la structure détaillée
      return signatureData.typography?.[field]?.fontStyle || fallback;
    } else if (property === "textDecoration") {
      // Récupérer textDecoration de la structure détaillée
      return signatureData.typography?.[field]?.textDecoration || fallback;
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
        
        // ✅ Utiliser VML pour Outlook + fallback img pour Gmail (compatible tous clients mail)
        const borderRadius = mask === 'circle' ? '50%' : '0';
        return `<table cellpadding="0" cellspacing="0" border="0" style="margin:0;padding:0;">
  <tr>
    <td width="${size}" height="${size}" style="width:${size}px;height:${size}px;border-radius:${borderRadius};overflow:hidden;display:block;">
      <!--[if gte mso 9]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" style="width:${size}px;height:${size}px;arcsize:50%;mso-position-horizontal:center;">
        <v:fill type="frame" src="${imageUrl}" />
      </v:roundrect>
      <![endif]-->
      <!--[if !gte mso 9]><!-->
      <img src="${imageUrl}" alt="Photo de profil" width="${size}" height="${size}" style="width:${size}px;height:${size}px;min-width:${size}px;min-height:${size}px;display:block;border:0;margin:0;padding:0;border-radius:${borderRadius};" />
      <!--<![endif]-->
    </td>
  </tr>
</table>`;
      })()
    : "";

  const logoHTML = signatureData.logo
    ? (() => {
        const logoSize = signatureData.logoSize || 60;
        // Utiliser directement l'URL Cloudflare (comme dans la preview) au lieu de wsrv.nl
        // pour éviter les espacements supplémentaires que Gmail ajoute
        return `<img src="${signatureData.logo}" alt="Logo entreprise" style="width: ${logoSize}px; height: auto; max-height: ${logoSize}px; object-fit: contain; display: block; margin: 0; padding: 0; font-size: 0; line-height: 0;" />`;
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
  
  // Vérifier l'orientation
  const isVertical = signatureData.orientation === "vertical";
  
  // Calculer le colspan dynamique basé sur le séparateur vertical
  const colSpan = signatureData.separatorVerticalEnabled ? 5 : 2;
  
  // Générer le séparateur vertical si activé
  const verticalSeparatorHTML = signatureData.separatorVerticalEnabled ? `
<td style="width: ${getSpacing(signatureData.spacings?.global, 12)}px;">&nbsp;</td>
<td style="width: ${signatureData.separatorVerticalWidth || 1}px; background-color: ${signatureData.colors?.separatorVertical || "#e0e0e0"}; border-radius: 0px; padding: 0px; font-size: 1px; line-height: 1px; height: 100%; min-height: 200px;">&nbsp;</td>
<td style="width: ${getSpacing(signatureData.spacings?.global, 12)}px;">&nbsp;</td>` : '';

  // ========== FONCTIONS HELPER POUR GÉNÉRER CHAQUE ÉLÉMENT ==========
  
  // Générer l'élément photo
  const generatePhotoElement = () => {
    if (!signatureData.photo || signatureData.photoVisible === false) return "";
    return `<tr>
<td style="padding: ${getPaddingStyle('photo', { bottom: getSpacing(signatureData.spacings?.photoBottom, 12) })};">
${profileImageHTML}
</td>
</tr>`;
  };

  // Générer l'élément nom complet
  const generateFullNameElement = () => {
    return `<tr>
<td colspan="2" style="text-align: ${signatureData.nameAlignment || "left"}; padding: ${getPaddingStyle('name', { bottom: 8 })};">
<span style="font-size: ${getTypography("fullName", "fontSize", 16)}px; font-weight: ${getTypography("fullName", "fontWeight", "bold")}; color: ${getTypography("fullName", "color", signatureData.primaryColor || "#171717")}; line-height: 1.2; font-family: ${getTypography("fullName", "fontFamily", "Arial, sans-serif")}; font-style: ${getTypography("fullName", "fontStyle", "normal")}; display: inline-block;">
${getTypography("fullName", "textDecoration", "none") === "underline" ? `<u>${signatureData.fullName || ""}</u>` : signatureData.fullName || ""}
</span>
</td>
</tr>`;
  };

  // Générer l'élément poste
  const generatePositionElement = () => {
    if (!signatureData.position) return "";
    return `<tr>
<td colspan="2" style="padding: ${getPaddingStyle('position', { bottom: getSpacing(signatureData.spacings?.positionBottom, 8) })}; text-align: ${signatureData.nameAlignment || "left"};">
<span style="font-size: ${getTypography("position", "fontSize", 14)}px; color: ${getTypography("position", "color", "rgb(102,102,102)")}; font-family: ${getTypography("position", "fontFamily", "Arial, sans-serif")}; font-weight: ${getTypography("position", "fontWeight", "normal")}; font-style: ${getTypography("position", "fontStyle", "normal")}; white-space: nowrap; display: inline-block;">
${getTypography("position", "textDecoration", "none") === "underline" ? `<u>${signatureData.position}</u>` : signatureData.position}
</span>
</td>
</tr>`;
  };

  // Générer l'élément contact (téléphone, mobile, email, site web, adresse)
  const generateContactElement = () => {
    let contactHTML = "";
    
    if (signatureData.phone && (signatureData.showPhoneIcon ?? true)) {
      contactHTML += `<tr>
<td colspan="2" style="padding: ${getPaddingStyle('phone', { bottom: getSpacing(signatureData.spacings?.phoneToMobile, 8) })};">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
<tbody>
<tr>
<td style="padding-right: 8px; vertical-align: middle;">
<img src="${getOptimizedIconUrl('https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/smartphone.png', 16)}" alt="Téléphone" width="16" height="16" style="width: 16px; height: 16px; display: block;" />
</td>
<td style="font-size: ${getTypography("phone", "fontSize", 12)}px; color: ${getTypography("phone", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("phone", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("phone", "fontFamily", "Arial, sans-serif")}; font-style: ${getTypography("phone", "fontStyle", "normal")};">
${getTypography("phone", "textDecoration", "none") === "underline" ? `<u>${escapeForGmail(signatureData.phone, 'phone')}</u>` : escapeForGmail(signatureData.phone, 'phone')}
</td>
</tr>
</tbody>
</table>
</td>
</tr>`;
    }
    
    if (signatureData.mobile && (signatureData.showMobileIcon ?? true)) {
      contactHTML += `<tr>
<td colspan="2" style="padding: ${getPaddingStyle('mobile', { bottom: getSpacing(signatureData.spacings?.mobileToEmail, 8) })};">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
<tbody>
<tr>
<td style="padding-right: 8px; vertical-align: middle;">
<img src="${getOptimizedIconUrl('https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/phone.png', 16)}" alt="Mobile" width="16" height="16" style="width: 16px; height: 16px; display: block;" />
</td>
<td style="font-size: ${getTypography("mobile", "fontSize", 12)}px; color: ${getTypography("mobile", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("mobile", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("mobile", "fontFamily", "Arial, sans-serif")}; font-style: ${getTypography("mobile", "fontStyle", "normal")};">
${getTypography("mobile", "textDecoration", "none") === "underline" ? `<u>${escapeForGmail(signatureData.mobile, 'phone')}</u>` : escapeForGmail(signatureData.mobile, 'phone')}
</td>
</tr>
</tbody>
</table>
</td>
</tr>`;
    }
    
    if (signatureData.email && (signatureData.showEmailIcon ?? true)) {
      contactHTML += `<tr>
<td colspan="2" style="padding: ${getPaddingStyle('email', { bottom: getSpacing(signatureData.spacings?.emailToWebsite, 8) })};">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
<tbody>
<tr>
<td style="padding-right: 8px; vertical-align: middle;">
<img src="${getOptimizedIconUrl('https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/mail.png', 16)}" alt="Email" width="16" height="16" style="width: 16px; height: 16px; display: block;" />
</td>
<td style="font-size: ${getTypography("email", "fontSize", 12)}px; color: ${getTypography("email", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("email", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("email", "fontFamily", "Arial, sans-serif")}; font-style: ${getTypography("email", "fontStyle", "normal")};">
${getTypography("email", "textDecoration", "none") === "underline" ? `<u>${escapeForGmail(signatureData.email, 'email')}</u>` : escapeForGmail(signatureData.email, 'email')}
</td>
</tr>
</tbody>
</table>
</td>
</tr>`;
    }
    
    if (signatureData.website && (signatureData.showWebsiteIcon ?? true)) {
      contactHTML += `<tr>
<td colspan="2" style="padding: ${getPaddingStyle('website', { bottom: getSpacing(signatureData.spacings?.websiteToAddress, 8) })};">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
<tbody>
<tr>
<td style="padding-right: 8px; vertical-align: middle;">
<img src="${getOptimizedIconUrl('https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/globe.png', 16)}" alt="Site web" width="16" height="16" style="width: 16px; height: 16px; display: block;" />
</td>
<td style="font-size: ${getTypography("website", "fontSize", 12)}px; color: ${getTypography("website", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("website", "fontWeight", "normal")}; vertical-align: middle; font-family: ${getTypography("website", "fontFamily", "Arial, sans-serif")}; font-style: ${getTypography("website", "fontStyle", "normal")};">
${getTypography("website", "textDecoration", "none") === "underline" ? `<u>${escapeForGmail(signatureData.website, 'website')}</u>` : escapeForGmail(signatureData.website, 'website')}
</td>
</tr>
</tbody>
</table>
</td>
</tr>`;
    }
    
    if (signatureData.address && (signatureData.showAddressIcon ?? true)) {
      contactHTML += `<tr>
<td colspan="2" style="padding: ${getPaddingStyle('address', { bottom: getSpacing(signatureData.spacings?.contactBottom, 8) })};">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
<tbody>
<tr>
<td style="padding-right: 8px;">
<img src="${getOptimizedIconUrl('https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/map-pin.png', 16)}" alt="Adresse" width="16" height="16" style="width: 16px; height: 16px; display: block; margin-top: 1px;" />
</td>
<td style="font-size: ${getTypography("address", "fontSize", 12)}px; color: ${getTypography("address", "color", "rgb(102,102,102)")}; font-weight: ${getTypography("address", "fontWeight", "normal")}; font-family: ${getTypography("address", "fontFamily", "Arial, sans-serif")}; font-style: ${getTypography("address", "fontStyle", "normal")};">
${getTypography("address", "textDecoration", "none") === "underline" ? `<u>${signatureData.address}</u>` : signatureData.address}
</td>
</tr>
</tbody>
</table>
</td>
</tr>`;
    }
    
    return contactHTML;
  };

  // Générer l'élément séparateur horizontal
  const generateSeparatorElement = (isFullWidth = false) => {
    if (!signatureData.separatorHorizontalEnabled) return "";
    return `<tr>
<td colspan="${isFullWidth ? colSpan : 2}" style="padding-top: ${getSpacing(signatureData.spacings?.separatorTop, 8)}px; padding-bottom: ${getSpacing(signatureData.spacings?.separatorBottom, 8)}px;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
<tbody>
<tr>
<td style="border-top: ${signatureData.separatorHorizontalWidth || 1}px solid ${signatureData.colors?.separatorHorizontal || "#e0e0e0"}; line-height: 1px; font-size: 1px;">&nbsp;</td>
</tr>
</tbody>
</table>
</td>
</tr>`;
  };

  // Générer l'élément logo
  const generateLogoElement = (isFullWidth = false) => {
    if (!logoHTML || signatureData.logoVisible === false) return "";
    return `<tr>
<td colspan="${isFullWidth ? colSpan : 2}" style="padding-top: ${getSpacing(signatureData.spacings?.logoBottom, signatureData.spacings?.global || 8)}px; padding-bottom: 0; padding-left: 0; padding-right: 0; margin: 0; text-align: left;">
${logoHTML}
</td>
</tr>`;
  };

  // Générer l'élément réseaux sociaux
  const generateSocialElement = (isFullWidth = false) => {
    if (!socialIconsHTML) return "";
    return `<tr>
<td colspan="${isFullWidth ? colSpan : 2}" style="padding-top: ${getSpacing(signatureData.spacings?.logoToSocial, 15)}px; text-align: left;">
${socialIconsHTML}
</td>
</tr>`;
  };

  // Fonction pour générer un élément selon son ID
  const generateElementById = (elementId, isFullWidth = false) => {
    switch (elementId) {
      case "photo": return generatePhotoElement();
      case "fullName": return generateFullNameElement();
      case "position": return generatePositionElement();
      case "contact": return generateContactElement();
      case "separator": return generateSeparatorElement(isFullWidth);
      case "logo": return generateLogoElement(isFullWidth);
      case "social": return generateSocialElement(isFullWidth);
      default: return "";
    }
  };

  // ========== LAYOUT PAR DÉFAUT ==========
  const DEFAULT_HORIZONTAL_LAYOUT = {
    leftColumn: ["photo", "fullName", "position"],
    rightColumn: ["contact"],
    bottomRow: ["separator", "logo", "social"],
  };

  // Si orientation verticale, générer la structure verticale
  if (isVertical) {
    const htmlResult = `
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: auto; max-width: 400px; margin: 0 auto; table-layout: auto; font-family: ${signatureData.fontFamily || "Arial, sans-serif"};">
<tbody>
${signatureData.photo && signatureData.photoVisible !== false ? `
<!-- Photo de profil (centrée) -->
<tr>
<td style="padding: ${getPaddingStyle('photo', { bottom: getSpacing(signatureData.spacings?.photoBottom, 16) })}; text-align: center;">
<div style="margin: 0 auto; width: fit-content;">
${profileImageHTML}
</div>
</td>
</tr>` : ""}
<!-- Nom complet (centré) -->
<tr>
<td style="text-align: center; padding: ${getPaddingStyle('name', { bottom: 8 })};">
<span style="font-family: ${getTypography("fullName", "fontFamily", "Arial, sans-serif")}; font-size: ${getTypography("fullName", "fontSize", 16)}px; font-weight: ${getTypography("fullName", "fontWeight", "bold")}; color: ${getTypography("fullName", "color", signatureData.primaryColor || "#171717")}; line-height: 1.2; font-style: ${getTypography("fullName", "fontStyle", "normal")}; display: inline-block;">
${getTypography("fullName", "textDecoration", "none") === "underline" ? `<u>${signatureData.fullName || ""}</u>` : signatureData.fullName || ""}
</span>
</td>
</tr>
${signatureData.position ? `
<!-- Poste (centré) -->
<tr>
<td style="padding: ${getPaddingStyle('position', { bottom: getSpacing(signatureData.spacings?.positionBottom, 8) })}; white-space: nowrap; text-align: center;">
<span style="font-family: ${getTypography("position", "fontFamily", "Arial, sans-serif")}; font-size: ${getTypography("position", "fontSize", 14)}px; color: ${getTypography("position", "color", "#666666")}; font-weight: ${getTypography("position", "fontWeight", "normal")}; font-style: ${getTypography("position", "fontStyle", "normal")}; display: inline-block;">
${getTypography("position", "textDecoration", "none") === "underline" ? `<u>${signatureData.position}</u>` : signatureData.position}
</span>
</td>
</tr>` : ""}
${signatureData.companyName ? `
<!-- Entreprise (centré) -->
<tr>
<td style="padding: ${getPaddingStyle('company', { bottom: 12 })}; text-align: center;">
<span style="font-family: ${getTypography("company", "fontFamily", "Arial, sans-serif")}; font-size: ${getTypography("company", "fontSize", 14)}px; font-weight: ${getTypography("company", "fontWeight", "bold")}; color: ${getTypography("company", "color", signatureData.primaryColor || "#171717")}; font-style: ${getTypography("company", "fontStyle", "normal")}; text-decoration: ${getTypography("company", "textDecoration", "none")}; display: inline-block;">
${signatureData.companyName}
</span>
</td>
</tr>` : ""}
${signatureData.separatorHorizontalEnabled ? `
<!-- Séparateur horizontal (centré) -->
<tr>
<td style="padding-top: ${getSpacing(signatureData.spacings?.separatorTop, 12)}px; padding-bottom: ${getSpacing(signatureData.spacings?.separatorBottom, 12)}px; text-align: center;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0 auto;">
<tbody>
<tr>
<td style="border-top: ${signatureData.separatorHorizontalWidth || 1}px solid ${signatureData.colors?.separatorHorizontal || "#e0e0e0"}; width: 100px; line-height: 1px; font-size: 1px;">&nbsp;</td>
</tr>
</tbody>
</table>
</td>
</tr>` : ""}
<!-- Informations de contact (centrées) -->
<tr>
<td style="text-align: center;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0 auto;">
<tbody>
${signatureData.phone && (signatureData.showPhoneIcon ?? true) ? `
<tr>
<td style="padding: ${getPaddingStyle('phone', { bottom: getSpacing(signatureData.spacings?.phoneToMobile, 8) })}; text-align: center;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0 auto;">
<tbody>
<tr>
<td style="padding-right: 8px; vertical-align: middle;">
<img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/smartphone.png" alt="Téléphone" width="16" height="16" style="width: 16px; height: 16px; display: block; margin-top: 0px;" />
</td>
<td style="font-size: ${getTypography("phone", "fontSize", 12)}px; color: ${getTypography("phone", "color", "rgb(102,102,102)")}; font-family: ${getTypography("phone", "fontFamily", "Arial, sans-serif")}; font-weight: ${getTypography("phone", "fontWeight", "normal")}; font-style: ${getTypography("phone", "fontStyle", "normal")}; vertical-align: middle;">
${getTypography("phone", "textDecoration", "none") === "underline" ? `<u>${escapeForGmail(signatureData.phone, 'phone')}</u>` : escapeForGmail(signatureData.phone, 'phone')}
</td>
</tr>
</tbody>
</table>
</td>
</tr>` : ""}
${signatureData.mobile && (signatureData.showMobileIcon ?? true) ? `
<tr>
<td style="padding: ${getPaddingStyle('mobile', { bottom: getSpacing(signatureData.spacings?.mobileToEmail, 8) })}; text-align: center;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0 auto;">
<tbody>
<tr>
<td style="padding-right: 8px; vertical-align: middle;">
<img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/phone.png" alt="Mobile" width="16" height="16" style="width: 16px; height: 16px; display: block; margin-top: 0px;" />
</td>
<td style="font-size: ${getTypography("mobile", "fontSize", 12)}px; color: ${getTypography("mobile", "color", "rgb(102,102,102)")}; font-family: ${getTypography("mobile", "fontFamily", "Arial, sans-serif")}; font-weight: ${getTypography("mobile", "fontWeight", "normal")}; font-style: ${getTypography("mobile", "fontStyle", "normal")}; vertical-align: middle;">
${getTypography("mobile", "textDecoration", "none") === "underline" ? `<u>${escapeForGmail(signatureData.mobile, 'phone')}</u>` : escapeForGmail(signatureData.mobile, 'phone')}
</td>
</tr>
</tbody>
</table>
</td>
</tr>` : ""}
${signatureData.email && (signatureData.showEmailIcon ?? true) ? `
<tr>
<td style="padding: ${getPaddingStyle('email', { bottom: getSpacing(signatureData.spacings?.emailToWebsite, 8) })}; text-align: center;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0 auto;">
<tbody>
<tr>
<td style="padding-right: 8px; vertical-align: middle;">
<img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/mail.png" alt="Email" width="16" height="16" style="width: 16px; height: 16px; display: block; margin-top: 0px;" />
</td>
<td style="font-size: ${getTypography("email", "fontSize", 12)}px; color: ${getTypography("email", "color", "rgb(102,102,102)")}; font-family: ${getTypography("email", "fontFamily", "Arial, sans-serif")}; font-weight: ${getTypography("email", "fontWeight", "normal")}; font-style: ${getTypography("email", "fontStyle", "normal")}; vertical-align: middle;">
${getTypography("email", "textDecoration", "none") === "underline" ? `<u>${escapeForGmail(signatureData.email, 'email')}</u>` : escapeForGmail(signatureData.email, 'email')}
</td>
</tr>
</tbody>
</table>
</td>
</tr>` : ""}
${signatureData.website && (signatureData.showWebsiteIcon ?? true) ? `
<tr>
<td style="padding: ${getPaddingStyle('website', { bottom: getSpacing(signatureData.spacings?.websiteToAddress, 8) })}; text-align: center;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0 auto;">
<tbody>
<tr>
<td style="padding-right: 8px; vertical-align: middle;">
<img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/globe.png" alt="Site web" width="16" height="16" style="width: 16px; height: 16px; display: block; margin-top: 0px;" />
</td>
<td style="font-size: ${getTypography("website", "fontSize", 12)}px; color: ${getTypography("website", "color", "rgb(102,102,102)")}; font-family: ${getTypography("website", "fontFamily", "Arial, sans-serif")}; font-weight: ${getTypography("website", "fontWeight", "normal")}; font-style: ${getTypography("website", "fontStyle", "normal")}; vertical-align: middle;">
${getTypography("website", "textDecoration", "none") === "underline" ? `<u>${escapeForGmail(signatureData.website, 'website')}</u>` : escapeForGmail(signatureData.website, 'website')}
</td>
</tr>
</tbody>
</table>
</td>
</tr>` : ""}
${signatureData.address && (signatureData.showAddressIcon ?? true) ? `
<tr>
<td style="padding: ${getPaddingStyle('address', { bottom: getSpacing(signatureData.spacings?.contactBottom, 8) })}; text-align: center;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 0 auto;">
<tbody>
<tr>
<td style="padding-right: 8px;">
<img src="https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/map-pin.png" alt="Adresse" width="16" height="16" style="width: 16px; height: 16px; display: block; margin-top: 1px;" />
</td>
<td style="font-size: ${getTypography("address", "fontSize", 12)}px; color: ${getTypography("address", "color", "rgb(102,102,102)")}; font-family: ${getTypography("address", "fontFamily", "Arial, sans-serif")}; font-weight: ${getTypography("address", "fontWeight", "normal")}; font-style: ${getTypography("address", "fontStyle", "normal")}; display: inline-block;">
${getTypography("address", "textDecoration", "none") === "underline" ? `<u>${signatureData.address}</u>` : signatureData.address}
</td>
</tr>
</tbody>
</table>
</td>
</tr>` : ""}
</tbody>
</table>
</td>
</tr>
${logoHTML && signatureData.logoVisible !== false ? `
<!-- Logo entreprise (centré) -->
<tr>
<td style="padding-top: ${getSpacing(signatureData.spacings?.logoBottom, signatureData.spacings?.global || 8)}px; text-align: center;">
<div style="margin: 0 auto; width: fit-content;">
${logoHTML}
</div>
</td>
</tr>` : ""}
${socialIconsHTML ? `
<!-- Réseaux sociaux (centrés) -->
<tr>
<td style="padding-top: ${getSpacing(signatureData.spacings?.logoToSocial, 16)}px; text-align: center;">
${socialIconsHTML}
</td>
</tr>` : ""}
</tbody>
</table>
`;
    return htmlResult;
  }

  // Structure horizontale dynamique basée sur horizontalLayout
  const layout = signatureData.horizontalLayout || DEFAULT_HORIZONTAL_LAYOUT;
  const leftColumn = layout.leftColumn || DEFAULT_HORIZONTAL_LAYOUT.leftColumn;
  const rightColumn = layout.rightColumn || DEFAULT_HORIZONTAL_LAYOUT.rightColumn;
  const bottomRow = layout.bottomRow || DEFAULT_HORIZONTAL_LAYOUT.bottomRow;

  // Générer le HTML pour chaque colonne
  const leftColumnHTML = leftColumn.map(elementId => generateElementById(elementId, false)).join("");
  const rightColumnHTML = rightColumn.map(elementId => generateElementById(elementId, false)).join("");
  const bottomRowHTML = bottomRow.map(elementId => generateElementById(elementId, true)).join("");

  const htmlResult = `
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: auto; max-width: 600px; table-layout: auto; font-family: ${signatureData.fontFamily || "Arial, sans-serif"};">
<tbody>
<tr>
<!-- Colonne gauche -->
<td style="vertical-align: top; padding-right: ${signatureData.separatorVerticalEnabled ? getSpacing(signatureData.spacings?.global, 12) : 0}px;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: auto;">
<tbody>
${leftColumnHTML}
</tbody>
</table>
</td>
${verticalSeparatorHTML}
<!-- Colonne droite -->
<td style="vertical-align: ${signatureData.contactAlignment || "top"}; padding-left: ${signatureData.separatorVerticalEnabled ? getSpacing(signatureData.spacings?.global, 12) : 0}px;">
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: auto;">
<tbody>
${rightColumnHTML}
</tbody>
</table>
</td>
</tr>
<!-- Zone du bas (pleine largeur) -->
${bottomRowHTML}
</tbody>
</table>
`;
  
  return htmlResult;
}
