/**
 * HTML Generator for Email-Compatible Signatures
 * Generates HTML table-based signatures compatible with Gmail, Outlook, Apple Mail, etc.
 */

import { WIDGET_TYPES } from "./widget-registry";

// Base URL for Cloudflare social icons
const CLOUDFLARE_SOCIAL_BASE = "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social";
const CLOUDFLARE_ICONS_BASE = "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/icons";

// Get social icon URL
const getSocialIconUrl = (platform, color = "black") => {
  const cloudflareplatform = platform === "x" ? "twitter" : platform;
  return `${CLOUDFLARE_SOCIAL_BASE}/${cloudflareplatform}/${cloudflareplatform}-${color}.png`;
};

// Get contact icon URL
const getContactIconUrl = (field) => {
  const iconMap = {
    phone: "phone",
    mobile: "smartphone",
    email: "mail",
    website: "globe",
    address: "map-pin",
  };
  return `${CLOUDFLARE_ICONS_BASE}/${iconMap[field] || "info"}.png`;
};

/**
 * Generate HTML for a text widget
 */
function generateTextWidgetHTML(widget, signatureData) {
  const { props } = widget;
  const content = props.field && signatureData ? signatureData[props.field] : props.content;

  if (!content) return "";

  const style = `
    font-family: ${props.fontFamily || "Arial, sans-serif"};
    font-size: ${props.fontSize || 14}px;
    font-weight: ${props.fontWeight || "400"};
    color: ${props.color || "#171717"};
    line-height: ${props.lineHeight || 1.4};
    margin: 0;
    padding: 0;
  `.replace(/\s+/g, " ").trim();

  return `<div style="${style}">${escapeHtml(content)}</div>`;
}

/**
 * Generate HTML for an image widget
 */
function generateImageWidgetHTML(widget, signatureData) {
  const { props } = widget;
  const src = props.field && signatureData ? signatureData[props.field] : props.src;

  if (!src) return "";

  const style = `
    width: ${props.width || 70}px;
    height: ${props.height === "auto" ? "auto" : `${props.height || 70}px`};
    border-radius: ${props.borderRadius || "50%"};
    object-fit: ${props.objectFit || "cover"};
    display: block;
  `.replace(/\s+/g, " ").trim();

  return `<img src="${src}" alt="${props.alt || "Image"}" width="${props.width || 70}" height="${props.height || 70}" style="${style}" />`;
}

/**
 * Generate HTML for a logo widget
 */
function generateLogoWidgetHTML(widget, signatureData) {
  const { props } = widget;
  const src = props.field && signatureData ? signatureData[props.field] : props.src;

  if (!src) return "";

  const style = `
    max-width: ${props.maxWidth || 150}px;
    max-height: ${props.maxHeight || 50}px;
    width: auto;
    height: auto;
    object-fit: ${props.objectFit || "contain"};
    display: block;
  `.replace(/\s+/g, " ").trim();

  return `<img src="${src}" alt="${props.alt || "Logo"}" style="${style}" />`;
}

/**
 * Generate HTML for a separator widget
 */
function generateSeparatorWidgetHTML(widget) {
  const { props } = widget;
  const isHorizontal = props.orientation !== "vertical";

  if (isHorizontal) {
    const style = `
      border: none;
      border-top: ${props.thickness || 1}px solid ${props.color || "#e0e0e0"};
      margin: 0;
      width: ${props.length || "100%"};
    `.replace(/\s+/g, " ").trim();

    return `<hr style="${style}" />`;
  } else {
    const style = `
      width: ${props.thickness || 1}px;
      height: ${props.length || "50px"};
      background-color: ${props.color || "#e0e0e0"};
      display: inline-block;
      vertical-align: top;
    `.replace(/\s+/g, " ").trim();

    return `<div style="${style}"></div>`;
  }
}

/**
 * Generate HTML for a spacer widget
 */
function generateSpacerWidgetHTML(widget) {
  const { props } = widget;
  const style = `
    height: ${props.height || 16}px;
    width: 100%;
    display: block;
  `.replace(/\s+/g, " ").trim();

  return `<div style="${style}"></div>`;
}

/**
 * Generate HTML for social icons widget
 */
function generateSocialIconsWidgetHTML(widget, signatureData) {
  const { props } = widget;
  const size = props.size || 20;
  const gap = props.gap || 8;
  const color = props.color || "black";
  const alignment = props.alignment || "left";

  // Get active social networks from signatureData
  const socialNetworks = signatureData?.socialNetworks || {};
  const activeNetworks = Object.keys(socialNetworks).filter(
    (key) => socialNetworks[key] && socialNetworks[key].url
  );

  if (activeNetworks.length === 0 && (!props.icons || props.icons.length === 0)) {
    return "";
  }

  const networksToShow = activeNetworks.length > 0 ? activeNetworks : props.icons;

  const iconsHtml = networksToShow
    .map((network) => {
      const url = socialNetworks[network]?.url || `#`;
      const iconUrl = getSocialIconUrl(network, color);
      return `<td style="padding-right: ${gap}px;">
        <a href="${url}" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
          <img src="${iconUrl}" alt="${network}" width="${size}" height="${size}" style="width: ${size}px; height: ${size}px; display: block;" />
        </a>
      </td>`;
    })
    .join("");

  const alignStyle = alignment === "center" ? "center" : alignment === "right" ? "right" : "left";

  return `<table cellpadding="0" cellspacing="0" border="0" align="${alignStyle}" style="border-collapse: collapse;">
    <tr>${iconsHtml}</tr>
  </table>`;
}

/**
 * Generate HTML for contact row widget
 */
function generateContactRowWidgetHTML(widget, signatureData) {
  const { props } = widget;
  const field = props.field || "phone";
  const value = signatureData?.[field];

  if (!value) return "";

  const showIcon = props.showIcon !== false;
  const iconSize = props.iconSize || 14;
  const fontSize = props.fontSize || 12;
  const color = props.color || "#666666";
  const prefix = props.prefix || "";

  const displayValue = prefix ? `${prefix} ${value}` : value;

  // Wrap in link for email, phone, website
  let content;
  if (field === "email") {
    content = `<a href="mailto:${value}" style="color: ${color}; text-decoration: none;">${escapeHtml(displayValue)}</a>`;
  } else if (field === "website") {
    const url = value.startsWith("http") ? value : `https://${value}`;
    content = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: ${color}; text-decoration: none;">${escapeHtml(displayValue)}</a>`;
  } else if (field === "phone" || field === "mobile") {
    const tel = value.replace(/\s+/g, "");
    content = `<a href="tel:${tel}" style="color: ${color}; text-decoration: none;">${escapeHtml(displayValue)}</a>`;
  } else {
    content = escapeHtml(displayValue);
  }

  const textStyle = `
    font-family: ${props.fontFamily || "Arial, sans-serif"};
    font-size: ${fontSize}px;
    color: ${color};
    line-height: 1.4;
  `.replace(/\s+/g, " ").trim();

  if (showIcon) {
    const iconUrl = getContactIconUrl(field);
    return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
      <tr>
        <td style="padding-right: 8px; vertical-align: middle;">
          <img src="${iconUrl}" alt="${field}" width="${iconSize}" height="${iconSize}" style="width: ${iconSize}px; height: ${iconSize}px; display: block;" />
        </td>
        <td style="vertical-align: middle; ${textStyle}">${content}</td>
      </tr>
    </table>`;
  }

  return `<div style="${textStyle}">${content}</div>`;
}

/**
 * Generate HTML for a single widget
 */
function generateWidgetHTML(widget, signatureData) {
  switch (widget.type) {
    case WIDGET_TYPES.TEXT:
      return generateTextWidgetHTML(widget, signatureData);
    case WIDGET_TYPES.IMAGE:
      return generateImageWidgetHTML(widget, signatureData);
    case WIDGET_TYPES.LOGO:
      return generateLogoWidgetHTML(widget, signatureData);
    case WIDGET_TYPES.SEPARATOR:
      return generateSeparatorWidgetHTML(widget);
    case WIDGET_TYPES.SPACER:
      return generateSpacerWidgetHTML(widget);
    case WIDGET_TYPES.SOCIAL_ICONS:
      return generateSocialIconsWidgetHTML(widget, signatureData);
    case WIDGET_TYPES.CONTACT_ROW:
      return generateContactRowWidgetHTML(widget, signatureData);
    default:
      return "";
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  if (!text) return "";
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generate complete email signature HTML from widgets
 * @param {Array} widgets - Array of widget objects
 * @param {Object} signatureData - Signature data containing field values
 * @param {Object} options - Generation options (fontFamily, etc.)
 * @returns {string} - Email-compatible HTML string
 */
export function generateSignatureHTML(widgets, signatureData, options = {}) {
  const fontFamily = options.fontFamily || signatureData?.fontFamily || "Arial, sans-serif";

  if (!widgets || widgets.length === 0) {
    return "";
  }

  // Generate HTML for each widget
  const widgetsHtml = widgets
    .map((widget) => {
      const html = generateWidgetHTML(widget, signatureData);
      if (!html) return "";
      return `<tr><td style="padding-bottom: 4px;">${html}</td></tr>`;
    })
    .filter(Boolean)
    .join("");

  // Wrap in email-compatible table structure
  return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-family: ${fontFamily}; max-width: 600px;">
  <tbody>
    ${widgetsHtml}
  </tbody>
</table>`;
}

/**
 * Generate complete HTML document with signature for copying/previewing
 * @param {Array} widgets - Array of widget objects
 * @param {Object} signatureData - Signature data containing field values
 * @returns {string} - Complete HTML document
 */
export function generateSignatureDocument(widgets, signatureData) {
  const signatureHtml = generateSignatureHTML(widgets, signatureData);

  return `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signature Email</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif;">
  ${signatureHtml}
</body>
</html>`;
}

/**
 * Copy signature HTML to clipboard
 * @param {Array} widgets - Array of widget objects
 * @param {Object} signatureData - Signature data containing field values
 * @returns {Promise<boolean>} - Success status
 */
export async function copySignatureToClipboard(widgets, signatureData) {
  try {
    const html = generateSignatureHTML(widgets, signatureData);
    const plainText = generatePlainTextSignature(widgets, signatureData);

    // Try to copy as both HTML and plain text
    if (navigator.clipboard && window.ClipboardItem) {
      const blob = new Blob([html], { type: "text/html" });
      const textBlob = new Blob([plainText], { type: "text/plain" });
      const item = new ClipboardItem({
        "text/html": blob,
        "text/plain": textBlob,
      });
      await navigator.clipboard.write([item]);
    } else {
      // Fallback: copy as HTML in a temp element
      const tempElement = document.createElement("div");
      tempElement.innerHTML = html;
      tempElement.style.position = "absolute";
      tempElement.style.left = "-9999px";
      document.body.appendChild(tempElement);

      const range = document.createRange();
      range.selectNodeContents(tempElement);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      document.execCommand("copy");
      document.body.removeChild(tempElement);
      selection.removeAllRanges();
    }

    return true;
  } catch (error) {
    console.error("Error copying signature:", error);
    return false;
  }
}

/**
 * Generate plain text version of signature
 */
function generatePlainTextSignature(widgets, signatureData) {
  if (!widgets || widgets.length === 0) return "";

  return widgets
    .map((widget) => {
      const { props } = widget;

      switch (widget.type) {
        case WIDGET_TYPES.TEXT:
          return props.field && signatureData ? signatureData[props.field] : props.content;
        case WIDGET_TYPES.CONTACT_ROW:
          const value = signatureData?.[props.field];
          return value ? (props.prefix ? `${props.prefix} ${value}` : value) : "";
        case WIDGET_TYPES.SEPARATOR:
          return "---";
        case WIDGET_TYPES.SPACER:
          return "";
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n");
}

export default {
  generateSignatureHTML,
  generateSignatureDocument,
  copySignatureToClipboard,
};
