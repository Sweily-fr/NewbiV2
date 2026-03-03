import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSession } from "@/src/lib/auth-client";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
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
  const { data: activeOrganization, isPending: orgLoading } =
    authClient.useActiveOrganization();

  // États pour les données utilisateur (cache minimal)
  const [cachedUser, setCachedUser] = useState(null);
  const [cachedOrganization, setCachedOrganization] = useState(null);

  // Refs pour empêcher les pollings multiples et les re-déclenchements
  const stripePollingRef = useRef(null);
  const hasHandledStripeReturn = useRef(false);
  const hasHandledCancelReturn = useRef(false);
  const hasHandledSubscriptionSuccess = useRef(false);

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
  }, [session?.user?.id, session?.user?.name, session?.user?.email, session?.user?.role, session?.user?.hasSeenOnboarding, session?.session?.activeOrganizationId, isHydrated]);

  // Cache minimal pour les données d'abonnement (éviter les flashs)
  useEffect(() => {
    if (!isHydrated) return;

    // Vérifier si on revient de Stripe ou d'une résiliation (invalider le cache)
    // Utilisation sécurisée pour éviter les erreurs SSR
    const urlParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const hasStripeSession = urlParams?.get("session_id");
    const hasCancelSuccess = urlParams?.get("cancel_success") === "true";
    const hasSubscriptionSuccess =
      urlParams?.get("subscription_success") === "true";
    const hasPaymentSuccess = urlParams?.get("payment_success") === "true";

    // ✅ Déterminer si on revient de Stripe (n'importe quel paramètre de succès)
    const isReturningFromStripe =
      hasStripeSession ||
      hasCancelSuccess ||
      hasSubscriptionSuccess ||
      hasPaymentSuccess;

    // Essayer de charger depuis le cache local d'abord
    // Utiliser activeOrganization.id en priorité, sinon session.activeOrganizationId
    const organizationId =
      activeOrganization?.id || session?.session?.activeOrganizationId;
    const cacheKey = organizationId ? `subscription-${organizationId}` : null;

    if (cacheKey) {
      // Si on revient de Stripe, d'une résiliation ou d'un nouvel abonnement, vider le cache pour forcer le rechargement
      if (isReturningFromStripe) {
        localStorage.removeItem(cacheKey);
        console.log(
          "🗑️ Cache d'abonnement invalidé (retour Stripe/résiliation/nouvel abonnement)"
        );
      }

      // Cache intelligent : 5 minutes + invalidation après paiement/résiliation
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached && !isReturningFromStripe) {
          // ← Ne pas utiliser le cache si on revient de Stripe, résiliation ou nouvel abonnement
          const { data: cachedSubscription, timestamp } = JSON.parse(cached);
          const isValid = Date.now() - timestamp < 5 * 60 * 1000; // 5 minutes (évite les flashs)

          if (isValid) {
            setSubscription(cachedSubscription);
            setIsLoading(false);
            setIsInitialized(true);
            console.log(
              "✅ Subscription chargée depuis le cache:",
              organizationId
            );
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

        // Fetch subscription silently

        // ✅ Utiliser l'API personnalisée qui récupère directement depuis MongoDB
        // (inclut les abonnements canceled, contrairement à Better Auth subscription.list)
        const response = await fetch(
          `/api/organizations/${organizationId}/subscription`
        );
        const data = await response.json();

        // Result received

        if (response.ok && data) {
          // Vérifier si l'abonnement est actif ou encore valide (canceled mais dans la période payée)
          let activeSubscription = null;

          // Si pas d'abonnement ou abonnement expiré
          if (data.isDefault || data.status === "expired" || !data.status) {
            // No active subscription
            activeSubscription = null;
          } else if (data.status === "active" || data.status === "trialing") {
            activeSubscription = data;
          } else if (data.status === "canceled" && data.periodEnd) {
            const periodEndDate = new Date(data.periodEnd);
            const now = new Date();
            if (periodEndDate > now) {
              activeSubscription = data;
            } else {
              activeSubscription = null;
            }
          }

          setSubscription(activeSubscription);

          // Sauvegarder en cache pour éviter les flashs futurs
          if (cacheKey) {
            try {
              localStorage.setItem(
                cacheKey,
                JSON.stringify({
                  data: activeSubscription,
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
  }, [
    isHydrated,
    session?.session?.activeOrganizationId,
    activeOrganization?.id,
    // Note: orgLoading retiré des deps pour éviter les re-déclenchements
    // inutiles qui causaient des flashs de loading en production
  ]);

  // Polling automatique après retour de Stripe
  useEffect(() => {
    if (!isHydrated || hasHandledStripeReturn.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const hasStripeSession = urlParams.get("session_id");
    const hasSubscriptionSuccess =
      urlParams.get("subscription_success") === "true";
    const hasPaymentSuccess = urlParams.get("payment_success") === "true";

    if (!hasStripeSession && !hasSubscriptionSuccess && !hasPaymentSuccess)
      return;

    // Attendre que l'organisation soit disponible
    if (!session?.session?.activeOrganizationId) return;

    // Marquer comme traité AVANT de lancer le polling
    hasHandledStripeReturn.current = true;

    // Nettoyer l'URL immédiatement pour éviter re-déclenchement
    window.history.replaceState({}, document.title, window.location.pathname);

    console.log("🔄 [POLLING] Démarrage du polling après retour Stripe...");

    let attempts = 0;
    const maxAttempts = 30;

    const checkSubscription = async () => {
      attempts++;
      console.log(`🔄 [POLLING] Tentative ${attempts}/${maxAttempts}...`);

      try {
        const response = await fetch(
          `/api/organizations/${session.session.activeOrganizationId}/subscription`
        );
        const data = await response.json();

        if (!response.ok) {
          console.error("❌ [POLLING] Erreur API:", data.error);
          return;
        }

        const isActive = data.status === "active" || data.status === "trialing";

        if (isActive) {
          clearInterval(stripePollingRef.current);
          stripePollingRef.current = null;
          console.log("✅ [POLLING] Abonnement trouvé!", data.plan);

          setSubscription(data);

          const cacheKey = `subscription-${session.session.activeOrganizationId}`;
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ data, timestamp: Date.now() })
          );
        } else if (attempts >= maxAttempts) {
          clearInterval(stripePollingRef.current);
          stripePollingRef.current = null;
          console.warn("⚠️ [POLLING] Timeout après 30 tentatives");
        }
      } catch (error) {
        console.error("❌ [POLLING] Erreur:", error);
      }
    };

    checkSubscription();
    stripePollingRef.current = setInterval(checkSubscription, 1000);

    return () => {
      if (stripePollingRef.current) {
        clearInterval(stripePollingRef.current);
        stripePollingRef.current = null;
      }
    };
  }, [isHydrated, session?.session?.activeOrganizationId]);

  // Synchronisation et mise à jour après résiliation d'abonnement
  useEffect(() => {
    if (!isHydrated || hasHandledCancelReturn.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const hasCancelSuccess = urlParams.get("cancel_success") === "true";

    if (!hasCancelSuccess) return;
    if (!session?.session?.activeOrganizationId) return;

    // Marquer comme traité AVANT la sync
    hasHandledCancelReturn.current = true;

    // Nettoyer l'URL immédiatement pour éviter re-déclenchement après reload
    window.history.replaceState({}, document.title, window.location.pathname);

    console.log("🔄 Résiliation détectée, synchronisation avec Stripe...");

    const syncAndUpdate = async () => {
      try {
        const { data: subscriptions, error: listError } =
          await authClient.subscription.list({
            query: {
              referenceId: session.session.activeOrganizationId,
            },
          });

        if (listError) {
          console.error("❌ Erreur récupération abonnement:", listError);
          return;
        }

        const currentSubscription = subscriptions?.find(
          (sub) => sub.stripeSubscriptionId
        );

        if (currentSubscription?.stripeSubscriptionId) {
          const syncResponse = await fetch("/api/sync-subscription-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stripeSubscriptionId: currentSubscription.stripeSubscriptionId,
              organizationId: session.session.activeOrganizationId,
            }),
          });

          const syncData = await syncResponse.json();

          if (syncData.success) {
            const updatedSubscription = {
              ...currentSubscription,
              status: syncData.status,
              cancelAtPeriodEnd: syncData.cancelAtPeriodEnd,
              periodEnd: syncData.periodEnd,
            };

            setSubscription(updatedSubscription);

            const cacheKey = `subscription-${session.session.activeOrganizationId}`;
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                data: updatedSubscription,
                timestamp: Date.now(),
              })
            );
          }
        }

        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error("❌ Erreur lors de la synchronisation:", error);
        window.location.reload();
      }
    };

    syncAndUpdate();
  }, [isHydrated, session?.session?.activeOrganizationId]);

  // Afficher un toast de succès pour un nouvel abonnement (upgrade)
  useEffect(() => {
    if (!isHydrated || hasHandledSubscriptionSuccess.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const hasSubscriptionSuccess =
      urlParams.get("subscription_success") === "true";

    if (hasSubscriptionSuccess) {
      hasHandledSubscriptionSuccess.current = true;
      toast.success("Abonnement activé avec succès !", {
        description:
          "Vous avez maintenant accès à toutes les fonctionnalités Pro.",
      });

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isHydrated]);

  // Logique d'onboarding basée sur le champ hasSeenOnboarding du user
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  useEffect(() => {
    if (!session?.user || !isHydrated) return;

    const isOwner = session.user.role === "owner";
    const hasSeenOnboarding = session.user.hasSeenOnboarding;

    // Afficher l'onboarding si l'utilisateur est owner et n'a jamais vu l'onboarding
    if (isOwner && !hasSeenOnboarding) {
      setIsOnboardingOpen(true);
    }
  }, [
    session?.user?.role,
    session?.user?.hasSeenOnboarding,
    session?.user?.id,
    isHydrated,
  ]);

  const completeOnboarding = useCallback(async () => {
    setOnboardingLoading(true);

    try {
      await authClient.updateUser({
        hasSeenOnboarding: true,
      });

      setIsOnboardingOpen(false);

      await authClient.getSession({
        fetchOptions: {
          cache: "no-store",
        },
      });
    } catch (error) {
      console.error("Erreur lors de la finalisation de l'onboarding:", error);
    } finally {
      setOnboardingLoading(false);
    }
  }, []);

  // Logique d'abonnement — stabilisées avec useCallback
  const hasFeature = useCallback((feature) => {
    if (!subscription) return false;
    return subscription.limits?.[feature] > 0;
  }, [subscription]);

  const getLimit = useCallback((feature) => {
    return subscription?.limits?.[feature] || 0;
  }, [subscription]);

  const isActive = useCallback((requirePaidSubscription = false) => {
    // 🔒 Si l'abonnement est en cours de chargement, vérifier le cache uniquement
    // Ne PAS autoriser l'accès par défaut (sécurité)
    if (isLoading && !subscription) {
      // Vérifier le cache pour éviter les flashs SI un cache valide existe
      const organizationId =
        activeOrganization?.id || session?.session?.activeOrganizationId;
      if (organizationId) {
        try {
          const cacheKey = `subscription-${organizationId}`;
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { data: cachedSub, timestamp } = JSON.parse(cached);
            // Vérifier que le cache n'est pas expiré (5 minutes)
            const isValidCache = Date.now() - timestamp < 5 * 60 * 1000;
            if (isValidCache && (cachedSub?.status === "active" || cachedSub?.status === "trialing")) {
              return true; // Utiliser le cache valide pendant le chargement
            }
            // Vérifier aussi les abonnements canceled mais encore valides
            if (isValidCache && cachedSub?.status === "canceled" && cachedSub?.periodEnd) {
              if (new Date(cachedSub.periodEnd) > new Date()) {
                return true;
              }
            }
          }
        } catch {
          // Ignorer les erreurs de cache
        }
      }
      // 🔒 Par défaut, NE PAS autoriser l'accès pendant le chargement (sécurité)
      // Le middleware serveur a déjà validé l'abonnement, donc on attend juste la confirmation client
      return false;
    }

    // Vérifier si l'abonnement Stripe est actif ou en période d'essai Stripe
    const hasActiveSubscription =
      subscription?.status === "active" || subscription?.status === "trialing";

    // ✅ Vérifier aussi si l'abonnement est annulé mais encore dans la période payée (prorata)
    const hasCanceledButValidSubscription =
      subscription?.status === "canceled" &&
      subscription?.periodEnd &&
      new Date(subscription.periodEnd) > new Date();

    const hasValidSubscription =
      hasActiveSubscription || hasCanceledButValidSubscription;

    // Si on exige un abonnement payant, ignorer la période d'essai Stripe (trialing)
    if (requirePaidSubscription) {
      return (
        subscription?.status === "active" || hasCanceledButValidSubscription
      );
    }

    // ⚠️ IMPORTANT: On ne fait plus de fallback sur le trial organisation
    // Seuls les abonnements Stripe sont acceptés (active, trialing, canceled valide)
    // Les anciens utilisateurs avec trial organisation devront souscrire via Stripe
    return hasValidSubscription;
  }, [subscription, isLoading, activeOrganization?.id, session?.session?.activeOrganizationId]);

  // Fonction de rafraîchissement simple
  const refreshLayoutData = useCallback(() => {
    // Vider tous les caches et forcer un refetch
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

      // Ne PAS réinitialiser subscription à null - garder l'ancienne valeur pendant le chargement
      // Le useEffect se chargera de refetch automatiquement
      setIsLoading(true);
      console.log("✅ Caches vidés, refetch en cours...");
    } catch (error) {
      console.warn("Erreur suppression caches:", error);
    }
  }, [session?.session?.activeOrganizationId]);

  // Utiliser activeOrganization de Better Auth en priorité, sinon fallback vers cache
  const finalOrganization =
    activeOrganization || session?.user?.organization || cachedOrganization;

  const user = session?.user || cachedUser;
  const shouldShowOnboarding =
    session?.user?.role === "owner" && !session?.user?.hasSeenOnboarding;
  const combinedLoading = isLoading || sessionLoading || orgLoading;
  const combinedInitialized = isInitialized && isHydrated && !orgLoading;

  return useMemo(
    () => ({
      user,
      organization: finalOrganization,
      subscription,
      hasFeature,
      getLimit,
      isActive,
      isOnboardingOpen,
      setIsOnboardingOpen,
      completeOnboarding,
      skipOnboarding: completeOnboarding,
      onboardingLoading,
      shouldShowOnboarding,
      isLoading: combinedLoading,
      isInitialized: combinedInitialized,
      isHydrated,
      refreshLayoutData,
      invalidateOrganizationCache: refreshLayoutData,
      cacheInfo: {
        lastUpdate: null,
        isFromCache: false,
        cacheKey: null,
      },
    }),
    [
      user,
      finalOrganization,
      subscription,
      hasFeature,
      getLimit,
      isActive,
      isOnboardingOpen,
      completeOnboarding,
      onboardingLoading,
      shouldShowOnboarding,
      combinedLoading,
      combinedInitialized,
      isHydrated,
      refreshLayoutData,
    ]
  );
}
