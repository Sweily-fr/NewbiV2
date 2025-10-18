import { useState, useEffect } from "react";
import { useSession } from "@/src/lib/auth-client";
import { useTrial } from "@/src/hooks/useTrial";
import { authClient } from "@/src/lib/auth-client";
/**
 * Version simplifiée du hook dashboard layout sans cache pour éviter les boucles infinies
 * Version temporaire pendant que nous résolvons les problèmes de cache
 */
export function useDashboardLayoutSimple() {
  // États de chargement
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [subscription, setSubscription] = useState(null);

  // Données de session
  const { data: session, isPending: sessionLoading } = useSession();
  // Données d'organisation active (Better Auth)
  const { data: activeOrganization, isPending: orgLoading } = authClient.useActiveOrganization();
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
      const userCache = localStorage.getItem("user-cache");
      if (userCache) {
        const { user, organization, timestamp } = JSON.parse(userCache);
        const isValid = Date.now() - timestamp < 5 * 60 * 1000; // 5 minutes

        if (isValid) {
          setCachedUser(user);
          setCachedOrganization(organization);
        }
      }
    } catch (error) {
      console.warn("Erreur lecture cache utilisateur:", error);
    }
  }, []);

  // Sauvegarder les données utilisateur en cache quand elles changent
  useEffect(() => {
    if (session?.user && isHydrated) {
      try {
        localStorage.setItem(
          "user-cache",
          JSON.stringify({
            user: session.user,
            organization: session.user.organization,
            timestamp: Date.now(),
          })
        );
        setCachedUser(session.user);
        setCachedOrganization(session.user.organization);
      } catch (error) {
        console.warn("Erreur sauvegarde cache utilisateur:", error);
      }
    }
  }, [session?.user, isHydrated]);

  // Cache minimal pour les données d'abonnement (éviter les flashs)
  useEffect(() => {
    if (!isHydrated) return;

    // Vérifier si on revient de Stripe (invalider le cache)
    const urlParams = new URLSearchParams(window.location.search);
    const hasStripeSession = urlParams.get("session_id");

    // Essayer de charger depuis le cache local d'abord
    // Utiliser activeOrganization.id en priorité, sinon session.activeOrganizationId
    const organizationId = activeOrganization?.id || session?.session?.activeOrganizationId;
    const cacheKey = organizationId
      ? `subscription-${organizationId}`
      : null;

    if (cacheKey) {
      // Si on revient de Stripe, vider le cache pour forcer le rechargement
      if (hasStripeSession) {
        localStorage.removeItem(cacheKey);
      }

      // Cache intelligent : court (30 secondes) + invalidation après paiement
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached && !hasStripeSession) { // ← Ne pas utiliser le cache si on revient de Stripe
          const { data: cachedSubscription, timestamp } = JSON.parse(cached);
          const isValid = Date.now() - timestamp < 30 * 1000; // 30 secondes (bon compromis)

          if (isValid) {
            setSubscription(cachedSubscription);
            setIsLoading(false);
            setIsInitialized(true);
            return;
          }
        }
      } catch (error) {
        console.warn("Erreur lecture cache abonnement:", error);
      }
    }

    // Si pas de cache valide, charger depuis l'API
    if (!organizationId) {
      // ⚠️ IMPORTANT: Ne pas marquer comme "initialized" si on attend l'organisation
      // Cela permet d'attendre que l'organisation soit chargée après OAuth
      if (session?.user && !sessionLoading && !orgLoading) {
        console.log("⏳ En attente de l'organisation après connexion OAuth...");
        setIsLoading(true); // Garder le loading actif
        // Ne pas marquer comme initialized pour continuer à attendre
      } else {
        setIsLoading(false);
        setIsInitialized(true);
      }
      return;
    }

    const fetchSubscription = async () => {
      try {
        setIsLoading(true);

        const { data: subscriptions, error } =
          await authClient.subscription.list({
            query: {
              referenceId: organizationId,
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
              localStorage.setItem(
                cacheKey,
                JSON.stringify({
                  data: activeSubscription || null,
                  timestamp: Date.now(),
                })
              );
            } catch (error) {
              console.warn("Erreur sauvegarde cache abonnement:", error);
            }
          }
        }
      } catch (error) {
        console.warn("Erreur récupération abonnement:", error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    fetchSubscription();
  }, [isHydrated, session?.session?.activeOrganizationId, activeOrganization?.id, orgLoading]);

  // Polling automatique après retour de Stripe
  useEffect(() => {
    if (!isHydrated) return;

    const urlParams = new URLSearchParams(window.location.search);
    const hasStripeSession = urlParams.get("session_id");

    if (!hasStripeSession) return;


    // Attendre que l'organisation soit disponible
    if (!session?.session?.activeOrganizationId) {
      return;
    }


    let attempts = 0;
    const maxAttempts = 30; // 30 × 2s = 60 secondes max
    let pollInterval;

    // Fonction de polling
    const checkSubscription = async () => {
      attempts++;

      try {
        const { data: subscriptions, error } =
          await authClient.subscription.list({
            query: {
              referenceId: session.session.activeOrganizationId,
            },
          });

        if (error) {
          console.error("❌ Erreur API:", error);
          return;
        }

        const activeSubscription = subscriptions?.find(
          (sub) => sub.status === "active" || sub.status === "trialing"
        );

        if (activeSubscription) {
          clearInterval(pollInterval);

          // Mettre à jour l'état
          setSubscription(activeSubscription);

          // Mettre à jour le cache
          const cacheKey = `subscription-${session.session.activeOrganizationId}`;
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: activeSubscription,
              timestamp: Date.now(),
            })
          );

          // Nettoyer l'URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );


          // Recharger la page pour s'assurer que tout est à jour
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else if (attempts >= maxAttempts) {

          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("❌ Erreur lors du polling:", error);
      }
    };

    // Première vérification immédiate
    checkSubscription();

    // Puis polling toutes les 2 secondes
    pollInterval = setInterval(checkSubscription, 2000);

    // Cleanup
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isHydrated, session?.session?.activeOrganizationId]);

  // Logique d'onboarding basée sur le champ hasSeenOnboarding du user
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  useEffect(() => {
    if (!session?.user || !isHydrated) return;

    const isOwner = session.user.role === "owner";
    const hasSeenOnboarding = session.user.hasSeenOnboarding;

    // Afficher l'onboarding si l'utilisateur est owner et n'a jamais vu l'onboarding
    if (isOwner && !hasSeenOnboarding && !isOnboardingOpen) {
      setIsOnboardingOpen(true);
    }
  }, [
    session?.user,
    session?.user?.role,
    session?.user?.hasSeenOnboarding,
    isHydrated,
    isOnboardingOpen,
  ]);

  const completeOnboarding = async () => {
    setOnboardingLoading(true);

    try {
      // Marquer l'onboarding comme vu dans le user
      await authClient.updateUser({
        hasSeenOnboarding: true,
      });

      // Fermer immédiatement le modal pour éviter qu'il se réaffiche
      setIsOnboardingOpen(false);

      // Rafraîchir la session pour obtenir les nouvelles données
      await authClient.getSession({
        fetchOptions: {
          cache: "no-store"
        }
      });
    } catch (error) {
      console.error("Erreur lors de la finalisation de l'onboarding:", error);
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

  const isActive = (requirePaidSubscription = false) => {
    const hasActiveSubscription =
      subscription?.status === "active" || subscription?.status === "trialing";

    // Si on exige un abonnement payant, ignorer la période d'essai
    if (requirePaidSubscription) {
      return hasActiveSubscription;
    }

    // Sinon, accepter aussi la période d'essai
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
      localStorage.removeItem("user-cache");
    } catch (error) {
      console.warn("Erreur suppression caches:", error);
    }

    window.location.reload();
  };

  // Utiliser activeOrganization de Better Auth en priorité, sinon fallback vers cache
  const finalOrganization = activeOrganization || session?.user?.organization || cachedOrganization;

  return {
    // Données utilisateur (avec cache pour éviter les flashs)
    user: session?.user || cachedUser,
    organization: finalOrganization,

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
    shouldShowOnboarding:
      session?.user?.role === "owner" && !session?.user?.hasSeenOnboarding,

    // États de chargement
    isLoading: isLoading || sessionLoading || trial.loading || orgLoading,
    isInitialized: isInitialized && isHydrated && !orgLoading,
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
