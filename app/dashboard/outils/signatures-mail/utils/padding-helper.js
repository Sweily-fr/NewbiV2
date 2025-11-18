/**
 * Helper pour gérer les paddings détaillés des éléments de signature
 * Détecte automatiquement les TD et applique les paddings appropriés
 */

/**
 * Génère le style de padding pour un élément
 * @param {Object} signatureData - Données de la signature
 * @param {string} elementKey - Clé de l'élément (photo, name, position, etc.)
 * @param {Object} defaultPadding - Padding par défaut si mode détaillé désactivé
 * @returns {string} Style CSS de padding
 */
export function getPaddingStyle(signatureData, elementKey, defaultPadding = {}) {
  // Si le mode détaillé n'est pas activé, utiliser les valeurs par défaut
  if (!signatureData.detailedSpacing) {
    const { top = 0, right = 0, bottom = 0, left = 0 } = defaultPadding;
    return `${top}px ${right}px ${bottom}px ${left}px`;
  }

  // Récupérer le padding détaillé pour cet élément
  const padding = signatureData.paddings?.[elementKey] || { top: 0, right: 0, bottom: 0, left: 0 };
  
  return `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`;
}

/**
 * Génère un objet de style avec le padding
 * @param {Object} signatureData - Données de la signature
 * @param {string} elementKey - Clé de l'élément
 * @param {Object} defaultPadding - Padding par défaut
 * @param {Object} additionalStyles - Styles supplémentaires à merger
 * @returns {Object} Objet de style React
 */
export function getPaddingStyleObject(signatureData, elementKey, defaultPadding = {}, additionalStyles = {}) {
  const paddingStyle = getPaddingStyle(signatureData, elementKey, defaultPadding);
  
  return {
    ...additionalStyles,
    padding: paddingStyle,
  };
}

/**
 * Génère les styles individuels de padding (pour les cas où on ne peut pas utiliser la propriété padding)
 * Ne retourne que les propriétés non-nulles pour éviter padding: 0px 0px 8px
 * @param {Object} signatureData - Données de la signature
 * @param {string} elementKey - Clé de l'élément
 * @param {Object} defaultPadding - Padding par défaut
 * @returns {Object} Objet avec paddingTop, paddingRight, paddingBottom, paddingLeft (uniquement les non-nuls)
 */
export function getIndividualPaddingStyles(signatureData, elementKey, defaultPadding = {}) {
  let top, right, bottom, left;

  if (!signatureData.detailedSpacing) {
    ({ top = 0, right = 0, bottom = 0, left = 0 } = defaultPadding);
  } else {
    // En mode détaillé, utiliser les paddings définis, sinon utiliser defaultPadding comme fallback
    const padding = signatureData.paddings?.[elementKey] || defaultPadding;
    ({ top = 0, right = 0, bottom = 0, left = 0 } = padding);
  }
  
  // Ne retourner que les propriétés non-nulles
  const styles = {};
  if (top !== 0) styles.paddingTop = `${top}px`;
  if (right !== 0) styles.paddingRight = `${right}px`;
  if (bottom !== 0) styles.paddingBottom = `${bottom}px`;
  if (left !== 0) styles.paddingLeft = `${left}px`;
  
  return styles;
}

/**
 * Génère le style inline pour les emails HTML (format string)
 * @param {Object} signatureData - Données de la signature
 * @param {string} elementKey - Clé de l'élément
 * @param {Object} defaultPadding - Padding par défaut
 * @returns {string} Style inline pour HTML
 */
export function getPaddingInlineStyle(signatureData, elementKey, defaultPadding = {}) {
  const styles = getIndividualPaddingStyles(signatureData, elementKey, defaultPadding);
  
  return `padding-top:${styles.paddingTop};padding-right:${styles.paddingRight};padding-bottom:${styles.paddingBottom};padding-left:${styles.paddingLeft};`;
}

/**
 * Détecte automatiquement les éléments présents dans la signature
 * @param {Object} signatureData - Données de la signature
 * @returns {Array} Liste des éléments visibles avec leurs métadonnées
 */
export function detectSignatureElements(signatureData) {
  const elements = [];

  // Photo de profil
  if (signatureData.photo && signatureData.photoVisible !== false) {
    elements.push({
      key: "photo",
      label: "Photo de profil",
      type: "image",
      value: signatureData.photo,
    });
  }

  // Nom complet
  if (signatureData.fullName) {
    elements.push({
      key: "name",
      label: "Nom complet",
      type: "text",
      value: signatureData.fullName,
    });
  }

  // Poste
  if (signatureData.position) {
    elements.push({
      key: "position",
      label: "Poste",
      type: "text",
      value: signatureData.position,
    });
  }

  // Entreprise
  if (signatureData.companyName) {
    elements.push({
      key: "company",
      label: "Entreprise",
      type: "text",
      value: signatureData.companyName,
    });
  }

  // Téléphone
  if (signatureData.phone) {
    elements.push({
      key: "phone",
      label: "Téléphone",
      type: "contact",
      value: signatureData.phone,
    });
  }

  // Mobile
  if (signatureData.mobile) {
    elements.push({
      key: "mobile",
      label: "Mobile",
      type: "contact",
      value: signatureData.mobile,
    });
  }

  // Email
  if (signatureData.email) {
    elements.push({
      key: "email",
      label: "Email",
      type: "contact",
      value: signatureData.email,
    });
  }

  // Site web
  if (signatureData.website) {
    elements.push({
      key: "website",
      label: "Site web",
      type: "contact",
      value: signatureData.website,
    });
  }

  // Adresse
  if (signatureData.address) {
    elements.push({
      key: "address",
      label: "Adresse",
      type: "contact",
      value: signatureData.address,
    });
  }

  // Séparateur
  if (signatureData.separatorHorizontalEnabled) {
    elements.push({
      key: "separator",
      label: "Séparateur",
      type: "separator",
      value: true,
    });
  }

  // Logo entreprise
  if (signatureData.logo) {
    elements.push({
      key: "logo",
      label: "Logo entreprise",
      type: "image",
      value: signatureData.logo,
    });
  }

  // Réseaux sociaux
  const hasSocialNetworks = Object.values(signatureData.socialNetworks || {}).some((url) => url);
  if (hasSocialNetworks) {
    elements.push({
      key: "social",
      label: "Réseaux sociaux",
      type: "social",
      value: signatureData.socialNetworks,
    });
  }

  return elements;
}

/**
 * Génère un rapport de mapping des TD détectés
 * @param {Object} signatureData - Données de la signature
 * @returns {Object} Rapport avec les éléments détectés et leurs paddings
 */
export function generatePaddingReport(signatureData) {
  const elements = detectSignatureElements(signatureData);
  
  return {
    totalElements: elements.length,
    detailedMode: signatureData.detailedSpacing || false,
    elements: elements.map((el) => ({
      ...el,
      padding: signatureData.paddings?.[el.key] || { top: 0, right: 0, bottom: 0, left: 0 },
      paddingStyle: getPaddingStyle(signatureData, el.key),
    })),
  };
}
