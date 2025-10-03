import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Version optimisée du hook de polling avec techniques avancées
 * À utiliser si le système de base devient trop lourd
 */
export const useRealTimePollingOptimized = ({
  refetch,
  enabled = true,
  baseInterval = 5000,
  maxInterval = 60000, // Augmenté à 1 minute
  minInterval = 2000,
  onDataChange = null,
  // Nouvelles options d'optimisation
  enableBatching = true,
  enableDifferentialSync = true,
  enableBackgroundThrottling = true,
}) => {
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  
  const intervalRef = useRef(null);
  const currentIntervalRef = useRef(baseInterval);
  const lastDataHashRef = useRef(null);
  const isActiveRef = useRef(true);
  const batchTimeoutRef = useRef(null);
  const pendingUpdatesRef = useRef([]);

  // Détection de performance du device
  const [devicePerformance, setDevicePerformance] = useState('high');

  useEffect(() => {
    // Détection automatique des performances
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const memory = navigator.deviceMemory || 4; // Default 4GB
    
    let performance = 'high';
    if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
      performance = 'low';
    } else if (connection?.effectiveType === '3g' || memory < 2) {
      performance = 'medium';
    }
    
    setDevicePerformance(performance);
  }, []);

  // Ajustement des intervalles selon les performances
  const getOptimizedInterval = useCallback(() => {
    const base = currentIntervalRef.current;
    
    switch (devicePerformance) {
      case 'low':
        return Math.max(base * 2, 10000); // Minimum 10s sur faible performance
      case 'medium':
        return Math.max(base * 1.5, 7000); // Minimum 7s sur performance moyenne
      default:
        return base;
    }
  }, [devicePerformance]);

  // Batching des mises à jour pour réduire les re-renders
  const batchUpdate = useCallback((updateFn) => {
    if (!enableBatching) {
      updateFn();
      return;
    }

    pendingUpdatesRef.current.push(updateFn);
    
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    batchTimeoutRef.current = setTimeout(() => {
      const updates = pendingUpdatesRef.current;
      pendingUpdatesRef.current = [];
      
      // Exécuter toutes les mises à jour en batch
      updates.forEach(update => update());
    }, 16); // 60fps
  }, [enableBatching]);

  // Synchronisation différentielle (seulement les changements)
  const performDifferentialSync = useCallback(async () => {
    if (!enableDifferentialSync) {
      return refetch();
    }

    try {
      // Ici, vous pourriez implémenter une requête qui ne récupère
      // que les éléments modifiés depuis lastUpdate
      const result = await refetch({
        // Exemple : ajouter un paramètre lastModified
        variables: {
          ...refetch.variables,
          lastModified: lastUpdate?.toISOString(),
        }
      });
      
      return result;
    } catch (error) {
      // Fallback vers sync complète
      return refetch();
    }
  }, [refetch, lastUpdate, enableDifferentialSync]);

  // Throttling en arrière-plan
  const backgroundThrottleMultiplier = useCallback(() => {
    if (!enableBackgroundThrottling) return 1;
    
    // Détection si l'app est en arrière-plan
    if (document.hidden) return 4; // 4x plus lent
    if (!document.hasFocus?.()) return 2; // 2x plus lent si pas de focus
    
    return 1;
  }, [enableBackgroundThrottling]);

  // Fonction de polling optimisée
  const poll = useCallback(async () => {
    if (!enabled || !refetch) return;

    try {
      setSyncStatus('syncing');
      setIsPolling(true);
      
      // Utiliser la sync différentielle si disponible
      const result = await performDifferentialSync();
      
      // Calculer un hash simple des données
      const dataHash = JSON.stringify(result?.data || {});
      
      if (lastDataHashRef.current && lastDataHashRef.current !== dataHash) {
        // Données changées
        batchUpdate(() => {
          if (onDataChange) {
            onDataChange(result?.data);
          }
          setLastUpdate(new Date());
        });
        
        // Réduire l'intervalle temporairement
        currentIntervalRef.current = minInterval;
      } else if (lastDataHashRef.current === dataHash) {
        // Pas de changement - augmenter l'intervalle
        const throttleMultiplier = backgroundThrottleMultiplier();
        currentIntervalRef.current = Math.min(
          currentIntervalRef.current * 1.2 * throttleMultiplier,
          maxInterval
        );
      }
      
      lastDataHashRef.current = dataHash;
      setSyncStatus('idle');
      
    } catch (error) {
      console.error('Erreur lors du polling optimisé:', error);
      setSyncStatus('error');
      
      // Backoff exponentiel plus agressif en cas d'erreur
      currentIntervalRef.current = Math.min(
        currentIntervalRef.current * 3,
        maxInterval
      );
    } finally {
      setIsPolling(false);
    }
  }, [
    enabled, 
    refetch, 
    onDataChange, 
    minInterval, 
    maxInterval, 
    performDifferentialSync,
    batchUpdate,
    backgroundThrottleMultiplier
  ]);

  // Démarrage du polling avec optimisations
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const scheduleNext = () => {
      const optimizedInterval = getOptimizedInterval();
      
      intervalRef.current = setTimeout(() => {
        poll().then(() => {
          if (enabled && !document.hidden) {
            scheduleNext();
          }
        });
      }, optimizedInterval);
    };

    scheduleNext();
  }, [poll, enabled, getOptimizedInterval]);

  // Nettoyage des timeouts
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  // Monitoring des performances
  const getPerformanceMetrics = useCallback(() => {
    return {
      devicePerformance,
      currentInterval: getOptimizedInterval(),
      isBackgroundThrottled: backgroundThrottleMultiplier() > 1,
      batchingEnabled: enableBatching,
      differentialSyncEnabled: enableDifferentialSync,
    };
  }, [devicePerformance, getOptimizedInterval, backgroundThrottleMultiplier, enableBatching, enableDifferentialSync]);

  // Reste de l'implémentation identique au hook de base...
  // (gestion de visibilité, activité utilisateur, etc.)

  return {
    isPolling,
    lastUpdate,
    syncStatus,
    currentInterval: getOptimizedInterval(),
    devicePerformance,
    getPerformanceMetrics,
    // ... autres retours
  };
};

export default useRealTimePollingOptimized;
