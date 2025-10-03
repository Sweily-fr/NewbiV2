import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook pour gérer le polling intelligent en temps réel
 * Adapte la fréquence selon l'activité de l'utilisateur et la visibilité de la page
 */
export const useRealTimePolling = ({
  refetch,
  enabled = true,
  baseInterval = 5000, // 5 secondes par défaut
  maxInterval = 30000, // 30 secondes maximum
  minInterval = 2000, // 2 secondes minimum
  onDataChange = null,
}) => {
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'error'
  
  const intervalRef = useRef(null);
  const currentIntervalRef = useRef(baseInterval);
  const lastDataHashRef = useRef(null);
  const isActiveRef = useRef(true);

  // Détection d'activité utilisateur
  const resetActivity = useCallback(() => {
    isActiveRef.current = true;
    currentIntervalRef.current = baseInterval;
  }, [baseInterval]);

  // Fonction de polling
  const poll = useCallback(async () => {
    if (!enabled || !refetch) return;

    try {
      setSyncStatus('syncing');
      setIsPolling(true);
      
      const result = await refetch();
      
      // Calculer un hash simple des données pour détecter les changements
      const dataHash = JSON.stringify(result?.data || {});
      
      if (lastDataHashRef.current && lastDataHashRef.current !== dataHash) {
        // Données changées - notifier et réduire l'intervalle temporairement
        if (onDataChange) {
          onDataChange(result?.data);
        }
        currentIntervalRef.current = minInterval;
        console.log('🔄 Données Kanban mises à jour par un collaborateur');
      } else if (lastDataHashRef.current === dataHash) {
        // Pas de changement - augmenter progressivement l'intervalle
        currentIntervalRef.current = Math.min(
          currentIntervalRef.current * 1.2,
          maxInterval
        );
      }
      
      lastDataHashRef.current = dataHash;
      setLastUpdate(new Date());
      setSyncStatus('idle');
      
    } catch (error) {
      console.error('Erreur lors du polling:', error);
      setSyncStatus('error');
      // En cas d'erreur, augmenter l'intervalle pour éviter le spam
      currentIntervalRef.current = Math.min(
        currentIntervalRef.current * 2,
        maxInterval
      );
    } finally {
      setIsPolling(false);
    }
  }, [enabled, refetch, onDataChange, minInterval, maxInterval]);

  // Gestion de la visibilité de la page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page cachée - arrêter le polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Page visible - reprendre le polling immédiatement
        resetActivity();
        poll();
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [poll, resetActivity]);

  // Gestion de l'activité utilisateur
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      resetActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [resetActivity]);

  // Fonction pour démarrer le polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const scheduleNext = () => {
      intervalRef.current = setTimeout(() => {
        poll().then(() => {
          if (enabled && !document.hidden) {
            scheduleNext();
          }
        });
      }, currentIntervalRef.current);
    };

    scheduleNext();
  }, [poll, enabled]);

  // Fonction pour arrêter le polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Fonction pour forcer une synchronisation
  const forcSync = useCallback(() => {
    resetActivity();
    return poll();
  }, [poll, resetActivity]);

  // Démarrer le polling au montage du composant
  useEffect(() => {
    if (enabled && !document.hidden) {
      // Délai initial pour éviter le polling immédiat au chargement
      const initialDelay = setTimeout(() => {
        startPolling();
      }, 1000);

      return () => {
        clearTimeout(initialDelay);
        stopPolling();
      };
    }
  }, [enabled, startPolling, stopPolling]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    isPolling,
    lastUpdate,
    syncStatus,
    currentInterval: currentIntervalRef.current,
    forcSync,
    startPolling,
    stopPolling,
  };
};

export default useRealTimePolling;
