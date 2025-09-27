import { useState, useEffect } from 'react';
import { useSession } from '@/src/lib/auth-client';
import { useTrial } from '@/src/hooks/useTrial';
import { authClient } from '@/src/lib/auth-client';
import { updateOrganization } from '@/src/lib/organization-client';
import { toast } from 'sonner';

/**
 * Version simplifiée du hook dashboard layout sans cache pour éviter les boucles infinies
 * Version temporaire pendant que nous résolvons les problèmes de cache
 */
export function useDashboardLayoutSimple() {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [subscription, setSubscription] = useState(null);

  // Données de session
  const { data: session, isPending: sessionLoading } = useSession();
  
  // Données de trial
  const trial = useTrial();

  // États pour les données utilisateur (cache minimal)
  const [cachedUser, setCachedUser] = useState(null);
  const [cachedOrganization, setCachedOrganization] = useState(null);

  // Protection contre l'erreur d'hydratation + chargement cache utilisateur
  useEffect(() => {
    setIsHydrated(true);
    
    // Charger les données utilisateur depuis le cache si disponibles
    try {
      const userCache = localStorage.getItem('user-cache');
      if (userCache) {
        const { user, organization, timestamp } = JSON.parse(userCache);
        const isValid = Date.now() - timestamp < 5 * 60 * 1000; // 5 minutes
        
        if (isValid) {
          setCachedUser(user);
          setCachedOrganization(organization);
        }
      }
    } catch (error) {
      console.warn('Erreur lecture cache utilisateur:', error);
    }
  }, []);

  // Sauvegarder les données utilisateur en cache quand elles changent
  useEffect(() => {
    if (session?.user && isHydrated) {
      try {
        localStorage.setItem('user-cache', JSON.stringify({
          user: session.user,
          organization: session.user.organization,
          timestamp: Date.now()
        }));
        setCachedUser(session.user);
        setCachedOrganization(session.user.organization);
      } catch (error) {
        console.warn('Erreur sauvegarde cache utilisateur:', error);
      }
    }
  }, [session?.user, isHydrated]);

  // Cache minimal pour les données d'abonnement (éviter les flashs)
  useEffect(() => {
    if (!isHydrated) return;

    // Essayer de charger depuis le cache local d'abord
    const cacheKey = session?.session?.activeOrganizationId 
      ? `subscription-${session.session.activeOrganizationId}` 
      : null;

    if (cacheKey) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data: cachedSubscription, timestamp } = JSON.parse(cached);
          const isValid = Date.now() - timestamp < 2 * 60 * 1000; // 2 minutes
          
          if (isValid) {
            setSubscription(cachedSubscription);
            setIsLoading(false);
            setIsInitialized(true);
            return;
          }
        }
      } catch (error) {
        console.warn('Erreur lecture cache abonnement:', error);
      }
    }

    // Si pas de cache valide, charger depuis l'API
    if (!session?.session?.activeOrganizationId) {
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }

    const fetchSubscription = async () => {
      try {
        setIsLoading(true);
        
        const { data: subscriptions, error } = await authClient.subscription.list({
          query: {
            referenceId: session.session.activeOrganizationId,
          },
        });

        if (!error) {
          const activeSubscription = subscriptions?.find(
            (sub) => sub.status === "active" || sub.status === "trialing"
          );
          
          setSubscription(activeSubscription || null);
          
          // Sauvegarder en cache pour éviter les flashs futurs
          if (cacheKey) {
            try {
              localStorage.setItem(cacheKey, JSON.stringify({
                data: activeSubscription || null,
                timestamp: Date.now()
              }));
            } catch (error) {
              console.warn('Erreur sauvegarde cache abonnement:', error);
            }
          }
        }
      } catch (error) {
        console.warn('Erreur récupération abonnement:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    fetchSubscription();
  }, [isHydrated, session?.session?.activeOrganizationId]);

  // Logique d'onboarding simplifiée
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.organization) {
      const isOwner = session.user.role === 'owner';
      const hasCompletedOnboarding = session.user.organization.hasCompletedOnboarding;
      
      if (isOwner && !hasCompletedOnboarding) {
        setIsOnboardingOpen(true);
      }
    }
  }, [session?.user?.role, session?.user?.organization?.hasCompletedOnboarding, session?.user?.organization]);

  const completeOnboarding = async () => {
    if (!session?.user?.organization?.id) {
      toast.error("Erreur lors de la finalisation de l'onboarding");
      return;
    }

    setOnboardingLoading(true);
    
    try {
      await updateOrganization(session.user.organization.id, {
        hasCompletedOnboarding: true,
        onboardingStep: 6,
      });

      setIsOnboardingOpen(false);
      toast.success("Bienvenue sur Newbi ! 🎉");
      
      // Recharger la page pour mettre à jour les données
      window.location.reload();
      
    } catch (error) {
      console.error('Erreur lors de la finalisation de l\'onboarding:', error);
      toast.error("Erreur lors de la finalisation de l'onboarding");
    } finally {
      setOnboardingLoading(false);
    }
  };

  // Logique d'abonnement
  const hasFeature = (feature) => {
    if (!subscription) return false;
    return subscription.limits?.[feature] > 0;
  };

  const getLimit = (feature) => {
    return subscription?.limits?.[feature] || 0;
  };

  const isActive = () => {
    const hasActiveSubscription = 
      subscription?.status === "active" || 
      subscription?.status === "trialing";
    
    if (!hasActiveSubscription) {
      return trial.hasPremiumAccess;
    }
    
    return hasActiveSubscription;
  };

  // Fonction de rafraîchissement simple
  const refreshLayoutData = () => {
    // Vider tous les caches avant de recharger
    try {
      // Cache d'abonnement
      const subscriptionCacheKey = session?.session?.activeOrganizationId 
        ? `subscription-${session.session.activeOrganizationId}` 
        : null;
      
      if (subscriptionCacheKey) {
        localStorage.removeItem(subscriptionCacheKey);
      }
      
      // Cache utilisateur
      localStorage.removeItem('user-cache');
      
    } catch (error) {
      console.warn('Erreur suppression caches:', error);
    }
    
    window.location.reload();
  };

  return {
    // Données utilisateur (avec cache pour éviter les flashs)
    user: session?.user || cachedUser,
    organization: session?.user?.organization || cachedOrganization,
    
    // Données d'abonnement
    subscription,
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
    shouldShowOnboarding: session?.user?.role === 'owner' && 
                         !session?.user?.organization?.hasCompletedOnboarding,
    
    // États de chargement
    isLoading: isLoading || sessionLoading || trial.loading,
    isInitialized,
    isHydrated,
    
    // Fonctions de cache (simplifiées)
    refreshLayoutData,
    invalidateOrganizationCache: refreshLayoutData,
    
    // Métadonnées de cache (désactivées)
    cacheInfo: {
      lastUpdate: null,
      isFromCache: false,
      cacheKey: null,
    },
  };
}
