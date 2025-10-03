import { useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { toast } from '@/src/components/ui/sonner';
import { useRealTimePolling } from './useRealTimePolling';

/**
 * Exemple d'utilisation du système temps réel pour d'autres outils
 * Adaptez ce template selon vos besoins spécifiques
 */
export const useRealTimeExample = ({ 
  query, 
  variables = {}, 
  toolName = "Outil",
  notificationMessage = "Données mises à jour par un collaborateur"
}) => {
  // Requête GraphQL standard
  const { data, loading, error, refetch } = useQuery(query, {
    variables,
    skip: !variables.workspaceId,
    errorPolicy: "all",
    // Optionnel : politique de cache pour éviter les flashs
    fetchPolicy: 'cache-and-network',
  });

  // Callback pour gérer les changements de données
  const handleDataChange = useCallback((newData) => {
    // Personnalisez cette logique selon vos données
    if (newData) {
      toast.info(`📊 ${notificationMessage}`, {
        duration: 3000,
      });
    }
  }, [notificationMessage]);

  // Configuration du polling temps réel
  const realTimeConfig = useRealTimePolling({
    refetch,
    enabled: !!variables.workspaceId && !loading,
    // Configuration adaptée selon le type de données
    baseInterval: 5000,   // 5 secondes par défaut
    maxInterval: 30000,   // 30 secondes maximum
    minInterval: 2000,    // 2 secondes minimum
    onDataChange: handleDataChange,
  });

  return {
    // Données originales
    data,
    loading,
    error,
    refetch,
    
    // États temps réel
    ...realTimeConfig,
    
    // Helpers
    toolName,
  };
};

// Exemples d'utilisation spécifiques

/**
 * Hook pour les factures avec temps réel
 */
export const useRealTimeInvoices = (workspaceId) => {
  return useRealTimeExample({
    query: GET_INVOICES, // Remplacez par votre requête
    variables: { workspaceId },
    toolName: "Factures",
    notificationMessage: "Factures mises à jour par un collaborateur"
  });
};

/**
 * Hook pour les clients avec temps réel
 */
export const useRealTimeClients = (workspaceId) => {
  return useRealTimeExample({
    query: GET_CLIENTS, // Remplacez par votre requête
    variables: { workspaceId },
    toolName: "Clients",
    notificationMessage: "Clients mis à jour par un collaborateur"
  });
};

/**
 * Hook pour les produits avec temps réel
 */
export const useRealTimeProducts = (workspaceId) => {
  return useRealTimeExample({
    query: GET_PRODUCTS, // Remplacez par votre requête
    variables: { workspaceId },
    toolName: "Produits",
    notificationMessage: "Catalogue mis à jour par un collaborateur"
  });
};

export default useRealTimeExample;
