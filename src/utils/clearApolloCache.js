/**
 * Utilitaire pour nettoyer le cache Apollo du localStorage
 * À exécuter une fois après la désactivation du système de cache
 */

export const clearApolloCache = () => {
  if (typeof window !== 'undefined') {
    try {
      // Supprimer le cache Apollo du localStorage
      localStorage.removeItem('newbi-apollo-cache');
      console.log('✅ Cache Apollo supprimé du localStorage');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du cache:', error);
      return false;
    }
  }
  return false;
};

// Exécution automatique au chargement du module
if (typeof window !== 'undefined') {
  clearApolloCache();
}
