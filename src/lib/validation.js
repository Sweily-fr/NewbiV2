// Validation patterns et règles de sécurité pour les formulaires
// Protection contre les injections XSS, SQL et autres attaques

// Legal forms that require specific fields
export const LEGAL_FORMS_WITH_RCS = ['SARL', 'SAS', 'SASU', 'EURL', 'SA', 'SNC'];
export const LEGAL_FORMS_WITH_CAPITAL = ['SARL', 'SAS', 'SASU', 'EURL', 'SA', 'SNC'];
export const LEGAL_FORMS_WITHOUT_CAPITAL = ['Auto-entrepreneur', 'EI'];
export const LEGAL_FORMS_EI_MICRO = ['EI', 'Auto-entrepreneur'];

// Function to determine if a field is required based on legal form and other conditions
export const getRequiredFields = (legalForm, isVatSubject = false, hasCommercialActivity = false) => {
  const required = {
    // Only required if legal form is selected
    siret: !!legalForm,
    fiscalRegime: !!legalForm,
    activityCategory: !!legalForm,
    legalForm: false,
    
    // Conditionally required fields
    rcs: false,
    vatNumber: false,
    capital: false
  };

  // RCS logic
  if (LEGAL_FORMS_WITH_RCS.includes(legalForm)) {
    required.rcs = true;
  } else if (LEGAL_FORMS_EI_MICRO.includes(legalForm) && hasCommercialActivity) {
    required.rcs = true;
  }

  // VAT number logic
  if (isVatSubject) {
    required.vatNumber = true;
  }

  // Capital logic
  if (LEGAL_FORMS_WITH_CAPITAL.includes(legalForm)) {
    required.capital = true;
  }

  return required;
};

// Function to determine if a field should be visible
export const getVisibleFields = (legalForm, isVatSubject = false, hasCommercialActivity = false) => {
  const visible = {
    // Always visible fields
    siret: true,
    fiscalRegime: true,
    activityCategory: true,
    legalForm: true,
    
    // Conditionally visible fields
    rcs: LEGAL_FORMS_WITH_RCS.includes(legalForm) || (LEGAL_FORMS_EI_MICRO.includes(legalForm) && hasCommercialActivity),
    vatNumber: isVatSubject,
    capital: !LEGAL_FORMS_WITHOUT_CAPITAL.includes(legalForm),
    vatSubjectCheckbox: true,
    commercialActivityCheckbox: LEGAL_FORMS_EI_MICRO.includes(legalForm)
  };

  return visible;
};

// Patterns de validation regex
export const VALIDATION_PATTERNS = {
  // Informations générales
  companyName: {
    pattern: /^[a-zA-ZÀ-ÿ0-9\s\-&'.,()]{2,100}$/,
    message:
      "Le nom doit contenir entre 2 et 100 caractères (lettres, chiffres, espaces et caractères spéciaux autorisés: -&'.,())",
  },

  email: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: "Format d'email invalide",
  },

  phone: {
    pattern: /^(\+33|0)[1-9](\d{8})$/,
    message:
      "Numéro de téléphone français invalide (ex: +33123456789 ou 0123456789)",
  },

  website: {
    pattern:
      /^https?:\/\/(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\/?.*$/,
    message: "URL invalide (doit commencer par http:// ou https://)",
  },

  description: {
    pattern: /^[a-zA-ZÀ-ÿ0-9\s\-.,!?'"\n\r]{0,1000}$/,
    message:
      "La description ne peut contenir que des lettres, chiffres, espaces et ponctuation basique (max 1000 caractères)",
  },

  // Adresse
  street: {
    pattern: /^[a-zA-ZÀ-ÿ0-9\s\-.,()]{2,200}$/,
    message:
      "L'adresse doit contenir entre 2 et 200 caractères (lettres, chiffres, espaces et -.,() autorisés)",
  },

  city: {
    pattern: /^[a-zA-ZÀ-ÿ\s\-']{2,100}$/,
    message:
      "La ville doit contenir entre 2 et 100 caractères (lettres, espaces, tirets et apostrophes uniquement)",
  },

  postalCode: {
    pattern: /^[0-9]{5}$/,
    message: "Code postal français invalide (5 chiffres)",
  },

  country: {
    pattern: /^[a-zA-ZÀ-ÿ\s\-]{2,50}$/,
    message: "Nom de pays invalide",
  },

  // Informations bancaires
  iban: {
    pattern: /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/,
    message: "Format IBAN invalide",
  },

  bic: {
    pattern: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
    message: "Format BIC invalide (8 ou 11 caractères)",
  },

  bankName: {
    pattern: /^[a-zA-ZÀ-ÿ0-9\s\-&'.,()]{2,100}$/,
    message: "Nom de banque invalide",
  },

  // Informations légales
  siret: {
    pattern: /^[0-9]{14}$/,
    message: "Le SIRET doit contenir exactement 14 chiffres",
  },

  vatNumber: {
    pattern: /^[A-Z]{2}[0-9A-Z]{2,13}$/,
    message: "Format de numéro de TVA invalide (ex: FR12345678901)",
  },

  rcs: {
    pattern: /^RCS\s[a-zA-ZÀ-ÿ\s\-']{2,50}\s[0-9]{3}\s[0-9]{3}\s[0-9]{3}$/,
    message: "Format RCS invalide (ex: RCS Paris 123 456 789)",
  },

  capital: {
    pattern: /^[0-9]{1,15}(\.[0-9]{1,2})?$/,
    message: "Capital social invalide (chiffres uniquement, max 2 décimales)",
  },

  fiscalRegime: {
    pattern: /^[a-zA-ZÀ-ÿ0-9\s\-&'.,()]{2,100}$/,
    message: "Régime fiscal invalide",
  },

  activityCategory: {
    pattern: /^[a-zA-ZÀ-ÿ0-9\s\-&'.,()]{2,100}$/,
    message: "Catégorie d'activité invalide",
  },

  legalForm: {
    pattern: /^[a-zA-ZÀ-ÿ0-9\s\-&'.,()]{2,50}$/,
    message: "Forme juridique invalide",
  },
};

// Fonction de nettoyage des données (sanitization)
export const sanitizeInput = (input, type = "text") => {
  if (!input || typeof input !== "string") return "";

  // Suppression des caractères dangereux
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Supprime les scripts
    .replace(/<[^>]*>/g, "") // Supprime toutes les balises HTML
    .replace(/javascript:/gi, "") // Supprime javascript:
    .replace(/on\w+\s*=/gi, "") // Supprime les event handlers
    .replace(/data:/gi, "") // Supprime data: URLs
    .replace(/vbscript:/gi, "") // Supprime vbscript:
    .trim();

  // Nettoyage spécifique par type
  switch (type) {
    case "email":
      sanitized = sanitized.toLowerCase();
      break;
    case "phone":
      sanitized = sanitized.replace(/\s/g, ""); // Supprime les espaces
      break;
    case "numeric":
      sanitized = sanitized.replace(/[^0-9.]/g, ""); // Garde seulement chiffres et points
      break;
    case "alphanumeric":
      sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, ""); // Garde seulement lettres et chiffres
      break;
  }

  return sanitized;
};

// Fonction de validation complète
export const validateField = (value, fieldName, isRequired = false) => {
  // Vérification si requis
  if (isRequired && (!value || value.trim() === "")) {
    return { isValid: false, message: "Ce champ est requis" };
  }

  // Si pas de valeur et pas requis, c'est valide
  if (!value || value.trim() === "") {
    return { isValid: true, message: "" };
  }

  // Nettoyage de la valeur
  const sanitizedValue = sanitizeInput(value);

  // Vérification de longueur maximale générale
  if (sanitizedValue.length > 1000) {
    return {
      isValid: false,
      message: "La valeur est trop longue (max 1000 caractères)",
    };
  }

  // Validation avec regex si pattern défini
  const validation = VALIDATION_PATTERNS[fieldName];
  if (validation && !validation.pattern.test(sanitizedValue)) {
    return { isValid: false, message: validation.message };
  }

  return { isValid: true, message: "", sanitizedValue };
};

// Validation de formulaire complet avec logique conditionnelle
export const validateSettingsForm = (formData) => {
  const errors = {};
  const sanitizedData = {};
  
  // Get conditional requirements based on legal form
  const legalForm = formData.legal?.legalForm || '';
  const isVatSubject = formData.legal?.isVatSubject || false;
  const hasCommercialActivity = formData.legal?.hasCommercialActivity || false;
  
  const requiredFields = getRequiredFields(legalForm, isVatSubject, hasCommercialActivity);
  const visibleFields = getVisibleFields(legalForm, isVatSubject, hasCommercialActivity);
  
  // Validation des champs entreprise
  if (formData.name) {
    const validation = validateField(formData.name, "companyName", false); // Pas requis
    if (!validation.isValid) errors.name = validation.message;
    else sanitizedData.name = validation.sanitizedValue;
  }

  if (formData.email) {
    const validation = validateField(formData.email, "email", false); // Pas requis
    if (!validation.isValid) errors.email = validation.message;
    else sanitizedData.email = validation.sanitizedValue;
  }

  if (formData.phone) {
    const validation = validateField(formData.phone, "phone");
    if (!validation.isValid) errors.phone = validation.message;
    else sanitizedData.phone = validation.sanitizedValue;
  }

  if (formData.website) {
    const validation = validateField(formData.website, "website");
    if (!validation.isValid) errors.website = validation.message;
    else sanitizedData.website = validation.sanitizedValue;
  }

  if (formData.description) {
    const validation = validateField(formData.description, "description");
    if (!validation.isValid) errors.description = validation.message;
    else sanitizedData.description = validation.sanitizedValue;
  }

  // Validation adresse
  if (formData.address) {
    const addressErrors = {};
    const sanitizedAddress = {};

    if (formData.address.street) {
      const validation = validateField(formData.address.street, "street");
      if (!validation.isValid) addressErrors.street = validation.message;
      else sanitizedAddress.street = validation.sanitizedValue;
    }

    if (formData.address.city) {
      const validation = validateField(formData.address.city, "city");
      if (!validation.isValid) addressErrors.city = validation.message;
      else sanitizedAddress.city = validation.sanitizedValue;
    }

    if (formData.address.postalCode) {
      const validation = validateField(
        formData.address.postalCode,
        "postalCode"
      );
      if (!validation.isValid) addressErrors.postalCode = validation.message;
      else sanitizedAddress.postalCode = validation.sanitizedValue;
    }

    if (formData.address.country) {
      const validation = validateField(formData.address.country, "country");
      if (!validation.isValid) addressErrors.country = validation.message;
      else sanitizedAddress.country = validation.sanitizedValue;
    }

    if (Object.keys(addressErrors).length > 0) errors.address = addressErrors;
    else sanitizedData.address = sanitizedAddress;
  }

  // Validation informations bancaires
  if (formData.bankDetails) {
    const bankErrors = {};
    const sanitizedBank = {};

    if (formData.bankDetails.iban) {
      const validation = validateField(formData.bankDetails.iban, "iban", true);
      if (!validation.isValid) bankErrors.iban = validation.message;
      else sanitizedBank.iban = validation.sanitizedValue;
    }

    if (formData.bankDetails.bic) {
      const validation = validateField(formData.bankDetails.bic, "bic", true);
      if (!validation.isValid) bankErrors.bic = validation.message;
      else sanitizedBank.bic = validation.sanitizedValue;
    }

    if (formData.bankDetails.bankName) {
      const validation = validateField(
        formData.bankDetails.bankName,
        "bankName"
      );
      if (!validation.isValid) bankErrors.bankName = validation.message;
      else sanitizedBank.bankName = validation.sanitizedValue;
    }

    if (Object.keys(bankErrors).length > 0) errors.bankDetails = bankErrors;
    else sanitizedData.bankDetails = sanitizedBank;
  }

  // Validation informations légales avec logique conditionnelle
  if (formData.legal) {
    const legalErrors = {};
    const sanitizedLegal = {};
    
    // SIRET - toujours obligatoire
    const siretValidation = validateField(formData.legal.siret, 'siret', requiredFields.siret);
    if (!siretValidation.isValid) legalErrors.siret = siretValidation.message;
    else if (siretValidation.sanitizedValue) sanitizedLegal.siret = siretValidation.sanitizedValue;
    
    // RCS - obligatoire selon la forme juridique et activité commerciale
    if (visibleFields.rcs) {
      const rcsValidation = validateField(formData.legal.rcs, 'rcs', requiredFields.rcs);
      if (!rcsValidation.isValid) legalErrors.rcs = rcsValidation.message;
      else if (rcsValidation.sanitizedValue) sanitizedLegal.rcs = rcsValidation.sanitizedValue;
    }
    
    // Numéro de TVA - obligatoire seulement si assujetti à la TVA
    if (visibleFields.vatNumber) {
      const vatValidation = validateField(formData.legal.vatNumber, 'vatNumber', requiredFields.vatNumber);
      if (!vatValidation.isValid) legalErrors.vatNumber = vatValidation.message;
      else if (vatValidation.sanitizedValue) sanitizedLegal.vatNumber = vatValidation.sanitizedValue;
    }
    
    // Capital social - obligatoire selon la forme juridique
    if (visibleFields.capital) {
      const capitalValidation = validateField(formData.legal.capital, 'capital', requiredFields.capital);
      if (!capitalValidation.isValid) legalErrors.capital = capitalValidation.message;
      else if (capitalValidation.sanitizedValue) sanitizedLegal.capital = capitalValidation.sanitizedValue;
    }
    
    // Régime fiscal - toujours obligatoire
    const fiscalRegimeValidation = validateField(formData.legal.fiscalRegime, 'fiscalRegime', requiredFields.fiscalRegime);
    if (!fiscalRegimeValidation.isValid) legalErrors.fiscalRegime = fiscalRegimeValidation.message;
    else if (fiscalRegimeValidation.sanitizedValue) sanitizedLegal.fiscalRegime = fiscalRegimeValidation.sanitizedValue;
    
    // Catégorie d'activité - toujours obligatoire
    const activityValidation = validateField(formData.legal.activityCategory, 'activityCategory', requiredFields.activityCategory);
    if (!activityValidation.isValid) legalErrors.activityCategory = activityValidation.message;
    else if (activityValidation.sanitizedValue) sanitizedLegal.activityCategory = activityValidation.sanitizedValue;
    
    if (Object.keys(legalErrors).length > 0) errors.legal = legalErrors;
    else sanitizedData.legal = sanitizedLegal;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData,
  };
};

// Fonction utilitaire pour échapper les caractères HTML
export const escapeHtml = (text) => {
  if (!text) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// Fonction pour détecter les tentatives d'injection
export const detectInjectionAttempt = (input) => {
  if (!input || typeof input !== "string") return false;

  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
    /expression\s*\(/i,
    /url\s*\(/i,
    /import\s+/i,
    /eval\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
    /Function\s*\(/i,
    /document\./i,
    /window\./i,
    /alert\s*\(/i,
    /confirm\s*\(/i,
    /prompt\s*\(/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(input));
};
