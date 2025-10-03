"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { authClient, useSession } from "@/src/lib/auth-client";
import { useTrial } from "@/src/hooks/useTrial";

const SubscriptionContext = createContext();

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { data: session } = useSession();

  // Protection contre l'erreur d'hydratation
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  const trial = useTrial(); // Réactivé avec démarrage automatique

  // Protection contre les boucles de rendu
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchSubscription = async () => {
    if (
      !session?.session?.activeOrganizationId ||
      isProcessing ||
      !isHydrated
    ) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setIsProcessing(true);

    try {
      // Récupérer les abonnements pour cette organisation
      const { data: subscriptions, error } = await authClient.subscription.list(
        {
          query: {
            referenceId: session.session.activeOrganizationId,
          },
        }
      );

      if (error) {
        console.error("Erreur récupération abonnement:", error);
        setSubscription(null);
        return;
      }

      const activeSubscription = subscriptions?.find(
        (sub) => sub.status === "active" || sub.status === "trialing"
      );

      setSubscription(activeSubscription || null);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'abonnement:", error);
      setSubscription(null);
    } finally {
      setLoading(false);
      setHasInitialized(true);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isHydrated) {
      fetchSubscription();
    }
  }, [session?.session?.activeOrganizationId, isHydrated]);

  const refreshSubscription = () => {
    setLoading(true);
    fetchSubscription();
  };

  const hasFeature = (feature) => {
    if (!subscription) return false;
    return subscription.limits?.[feature] > 0;
  };

  const getLimit = (feature) => {
    return subscription?.limits?.[feature] || 0;
  };

  const isActive = () => {
    // Vérifier d'abord si l'utilisateur a un abonnement payant actif
    const hasActiveSubscription =
      subscription?.status === "active" || subscription?.status === "trialing";

    // Si pas d'abonnement payant, vérifier la période d'essai
    if (!hasActiveSubscription) {
      return trial.hasPremiumAccess;
    }

    return hasActiveSubscription;
  };

  const value = {
    subscription,
    loading: loading || trial.loading,
    hasInitialized,
    refreshSubscription,
    hasFeature,
    getLimit,
    isActive,
    // Helpers pour les features
    canCreateProjects: () => hasFeature("projects"),
    canUseStorage: () => hasFeature("storage"),
    canCreateInvoices: () => hasFeature("invoices"),
    projectLimit: () => getLimit("projects"),
    storageLimit: () => getLimit("storage"),
    invoiceLimit: () => getLimit("invoices"),
    // Données de période d'essai
    trial: {
      isTrialActive: trial.isTrialActive,
      daysRemaining: trial.daysRemaining,
      hasUsedTrial: trial.hasUsedTrial,
      trialMessage: trial.trialMessage,
      canStartTrial: trial.canStartTrial,
      startTrial: trial.startTrial,
    },
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
}
