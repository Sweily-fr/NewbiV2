import { useState, useCallback } from "react";
import { useQuery, useMutation, useApolloClient } from "@apollo/client";
import {
  MY_STRIPE_CONNECT_ACCOUNT,
  CREATE_STRIPE_CONNECT_ACCOUNT,
  GENERATE_STRIPE_ONBOARDING_LINK,
  GENERATE_STRIPE_DASHBOARD_LINK,
  CHECK_STRIPE_CONNECT_ACCOUNT_STATUS,
  DISCONNECT_STRIPE_ACCOUNT,
} from "@/src/graphql/mutations/stripe";

export const useStripeConnect = (organizationId) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const apolloClient = useApolloClient();

  // Query pour récupérer le compte Stripe de l'organisation
  const {
    data: stripeStatusData,
    loading: statusLoading,
    refetch: refetchStatus,
  } = useQuery(MY_STRIPE_CONNECT_ACCOUNT, {
    skip: !organizationId,
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });

  // Note: Le cache est maintenant vidé globalement lors de la déconnexion dans nav-user.jsx

  // Mutations
  const [createStripeAccount] = useMutation(CREATE_STRIPE_CONNECT_ACCOUNT);
  const [generateOnboardingLink] = useMutation(GENERATE_STRIPE_ONBOARDING_LINK);
  const [generateDashboardLink] = useMutation(GENERATE_STRIPE_DASHBOARD_LINK);
  const [checkAccountStatus] = useMutation(CHECK_STRIPE_CONNECT_ACCOUNT_STATUS);
  const [disconnectAccount] = useMutation(DISCONNECT_STRIPE_ACCOUNT);

  // Fonction pour connecter Stripe
  const connectStripe = useCallback(
    async (userEmail) => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Créer le compte Stripe Connect s'il n'existe pas
        let accountId = stripeStatusData?.myStripeConnectAccount?.accountId;

        if (!accountId) {
          const { data: accountData } = await createStripeAccount();

          if (!accountData.createStripeConnectAccount.success) {
            throw new Error(
              accountData.createStripeConnectAccount.message ||
                "Erreur lors de la création du compte Stripe"
            );
          }

          accountId = accountData.createStripeConnectAccount.accountId;
        }

        // 2. Générer le lien d'onboarding (Étape 1 : informations de base)
        const returnUrl = `${window.location.origin}/dashboard?stripe_step1_complete=true`;

        const { data: linkData } = await generateOnboardingLink({
          variables: {
            accountId,
            returnUrl,
          },
        });

        // Vérifier le succès
        if (!linkData.generateStripeOnboardingLink.success) {
          throw new Error(
            linkData.generateStripeOnboardingLink.message ||
              "Erreur lors de la génération du lien Stripe"
          );
        }

        // 3. Rediriger vers Stripe
        if (linkData.generateStripeOnboardingLink.url) {
          window.location.href = linkData.generateStripeOnboardingLink.url;
        }
      } catch (err) {
        console.error("❌ Erreur lors de la connexion Stripe:", err);
        setError(err.message || "Erreur lors de la connexion à Stripe");
      } finally {
        setIsLoading(false);
      }
    },
    [
      organizationId,
      stripeStatusData,
      createStripeAccount,
      generateOnboardingLink,
    ]
  );

  // Fonction pour déconnecter Stripe
  const disconnectStripe = useCallback(async () => {
    setIsLoading(true);

    try {
      // Vérifier que l'utilisateur a un compte Stripe avant de tenter la déconnexion
      if (!stripeStatusData?.myStripeConnectAccount) {
        throw new Error("Aucun compte Stripe à déconnecter");
      }

      const { data } = await disconnectAccount();

      if (!data.disconnectStripe.success) {
        throw new Error(
          data.disconnectStripe.message || "Erreur lors de la déconnexion"
        );
      }

      // Rafraîchir le statut
      await refetchStatus();
    } catch (err) {
      console.error("Erreur lors de la déconnexion Stripe:", err);
      setError(err.message || "Erreur lors de la déconnexion de Stripe");
    } finally {
      setIsLoading(false);
    }
  }, [stripeStatusData, disconnectAccount, refetchStatus]);

  // Calculer l'état de connexion
  const isConnected = !!stripeStatusData?.myStripeConnectAccount?.accountId;
  const isOnboarded =
    stripeStatusData?.myStripeConnectAccount?.isOnboarded || false;
  const canReceivePayments =
    stripeStatusData?.myStripeConnectAccount?.chargesEnabled || false;
  const accountStatus =
    stripeStatusData?.myStripeConnectAccount?.accountStatus || "not_connected";

  // Fonction pour ouvrir le tableau de bord Stripe
  const openStripeDashboard = useCallback(async () => {
    const accountId = stripeStatusData?.myStripeConnectAccount?.accountId;
    if (accountId) {
      // Si le compte n'est pas encore configuré, générer un lien d'onboarding
      if (!isOnboarded || !canReceivePayments) {
        try {
          // Retourner vers le dashboard avec le paramètre pour le modal de succès
          const returnUrl = `${window.location.origin}/dashboard?stripe_connect_success=true`;
          const { data: linkData } = await generateOnboardingLink({
            variables: {
              accountId,
              returnUrl,
            },
          });

          if (linkData.generateStripeOnboardingLink.success) {
            window.location.href = linkData.generateStripeOnboardingLink.url;
            return;
          }
        } catch (err) {
          console.error(
            "Erreur lors de la génération du lien d'onboarding:",
            err
          );
        }
      } else {
        // Compte configuré : générer un login link pour accéder au dashboard
        try {
          const { data: dashboardData } = await generateDashboardLink({
            variables: { accountId },
          });

          if (dashboardData.generateStripeDashboardLink.success) {
            window.open(
              dashboardData.generateStripeDashboardLink.url,
              "_blank"
            );
            return;
          }
        } catch (err) {
          console.error(
            "Erreur lors de la génération du lien de dashboard:",
            err
          );
        }
      }
    }
  }, [
    stripeStatusData,
    isOnboarded,
    canReceivePayments,
    generateOnboardingLink,
    generateDashboardLink,
  ]);

  // Fonction pour vérifier et synchroniser le statut du compte
  const checkAndUpdateAccountStatus = useCallback(async () => {
    const accountId = stripeStatusData?.myStripeConnectAccount?.accountId;
    if (!accountId) return;

    try {
      setIsLoading(true);

      // Appel à l'API REST au lieu de GraphQL
      const response = await fetch("/api/stripe/connect/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountId, organizationId }),
      });

      const data = await response.json();

      if (data.success) {
        await refetchStatus();
      } else {
        console.error("❌ Erreur mise à jour statut:", data.message);
      }
    } catch (err) {
      console.error("Erreur lors de la vérification du statut:", err);
    } finally {
      setIsLoading(false);
    }
  }, [stripeStatusData, organizationId, refetchStatus]);

  return {
    // États
    isConnected,
    isOnboarded,
    canReceivePayments,
    accountStatus,
    isLoading: isLoading || statusLoading,
    error,

    // Données du compte
    stripeAccount: stripeStatusData?.myStripeConnectAccount,

    // Actions
    connectStripe,
    disconnectStripe,
    openStripeDashboard,
    checkAndUpdateAccountStatus,
    refetchStatus,

    // Utilitaires
    clearError: () => setError(null),
  };
};
