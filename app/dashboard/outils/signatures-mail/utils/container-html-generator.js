/**
 * Container HTML Generator - Converts container structure to email-compatible HTML
 *
 * Features:
 * - Table-based layout for email client compatibility
 * - Inline styles only (no external CSS)
 * - VML support for Outlook rounded images
 * - Gmail link detection prevention
 */

import { ELEMENT_TYPES } from './block-registry';

// Cloudflare R2 base URL for social icons (même URL que BlockElement.jsx)
const CLOUDFLARE_SOCIAL_BASE = "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social";

// Function to get social icon URL from Cloudflare
const getSocialIconUrl = (platform, color = "black") => {
  // x -> twitter pour le nom du fichier
  const cloudflareplatform = platform === "x" ? "twitter" : platform;
  return `${CLOUDFLARE_SOCIAL_BASE}/${cloudflareplatform}/${cloudflareplatform}-${color}.png`;
};

// Function to convert hex color to color name for Cloudflare (même logique que BlockElement.jsx)
const getColorName = (colorInput) => {
  if (!colorInput) return "black";
  const color = colorInput.toLowerCase().trim();

  // Si c'est déjà un nom de couleur valide
  const validColorNames = ["blue", "pink", "purple", "black", "red", "green", "yellow", "orange", "indigo", "sky", "white"];
  if (validColorNames.includes(color)) return color;

  // Conversion hex -> nom de couleur
  const hexColor = color.replace("#", "");
  const colorMap = {
    "0077b5": "blue",
    "1877f2": "blue",
    "e4405f": "pink",
    "833ab4": "purple",
    "000000": "black",
    "171717": "black",
    "1da1f2": "blue",
    "ff0000": "red",
    "333333": "black",
    "5a50ff": "purple",
    "3b82f6": "blue",
    "ef4444": "red",
    "22c55e": "green",
    "f59e0b": "orange",
    "ffffff": "white",
  };
  return colorMap[hexColor] || "black";
};

/**
 * Helper to escape text for Gmail (prevent auto-link detection)
 */
function escapeForGmail(text, type) {
  if (!text) return text;

  const wj = '&#8288;'; // Word Joiner
  const zwsp = '&#8203;'; // Zero-Width Space

  if (type === 'email') {
    return text.replace(/@/g, `@${wj}`).replace(/\./g, `.${wj}`);
  }

  if (type === 'website') {
    let cleanUrl = text.replace(/^https?:\/\//i, '');
    return cleanUrl.replace(/\./g, `.${wj}`);
  }

  if (type === 'phone') {
    return text.replace(/(\d)/g, `$1${zwsp}`);
  }

  return text;
}

/**
 * Generate HTML for a single element
 * @param {Object} element - The element to render
 * @param {Object} signatureData - The signature data
 * @param {string} parentLayout - The parent container's layout ('vertical' or 'horizontal')
 */
function generateElementHTML(element, signatureData, parentLayout = 'vertical') {
  const props = element.props || {};
  const type = element.type;

  switch (type) {
    case ELEMENT_TYPES.NAME: {
      const name = `${signatureData.firstName || ''} ${signatureData.lastName || ''}`.trim();
      if (!name) return '';

      const fontSize = props.fontSize || 14;
      const fontWeight = props.fontWeight || '700';
      const color = props.color || '#171717';
      const fontFamily = props.fontFamily || signatureData.fontFamily || 'Arial, sans-serif';
      const fontStyle = props.fontStyle || 'normal';
      const textAlign = props.textAlign || 'left';

      return `<div style="font-size: ${fontSize}px; font-weight: ${fontWeight}; color: ${color}; font-family: ${fontFamily}; font-style: ${fontStyle}; text-align: ${textAlign}; line-height: 1.4; margin: 0; padding: 0;">${name}</div>`;
    }

    case ELEMENT_TYPES.POSITION: {
      const position = signatureData.position;
      if (!position) return '';

      const fontSize = props.fontSize || 12;
      const fontWeight = props.fontWeight || '400';
      const color = props.color || '#666666';
      const fontFamily = props.fontFamily || signatureData.fontFamily || 'Arial, sans-serif';
      const fontStyle = props.fontStyle || 'normal';
      const textAlign = props.textAlign || 'left';

      return `<div style="font-size: ${fontSize}px; font-weight: ${fontWeight}; color: ${color}; font-family: ${fontFamily}; font-style: ${fontStyle}; text-align: ${textAlign}; line-height: 1.4; margin: 0; padding: 0;">${position}</div>`;
    }

    case ELEMENT_TYPES.COMPANY: {
      const company = signatureData.companyName;
      if (!company) return '';

      const fontSize = props.fontSize || 12;
      const fontWeight = props.fontWeight || '500';
      const color = props.color || '#171717';
      const fontFamily = props.fontFamily || signatureData.fontFamily || 'Arial, sans-serif';
      const fontStyle = props.fontStyle || 'normal';
      const textAlign = props.textAlign || 'left';

      return `<div style="font-size: ${fontSize}px; font-weight: ${fontWeight}; color: ${color}; font-family: ${fontFamily}; font-style: ${fontStyle}; text-align: ${textAlign}; line-height: 1.4; margin: 0; padding: 0;">${company}</div>`;
    }

    case ELEMENT_TYPES.TEXT: {
      const content = props.content || '';
      if (!content) return '';

      const fontSize = props.fontSize || 12;
      const fontWeight = props.fontWeight || '400';
      const color = props.color || '#171717';
      const fontFamily = props.fontFamily || signatureData.fontFamily || 'Arial, sans-serif';
      const fontStyle = props.fontStyle || 'normal';
      const textAlign = props.textAlign || 'left';

      return `<div style="font-size: ${fontSize}px; font-weight: ${fontWeight}; color: ${color}; font-family: ${fontFamily}; font-style: ${fontStyle}; text-align: ${textAlign}; line-height: 1.4; margin: 0; padding: 0;">${content}</div>`;
    }

    case ELEMENT_TYPES.PHONE:
    case ELEMENT_TYPES.MOBILE: {
      const value = type === ELEMENT_TYPES.PHONE ? signatureData.phone : signatureData.mobile;
      if (!value) return '';

      const fontSize = props.fontSize || 12;
      const color = props.color || '#666666';
      const fontFamily = props.fontFamily || signatureData.fontFamily || 'Arial, sans-serif';
      const showIcon = props.showIcon !== false;
      const iconColor = props.iconColor || color;

      const icon = showIcon ? `<img src="https://pub-dd6ab45e76d24bfb9622b5737a421877.r2.dev/icons/${type === ELEMENT_TYPES.PHONE ? 'phone' : 'smartphone'}-${getColorName(iconColor)}.png" alt="" width="14" height="14" style="vertical-align: middle; margin-right: 6px; display: inline-block;" />` : '';

      return `<div style="font-size: ${fontSize}px; color: ${color}; font-family: ${fontFamily}; line-height: 1.4; margin: 0; padding: 0;">${icon}<span>${escapeForGmail(value, 'phone')}</span></div>`;
    }

    case ELEMENT_TYPES.EMAIL: {
      const email = signatureData.email;
      if (!email) return '';

      const fontSize = props.fontSize || 12;
      const color = props.color || '#666666';
      const fontFamily = props.fontFamily || signatureData.fontFamily || 'Arial, sans-serif';
      const showIcon = props.showIcon !== false;
      const iconColor = props.iconColor || color;

      const icon = showIcon ? `<img src="https://pub-dd6ab45e76d24bfb9622b5737a421877.r2.dev/icons/mail-${getColorName(iconColor)}.png" alt="" width="14" height="14" style="vertical-align: middle; margin-right: 6px; display: inline-block;" />` : '';

      return `<div style="font-size: ${fontSize}px; color: ${color}; font-family: ${fontFamily}; line-height: 1.4; margin: 0; padding: 0;">${icon}<a href="mailto:${email}" style="color: ${color}; text-decoration: none;">${escapeForGmail(email, 'email')}</a></div>`;
    }

    case ELEMENT_TYPES.WEBSITE: {
      const website = signatureData.website;
      if (!website) return '';

      const fontSize = props.fontSize || 12;
      const color = props.color || '#666666';
      const fontFamily = props.fontFamily || signatureData.fontFamily || 'Arial, sans-serif';
      const showIcon = props.showIcon !== false;
      const iconColor = props.iconColor || color;

      const icon = showIcon ? `<img src="https://pub-dd6ab45e76d24bfb9622b5737a421877.r2.dev/icons/globe-${getColorName(iconColor)}.png" alt="" width="14" height="14" style="vertical-align: middle; margin-right: 6px; display: inline-block;" />` : '';
      const href = website.startsWith('http') ? website : `https://${website}`;

      return `<div style="font-size: ${fontSize}px; color: ${color}; font-family: ${fontFamily}; line-height: 1.4; margin: 0; padding: 0;">${icon}<a href="${href}" style="color: ${color}; text-decoration: none;" target="_blank">${escapeForGmail(website, 'website')}</a></div>`;
    }

    case ELEMENT_TYPES.ADDRESS: {
      const address = signatureData.address;
      if (!address) return '';

      const fontSize = props.fontSize || 12;
      const color = props.color || '#666666';
      const fontFamily = props.fontFamily || signatureData.fontFamily || 'Arial, sans-serif';
      const showIcon = props.showIcon !== false;
      const iconColor = props.iconColor || color;

      const icon = showIcon ? `<img src="https://pub-dd6ab45e76d24bfb9622b5737a421877.r2.dev/icons/map-pin-${getColorName(iconColor)}.png" alt="" width="14" height="14" style="vertical-align: middle; margin-right: 6px; display: inline-block;" />` : '';

      return `<div style="font-size: ${fontSize}px; color: ${color}; font-family: ${fontFamily}; line-height: 1.4; margin: 0; padding: 0;">${icon}<span>${address}</span></div>`;
    }

    case ELEMENT_TYPES.PHOTO: {
      const photoUrl = signatureData.photo;
      if (!photoUrl) return '';

      const size = props.width || props.height || 60;
      const borderRadius = props.borderRadius || '50%';
      const isRound = borderRadius === '50%' || borderRadius === '100%';

      // Use wsrv.nl for image resizing
      const optimizedUrl = `https://wsrv.nl/?url=${encodeURIComponent(photoUrl)}&w=${size * 2}&h=${size * 2}&fit=cover&output=jpg&q=90`;

      if (isRound) {
        // VML for Outlook + standard img for other clients
        return `
          <!--[if gte mso 9]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" style="width:${size}px;height:${size}px;v-text-anchor:middle;" arcsize="50%" strokeweight="0" fillcolor="#FFFFFF">
            <v:fill type="frame" src="${optimizedUrl}" />
            <w:anchorlock/>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <img src="${optimizedUrl}" alt="Photo" width="${size}" height="${size}" style="width: ${size}px; height: ${size}px; border-radius: 50%; object-fit: cover; display: block;" />
          <!--<![endif]-->
        `.trim();
      }

      return `<img src="${optimizedUrl}" alt="Photo" width="${size}" height="${size}" style="width: ${size}px; height: ${size}px; border-radius: ${borderRadius}; object-fit: cover; display: block;" />`;
    }

    case ELEMENT_TYPES.LOGO: {
      const logoUrl = signatureData.logo || signatureData.companyLogo;
      if (!logoUrl) return '';

      const maxWidth = props.maxWidth || 100;
      const height = signatureData.logoSize || props.maxHeight || 32;

      return `<img src="${logoUrl}" alt="Logo" style="max-width: ${maxWidth}px; height: ${height}px; object-fit: contain; display: block;" />`;
    }

    case ELEMENT_TYPES.SEPARATOR_LINE: {
      // L'orientation du séparateur dépend du layout du parent:
      // - Parent vertical (colonne) → séparateur horizontal
      // - Parent horizontal (ligne) → séparateur vertical
      const autoOrientation = parentLayout === 'horizontal' ? 'vertical' : 'horizontal';
      const thickness = props.thickness || 1;
      const color = props.color || '#e0e0e0';

      if (autoOrientation === 'vertical') {
        return `<div style="width: ${thickness}px; min-width: ${thickness}px; height: 100%; min-height: 30px; background-color: ${color};"></div>`;
      }

      return `<div style="width: 100%; height: ${thickness}px; min-height: ${thickness}px; background-color: ${color};"></div>`;
    }

    case ELEMENT_TYPES.SPACER: {
      const height = props.height || 8;
      return `<div style="height: ${height}px; line-height: ${height}px; font-size: 1px;">&nbsp;</div>`;
    }

    case ELEMENT_TYPES.SOCIAL_ICONS: {
      const networksData = signatureData.socialNetworks || {};
      const socialColors = signatureData.socialColors || {};
      const globalColor = signatureData.socialGlobalColor || props.color || 'black';
      const size = props.size || 20;
      const gap = props.gap || 6;
      const alignment = props.alignment || 'left';

      const alignStyle = alignment === 'center' ? 'center' : alignment === 'right' ? 'right' : 'left';

      // Même logique que BlockElement.jsx: afficher tous les réseaux présents
      const hasNetworks = Object.keys(networksData).length > 0;
      const defaultNetworks = ['facebook', 'linkedin', 'x'];
      const networksToShow = hasNetworks ? Object.keys(networksData) : defaultNetworks;

      const iconsHTML = networksToShow
        .map((networkName) => {
          const networkData = networksData[networkName] || {};
          // Couleur par réseau ou couleur globale
          const color = socialColors[networkName] || globalColor || 'black';
          const colorName = getColorName(color);
          const iconUrl = getSocialIconUrl(networkName.toLowerCase(), colorName);

          // Si URL valide (pas # et pas vide), créer un lien
          const hasValidUrl = networkData.url && networkData.url !== '#' && networkData.url.trim() !== '';

          if (hasValidUrl) {
            return `<a href="${networkData.url}" target="_blank" style="display: inline-block; margin-right: ${gap}px; text-decoration: none;"><img src="${iconUrl}" alt="${networkName}" width="${size}" height="${size}" style="width: ${size}px; height: ${size}px; display: block; border: 0;" /></a>`;
          } else {
            // Sans lien, juste l'image
            return `<img src="${iconUrl}" alt="${networkName}" width="${size}" height="${size}" style="width: ${size}px; height: ${size}px; display: inline-block; margin-right: ${gap}px; border: 0;" />`;
          }
        })
        .join('');

      if (!iconsHTML) return '';

      return `<div style="text-align: ${alignStyle};">${iconsHTML}</div>`;
    }

    default:
      return '';
  }
}

/**
 * Generate HTML for a container (recursive)
 * @param {Object} container - The container to render
 * @param {Object} signatureData - The signature data
 * @param {number} depth - Current depth level
 * @param {string} grandparentLayout - The layout of the parent's parent (for separators)
 */
function generateContainerHTML(container, signatureData, depth = 0, grandparentLayout = 'vertical') {
  if (!container) return '';

  const layout = container.layout || 'vertical';
  const alignment = container.alignment || 'start';
  // Utiliser les mêmes valeurs par défaut que ContainerNode.jsx
  const padding = container.padding ?? 12;
  const gap = container.gap ?? 12;
  const width = container.width;
  const height = container.height;

  // Map alignment to CSS
  const alignmentMap = {
    start: 'left',
    center: 'center',
    end: 'right',
  };
  const verticalAlignMap = {
    start: 'top',
    center: 'middle',
    end: 'bottom',
  };
  const textAlign = alignmentMap[alignment] || 'left';
  const verticalAlign = verticalAlignMap[alignment] || 'top';

  // Build elements with metadata (for detecting separators)
  const elementsWithMeta = (container.elements || []).map(element => {
    const isSeparator = element.type === ELEMENT_TYPES.SEPARATOR_LINE;
    const isSingleElement = container.elements.length === 1;
    // Séparateur seul: utiliser le layout du grandparent
    const effectiveLayout = (isSeparator && isSingleElement) ? grandparentLayout : layout;
    return {
      type: 'element',
      element,
      isSeparator,
      html: generateElementHTML(element, signatureData, effectiveLayout),
    };
  }).filter(item => item.html);

  const childrenWithMeta = (container.children || []).map(child => {
    // Check if child is a separator-only container
    const childHasSeparatorOnly = child.elements?.length === 1 &&
      child.elements[0].type === ELEMENT_TYPES.SEPARATOR_LINE &&
      (!child.children || child.children.length === 0);

    return {
      type: 'child',
      child,
      isSeparator: childHasSeparatorOnly,
      separatorElement: childHasSeparatorOnly ? child.elements[0] : null,
      html: generateContainerHTML(child, signatureData, depth + 1, layout),
    };
  }).filter(item => item.html);

  const allContent = [...elementsWithMeta, ...childrenWithMeta];

  if (allContent.length === 0) return '';

  // Build container style
  let containerStyle = `padding: ${padding}px;`;
  if (width) containerStyle += ` width: ${width}px;`;
  if (height) containerStyle += ` height: ${height}px;`;

  if (layout === 'horizontal') {
    // Horizontal layout: use table with cells in a row
    const cellsHTML = allContent.map((item, index) => {
      const isLast = index === allContent.length - 1;
      const isFirst = index === 0;
      const prevIsSeparator = index > 0 && allContent[index - 1].isSeparator;
      const nextIsSeparator = index < allContent.length - 1 && allContent[index + 1].isSeparator;

      if (item.isSeparator) {
        // Extraire directement les props du séparateur (soit de l'élément direct, soit du conteneur séparateur)
        const separatorEl = item.element || item.separatorElement;
        const props = separatorEl?.props || {};
        const separatorWidth = props.thickness || 1;
        const separatorColor = props.color || '#e0e0e0';

        // Pour email: utiliser une cellule avec background-color directement
        // Le gap est ajouté via des cellules vides de chaque côté pour l'espacement symétrique
        return `<td style="width: ${gap}px; padding: 0;"></td><td style="width: ${separatorWidth}px; background-color: ${separatorColor}; padding: 0;"></td><td style="width: ${gap}px; padding: 0;"></td>`;
      }

      // Pour les éléments non-séparateurs:
      // - Pas de padding à gauche si premier
      // - Pas de padding à droite si dernier OU si le suivant est un séparateur (le séparateur gère son propre espacement)
      let paddingRight = (isLast || nextIsSeparator) ? 0 : gap;

      const cellPadding = `0 ${paddingRight}px 0 0`;
      return `<td style="vertical-align: ${verticalAlign}; padding: ${cellPadding};">${item.html}</td>`;
    }).join('');

    return `
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; ${containerStyle}">
        <tr>${cellsHTML}</tr>
      </table>
    `.trim();
  } else {
    // Vertical layout: use table with cells in rows
    const rowsHTML = allContent.map((item, index) => {
      const isLast = index === allContent.length - 1;
      const cellPadding = isLast ? '0' : `0 0 ${gap}px 0`;

      // Pour les séparateurs horizontaux (dans un layout vertical), utiliser directement le div
      if (item.isSeparator) {
        const separatorEl = item.element || item.separatorElement;
        const props = separatorEl?.props || {};
        const separatorHeight = props.thickness || 1;
        const separatorColor = props.color || '#e0e0e0';
        return `<tr><td style="padding: ${cellPadding};"><div style="width: 100%; height: ${separatorHeight}px; background-color: ${separatorColor};"></div></td></tr>`;
      }

      return `<tr><td style="text-align: ${textAlign}; padding: ${cellPadding};">${item.html}</td></tr>`;
    }).join('');

    return `
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; ${containerStyle}">
        ${rowsHTML}
      </table>
    `.trim();
  }
}

/**
 * Main function: Generate complete email-compatible HTML from container structure
 */
export function generateSignatureHTMLFromContainer(rootContainer, signatureData) {
  try {
    if (!rootContainer) {
      return '';
    }

    const fontFamily = signatureData?.fontFamily || 'Arial, sans-serif';
    const containerHTML = generateContainerHTML(rootContainer, signatureData);

    if (!containerHTML) {
      return '';
    }

    // Wrap in outer table for email clients
    return `
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-family: ${fontFamily}; max-width: 600px;">
        <tr>
          <td style="padding: 0;">
            ${containerHTML}
          </td>
        </tr>
      </table>
    `.trim();
  } catch (error) {
    console.error('[generateSignatureHTMLFromContainer] Error:', error);
    throw error;
  }
}

/**
 * Generate plain text version of the signature
 */
export function generatePlainTextFromContainer(rootContainer, signatureData) {
  const lines = [];

  const name = `${signatureData.firstName || ''} ${signatureData.lastName || ''}`.trim();
  if (name) lines.push(name);
  if (signatureData.position) lines.push(signatureData.position);
  if (signatureData.companyName) lines.push(signatureData.companyName);

  lines.push('---');

  if (signatureData.phone) lines.push(`Tel: ${signatureData.phone}`);
  if (signatureData.mobile) lines.push(`Mobile: ${signatureData.mobile}`);
  if (signatureData.email) lines.push(`Email: ${signatureData.email}`);
  if (signatureData.website) lines.push(`Web: ${signatureData.website}`);
  if (signatureData.address) lines.push(`Adresse: ${signatureData.address}`);

  return lines.join('\n');
}
