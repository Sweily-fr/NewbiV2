/**
 * Presets complets pour chaque template de signature
 * Contient: typography, colors, spacing, visibilité des éléments, etc.
 */

const PRIMARY_COLOR = "#5A50FF";
const SOCIAL_BG_COLOR = "#202020";

export const TEMPLATE_PRESETS = {
  // Template 1: Logo + icônes sociales à gauche, séparateur vertical, nom + poste + téléphone + site web à droite
  template1: {
    // Configuration de base
    orientation: "horizontal",
    photoVisible: false, // Pas de photo sur ce template
    imageShape: "round",
    logoSize: 32,

    // Séparateurs
    separators: {
      vertical: { enabled: true, width: 1, color: "#e0e0e0", radius: 0 },
      horizontal: { enabled: false, width: 1, color: "#e0e0e0", radius: 0 },
    },
    separatorVerticalEnabled: true,
    separatorHorizontalEnabled: false,

    // Typography détaillée
    typography: {
      fullName: {
        fontFamily: "Arial, sans-serif",
        fontSize: 14,
        color: "#171717",
        fontWeight: "700",
        fontStyle: "normal",
        textDecoration: "none",
      },
      position: {
        fontFamily: "Arial, sans-serif",
        fontSize: 12,
        color: "#666666",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
      company: {
        fontFamily: "Arial, sans-serif",
        fontSize: 12,
        color: "#171717",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
      phone: {
        fontFamily: "Arial, sans-serif",
        fontSize: 11,
        color: "#666666",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
      mobile: {
        fontFamily: "Arial, sans-serif",
        fontSize: 11,
        color: "#666666",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
      email: {
        fontFamily: "Arial, sans-serif",
        fontSize: 11,
        color: "#666666",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
      website: {
        fontFamily: "Arial, sans-serif",
        fontSize: 11,
        color: "#666666",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
      address: {
        fontFamily: "Arial, sans-serif",
        fontSize: 11,
        color: "#666666",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
    },

    // Tailles de police générales
    fontSize: {
      name: 14,
      position: 12,
      contact: 11,
    },

    // Couleurs
    colors: {
      name: "#171717",
      position: "#666666",
      company: "#171717",
      contact: "#666666",
      separatorVertical: "#e0e0e0",
      separatorHorizontal: "#e0e0e0",
    },
    primaryColor: "#171717",

    // Réseaux sociaux
    socialNetworks: {
      facebook: { url: "#" },
      linkedin: { url: "#" },
      x: { url: "#" },
    },
    socialGlobalColor: "black",
    socialSize: 20,

    // Espacements
    spacings: {
      global: 8,
      photoBottom: 12,
      logoBottom: 8,
      nameBottom: 4,
      positionBottom: 8,
      companyBottom: 12,
      contactBottom: 4,
      phoneToMobile: 4,
      mobileToEmail: 4,
      emailToWebsite: 4,
      websiteToAddress: 4,
      separatorTop: 12,
      separatorBottom: 12,
      logoToSocial: 8,
      verticalSeparatorLeft: 12,
      verticalSeparatorRight: 12,
    },

    // Icônes de contact
    showPhoneIcon: false,
    showMobileIcon: false,
    showEmailIcon: false,
    showWebsiteIcon: false,
    showAddressIcon: false,
  },

  // Template 2: Logo en haut, nom + titre sur même ligne, téléphone + site web, icônes sociales en bas
  template2: {
    // Configuration de base
    orientation: "vertical",
    photoVisible: false, // Pas de photo sur ce template
    imageShape: "round",
    logoSize: 32,

    // Séparateurs
    separators: {
      vertical: { enabled: false, width: 1, color: "#e0e0e0", radius: 0 },
      horizontal: { enabled: false, width: 1, color: "#e0e0e0", radius: 0 },
    },
    separatorVerticalEnabled: false,
    separatorHorizontalEnabled: false,

    // Typography détaillée
    typography: {
      fullName: {
        fontFamily: "Arial, sans-serif",
        fontSize: 14,
        color: "#171717",
        fontWeight: "700",
        fontStyle: "normal",
        textDecoration: "none",
      },
      position: {
        fontFamily: "Arial, sans-serif",
        fontSize: 12,
        color: "#666666", // Gris pour la position dans template 2
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
      company: {
        fontFamily: "Arial, sans-serif",
        fontSize: 12,
        color: "#171717",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
      phone: {
        fontFamily: "Arial, sans-serif",
        fontSize: 11,
        color: "#666666",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
      mobile: {
        fontFamily: "Arial, sans-serif",
        fontSize: 11,
        color: "#666666",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
      email: {
        fontFamily: "Arial, sans-serif",
        fontSize: 11,
        color: "#666666",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
      website: {
        fontFamily: "Arial, sans-serif",
        fontSize: 11,
        color: PRIMARY_COLOR, // Site web en couleur primaire
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
      address: {
        fontFamily: "Arial, sans-serif",
        fontSize: 11,
        color: "#666666",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
    },

    // Tailles de police générales
    fontSize: {
      name: 14,
      position: 12,
      contact: 11,
    },

    // Couleurs
    colors: {
      name: "#171717",
      position: "#666666",
      company: "#171717",
      contact: "#666666",
      separatorVertical: "#e0e0e0",
      separatorHorizontal: "#e0e0e0",
    },
    primaryColor: PRIMARY_COLOR,

    // Réseaux sociaux
    socialNetworks: {
      facebook: { url: "#" },
      linkedin: { url: "#" },
      x: { url: "#" },
    },
    socialGlobalColor: "black",
    socialSize: 20,

    // Espacements
    spacings: {
      global: 8,
      photoBottom: 12,
      logoBottom: 8,
      nameBottom: 4,
      positionBottom: 4,
      companyBottom: 12,
      contactBottom: 4,
      phoneToMobile: 4,
      mobileToEmail: 4,
      emailToWebsite: 4,
      websiteToAddress: 4,
      separatorTop: 12,
      separatorBottom: 12,
      logoToSocial: 10,
      verticalSeparatorLeft: 12,
      verticalSeparatorRight: 12,
    },

    // Icônes de contact
    showPhoneIcon: false,
    showMobileIcon: false,
    showEmailIcon: false,
    showWebsiteIcon: false,
    showAddressIcon: false,
  },

  // Template 3: Logo à gauche avec infos, avatar à droite avec icônes sociales
  template3: {
    // Configuration de base
    orientation: "horizontal",
    photoVisible: true, // Photo visible sur ce template (avatar à droite)
    imageShape: "round",
    imageSize: 60,
    logoSize: 32,

    // Séparateurs
    separators: {
      vertical: { enabled: false, width: 1, color: "#e0e0e0", radius: 0 },
      horizontal: { enabled: false, width: 1, color: "#e0e0e0", radius: 0 },
    },
    separatorVerticalEnabled: false,
    separatorHorizontalEnabled: false,

    // Typography détaillée
    typography: {
      fullName: {
        fontFamily: "Arial, sans-serif",
        fontSize: 14,
        color: "#171717",
        fontWeight: "700",
        fontStyle: "normal",
        textDecoration: "none",
      },
      position: {
        fontFamily: "Arial, sans-serif",
        fontSize: 12,
        color: PRIMARY_COLOR, // Position en couleur primaire (violet)
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
      company: {
        fontFamily: "Arial, sans-serif",
        fontSize: 12,
        color: "#171717",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
      phone: {
        fontFamily: "Arial, sans-serif",
        fontSize: 11,
        color: "#666666",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
      mobile: {
        fontFamily: "Arial, sans-serif",
        fontSize: 11,
        color: "#666666",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
      email: {
        fontFamily: "Arial, sans-serif",
        fontSize: 11,
        color: "#666666",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
      website: {
        fontFamily: "Arial, sans-serif",
        fontSize: 11,
        color: "#666666",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
      address: {
        fontFamily: "Arial, sans-serif",
        fontSize: 11,
        color: "#666666",
        fontWeight: "400",
        fontStyle: "normal",
        textDecoration: "none",
      },
    },

    // Tailles de police générales
    fontSize: {
      name: 14,
      position: 12,
      contact: 11,
    },

    // Couleurs
    colors: {
      name: "#171717",
      position: PRIMARY_COLOR, // Position en violet
      company: "#171717",
      contact: "#666666",
      separatorVertical: "#e0e0e0",
      separatorHorizontal: "#e0e0e0",
    },
    primaryColor: PRIMARY_COLOR,

    // Réseaux sociaux
    socialNetworks: {
      facebook: { url: "#" },
      linkedin: { url: "#" },
      x: { url: "#" },
    },
    socialGlobalColor: "black",
    socialSize: 16,

    // Espacements
    spacings: {
      global: 8,
      photoBottom: 8,
      logoBottom: 6,
      nameBottom: 4,
      positionBottom: 4,
      companyBottom: 12,
      contactBottom: 4,
      phoneToMobile: 4,
      mobileToEmail: 4,
      emailToWebsite: 4,
      websiteToAddress: 4,
      separatorTop: 12,
      separatorBottom: 12,
      logoToSocial: 8,
      verticalSeparatorLeft: 12,
      verticalSeparatorRight: 40, // Plus d'espace entre les colonnes
    },

    // Icônes de contact
    showPhoneIcon: false,
    showMobileIcon: false,
    showEmailIcon: false,
    showWebsiteIcon: false,
    showAddressIcon: false,
  },
};

/**
 * Applique un preset de template aux données de signature
 * @param {object} currentData - Les données actuelles de signature
 * @param {string} templateId - L'ID du template (template1, template2, template3)
 * @returns {object} - Les données de signature mises à jour avec le preset
 */
export function applyTemplatePreset(currentData, templateId) {
  const preset = TEMPLATE_PRESETS[templateId];

  if (!preset) {
    console.warn(`Preset non trouvé pour le template: ${templateId}`);
    return { ...currentData, templateId };
  }

  console.log(`🎨 [PRESET] Application du preset pour: ${templateId}`);

  // Merger le preset avec les données actuelles
  // Le preset écrase les valeurs de style, mais conserve les données utilisateur (nom, email, etc.)
  return {
    ...currentData,
    templateId,

    // Configuration de base
    orientation: preset.orientation,
    photoVisible: preset.photoVisible,
    imageShape: preset.imageShape,
    imageSize: preset.imageSize || currentData.imageSize,
    logoSize: preset.logoSize,

    // Séparateurs
    separators: {
      ...currentData.separators,
      ...preset.separators,
    },
    separatorVerticalEnabled: preset.separatorVerticalEnabled,
    separatorHorizontalEnabled: preset.separatorHorizontalEnabled,

    // Typography
    typography: {
      fullName: {
        ...currentData.typography?.fullName,
        ...preset.typography.fullName,
      },
      position: {
        ...currentData.typography?.position,
        ...preset.typography.position,
      },
      company: {
        ...currentData.typography?.company,
        ...preset.typography.company,
      },
      phone: {
        ...currentData.typography?.phone,
        ...preset.typography.phone,
      },
      mobile: {
        ...currentData.typography?.mobile,
        ...preset.typography.mobile,
      },
      email: {
        ...currentData.typography?.email,
        ...preset.typography.email,
      },
      website: {
        ...currentData.typography?.website,
        ...preset.typography.website,
      },
      address: {
        ...currentData.typography?.address,
        ...preset.typography.address,
      },
    },

    // Tailles de police
    fontSize: {
      ...currentData.fontSize,
      ...preset.fontSize,
    },

    // Couleurs
    colors: {
      ...currentData.colors,
      ...preset.colors,
    },
    primaryColor: preset.primaryColor,

    // Réseaux sociaux
    socialNetworks: preset.socialNetworks,
    socialGlobalColor: preset.socialGlobalColor,
    socialSize: preset.socialSize,

    // Espacements
    spacings: {
      ...currentData.spacings,
      ...preset.spacings,
    },

    // Icônes de contact
    showPhoneIcon: preset.showPhoneIcon,
    showMobileIcon: preset.showMobileIcon,
    showEmailIcon: preset.showEmailIcon,
    showWebsiteIcon: preset.showWebsiteIcon,
    showAddressIcon: preset.showAddressIcon,
  };
}

export default TEMPLATE_PRESETS;
