/**
 * Système centralisé de gestion des messages d'erreur utilisateur
 * Transforme les erreurs techniques en messages compréhensibles
 */

// Messages d'erreur par catégorie
export const ERROR_MESSAGES = {
  // Erreurs d'authentification
  AUTH: {
    INVALID_CREDENTIALS: "Email ou mot de passe incorrect",
    ACCOUNT_DISABLED: "Votre compte a été temporairement désactivé. Contactez le support.",
    EMAIL_NOT_VERIFIED: "Veuillez vérifier votre adresse email avant de vous connecter",
    SESSION_EXPIRED: "Votre session a expiré. Veuillez vous reconnecter.",
    UNAUTHORIZED: "Vous n'êtes pas autorisé à effectuer cette action",
    TOKEN_EXPIRED: "Votre session a expiré. Veuillez vous reconnecter.",
    INVALID_TOKEN: "Session invalide. Veuillez vous reconnecter.",
  },

  // Erreurs de réseau
  NETWORK: {
    CONNECTION_FAILED: "Impossible de se connecter au serveur. Vérifiez votre connexion internet.",
    SERVER_UNAVAILABLE: "Le serveur est temporairement indisponible. Veuillez réessayer dans quelques instants.",
    TIMEOUT: "La requête a pris trop de temps. Veuillez réessayer.",
    NO_INTERNET: "Aucune connexion internet détectée. Vérifiez votre connexion.",
  },

  // Erreurs de validation
  VALIDATION: {
    REQUIRED_FIELD: "Ce champ est obligatoire",
    INVALID_EMAIL: "Veuillez saisir une adresse email valide",
    INVALID_PHONE: "Veuillez saisir un numéro de téléphone valide",
    INVALID_SIRET: "Le SIRET doit contenir exactement 14 chiffres",
    INVALID_VAT: "Le format du numéro de TVA n'est pas valide",
    PASSWORD_TOO_SHORT: "Le mot de passe doit contenir au moins 8 caractères",
    PASSWORDS_DONT_MATCH: "Les mots de passe ne correspondent pas",
    INVALID_DATE: "Veuillez saisir une date valide",
    INVALID_AMOUNT: "Veuillez saisir un montant valide",
  },

  // Erreurs métier - Clients
  CLIENT: {
    NOT_FOUND: "Client introuvable",
    ALREADY_EXISTS: "Un client avec cet email existe déjà",
    CREATION_FAILED: "Impossible de créer le client. Vérifiez les informations saisies.",
    UPDATE_FAILED: "Impossible de modifier le client. Veuillez réessayer.",
    DELETE_FAILED: "Impossible de supprimer le client. Il est peut-être utilisé dans des documents.",
    INVALID_DATA: "Les données du client ne sont pas valides",
  },

  // Erreurs métier - Factures
  INVOICE: {
    NOT_FOUND: "Facture introuvable",
    CREATION_FAILED: "Impossible de créer la facture. Vérifiez les informations saisies.",
    UPDATE_FAILED: "Impossible de modifier la facture. Veuillez réessayer.",
    DELETE_FAILED: "Impossible de supprimer la facture",
    SEND_FAILED: "Impossible d'envoyer la facture par email",
    INVALID_STATUS: "Statut de facture invalide",
    ALREADY_PAID: "Cette facture est déjà marquée comme payée",
    CANNOT_MODIFY_PAID: "Impossible de modifier une facture payée",
    DUPLICATE_NUMBER: "Ce numéro de facture existe déjà",
    INVALID_ITEMS: "Veuillez ajouter au moins un article à la facture",
  },

  // Erreurs métier - Devis
  QUOTE: {
    NOT_FOUND: "Devis introuvable",
    CREATION_FAILED: "Impossible de créer le devis. Vérifiez les informations saisies.",
    UPDATE_FAILED: "Impossible de modifier le devis. Veuillez réessayer.",
    DELETE_FAILED: "Impossible de supprimer le devis",
    SEND_FAILED: "Impossible d'envoyer le devis par email",
    INVALID_STATUS: "Statut de devis invalide",
    ALREADY_CONVERTED: "Ce devis a déjà été converti en facture",
    CONVERSION_FAILED: "Impossible de convertir le devis en facture",
    DUPLICATE_NUMBER: "Ce numéro de devis existe déjà",
    INVALID_ITEMS: "Veuillez ajouter au moins un article au devis",
  },

  // Erreurs métier - Avoirs
  CREDIT_NOTE: {
    NOT_FOUND: "Avoir introuvable",
    CREATION_FAILED: "Impossible de créer l'avoir. Vérifiez les informations saisies.",
    UPDATE_FAILED: "Impossible de modifier l'avoir. Veuillez réessayer.",
    DELETE_FAILED: "Impossible de supprimer l'avoir",
    AMOUNT_EXCEEDS_INVOICE: "Le montant de l'avoir ne peut pas dépasser le montant de la facture",
    LIMIT_REACHED: "La limite d'avoirs pour cette facture est atteinte",
    INVALID_ITEMS: "Veuillez ajouter au moins un article à l'avoir",
  },

  // Erreurs métier - Entreprise
  COMPANY: {
    INFO_INCOMPLETE: "Veuillez compléter les informations de votre entreprise dans les paramètres",
    LEGAL_INFO_MISSING: "Les informations légales de votre entreprise sont incomplètes (SIRET, TVA)",
    UPDATE_FAILED: "Impossible de mettre à jour les informations de l'entreprise",
    INVALID_SIRET: "Le numéro SIRET n'est pas valide",
    INVALID_VAT: "Le numéro de TVA n'est pas valide",
  },

  // Erreurs de fichiers
  FILE: {
    UPLOAD_FAILED: "Échec de l'envoi du fichier. Veuillez réessayer.",
    INVALID_FORMAT: "Format de fichier non supporté",
    TOO_LARGE: "Le fichier est trop volumineux. Taille maximum autorisée : 10 Mo",
    DOWNLOAD_FAILED: "Impossible de télécharger le fichier",
    NOT_FOUND: "Fichier introuvable",
    PROCESSING_FAILED: "Erreur lors du traitement du fichier",
  },

  // Erreurs de paiement
  PAYMENT: {
    FAILED: "Le paiement a échoué. Veuillez réessayer.",
    CARD_DECLINED: "Votre carte a été refusée. Vérifiez vos informations bancaires.",
    INSUFFICIENT_FUNDS: "Fonds insuffisants sur votre compte",
    SUBSCRIPTION_FAILED: "Impossible de traiter l'abonnement. Contactez le support.",
    INVOICE_CREATION_FAILED: "Erreur lors de la création de la facture de paiement",
  },

  // Erreurs génériques
  GENERIC: {
    UNKNOWN_ERROR: "Une erreur inattendue s'est produite. Veuillez réessayer.",
    OPERATION_FAILED: "L'opération a échoué. Veuillez réessayer.",
    ACCESS_DENIED: "Accès refusé. Vous n'avez pas les permissions nécessaires.",
    RESOURCE_NOT_FOUND: "Ressource introuvable",
    INVALID_REQUEST: "Requête invalide. Vérifiez les données saisies.",
    SERVER_ERROR: "Erreur serveur. Veuillez réessayer plus tard.",
  },
};

// Patterns d'erreurs techniques à détecter
const ERROR_PATTERNS = {
  // Erreurs GraphQL
  GRAPHQL_VALIDATION: /GraphQL error:|Variable .* of required type|Field .* doesn't exist/i,
  GRAPHQL_NETWORK: /Network error|Failed to fetch/i,
  
  // Erreurs MongoDB
  MONGO_DUPLICATE: /duplicate key error|E11000/i,
  MONGO_VALIDATION: /ValidationError|Path .* is required/i,
  MONGO_CAST: /CastError|Cast to .* failed/i,
  
  // Erreurs d'authentification
  AUTH_INVALID: /invalid credentials|wrong password|authentication failed/i,
  AUTH_EXPIRED: /token expired|session expired|jwt expired/i,
  AUTH_UNAUTHORIZED: /unauthorized|access denied|forbidden/i,
  
  // Erreurs de validation
  VALIDATION_REQUIRED: /required|obligatoire|manquant/i,
  VALIDATION_FORMAT: /invalid format|format invalide|malformed/i,
  VALIDATION_LENGTH: /too short|too long|length/i,
  
  // Erreurs réseau
  NETWORK_TIMEOUT: /timeout|timed out/i,
  NETWORK_CONNECTION: /connection refused|connection failed|network error/i,
  NETWORK_UNAVAILABLE: /service unavailable|server unavailable/i,
};

/**
 * Analyse une erreur et retourne un message utilisateur approprié
 * @param {Error|string} error - L'erreur à analyser
 * @param {string} context - Le contexte de l'erreur (ex: 'client', 'invoice', 'auth')
 * @returns {string} Message d'erreur utilisateur
 */
export function getErrorMessage(error, context = 'generic') {
  if (!error) return ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR;
  
  const errorMessage = typeof error === 'string' ? error : error.message || '';
  const errorCode = typeof error === 'object' ? error.code : null;
  
  // Vérifier d'abord les codes d'erreur spécifiques
  if (errorCode) {
    switch (errorCode) {
      case 'UNAUTHENTICATED':
      case 'UNAUTHORIZED':
        return ERROR_MESSAGES.AUTH.UNAUTHORIZED;
      case 'COMPANY_INFO_INCOMPLETE':
        return ERROR_MESSAGES.COMPANY.INFO_INCOMPLETE;
      case 'VALIDATION_ERROR':
        return ERROR_MESSAGES.VALIDATION.INVALID_DATA;
      case 'DUPLICATE_KEY':
        return getContextualDuplicateMessage(context);
      case 'NOT_FOUND':
        return getContextualNotFoundMessage(context);
    }
  }
  
  // Analyser le message d'erreur avec les patterns
  const lowerMessage = errorMessage.toLowerCase();
  
  // Erreurs spécifiques de confusion entre createInvoice et createQuote
  if (errorMessage.includes("Cannot read properties of undefined (reading 'createInvoice')")) {
    if (context === 'quote') {
      return "Impossible de créer le devis. Veuillez vérifier les informations saisies et réessayer.";
    }
    if (context === 'invoice') {
      return "Impossible de créer la facture. Veuillez vérifier les informations saisies et réessayer.";
    }
    return "Erreur lors de la création du document. Veuillez réessayer.";
  }
  
  // Erreurs génériques de propriétés undefined
  if (errorMessage.includes("Cannot read properties of undefined")) {
    if (context === 'invoice') {
      return "Impossible de traiter la facture. Veuillez vérifier les informations saisies et réessayer.";
    }
    if (context === 'quote') {
      return "Impossible de traiter le devis. Veuillez vérifier les informations saisies et réessayer.";
    }
    return "Une erreur s'est produite lors du traitement. Veuillez réessayer.";
  }
  
  // Erreurs d'authentification
  if (ERROR_PATTERNS.AUTH_INVALID.test(errorMessage)) {
    return ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS;
  }
  if (ERROR_PATTERNS.AUTH_EXPIRED.test(errorMessage)) {
    return ERROR_MESSAGES.AUTH.SESSION_EXPIRED;
  }
  if (ERROR_PATTERNS.AUTH_UNAUTHORIZED.test(errorMessage)) {
    return ERROR_MESSAGES.AUTH.UNAUTHORIZED;
  }
  
  // Erreurs réseau
  if (ERROR_PATTERNS.NETWORK_CONNECTION.test(errorMessage)) {
    return ERROR_MESSAGES.NETWORK.CONNECTION_FAILED;
  }
  if (ERROR_PATTERNS.NETWORK_TIMEOUT.test(errorMessage)) {
    return ERROR_MESSAGES.NETWORK.TIMEOUT;
  }
  if (ERROR_PATTERNS.NETWORK_UNAVAILABLE.test(errorMessage)) {
    return ERROR_MESSAGES.NETWORK.SERVER_UNAVAILABLE;
  }
  
  // Erreurs de validation spécifiques
  if (lowerMessage.includes('email') && lowerMessage.includes('invalid')) {
    return ERROR_MESSAGES.VALIDATION.INVALID_EMAIL;
  }
  if (lowerMessage.includes('siret')) {
    return ERROR_MESSAGES.VALIDATION.INVALID_SIRET;
  }
  if (lowerMessage.includes('tva') || lowerMessage.includes('vat')) {
    return ERROR_MESSAGES.VALIDATION.INVALID_VAT;
  }
  
  // Erreurs contextuelles
  if (lowerMessage.includes('existe déjà') || lowerMessage.includes('already exists')) {
    return getContextualDuplicateMessage(context);
  }
  if (lowerMessage.includes('introuvable') || lowerMessage.includes('not found')) {
    return getContextualNotFoundMessage(context);
  }
  
  // Erreurs de fichiers
  if (lowerMessage.includes('upload') || lowerMessage.includes('téléchargement')) {
    if (lowerMessage.includes('too large') || lowerMessage.includes('trop volumineux')) {
      return ERROR_MESSAGES.FILE.TOO_LARGE;
    }
    return ERROR_MESSAGES.FILE.UPLOAD_FAILED;
  }
  
  // Messages contextuels par défaut
  return getContextualDefaultMessage(context);
}

/**
 * Retourne un message de duplication contextuel
 */
function getContextualDuplicateMessage(context) {
  switch (context) {
    case 'client':
      return ERROR_MESSAGES.CLIENT.ALREADY_EXISTS;
    case 'invoice':
      return ERROR_MESSAGES.INVOICE.DUPLICATE_NUMBER;
    case 'quote':
      return ERROR_MESSAGES.QUOTE.DUPLICATE_NUMBER;
    default:
      return "Cette information existe déjà";
  }
}

/**
 * Retourne un message "non trouvé" contextuel
 */
function getContextualNotFoundMessage(context) {
  switch (context) {
    case 'client':
      return ERROR_MESSAGES.CLIENT.NOT_FOUND;
    case 'invoice':
      return ERROR_MESSAGES.INVOICE.NOT_FOUND;
    case 'quote':
      return ERROR_MESSAGES.QUOTE.NOT_FOUND;
    case 'creditNote':
      return ERROR_MESSAGES.CREDIT_NOTE.NOT_FOUND;
    default:
      return ERROR_MESSAGES.GENERIC.RESOURCE_NOT_FOUND;
  }
}

/**
 * Retourne un message d'erreur par défaut contextuel
 */
function getContextualDefaultMessage(context) {
  switch (context) {
    case 'client':
      return ERROR_MESSAGES.CLIENT.CREATION_FAILED;
    case 'invoice':
      return ERROR_MESSAGES.INVOICE.CREATION_FAILED;
    case 'quote':
      return ERROR_MESSAGES.QUOTE.CREATION_FAILED;
    case 'creditNote':
      return ERROR_MESSAGES.CREDIT_NOTE.CREATION_FAILED;
    case 'auth':
      return ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS;
    case 'payment':
      return ERROR_MESSAGES.PAYMENT.FAILED;
    case 'file':
      return ERROR_MESSAGES.FILE.UPLOAD_FAILED;
    default:
      return ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR;
  }
}

/**
 * Fonction helper pour afficher une erreur avec toast
 * @param {Error|string} error - L'erreur
 * @param {string} context - Le contexte
 * @param {Function} toastFunction - Fonction toast à utiliser
 */
export function showErrorToast(error, context = 'generic', toastFunction) {
  const message = getErrorMessage(error, context);
  if (toastFunction) {
    toastFunction(message);
  }
  return message;
}

/**
 * Validation des erreurs critiques qui nécessitent une action immédiate
 */
export function isCriticalError(error) {
  if (!error) return false;
  
  const errorMessage = typeof error === 'string' ? error : error.message || '';
  const errorCode = typeof error === 'object' ? error.code : null;
  
  // Erreurs critiques qui nécessitent une déconnexion/redirection
  const criticalCodes = ['UNAUTHENTICATED', 'TOKEN_EXPIRED', 'SESSION_EXPIRED'];
  const criticalPatterns = [
    ERROR_PATTERNS.AUTH_EXPIRED,
    ERROR_PATTERNS.AUTH_UNAUTHORIZED
  ];
  
  return criticalCodes.includes(errorCode) || 
         criticalPatterns.some(pattern => pattern.test(errorMessage));
}

/**
 * Détermine si l'erreur nécessite une action de l'utilisateur
 */
export function requiresUserAction(error) {
  if (!error) return false;
  
  const errorMessage = typeof error === 'string' ? error : error.message || '';
  const errorCode = typeof error === 'object' ? error.code : null;
  
  // Erreurs qui nécessitent une action utilisateur
  const actionRequiredCodes = ['COMPANY_INFO_INCOMPLETE', 'EMAIL_NOT_VERIFIED'];
  const actionRequiredPatterns = [
    /compléter.*informations/i,
    /vérifier.*email/i,
    /configuration.*requise/i
  ];
  
  return actionRequiredCodes.includes(errorCode) || 
         actionRequiredPatterns.some(pattern => pattern.test(errorMessage));
}
