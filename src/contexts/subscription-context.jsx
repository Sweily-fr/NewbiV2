"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { authClient, useSession } from "@/src/lib/auth-client";

const SubscriptionContext = createContext();

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { data: session } = useSession();

  const fetchSubscription = async () => {
    if (!session?.session?.activeOrganizationId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

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

      // if (activeSubscription) {
      //   console.log("STATUT:", activeSubscription.status);
      //   console.log("PLAN:", activeSubscription.plan);
      //   console.log("LIMITES:", activeSubscription.limits);
      // }

      setSubscription(activeSubscription || null);
    } catch (error) {
      setSubscription(null);
    } finally {
      setLoading(false);
      setHasInitialized(true);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [session?.session?.activeOrganizationId]);

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
    const result =
      subscription?.status === "active" || subscription?.status === "trialing";
    return result;
  };

  const value = {
    subscription,
    loading,
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
