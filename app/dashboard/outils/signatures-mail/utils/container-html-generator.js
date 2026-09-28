/**
 * Container HTML Generator - Converts container structure to email-compatible HTML
 *
 * Features:
 * - Table-based layout for email client compatibility
 * - Inline styles only (no external CSS)
 * - VML support for Outlook rounded images
 * - Gmail link detection prevention
 */

import { ELEMENT_TYPES } from "./block-registry";

import {
  getSocialIconUrl,
  getSocialColorName as getColorName,
  getContactIconUrl,
} from "./social-icons";

/**
 * Échappe un texte destiné à un noeud de texte HTML.
 * Sans cela, un nom ou un texte libre contenant & < > casse la signature
 * collée dans le client mail (ou y injecte du balisage).
 */
function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Échappe une valeur destinée à un attribut HTML entre guillemets doubles
 * (href, alt, src...). Empêche la valeur de sortir de l'attribut.
 */
function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

/**
 * Numéro de téléphone utilisable dans un href tel:
 */
function telHref(value) {
  const cleaned = String(value).replace(/[^\d+]/g, "");
  return cleaned.startsWith("+") ? cleaned : cleaned.replace(/^00/, "+");
}

/**
 * Reset appliqué à chaque <table> générée : Outlook ajoute sinon ~7,5pt
 * d'espace de part et d'autre de chaque table, qui se cumulent avec
 * l'imbrication des conteneurs.
 */
const TABLE_RESET =
  "border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;";

/**
 * Complète une URL saisie sans protocole (ex. "calendly.com/moi").
 * Sans cela le href est relatif et le lien est cassé dans tous les webmails.
 */
function normalizeUrl(value) {
  const url = String(value || "").trim();
  if (!url || url === "#") return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return `https://${url}`;
}

/**
 * Helper to escape text for Gmail (prevent auto-link detection)
 */
function escapeForGmail(text, type) {
  if (!text) return text;

  // email et site sont rendus dans un <a> : Gmail n'auto-lie pas le texte
  // déjà contenu dans un lien. Seul le nettoyage du protocole reste utile.
  if (type === "website") {
    return escapeHtml(text.replace(/^https?:\/\//i, "").replace(/\/$/, ""));
  }

  return escapeHtml(text);
}

/**
 * Ligne « icône + texte » d'un élément de contact.
 * Le moteur Word (Outlook) ignore margin sur une image : sans table à deux
 * cellules l'icône se retrouve collée au texte. L'attribut align préserve
 * l'alignement du conteneur, que la table n'hérite pas du <td>.
 */
function contactLine(iconHTML, contentHTML, style, align) {
  const textStyle = `font-size: ${style.fontSize}px; color: ${style.color}; font-family: ${style.fontFamily}; line-height: 1.4;`;

  if (!iconHTML) {
    return `<div style="${textStyle} margin: 0; padding: 0;">${contentHTML}</div>`;
  }

  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" align="${align}" style="${TABLE_RESET}"><tr><td style="padding-right: 8px; vertical-align: middle; font-size: 0; line-height: 0;">${iconHTML}</td><td style="${textStyle} vertical-align: middle;">${contentHTML}</td></tr></table>`;
}

/**
 * Generate HTML for a single element
 * @param {Object} element - The element to render
 * @param {Object} signatureData - The signature data
 * @param {string} parentLayout - The parent container's layout ('vertical' or 'horizontal')
 */
function generateElementHTML(
  element,
  signatureData,
  parentLayout = "vertical",
  containerAlignment = "left",
) {
  const props = element.props || {};
  const type = element.type;

  // Ne pas générer de HTML pour les éléments masqués
  if (props.hidden === true) return "";

  switch (type) {
    case ELEMENT_TYPES.NAME: {
      const name =
        `${signatureData.firstName || ""} ${signatureData.lastName || ""}`.trim();
      if (!name) return "";

      const fontSize = props.fontSize || 14;
      const fontWeight = props.fontWeight || "700";
      const color = props.color || "#171717";
      const fontFamily =
        props.fontFamily || signatureData.fontFamily || "Arial, sans-serif";
      const fontStyle = props.fontStyle || "normal";
      const textAlign = props.textAlign
        ? `text-align: ${props.textAlign}; `
        : "";

      return `<div style="font-size: ${fontSize}px; font-weight: ${fontWeight}; color: ${color}; font-family: ${fontFamily}; font-style: ${fontStyle}; ${textAlign}line-height: 1.4; margin: 0; padding: 0;">${escapeHtml(name)}</div>`;
    }

    case ELEMENT_TYPES.POSITION: {
      const position = signatureData.position;
      if (!position) return "";

      const fontSize = props.fontSize || 12;
      const fontWeight = props.fontWeight || "400";
      const color = props.color || "#666666";
      const fontFamily =
        props.fontFamily || signatureData.fontFamily || "Arial, sans-serif";
      const fontStyle = props.fontStyle || "normal";
      const textAlign = props.textAlign
        ? `text-align: ${props.textAlign}; `
        : "";

      return `<div style="font-size: ${fontSize}px; font-weight: ${fontWeight}; color: ${color}; font-family: ${fontFamily}; font-style: ${fontStyle}; ${textAlign}line-height: 1.4; margin: 0; padding: 0;">${escapeHtml(position)}</div>`;
    }

    case ELEMENT_TYPES.COMPANY: {
      const company = signatureData.companyName;
      if (!company) return "";

      const fontSize = props.fontSize || 12;
      const fontWeight = props.fontWeight || "500";
      const color = props.color || "#171717";
      const fontFamily =
        props.fontFamily || signatureData.fontFamily || "Arial, sans-serif";
      const fontStyle = props.fontStyle || "normal";
      const textAlign = props.textAlign
        ? `text-align: ${props.textAlign}; `
        : "";

      return `<div style="font-size: ${fontSize}px; font-weight: ${fontWeight}; color: ${color}; font-family: ${fontFamily}; font-style: ${fontStyle}; ${textAlign}line-height: 1.4; margin: 0; padding: 0;">${escapeHtml(company)}</div>`;
    }

    case ELEMENT_TYPES.TEXT: {
      const content = props.content || "";
      if (!content) return "";

      const fontSize = props.fontSize || 12;
      const fontWeight = props.fontWeight || "400";
      const color = props.color || "#171717";
      const fontFamily =
        props.fontFamily || signatureData.fontFamily || "Arial, sans-serif";
      const fontStyle = props.fontStyle || "normal";
      const textAlign = props.textAlign
        ? `text-align: ${props.textAlign}; `
        : "";

      return `<div style="font-size: ${fontSize}px; font-weight: ${fontWeight}; color: ${color}; font-family: ${fontFamily}; font-style: ${fontStyle}; ${textAlign}line-height: 1.4; margin: 0; padding: 0;">${escapeHtml(content)}</div>`;
    }

    case ELEMENT_TYPES.CTA: {
      const label = props.label || "Prendre rendez-vous";
      const url = normalizeUrl(props.url);
      const bgColor = props.backgroundColor || "#5a50ff";
      const textColor = props.color || "#ffffff";
      const fontSize = props.fontSize || 13;
      const fontWeight = props.fontWeight || "600";
      const borderRadius = props.borderRadius ?? 6;
      const paddingX = props.paddingX ?? 16;
      const paddingY = props.paddingY ?? 8;
      const fontFamily =
        props.fontFamily || signatureData.fontFamily || "Arial, sans-serif";

      return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="${TABLE_RESET}"><tbody><tr><td align="center" style="background-color: ${bgColor}; border-radius: ${borderRadius}px; padding: ${paddingY}px ${paddingX}px;"><a href="${escapeAttr(url)}" target="_blank" style="display: inline-block; font-size: ${fontSize}px; font-weight: ${fontWeight}; color: ${textColor}; font-family: ${fontFamily}; text-decoration: none; line-height: 1.4;">${escapeHtml(label)}</a></td></tr></tbody></table>`;
    }

    case ELEMENT_TYPES.BANNER: {
      const bannerUrl = signatureData.banner;
      if (!bannerUrl) return "";

      const bannerWidth = props.width || 400;
      const borderRadius = props.borderRadius ?? 0;
      const alt = props.alt || "Bandeau";
      const url = props.url;

      const imgTag = `<img src="${escapeAttr(bannerUrl)}" alt="${escapeAttr(alt)}" width="${bannerWidth}" style="width: ${bannerWidth}px; max-width: 100%; height: auto; display: block; border: 0; border-radius: ${borderRadius}px;" />`;

      if (url) {
        return `<a href="${escapeAttr(url)}" target="_blank" style="text-decoration: none; display: inline-block;">${imgTag}</a>`;
      }
      return imgTag;
    }

    case ELEMENT_TYPES.PHONE:
    case ELEMENT_TYPES.MOBILE: {
      const value =
        type === ELEMENT_TYPES.PHONE
          ? signatureData.phone
          : signatureData.mobile;
      if (!value) return "";

      const fontSize = props.fontSize || 12;
      const color = props.color || "#666666";
      const fontFamily =
        props.fontFamily || signatureData.fontFamily || "Arial, sans-serif";
      const showIcon = props.showIcon !== false;
      const iconColor = props.iconColor || color;

      const icon = showIcon
        ? `<img src="${getContactIconUrl(type === ELEMENT_TYPES.PHONE ? "phone" : "smartphone", iconColor)}" alt="${type === ELEMENT_TYPES.PHONE ? "Tél" : "Mobile"}" width="16" height="16" style="width: 16px; height: 16px; display: block; border: 0;" />`
        : "";

      return contactLine(
        icon,
        `<a href="tel:${escapeAttr(telHref(value))}" style="color: ${color}; text-decoration: none;">${escapeHtml(value)}</a>`,
        { fontSize, color, fontFamily }, containerAlignment,
      );
    }

    case ELEMENT_TYPES.EMAIL: {
      const email = signatureData.email;
      if (!email) return "";

      const fontSize = props.fontSize || 12;
      const color = props.color || "#666666";
      const fontFamily =
        props.fontFamily || signatureData.fontFamily || "Arial, sans-serif";
      const showIcon = props.showIcon !== false;
      const iconColor = props.iconColor || color;

      const icon = showIcon
        ? `<img src="${getContactIconUrl("mail", iconColor)}" alt="Email" width="16" height="16" style="width: 16px; height: 16px; display: block; border: 0;" />`
        : "";

      return contactLine(
        icon,
        `<a href="mailto:${escapeAttr(email)}" style="color: ${color}; text-decoration: none;">${escapeForGmail(email, "email")}</a>`,
        { fontSize, color, fontFamily }, containerAlignment,
      );
    }

    case ELEMENT_TYPES.WEBSITE: {
      const website = signatureData.website;
      if (!website) return "";

      const fontSize = props.fontSize || 12;
      const color = props.color || "#666666";
      const fontFamily =
        props.fontFamily || signatureData.fontFamily || "Arial, sans-serif";
      const showIcon = props.showIcon !== false;
      const iconColor = props.iconColor || color;

      const icon = showIcon
        ? `<img src="${getContactIconUrl("globe", iconColor)}" alt="Site" width="16" height="16" style="width: 16px; height: 16px; display: block; border: 0;" />`
        : "";
      const href = normalizeUrl(website);

      return contactLine(
        icon,
        `<a href="${escapeAttr(href)}" style="color: ${color}; text-decoration: none;" target="_blank">${escapeForGmail(website, "website")}</a>`,
        { fontSize, color, fontFamily }, containerAlignment,
      );
    }

    case ELEMENT_TYPES.ADDRESS: {
      const address = signatureData.address;
      if (!address) return "";

      const fontSize = props.fontSize || 12;
      const color = props.color || "#666666";
      const fontFamily =
        props.fontFamily || signatureData.fontFamily || "Arial, sans-serif";
      const showIcon = props.showIcon !== false;
      const iconColor = props.iconColor || color;

      const icon = showIcon
        ? `<img src="${getContactIconUrl("map-pin", iconColor)}" alt="Adresse" width="16" height="16" style="width: 16px; height: 16px; display: block; border: 0;" />`
        : "";

      return contactLine(
        icon,
        `<span>${escapeHtml(address)}</span>`,
        { fontSize, color, fontFamily }, containerAlignment,
      );
    }

    case ELEMENT_TYPES.PHOTO: {
      const photoUrl = signatureData.photo;
      if (!photoUrl) return "";

      const size = props.width || props.height || 60;
      const borderRadius = props.borderRadius || "50%";
      const isRound = borderRadius === "50%" || borderRadius === "100%";

      // wsrv.nl fait le crop côté serveur → l'image retournée est déjà carrée et cadrée
      const optimizedUrl = `https://wsrv.nl/?url=${encodeURIComponent(photoUrl)}&w=${size * 2}&h=${size * 2}&fit=cover&output=jpg&q=90`;
      const radius = isRound ? "50%" : borderRadius;

      if (isRound) {
        // VML for Outlook
        return `
          <!--[if gte mso 9]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" style="width:${size}px;height:${size}px;v-text-anchor:middle;" arcsize="50%" stroked="f" strokeweight="0" fillcolor="#FFFFFF">
            <v:fill type="frame" src="${optimizedUrl}" />
            <w:anchorlock/>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <img src="${escapeAttr(optimizedUrl)}" alt="Photo" width="${size}" height="${size}" style="display: block; width: ${size}px; height: ${size}px; border-radius: ${radius}; border: 0;" />
          <!--<![endif]-->
        `.trim();
      }

      // Photo non ronde : wsrv.nl recadre déjà l'image côté serveur, une
      // simple <img> suffit. L'ancienne cellule à image de fond + <img
      // opacity:0> affichait un carré vide dans tout client honorant
      // opacity sans honorer background-size.
      return `<img src="${escapeAttr(optimizedUrl)}" alt="Photo" width="${size}" height="${size}" style="display: block; width: ${size}px; height: ${size}px; border-radius: ${radius}; border: 0;" />`;
    }

    case ELEMENT_TYPES.LOGO: {
      const logoUrl = signatureData.logo || signatureData.companyLogo;
      if (!logoUrl) return "";

      // Les presets ne definissent souvent que maxHeight : borner par la
      // hauteur dans ce cas, sinon le logo sortait a 100px de large.
      const logoHeight = signatureData.logoSize ? null : props.maxHeight;
      if (logoHeight) {
        return `<img src="${escapeAttr(logoUrl)}" alt="Logo" height="${logoHeight}" style="height: ${logoHeight}px; max-height: ${logoHeight}px; width: auto; display: block; border: 0;" />`;
      }

      const logoWidth = signatureData.logoSize || props.maxWidth || 100;

      return `<img src="${escapeAttr(logoUrl)}" alt="Logo" width="${logoWidth}" style="width: ${logoWidth}px; max-width: ${logoWidth}px; height: auto; display: block; border: 0;" />`;
    }

    case ELEMENT_TYPES.SEPARATOR_LINE: {
      // L'orientation du séparateur dépend du layout du parent:
      // - Parent vertical (colonne) → séparateur horizontal
      // - Parent horizontal (ligne) → séparateur vertical
      const autoOrientation =
        parentLayout === "horizontal" ? "vertical" : "horizontal";
      const thickness = props.thickness || 1;
      const color = props.color || "#e0e0e0";

      if (autoOrientation === "vertical") {
        // Éviter height: 100% car problématique dans les clients mail
        // Utiliser align-self: stretch pour flexbox ou laisser la hauteur naturelle
        return `<div style="width: ${thickness}px; min-width: ${thickness}px; align-self: stretch; min-height: 30px; background-color: ${color};"></div>`;
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
      const globalColor =
        signatureData.socialGlobalColor || props.color || "black";
      const size = props.size || 20;
      const gap = props.gap || 8;

      // Utiliser l'alignement du conteneur parent, avec fallback sur les props de l'élément
      const effectiveAlignment =
        containerAlignment || props.alignment || "left";

      // Filtrer __typename et les valeurs vides, ne garder que les vrais réseaux
      const supportedNetworks = [
        "facebook",
        "instagram",
        "linkedin",
        "x",
        "github",
        "youtube",
      ];
      const activeNetworks = Object.keys(networksData).filter((key) => {
        if (!supportedNetworks.includes(key)) return false;
        const value = networksData[key];
        if (!value) return false;
        // Extraire l'URL (string directe ou objet { url: "..." })
        const url = typeof value === "string" ? value : value?.url;
        return url && url.trim() !== "" && url !== "#";
      });

      const hasNetworks = activeNetworks.length > 0;
      const defaultNetworks = ["linkedin", "facebook", "instagram"];
      const networksToShow = hasNetworks ? activeNetworks : defaultNetworks;

      // Utiliser des cellules de table pour une compatibilité email maximale
      const iconCells = networksToShow
        .map((networkName, index) => {
          const networkData = networksData[networkName];
          const color = socialColors[networkName] || globalColor || "black";
          const colorName = getColorName(color);
          const iconUrl = getSocialIconUrl(
            networkName.toLowerCase(),
            colorName,
          );
          const isLast = index === networksToShow.length - 1;
          const cellPadding = isLast ? "0" : `0 ${gap}px 0 0`;

          // Supporter les deux formats : string directe "https://..." ou objet { url: "..." }
          const url =
            typeof networkData === "string" ? networkData : networkData?.url;
          const safeUrl = normalizeUrl(url);
          const hasValidUrl = safeUrl !== "";

          const imgTag = `<img src="${iconUrl}" alt="${networkName}" width="${size}" height="${size}" style="width: ${size}px; height: ${size}px; display: block; border: 0;" />`;

          const content = hasValidUrl
            ? `<a href="${escapeAttr(safeUrl)}" target="_blank" style="text-decoration: none; display: inline-block;">${imgTag}</a>`
            : imgTag;

          return `<td style="padding: ${cellPadding};">${content}</td>`;
        })
        .join("");

      if (!iconCells) return "";

      // L'attribut align est le seul moyen fiable dans Outlook : margin sur
      // une table y est ignoré et les icônes restaient collées à gauche.
      const tableAlign =
        effectiveAlignment === "center"
          ? "center"
          : effectiveAlignment === "right"
            ? "right"
            : "left";

      return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" align="${tableAlign}" style="${TABLE_RESET}"><tbody><tr>${iconCells}</tr></tbody></table>`;
    }

    default:
      return "";
  }
}

/**
 * Generate HTML for a container (recursive)
 * @param {Object} container - The container to render
 * @param {Object} signatureData - The signature data
 * @param {number} depth - Current depth level
 * @param {string} grandparentLayout - The layout of the parent's parent (for separators)
 */
function generateContainerHTML(
  container,
  signatureData,
  depth = 0,
  grandparentLayout = "vertical",
) {
  if (!container) return "";

  const layout = container.layout || "vertical";
  const alignment = container.alignment || "start";
  // Utiliser les mêmes valeurs par défaut que ContainerNode.jsx
  const padding = container.padding ?? 12;
  const gap = container.gap ?? 12;
  const width = container.width;
  const height = container.height;

  // Map alignment to CSS
  const alignmentMap = {
    start: "left",
    center: "center",
    end: "right",
  };
  const verticalAlignMap = {
    start: "top",
    center: "middle",
    end: "bottom",
  };
  const textAlign = alignmentMap[alignment] || "left";
  const verticalAlign = verticalAlignMap[alignment] || "top";

  // Build elements with metadata (for detecting separators) - exclure les éléments masqués
  const visibleElements = (container.elements || []).filter(
    (el) => !el.props?.hidden,
  );
  const elementsWithMeta = visibleElements
    .map((element) => {
      const isSeparator = element.type === ELEMENT_TYPES.SEPARATOR_LINE;
      const isSingleElement = visibleElements.length === 1;
      // Séparateur seul: utiliser le layout du grandparent
      const effectiveLayout =
        isSeparator && isSingleElement ? grandparentLayout : layout;
      return {
        type: "element",
        element,
        isSeparator,
        html: generateElementHTML(
          element,
          signatureData,
          effectiveLayout,
          textAlign,
        ),
      };
    })
    .filter((item) => item.html);

  const childrenWithMeta = (container.children || [])
    .map((child) => {
      // Check if child is a separator-only container
      const childHasSeparatorOnly =
        child.elements?.length === 1 &&
        child.elements[0].type === ELEMENT_TYPES.SEPARATOR_LINE &&
        (!child.children || child.children.length === 0);

      return {
        type: "child",
        child,
        isSeparator: childHasSeparatorOnly,
        separatorElement: childHasSeparatorOnly ? child.elements[0] : null,
        html: generateContainerHTML(child, signatureData, depth + 1, layout),
      };
    })
    .filter((item) => item.html);

  const allContent = [...elementsWithMeta, ...childrenWithMeta];

  if (allContent.length === 0) return "";

  // Build container style. Le moteur Word (Outlook) ignore padding sur une
  // <table> : on le porte sur un <td> englobant, sinon toute la signature
  // est collée au bord gauche et plus compacte que l'aperçu.
  let containerStyle = "";
  if (width) containerStyle += ` width: ${width}px;`;
  if (height) containerStyle += ` height: ${height}px;`;

  const withPadding = (inner) =>
    padding > 0
      ? `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="${TABLE_RESET}"><tr><td style="padding: ${padding}px;">${inner}</td></tr></table>`
      : inner;

  if (layout === "horizontal") {
    // Horizontal layout: use table with cells in a row
    const cellsHTML = allContent
      .map((item, index) => {
        const isLast = index === allContent.length - 1;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const isFirst = index === 0;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const prevIsSeparator = index > 0 && allContent[index - 1].isSeparator;
        const nextIsSeparator =
          index < allContent.length - 1 && allContent[index + 1].isSeparator;

        if (item.isSeparator) {
          // Extraire directement les props du séparateur (soit de l'élément direct, soit du conteneur séparateur)
          const separatorEl = item.element || item.separatorElement;
          const props = separatorEl?.props || {};
          const separatorWidth = props.thickness || 1;
          const separatorColor = props.color || "#e0e0e0";

          // Pour email: utiliser une cellule avec background-color directement
          // Le gap est ajouté via des cellules vides de chaque côté pour l'espacement symétrique
          // Une cellule vide est effondrée par Outlook et Gmail : le trait
          // disparaît et les gaps sont perdus. Un &nbsp; de 1px la maintient.
          const spacer = `<td width="${gap}" style="width: ${gap}px; padding: 0; font-size: 1px; line-height: 1px;">&nbsp;</td>`;
          return `${spacer}<td width="${separatorWidth}" style="width: ${separatorWidth}px; background-color: ${separatorColor}; padding: 0; font-size: 1px; line-height: 1px;">&nbsp;</td>${spacer}`;
        }

        // Pour les éléments non-séparateurs:
        // - Pas de padding à gauche si premier
        // - Pas de padding à droite si dernier OU si le suivant est un séparateur (le séparateur gère son propre espacement)
        let paddingRight = isLast || nextIsSeparator ? 0 : gap;

        const cellPadding = `0 ${paddingRight}px 0 0`;
        return `<td style="vertical-align: ${verticalAlign}; padding: ${cellPadding};">${item.html}</td>`;
      })
      .join("");

    return withPadding(
      `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="${TABLE_RESET}${containerStyle}"><tr>${cellsHTML}</tr></table>`,
    );
  } else {
    // Vertical layout: use table with cells in rows
    const rowsHTML = allContent
      .map((item, index) => {
        const isLast = index === allContent.length - 1;
        const cellPadding = isLast ? "0" : `0 0 ${gap}px 0`;

        // Pour les séparateurs horizontaux (dans un layout vertical), utiliser directement le div
        if (item.isSeparator) {
          const separatorEl = item.element || item.separatorElement;
          const props = separatorEl?.props || {};
          const separatorHeight = props.thickness || 1;
          const separatorColor = props.color || "#e0e0e0";
          return `<tr><td style="padding: ${cellPadding};"><div style="width: 100%; height: ${separatorHeight}px; background-color: ${separatorColor};"></div></td></tr>`;
        }

        return `<tr><td style="text-align: ${textAlign}; padding: ${cellPadding};">${item.html}</td></tr>`;
      })
      .join("");

    return withPadding(
      `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="${TABLE_RESET}${containerStyle}">${rowsHTML}</table>`,
    );
  }
}

/**
 * Main function: Generate complete email-compatible HTML from container structure
 */
export function generateSignatureHTMLFromContainer(
  rootContainer,
  signatureData,
) {
  try {
    if (!rootContainer) {
      return "";
    }

    const fontFamily = signatureData?.fontFamily || "Arial, sans-serif";
    const containerHTML = generateContainerHTML(rootContainer, signatureData);

    if (!containerHTML) {
      return "";
    }

    // Wrap in outer table for email clients
    return `
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="${TABLE_RESET} font-family: ${fontFamily}; max-width: 600px; background-color: transparent; color-scheme: light dark;">
        <tr>
          <td style="padding: 0;">
            ${containerHTML}
          </td>
        </tr>
      </table>
    `.trim();
  } catch (error) {
    console.error("[generateSignatureHTMLFromContainer] Error:", error);
    throw error;
  }
}

/**
 * Generate plain text version of the signature
 */
export function generatePlainTextFromContainer(rootContainer, signatureData) {
  const lines = [];

  const name =
    `${signatureData.firstName || ""} ${signatureData.lastName || ""}`.trim();
  if (name) lines.push(name);
  if (signatureData.position) lines.push(signatureData.position);
  if (signatureData.companyName) lines.push(signatureData.companyName);

  lines.push("---");

  if (signatureData.phone) lines.push(`Tel: ${signatureData.phone}`);
  if (signatureData.mobile) lines.push(`Mobile: ${signatureData.mobile}`);
  if (signatureData.email) lines.push(`Email: ${signatureData.email}`);
  if (signatureData.website) lines.push(`Web: ${signatureData.website}`);
  if (signatureData.address) lines.push(`Adresse: ${signatureData.address}`);

  return lines.join("\n");
}
