import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSession } from '@/src/lib/auth-client';
import { useTrial } from '@/src/hooks/useTrial';
import { authClient } from '@/src/lib/auth-client';
import { updateOrganization } from '@/src/lib/organization-client';
import { toast } from 'sonner';

/**
 * Hook optimisé pour les données du layout dashboard avec cache intelligent
 * Évite les rechargements inutiles des informations utilisateur, workspace et abonnement
 */
export function useDashboardLayout() {
  // États de cache local
  const [cachedData, setCachedData] = useState({
    user: null,
    organization: null,
    subscription: null,
    trial: null,
    lastUpdate: null,
  });
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Données de session avec cache-first
  const { data: session, isPending: sessionLoading } = useSession();
  
  // Données de trial avec cache
  const trial = useTrial();

  // Protection contre l'erreur d'hydratation
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Cache key basé sur l'utilisateur et l'organisation
  const cacheKey = useMemo(() => {
    if (!session?.user?.id || !session?.session?.activeOrganizationId) return null;
    return `dashboard-layout-${session.user.id}-${session.session.activeOrganizationId}`;
  }, [session?.user?.id, session?.session?.activeOrganizationId]);

  // Récupération des données d'abonnement avec cache
  const fetchSubscriptionData = async (organizationId) => {
    try {
      const { data: subscriptions, error } = await authClient.subscription.list({
        query: {
          referenceId: organizationId,
        },
      });

      if (error) {
        console.warn('Erreur récupération abonnement:', error);
        return null;
      }

      return subscriptions?.find(
        (sub) => sub.status === "active" || sub.status === "trialing"
      ) || null;
    } catch (error) {
      console.warn('Erreur lors de la récupération de l\'abonnement:', error);
      return null;
    }
  };

  // Fonction pour vérifier si les données en cache sont encore valides
  const isCacheValid = (lastUpdate) => {
    if (!lastUpdate) return false;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    return Date.now() - lastUpdate < CACHE_DURATION;
  };

  // État pour éviter les appels multiples
  const isLoadingRef = useRef(false);

  // Fonction pour charger et mettre en cache les données
  const loadLayoutData = useCallback(async (forceRefresh = false) => {
    if (!isHydrated || !session?.user || !session?.session?.activeOrganizationId) {
      setIsLoading(false);
      return;
    }

    // Éviter les appels multiples simultanés
    if (isLoadingRef.current && !forceRefresh) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      // Récupérer les données d'abonnement
      const subscriptionData = await fetchSubscriptionData(
        session.session.activeOrganizationId
      );

      // Mettre à jour le cache
      const newCachedData = {
        user: session?.user,
        organization: session?.user?.organization,
        subscription: subscriptionData,
        trial: trial,
        lastUpdate: Date.now(),
      };

      setCachedData(newCachedData);

      // Sauvegarder dans le localStorage pour persistance
      if (cacheKey) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(newCachedData));
        } catch (error) {
          console.warn('Impossible de sauvegarder en cache local:', error);
        }
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données du layout:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
      isLoadingRef.current = false;
    }
  }, [isHydrated, cacheKey]);

  // Charger depuis le localStorage au démarrage
  useEffect(() => {
    if (!isHydrated || !cacheKey) return;

    let shouldLoadData = true;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (isCacheValid(parsedCache.lastUpdate)) {
          setCachedData(parsedCache);
          setIsLoading(false);
          setIsInitialized(true);
          shouldLoadData = false;
        }
      }
    } catch (error) {
      console.warn('Erreur lecture cache local:', error);
    }

    // Si pas de cache valide, charger les données
    if (shouldLoadData) {
      loadLayoutData();
    }
  }, [isHydrated, cacheKey, loadLayoutData]);

  // Recharger si la session change significativement (simplifié)
  useEffect(() => {
    if (isInitialized && session?.user?.id) {
      // Utiliser un timeout pour éviter les appels trop fréquents
      const timeoutId = setTimeout(() => {
        loadLayoutData(true); // Force refresh
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [session?.user?.id, session?.user?.organization?.id, isInitialized, loadLayoutData]);

  // Fonction pour forcer le rafraîchissement du cache
  const refreshLayoutData = useCallback(() => {
    if (cacheKey) {
      localStorage.removeItem(cacheKey);
    }
    setCachedData({
      user: null,
      organization: null,
      subscription: null,
      trial: null,
      lastUpdate: null,
    });
    loadLayoutData(true); // Force refresh
  }, [cacheKey, loadLayoutData]);

  // Fonction pour invalider le cache après mise à jour d'organisation
  const invalidateOrganizationCache = () => {
    refreshLayoutData();
  };

  // Logique d'onboarding avec cache
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  // Calculer l'état d'onboarding de manière dérivée (pas de useEffect)
  const shouldShowOnboardingModal = useMemo(() => {
    if (!cachedData.user || !cachedData.organization) return false;
    const isOwner = cachedData.user.role === 'owner';
    const hasCompletedOnboarding = cachedData.organization.hasCompletedOnboarding;
    return isOwner && !hasCompletedOnboarding;
  }, [cachedData.user?.role, cachedData.organization?.hasCompletedOnboarding]);

  // Mettre à jour l'état d'onboarding seulement quand nécessaire
  useEffect(() => {
    if (shouldShowOnboardingModal && !isOnboardingOpen) {
      setIsOnboardingOpen(true);
    }
  }, [shouldShowOnboardingModal, isOnboardingOpen]);

  const completeOnboarding = async () => {
    if (!cachedData.organization?.id) {
      toast.error("Erreur lors de la finalisation de l'onboarding");
      return;
    }

    setOnboardingLoading(true);
    
    try {
      await updateOrganization(cachedData.organization.id, {
        hasCompletedOnboarding: true,
        onboardingStep: 6,
      });

      setIsOnboardingOpen(false);
      toast.success("Bienvenue sur Newbi ! 🎉");
      
      // Invalider le cache pour forcer le rechargement
      refreshLayoutData();
      
    } catch (error) {
      console.error('Erreur lors de la finalisation de l\'onboarding:', error);
      toast.error("Erreur lors de la finalisation de l'onboarding");
    } finally {
      setOnboardingLoading(false);
    }
  };

  // Logique d'abonnement avec cache
  const hasFeature = (feature) => {
    if (!cachedData.subscription) return false;
    return cachedData.subscription.limits?.[feature] > 0;
  };

  const getLimit = (feature) => {
    return cachedData.subscription?.limits?.[feature] || 0;
  };

  const isActive = () => {
    // Vérifier d'abord si l'utilisateur a un abonnement payant actif
    const hasActiveSubscription = 
      cachedData.subscription?.status === "active" || 
      cachedData.subscription?.status === "trialing";
    
    // Si pas d'abonnement payant, vérifier la période d'essai
    if (!hasActiveSubscription) {
      return trial.hasPremiumAccess;
    }
    
    return hasActiveSubscription;
  };

  return {
    // Données utilisateur
    user: cachedData.user,
    organization: cachedData.organization,
    
    // Données d'abonnement
    subscription: cachedData.subscription,
    hasFeature,
    getLimit,
    isActive,
    
    // Données de trial
    trial,
    
    // Onboarding
    isOnboardingOpen,
    setIsOnboardingOpen,
    completeOnboarding,
    skipOnboarding: completeOnboarding,
    onboardingLoading,
    shouldShowOnboarding: cachedData.user?.role === 'owner' && 
                         !cachedData.organization?.hasCompletedOnboarding,
    
    // États de chargement
    isLoading: isLoading || sessionLoading || trial.loading,
    isInitialized,
    isHydrated,
    
    // Fonctions de cache
    refreshLayoutData,
    invalidateOrganizationCache,
    
    // Métadonnées de cache
    cacheInfo: {
      lastUpdate: cachedData.lastUpdate,
      isFromCache: cachedData.lastUpdate && isCacheValid(cachedData.lastUpdate),
      cacheKey,
    },
  };
}
