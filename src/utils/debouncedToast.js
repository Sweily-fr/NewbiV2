/**
 * Wrapper pour les notifications toast avec debouncing automatique
 * Utilise le système de debouncing global pour éviter les doublons
 */

import { toast as originalToast } from '@/src/components/ui/sonner';
import toastDebouncer from './toastDebouncer';

/**
 * Toast avec debouncing automatique
 */
const debouncedToast = {
  /**
   * Notification de succès
   */
  success: (message, options = {}) => {
    const { description = '' } = options;
    
    if (toastDebouncer.shouldShow(message, 'success', description)) {
      return originalToast.success(message, options);
    }
    return null;
  },

  /**
   * Notification d'information
   */
  info: (message, options = {}) => {
    const { description = '' } = options;
    
    if (toastDebouncer.shouldShow(message, 'info', description)) {
      return originalToast.info(message, options);
    }
    return null;
  },

  /**
   * Notification d'erreur
   */
  error: (message, options = {}) => {
    const { description = '' } = options;
    
    if (toastDebouncer.shouldShow(message, 'error', description)) {
      return originalToast.error(message, options);
    }
    return null;
  },

  /**
   * Notification d'avertissement
   */
  warning: (message, options = {}) => {
    const { description = '' } = options;
    
    if (toastDebouncer.shouldShow(message, 'warning', description)) {
      return originalToast.warning(message, options);
    }
    return null;
  },

  /**
   * Notification par défaut
   */
  default: (message, options = {}) => {
    const { description = '' } = options;
    
    if (toastDebouncer.shouldShow(message, 'default', description)) {
      return originalToast(message, options);
    }
    return null;
  },

  /**
   * Méthodes utilitaires
   */
  dismiss: originalToast.dismiss,
  promise: originalToast.promise,
  custom: originalToast.custom,
  
  /**
   * Accès au debouncer pour debug
   */
  debouncer: toastDebouncer
};

export default debouncedToast;
export { debouncedToast as toast };
