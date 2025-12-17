import { useState, useEffect } from "react";
import { useSession } from "@/src/lib/auth-client";
import { useTrial } from "@/src/hooks/useTrial";
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

        console.log(
          "🔍 [SUBSCRIPTION] Fetching for organizationId:",
          organizationId
        );

        // ✅ Utiliser l'API personnalisée qui récupère directement depuis MongoDB
        // (inclut les abonnements canceled, contrairement à Better Auth subscription.list)
        const response = await fetch(
          `/api/organizations/${organizationId}/subscription`
        );
        const data = await response.json();

        console.log("🔍 [SUBSCRIPTION] Result:", data);

        if (response.ok && data) {
          // Vérifier si l'abonnement est actif ou encore valide (canceled mais dans la période payée)
          let activeSubscription = null;

          // Si pas d'abonnement ou abonnement expiré
          if (data.isDefault || data.status === "expired" || !data.status) {
            console.log("🔍 [SUBSCRIPTION] Pas d'abonnement actif ou expiré");
            activeSubscription = null;
          } else if (data.status === "active" || data.status === "trialing") {
            activeSubscription = data;
          } else if (data.status === "canceled" && data.periodEnd) {
            const periodEndDate = new Date(data.periodEnd);
            const now = new Date();
            if (periodEndDate > now) {
              console.log(
                "🔍 [SUBSCRIPTION] Abonnement annulé mais encore valide jusqu'au:",
                periodEndDate.toLocaleDateString("fr-FR")
              );
              activeSubscription = data;
            } else {
              console.log("🔍 [SUBSCRIPTION] Abonnement annulé et expiré");
              activeSubscription = null;
            }
          }

          console.log(
            "🔍 [SUBSCRIPTION] Active subscription:",
            activeSubscription
          );

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
    orgLoading,
  ]);

  // Polling automatique après retour de Stripe
  useEffect(() => {
    if (!isHydrated) return;

    const urlParams = new URLSearchParams(window.location.search);
    const hasStripeSession = urlParams.get("session_id");
    const hasSubscriptionSuccess =
      urlParams.get("subscription_success") === "true";
    const hasPaymentSuccess = urlParams.get("payment_success") === "true";

    // ✅ Déclencher le polling si on revient de Stripe (session_id OU subscription_success OU payment_success)
    if (!hasStripeSession && !hasSubscriptionSuccess && !hasPaymentSuccess)
      return;

    console.log("🔄 [POLLING] Démarrage du polling après retour Stripe...", {
      hasStripeSession: !!hasStripeSession,
      hasSubscriptionSuccess,
      hasPaymentSuccess,
    });

    // Attendre que l'organisation soit disponible
    if (!session?.session?.activeOrganizationId) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 30; // 30 × 2s = 60 secondes max
    let pollInterval;

    // Fonction de polling - utilise l'API personnalisée
    const checkSubscription = async () => {
      attempts++;
      console.log(`🔄 [POLLING] Tentative ${attempts}/${maxAttempts}...`);

      try {
        const response = await fetch(
          `/api/organizations/${session.session.activeOrganizationId}/subscription`
        );
        const data = await response.json();

        console.log(`🔍 [POLLING] Résultat:`, data);

        if (!response.ok) {
          console.error("❌ [POLLING] Erreur API:", data.error);
          return;
        }

        // Vérifier si l'abonnement est actif
        const isActive = data.status === "active" || data.status === "trialing";

        if (isActive) {
          clearInterval(pollInterval);
          console.log("✅ [POLLING] Abonnement trouvé!", data.plan);

          // Mettre à jour l'état
          setSubscription(data);

          // Mettre à jour le cache
          const cacheKey = `subscription-${session.session.activeOrganizationId}`;
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: data,
              timestamp: Date.now(),
            })
          );

          // Nettoyer l'URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );

          console.log("✅ [POLLING] Subscription mise à jour");
        } else {
          console.log(
            `⏳ [POLLING] Pas d'abonnement actif trouvé (status: ${data.status}), nouvelle tentative...`
          );
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            console.warn(
              "⚠️ [POLLING] Timeout - abonnement non trouvé après 30 tentatives"
            );
            // Nettoyer l'URL même en cas d'échec
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          }
        }
      } catch (error) {
        console.error("❌ [POLLING] Erreur:", error);
      }
    };

    // Première vérification immédiate
    checkSubscription();

    // Puis polling toutes les 1 seconde (plus rapide)
    pollInterval = setInterval(checkSubscription, 1000);

    // Cleanup
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isHydrated, session?.session?.activeOrganizationId]);

  // Synchronisation et mise à jour après résiliation d'abonnement
  useEffect(() => {
    if (!isHydrated) return;

    const urlParams = new URLSearchParams(window.location.search);
    const hasCancelSuccess = urlParams.get("cancel_success") === "true";

    if (!hasCancelSuccess) return;

    // Attendre que l'organisation et l'abonnement soient disponibles
    if (!session?.session?.activeOrganizationId) {
      return;
    }

    console.log("🔄 Résiliation détectée, synchronisation avec Stripe...");

    const syncAndUpdate = async () => {
      try {
        // D'abord, récupérer l'abonnement actuel pour avoir le stripeSubscriptionId
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

        // Trouver l'abonnement (actif ou en cours d'annulation)
        const currentSubscription = subscriptions?.find(
          (sub) => sub.stripeSubscriptionId
        );

        if (currentSubscription?.stripeSubscriptionId) {
          console.log(
            "🔄 Synchronisation depuis Stripe:",
            currentSubscription.stripeSubscriptionId
          );

          // Appeler l'API de synchronisation pour mettre à jour depuis Stripe
          const syncResponse = await fetch("/api/sync-subscription-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stripeSubscriptionId: currentSubscription.stripeSubscriptionId,
              organizationId: session.session.activeOrganizationId,
            }),
          });

          const syncData = await syncResponse.json();
          console.log("✅ Synchronisation terminée:", syncData);

          if (syncData.success) {
            // Mettre à jour l'abonnement local avec les nouvelles données
            const updatedSubscription = {
              ...currentSubscription,
              status: syncData.status,
              cancelAtPeriodEnd: syncData.cancelAtPeriodEnd,
              periodEnd: syncData.periodEnd,
            };

            setSubscription(updatedSubscription);

            // Mettre à jour le cache
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

        // Nettoyer l'URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        console.log("✅ Résiliation traitée, rechargement de la page...");

        // Recharger la page pour mettre à jour l'interface
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error("❌ Erreur lors de la synchronisation:", error);
        // Nettoyer l'URL même en cas d'erreur
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        window.location.reload();
      }
    };

    // Exécuter la synchronisation
    syncAndUpdate();
  }, [isHydrated, session?.session?.activeOrganizationId]);

  // Afficher un toast de succès pour un nouvel abonnement (upgrade)
  useEffect(() => {
    if (!isHydrated) return;

    const urlParams = new URLSearchParams(window.location.search);
    const hasSubscriptionSuccess =
      urlParams.get("subscription_success") === "true";

    if (hasSubscriptionSuccess) {
      toast.success("Abonnement activé avec succès !", {
        description:
          "Vous avez maintenant accès à toutes les fonctionnalités Pro.",
      });

      // Nettoyer l'URL
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
    // Ne pas ajouter isOnboardingOpen dans les dépendances pour éviter la boucle
    if (isOwner && !hasSeenOnboarding) {
      setIsOnboardingOpen(true);
    }
  }, [
    session?.user,
    session?.user?.role,
    session?.user?.hasSeenOnboarding,
    isHydrated,
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
          cache: "no-store",
        },
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
    // Vérifier si l'abonnement est actif ou en période d'essai
    const hasActiveSubscription =
      subscription?.status === "active" || subscription?.status === "trialing";

    // ✅ Vérifier aussi si l'abonnement est annulé mais encore dans la période payée (prorata)
    const hasCanceledButValidSubscription =
      subscription?.status === "canceled" &&
      subscription?.periodEnd &&
      new Date(subscription.periodEnd) > new Date();

    const hasValidSubscription =
      hasActiveSubscription || hasCanceledButValidSubscription;

    // Si on exige un abonnement payant, ignorer la période d'essai ET le trial
    if (requirePaidSubscription) {
      // Pour un abonnement payant requis, on accepte active ou canceled avec période valide
      return (
        subscription?.status === "active" || hasCanceledButValidSubscription
      );
    }

    // Sinon, accepter aussi la période d'essai (trialing) et le trial de l'organisation
    if (!hasValidSubscription) {
      return trial.hasPremiumAccess;
    }

    return hasValidSubscription;
  };

  // Fonction de rafraîchissement simple
  const refreshLayoutData = () => {
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
  };

  // Utiliser activeOrganization de Better Auth en priorité, sinon fallback vers cache
  const finalOrganization =
    activeOrganization || session?.user?.organization || cachedOrganization;

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
