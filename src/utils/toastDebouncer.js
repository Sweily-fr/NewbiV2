/**
 * Système de debouncing global pour les notifications toast
 * Évite les notifications dupliquées en filtrant les messages identiques
 */

class ToastDebouncer {
  constructor() {
    this.notifications = new Map();
    this.debounceTime = 3000; // 3 secondes
  }

  /**
   * Vérifie si une notification doit être affichée
   * @param {string} message - Le message de la notification
   * @param {string} type - Le type de notification (success, info, error, warning)
   * @param {string} description - Description optionnelle
   * @returns {boolean} - true si la notification doit être affichée
   */
  shouldShow(message, type = "info", description = "") {
    const key = `${type}-${message}-${description}`;
    const now = Date.now();

    // Vérifier si cette notification a déjà été affichée récemment
    if (this.notifications.has(key)) {
      const lastTime = this.notifications.get(key);

      // Si c'est dans la fenêtre de debouncing, ignorer
      if (now - lastTime < this.debounceTime) {
        console.log(
          `🚫 [ToastDebouncer] Notification ignorée (debounce): ${message}`,
        );
        return false;
      }
    }

    // Enregistrer cette notification
    this.notifications.set(key, now);

    // Nettoyer les anciennes entrées (plus de 10 secondes)
    this.cleanup();

    console.log(`✅ [ToastDebouncer] Notification autorisée: ${message}`);
    return true;
  }

  /**
   * Nettoie les anciennes entrées de notifications
   */
  cleanup() {
    const now = Date.now();
    const cleanupTime = 10000; // 10 secondes

    for (const [key, timestamp] of this.notifications.entries()) {
      if (now - timestamp > cleanupTime) {
        this.notifications.delete(key);
      }
    }
  }

  /**
   * Force le nettoyage de toutes les notifications
   */
  clear() {
    this.notifications.clear();
    console.log("🧹 [ToastDebouncer] Cache nettoyé");
  }

  /**
   * Configure le temps de debouncing
   * @param {number} time - Temps en millisecondes
   */
  setDebounceTime(time) {
    this.debounceTime = time;
  }

  /**
   * Obtient les statistiques du debouncer
   */
  getStats() {
    return {
      activeNotifications: this.notifications.size,
      debounceTime: this.debounceTime,
      notifications: Array.from(this.notifications.entries()).map(
        ([key, timestamp]) => ({
          key,
          timestamp,
          age: Date.now() - timestamp,
        }),
      ),
    };
  }
}

// Instance globale
const toastDebouncer = new ToastDebouncer();

export default toastDebouncer;
