import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSession } from "@/src/lib/auth-client";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import { getOnboardingStep } from "@/src/lib/onboarding";
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
  // Tracks whether the last subscription fetch returned authoritative data.
  // Default `true` so the initial render doesn't trigger the "read-only"
  // fallback before the first fetch lands. Flipped to `false` on network /
  // 403 / 500 errors so downstream hooks (useSubscriptionAccess) can treat
  // the absence of a subscription as "unknown" rather than "expired".
  const [lastFetchOk, setLastFetchOk] = useState(true);
  // Incrémenté pour forcer un refetch de l'abonnement (ex: l'outil dev a changé
  // le statut en BDD → on veut le voir apparaître/disparaître sans rechargement).
  const [refreshTick, setRefreshTick] = useState(0);

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
  // Dernière organisation active connue, pour détecter un changement d'org et
  // purger le cache d'abonnement de l'org quittée (cf. effet plus bas).
  const prevOrgIdRef = useRef(null);

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
          }),
        );
        setCachedUser(session.user);
        setCachedOrganization(session.user.organization);
      } catch (error) {
        console.warn("Erreur sauvegarde cache utilisateur:", error);
      }
    }
  }, [
    session?.user?.id,
    session?.user?.name,
    session?.user?.email,
    session?.user?.role,
    session?.user?.hasSeenOnboarding,
    session?.session?.activeOrganizationId,
    isHydrated,
  ]);

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
          "🗑️ Cache d'abonnement invalidé (retour Stripe/résiliation/nouvel abonnement)",
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
              organizationId,
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

        // ✅ Utiliser l'API personnalisée qui récupère directement depuis MongoDB
        // (inclut les abonnements canceled, contrairement à Better Auth subscription.list)
        const response = await fetch(
          `/api/organizations/${organizationId}/subscription`,
        );
        const data = await response.json();

        if (response.ok && data) {
          setLastFetchOk(true);
          // Vérifier si l'abonnement est actif ou encore valide (canceled mais dans la période payée)
          let activeSubscription = null;

          // App-managed trial check (feature-flagged via API). When the flag is
          // OFF the API returns appTrialEnabled=false, so this branch is
          // skipped and the legacy behaviour below runs unchanged.
          const trialActive =
            data.appTrialEnabled === true &&
            data.isTrialActive === true &&
            data.trialEndDate &&
            new Date(data.trialEndDate) > new Date();

          if (trialActive) {
            // Trial app actif → on conserve les champs trial même sans sub Stripe
            activeSubscription = data;
          } else if (
            data.isDefault ||
            data.status === "expired" ||
            !data.status
          ) {
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
                }),
              );
            } catch (error) {
              console.warn("Erreur sauvegarde cache abonnement:", error);
            }
          }
        } else {
          // Non-ok response (4xx/5xx) — don't conclude "expired" from this.
          // Mark fetch as failed so downstream hooks can avoid red banners.
          setLastFetchOk(false);
        }
      } catch (error) {
        // Network error — same safety net: don't conclude "expired".
        setLastFetchOk(false);
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
    refreshTick,
    // Note: orgLoading retiré des deps pour éviter les re-déclenchements
    // inutiles qui causaient des flashs de loading en production
  ]);

  // Refetch déclenché par un événement global `subscription:refresh`.
  // Utilisé par l'outil dev (après modification du statut en BDD) pour observer
  // la bannière se mettre à jour en TEMPS RÉEL, sans recharger la page. Vide
  // d'abord le cache de l'org pour forcer un appel API frais.
  useEffect(() => {
    if (!isHydrated) return;
    const onRefresh = () => {
      try {
        const orgId =
          activeOrganization?.id || session?.session?.activeOrganizationId;
        if (orgId) localStorage.removeItem(`subscription-${orgId}`);
      } catch {
        // ignore
      }
      setRefreshTick((t) => t + 1);
    };
    window.addEventListener("subscription:refresh", onRefresh);
    return () => window.removeEventListener("subscription:refresh", onRefresh);
  }, [isHydrated, session?.session?.activeOrganizationId, activeOrganization?.id]);

  // Purge le cache d'abonnement de l'organisation quittée lors d'un changement
  // d'org. Sans ça, revenir sur une org dont le statut a changé ailleurs (ou
  // dont l'abonnement vient d'être renouvelé) réafficherait l'ancien statut
  // tant que le cache de 5 min n'a pas expiré. Le fetch ci-dessus se
  // redéclenche déjà au changement d'org ; on s'assure juste qu'il ne lise pas
  // un cache périmé.
  useEffect(() => {
    if (!isHydrated) return;
    const currentOrgId =
      activeOrganization?.id || session?.session?.activeOrganizationId || null;
    const prevOrgId = prevOrgIdRef.current;

    if (prevOrgId && currentOrgId && prevOrgId !== currentOrgId) {
      try {
        localStorage.removeItem(`subscription-${prevOrgId}`);
      } catch (error) {
        console.warn("Erreur purge cache abonnement (changement d'org):", error);
      }
    }
    prevOrgIdRef.current = currentOrgId;
  }, [isHydrated, session?.session?.activeOrganizationId, activeOrganization?.id]);

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
          `/api/organizations/${session.session.activeOrganizationId}/subscription`,
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
            JSON.stringify({ data, timestamp: Date.now() }),
          );

          // Rafraîchir aussi le badge PRO/Expiré du sélecteur d'org.
          window.dispatchEvent(new CustomEvent("subscription:refresh"));
        } else if (attempts >= maxAttempts) {
          clearInterval(stripePollingRef.current);
          stripePollingRef.current = null;
          console.warn("⚠️ [POLLING] Timeout après 30 tentatives");
        }
      } catch (error) {
        console.error("❌ [POLLING] Erreur:", error);
      }
    };

    // Synchroniser d'abord l'abonnement DEPUIS Stripe (sans dépendre du
    // webhook : indispensable en local et résilient en prod si le webhook est
    // en retard/échoue), puis lancer le polling qui verra le statut "active".
    const orgId = session.session.activeOrganizationId;
    fetch(`/api/organizations/${orgId}/sync-subscription`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        console.log("🔄 [SYNC] Sync Stripe:", d);
        // Prévenir les autres sources d'abonnement (ex: badge PRO/Expiré du
        // sélecteur d'org, qui lit /api/organization/list-with-order) de se
        // rafraîchir.
        window.dispatchEvent(new CustomEvent("subscription:refresh"));
      })
      .catch((e) =>
        console.warn("⚠️ [SYNC] Échec sync Stripe (polling quand même):", e),
      )
      .finally(() => {
        checkSubscription();
        stripePollingRef.current = setInterval(checkSubscription, 1000);
      });

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
          (sub) => sub.stripeSubscriptionId,
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
              }),
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

      // ⚠️ NE PAS nettoyer l'URL ici. Cet effet ne dépend que de `isHydrated`
      // et tourne donc avant que `activeOrganizationId` soit prêt. Effacer le
      // paramètre `subscription_success` maintenant empêcherait l'effet
      // d'invalidation de cache (ligne ~119) ET le polling post-Stripe
      // (ligne ~253, qui attend l'org active) de le voir : le cache
      // `subscription-${orgId}` resterait sur l'ancien statut "expiré"
      // jusqu'à un changement d'organisation. Le polling nettoie l'URL
      // lui-même une fois qu'il a démarré (cf. replaceState ligne ~272).
    }
  }, [isHydrated]);

  // Defensive fallback: onboarding modal in the dashboard.
  // This should normally NEVER trigger — users with incomplete onboarding are
  // redirected to /auth/signup by dashboard/layout.jsx (server-side) before
  // reaching client code. If this fires, it means we have an inconsistent state
  // (e.g. user has a subscription but onboardingStep !== "completed").
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  useEffect(() => {
    if (!session?.user || !isHydrated) return;

    const isOwner = session.user.role === "owner";
    const step = getOnboardingStep(session.user);

    if (isOwner && step !== "completed") {
      console.warn(
        `⚠️ [ONBOARDING FALLBACK] Modal affiché pour ${session.user.email} — onboardingStep: "${step}". ` +
          "Cet état ne devrait pas se produire : l'utilisateur devrait avoir été redirigé par dashboard/layout.jsx.",
      );
      setIsOnboardingOpen(true);
    }
  }, [
    session?.user?.role,
    session?.user?.onboardingStep,
    session?.user?.hasSeenOnboarding,
    session?.user?.id,
    isHydrated,
  ]);

  const completeOnboarding = useCallback(async () => {
    setOnboardingLoading(true);

    try {
      // hasSeenOnboarding and onboardingStep have input: false (Sprint 2).
      // Use updateUser for fields that ARE client-writable (hasCompletedTutorial),
      // and a server-side route for the protected onboarding fields.
      // This is a defensive fallback — should rarely execute (see comment above useEffect).
      await fetch(
        "/api/organizations/" +
          session?.session?.activeOrganizationId +
          "/complete-onboarding",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

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
  const hasFeature = useCallback(
    (feature) => {
      if (!subscription) return false;
      return subscription.limits?.[feature] > 0;
    },
    [subscription],
  );

  const getLimit = useCallback(
    (feature) => {
      return subscription?.limits?.[feature] || 0;
    },
    [subscription],
  );

  const isActive = useCallback(
    (requirePaidSubscription = false) => {
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
              if (
                isValidCache &&
                (cachedSub?.status === "active" ||
                  cachedSub?.status === "trialing" ||
                  cachedSub?.status === "past_due")
              ) {
                return true; // Utiliser le cache valide pendant le chargement
              }
              // Vérifier aussi les abonnements canceled mais encore valides
              if (
                isValidCache &&
                cachedSub?.status === "canceled" &&
                cachedSub?.periodEnd
              ) {
                if (new Date(cachedSub.periodEnd) > new Date()) {
                  return true;
                }
              }
              // App-managed trial active (feature-flagged via API). When the
              // flag was OFF on the previous fetch, appTrialEnabled is false
              // in the cached payload and this branch is skipped.
              if (
                isValidCache &&
                cachedSub?.appTrialEnabled === true &&
                cachedSub?.isTrialActive === true &&
                cachedSub?.trialEndDate &&
                new Date(cachedSub.trialEndDate) > new Date()
              ) {
                return true;
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

      // Vérifier si l'abonnement Stripe est actif ou en période d'essai Stripe.
      // Décision #12 (Lot 5) — past_due (grace period Stripe pendant retries)
      // est aligné avec le backend : l'utilisateur garde l'accès, une bannière
      // d'avertissement s'affiche en parallèle.
      const hasActiveSubscription =
        subscription?.status === "active" ||
        subscription?.status === "trialing" ||
        subscription?.status === "past_due";

      // ✅ Vérifier aussi si l'abonnement est annulé mais encore dans la période payée (prorata)
      const hasCanceledButValidSubscription =
        subscription?.status === "canceled" &&
        subscription?.periodEnd &&
        new Date(subscription.periodEnd) > new Date();

      // App-managed trial (feature-flagged via API). When the flag is OFF,
      // appTrialEnabled is false and this branch is a no-op.
      const hasActiveAppTrial =
        subscription?.appTrialEnabled === true &&
        subscription?.isTrialActive === true &&
        subscription?.trialEndDate &&
        new Date(subscription.trialEndDate) > new Date();

      const hasValidSubscription =
        hasActiveSubscription ||
        hasCanceledButValidSubscription ||
        hasActiveAppTrial;

      // Si on exige un abonnement payant, ignorer toute forme de trial (Stripe ET app)
      if (requirePaidSubscription) {
        return (
          subscription?.status === "active" || hasCanceledButValidSubscription
        );
      }

      // ⚠️ IMPORTANT: On ne fait plus de fallback sur le trial organisation legacy
      // Seuls les abonnements Stripe (active, trialing, canceled valide) et le
      // trial app-managed (feature-flagged) sont acceptés.
      return hasValidSubscription;
    },
    [
      subscription,
      isLoading,
      activeOrganization?.id,
      session?.session?.activeOrganizationId,
    ],
  );

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
    session?.user?.role === "owner" &&
    getOnboardingStep(session?.user) !== "completed";
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
      // Lot 3 safety net: when the fetch fails, downstream hooks must NOT
      // conclude "subscription expired" from the absence of data.
      lastFetchOk,
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
      lastFetchOk,
    ],
  );
}
