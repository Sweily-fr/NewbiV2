import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_STRIPE_CONNECT_ACCOUNT,
  GENERATE_STRIPE_ONBOARDING_LINK,
  CHECK_STRIPE_CONNECT_ACCOUNT_STATUS,
  MY_STRIPE_CONNECT_ACCOUNT,
  DISCONNECT_STRIPE_ACCOUNT,
} from "@/src/graphql/mutations/stripe";

export const useStripeConnect = (userId) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Query pour récupérer le compte Stripe de l'utilisateur
  const {
    data: stripeStatusData,
    loading: statusLoading,
    refetch: refetchStatus,
  } = useQuery(MY_STRIPE_CONNECT_ACCOUNT, {
    skip: !userId,
    errorPolicy: "all",
  });

  // Mutations
  const [createStripeAccount] = useMutation(CREATE_STRIPE_CONNECT_ACCOUNT);
  const [generateOnboardingLink] = useMutation(GENERATE_STRIPE_ONBOARDING_LINK);
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

        // 2. Générer le lien d'onboarding
        const returnUrl = `${window.location.origin}/dashboard/settings?stripe_success=true`;
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
        console.error("Erreur lors de la connexion Stripe:", err);
        setError(err.message || "Erreur lors de la connexion à Stripe");
      } finally {
        setIsLoading(false);
      }
    },
    [userId, stripeStatusData, createStripeAccount, generateOnboardingLink]
  );

  // Fonction pour déconnecter Stripe
  const disconnectStripe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

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

  // Fonction pour ouvrir le tableau de bord Stripe
  const openStripeDashboard = useCallback(() => {
    const accountId = stripeStatusData?.myStripeConnectAccount?.accountId;
    if (accountId) {
      window.open(
        `https://dashboard.stripe.com/connect/accounts/${accountId}`,
        "_blank"
      );
    }
  }, [stripeStatusData]);

  // Calculer l'état de connexion
  const isConnected = !!stripeStatusData?.myStripeConnectAccount?.accountId;
  const isOnboarded =
    stripeStatusData?.myStripeConnectAccount?.isOnboarded || false;
  const canReceivePayments =
    stripeStatusData?.myStripeConnectAccount?.chargesEnabled || false;
  const accountStatus =
    stripeStatusData?.myStripeConnectAccount?.accountStatus || "not_connected";

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
    refetchStatus,

    // Utilitaires
    clearError: () => setError(null),
  };
};
