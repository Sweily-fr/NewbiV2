import { useCallback, useRef } from 'react';
import { toast } from '@/src/components/ui/sonner';
import { getErrorMessage, isCriticalError, requiresUserAction } from '@/src/utils/errorMessages';
import { useRouter } from 'next/navigation';

/**
 * Hook personnalisé pour la gestion centralisée des erreurs
 * Transforme les erreurs techniques en messages utilisateur clairs
 */
export function useErrorHandler() {
  const router = useRouter();
  const lastErrorRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  /**
   * Gère une erreur en affichant le message approprié et en prenant les actions nécessaires
   * @param {Error|string} error - L'erreur à gérer
   * @param {string} context - Le contexte de l'erreur
   * @param {Object} options - Options supplémentaires
   */
  const handleError = useCallback((error, context = 'generic', options = {}) => {
    const {
      showToast = true,
      logError = true,
      redirectOnCritical = true,
      customMessage = null,
      duration = 5000,
      onError = null,
      preventDuplicates = true,
      hideServerErrors = true
    } = options;

    // Logger l'erreur pour le debug (seulement en développement)
    if (logError && process.env.NODE_ENV === 'development') {
      console.error(`[${context.toUpperCase()}] Erreur:`, error);
    }

    // Obtenir le message utilisateur approprié
    const userMessage = customMessage || getErrorMessage(error, context);

    // Filtrer les erreurs serveur si demandé
    const errorMessage = typeof error === 'string' ? error : error.message || '';
    const isServerError = errorMessage.includes('500') || 
                          errorMessage.includes('Internal Server Error') ||
                          errorMessage.includes('Server Error');
    
    if (hideServerErrors && isServerError) {
      // Ne pas afficher les erreurs serveur brutes, utiliser un message générique
      if (showToast) {
        toast.error("Une erreur s'est produite. Veuillez réessayer.", { duration });
      }
      return userMessage;
    }

    // Prévenir les doublons de notifications
    if (preventDuplicates) {
      const errorKey = `${context}-${userMessage}`;
      const now = Date.now();
      
      if (lastErrorRef.current === errorKey && 
          errorTimeoutRef.current && 
          now - errorTimeoutRef.current < 3000) {
        // Même erreur dans les 3 dernières secondes, ne pas afficher
        return userMessage;
      }
      
      lastErrorRef.current = errorKey;
      errorTimeoutRef.current = now;
    }

    // Afficher le toast si demandé
    if (showToast) {
      // Déterminer le type de toast selon la gravité
      if (isCriticalError(error)) {
        toast.error(userMessage, {
          duration: duration,
          description: "Vous allez être redirigé vers la page de connexion"
        });
      } else if (requiresUserAction(error)) {
        toast.warning(userMessage, {
          duration: duration,
          description: "Une action de votre part est requise"
        });
      } else {
        toast.error(userMessage, {
          duration: duration
        });
      }
    }

    // Gérer les erreurs critiques
    if (isCriticalError(error) && redirectOnCritical) {
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    }

    // Callback personnalisé si fourni
    if (onError && typeof onError === 'function') {
      onError(error, userMessage);
    }

    return userMessage;
  }, [router]);

  /**
   * Gère spécifiquement les erreurs GraphQL
   */
  const handleGraphQLError = useCallback((error, context = 'generic', options = {}) => {
    // Extraire les erreurs GraphQL
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      const graphQLError = error.graphQLErrors[0];
      const enhancedError = {
        message: graphQLError.message,
        code: graphQLError.extensions?.code,
        ...graphQLError
      };
      return handleError(enhancedError, context, options);
    }

    // Gérer les erreurs réseau
    if (error.networkError) {
      return handleError(error.networkError, 'network', options);
    }

    // Erreur GraphQL générique
    return handleError(error, context, options);
  }, [handleError]);

  /**
   * Gère les erreurs de mutation avec des messages contextuels
   */
  const handleMutationError = useCallback((error, operation, context, options = {}) => {
    const contextualOptions = {
      ...options,
      customMessage: getOperationErrorMessage(operation, context)
    };
    
    return handleGraphQLError(error, context, contextualOptions);
  }, [handleGraphQLError]);

  /**
   * Gère les erreurs de validation de formulaire
   */
  const handleValidationError = useCallback((errors, options = {}) => {
    if (!errors || typeof errors !== 'object') return;

    const errorMessages = Object.entries(errors).map(([field, error]) => {
      const fieldName = getFieldDisplayName(field);
      const message = typeof error === 'string' ? error : error.message;
      return `${fieldName}: ${message}`;
    });

    const combinedMessage = errorMessages.length > 1 
      ? `Erreurs de validation:\n${errorMessages.join('\n')}`
      : errorMessages[0];

    if (options.showToast !== false) {
      toast.error("Veuillez corriger les erreurs suivantes", {
        description: combinedMessage,
        duration: options.duration || 7000
      });
    }

    return combinedMessage;
  }, []);

  /**
   * Wrapper pour les opérations async avec gestion d'erreur automatique
   */
  const withErrorHandling = useCallback((asyncOperation, context = 'generic', options = {}) => {
    return async (...args) => {
      try {
        return await asyncOperation(...args);
      } catch (error) {
        handleError(error, context, options);
        throw error; // Re-throw pour permettre la gestion locale si nécessaire
      }
    };
  }, [handleError]);

  return {
    handleError,
    handleGraphQLError,
    handleMutationError,
    handleValidationError,
    withErrorHandling
  };
}

/**
 * Obtient un message d'erreur contextuel pour les opérations
 */
function getOperationErrorMessage(operation, context) {
  const operationMessages = {
    create: {
      client: "Impossible de créer le client",
      invoice: "Impossible de créer la facture", 
      quote: "Impossible de créer le devis",
      creditNote: "Impossible de créer l'avoir"
    },
    update: {
      client: "Impossible de modifier le client",
      invoice: "Impossible de modifier la facture",
      quote: "Impossible de modifier le devis", 
      creditNote: "Impossible de modifier l'avoir"
    },
    delete: {
      client: "Impossible de supprimer le client",
      invoice: "Impossible de supprimer la facture",
      quote: "Impossible de supprimer le devis",
      creditNote: "Impossible de supprimer l'avoir"
    },
    send: {
      invoice: "Impossible d'envoyer la facture",
      quote: "Impossible d'envoyer le devis"
    }
  };

  return operationMessages[operation]?.[context] || "Opération impossible";
}

/**
 * Convertit les noms de champs techniques en libellés utilisateur
 */
function getFieldDisplayName(fieldName) {
  const fieldNames = {
    email: "Email",
    name: "Nom",
    firstName: "Prénom", 
    lastName: "Nom de famille",
    phone: "Téléphone",
    siret: "SIRET",
    vatNumber: "Numéro de TVA",
    address: "Adresse",
    city: "Ville",
    postalCode: "Code postal",
    country: "Pays",
    companyName: "Nom de l'entreprise",
    legalForm: "Forme juridique",
    activityCategory: "Catégorie d'activité",
    fiscalRegime: "Régime fiscal"
  };

  return fieldNames[fieldName] || fieldName;
}

/**
 * Hook spécialisé pour les erreurs d'authentification
 */
export function useAuthErrorHandler() {
  const { handleError } = useErrorHandler();
  
  const handleAuthError = useCallback((error, options = {}) => {
    return handleError(error, 'auth', {
      redirectOnCritical: true,
      ...options
    });
  }, [handleError]);

  return { handleAuthError };
}

/**
 * Hook spécialisé pour les erreurs de formulaire
 */
export function useFormErrorHandler() {
  const { handleValidationError, handleError } = useErrorHandler();
  
  const handleFormError = useCallback((error, context = 'generic', options = {}) => {
    // Si c'est une erreur de validation React Hook Form
    if (error && typeof error === 'object' && !error.message) {
      return handleValidationError(error, options);
    }
    
    // Sinon, traiter comme une erreur normale
    return handleError(error, context, options);
  }, [handleValidationError, handleError]);

  return { handleFormError };
}
