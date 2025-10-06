"use client";

import { useCallback } from "react";
import { useSubscription } from "@/src/contexts/subscription-context";
import { useSession } from "@/src/lib/auth-client";
import { isCompanyInfoComplete } from "./useCompanyInfoGuard";

/**
 * Hook centralisé pour vérifier l'accès aux fonctionnalités
 * @param {string} featureName - Nom de la fonctionnalité à vérifier
 * @returns {Object} État d'accès et informations associées
 */
export function useFeatureAccess(featureName) {
  const { isActive, subscription, loading, trial } = useSubscription();
  const { data: session } = useSession();

  // Définition des fonctionnalités et leurs restrictions
  const featureConfig = {
    // Fonctionnalités gratuites
    kanban: {
      requiresPro: false,
      requiresCompanyInfo: false,
      requiresPaidSubscription: false,
    },
    "signatures-mail": {
      requiresPro: false,
      requiresCompanyInfo: false,
      requiresPaidSubscription: false,
    },
    calendar: {
      requiresPro: false,
      requiresCompanyInfo: false,
      requiresPaidSubscription: false,
    },

    // Fonctionnalités Pro
    dashboard: {
      requiresPro: true,
      requiresCompanyInfo: false,
      requiresPaidSubscription: false,
    },
    factures: {
      requiresPro: true,
      requiresCompanyInfo: true,
      requiresPaidSubscription: false,
    },
    devis: {
      requiresPro: true,
      requiresCompanyInfo: true,
      requiresPaidSubscription: false,
    },
    "gestion-depenses": {
      requiresPro: true,
      requiresCompanyInfo: false,
      requiresPaidSubscription: false,
    },
    "transferts-fichiers": {
      requiresPro: true,
      requiresCompanyInfo: false,
      requiresPaidSubscription: false,
    },
    clients: {
      requiresPro: true,
      requiresCompanyInfo: false,
      requiresPaidSubscription: false,
    },
    collaborateurs: {
      requiresPro: true,
      requiresCompanyInfo: false,
      requiresPaidSubscription: false,
    },

    // Fonctionnalités nécessitant un abonnement payant (pas de trial)
    catalogues: {
      requiresPro: true,
      requiresCompanyInfo: false,
      requiresPaidSubscription: true,
    },
  };

  // Vérifier l'accès à une fonctionnalité
  const checkAccess = useCallback(() => {
    const config = featureConfig[featureName];

    // Si la fonctionnalité n'est pas définie, refuser l'accès par défaut
    if (!config) {
      return {
        hasAccess: false,
        reason: "unknown_feature",
        message: "Fonctionnalité non reconnue",
      };
    }

    // Vérifier l'abonnement Pro si requis
    if (config.requiresPro) {
      const hasProAccess = isActive();

      if (!hasProAccess) {
        return {
          hasAccess: false,
          reason: "no_pro_subscription",
          message: "Cette fonctionnalité nécessite un abonnement Pro",
          action: "upgrade",
        };
      }

      // Vérifier si un abonnement payant est requis (pas de trial)
      if (config.requiresPaidSubscription) {
        const isPaidSubscription = subscription?.status === "active";

        if (!isPaidSubscription) {
          return {
            hasAccess: false,
            reason: "trial_not_allowed",
            message:
              "Cette fonctionnalité nécessite un abonnement payant (période d'essai non acceptée)",
            action: "upgrade_paid",
          };
        }
      }
    }

    // Vérifier les informations d'entreprise si requises
    if (config.requiresCompanyInfo) {
      const organization = session?.user?.organization;
      const hasCompanyInfo = organization
        ? isCompanyInfoComplete(organization)
        : false;

      if (!hasCompanyInfo) {
        return {
          hasAccess: false,
          reason: "incomplete_company_info",
          message: "Veuillez compléter les informations de votre entreprise",
          action: "complete_profile",
        };
      }
    }

    // Accès autorisé
    return {
      hasAccess: true,
      reason: "authorized",
      message: "Accès autorisé",
    };
  }, [featureName, isActive, subscription, session]);

  // Obtenir le message d'état pour l'utilisateur
  const getAccessMessage = useCallback(() => {
    const accessStatus = checkAccess();

    if (accessStatus.hasAccess) {
      return null;
    }

    // Messages personnalisés selon la raison
    const messages = {
      no_pro_subscription: {
        title: "Fonctionnalité Premium",
        description:
          "Passez à un abonnement Pro pour accéder à cette fonctionnalité.",
        cta: "Découvrir Pro",
      },
      trial_not_allowed: {
        title: "Abonnement payant requis",
        description:
          "Cette fonctionnalité nécessite un abonnement payant actif.",
        cta: "Souscrire maintenant",
      },
      incomplete_company_info: {
        title: "Configuration requise",
        description:
          "Complétez les informations de votre entreprise pour accéder à cette fonctionnalité.",
        cta: "Compléter mon profil",
      },
      unknown_feature: {
        title: "Fonctionnalité non disponible",
        description: "Cette fonctionnalité n'est pas encore disponible.",
        cta: null,
      },
    };

    return messages[accessStatus.reason] || messages.unknown_feature;
  }, [checkAccess]);

  // Obtenir les informations de l'abonnement
  const getSubscriptionInfo = useCallback(() => {
    return {
      isPro: isActive(),
      isPaid: subscription?.status === "active",
      isTrial: trial?.isTrialActive || false,
      daysRemaining: trial?.daysRemaining || 0,
      plan: subscription?.plan || "free",
    };
  }, [isActive, subscription, trial]);

  const accessStatus = checkAccess();

  return {
    // État d'accès
    hasAccess: accessStatus.hasAccess,
    reason: accessStatus.reason,
    message: accessStatus.message,
    action: accessStatus.action,

    // Helpers
    loading,
    getAccessMessage,
    getSubscriptionInfo,

    // Informations d'abonnement
    subscriptionInfo: getSubscriptionInfo(),
  };
}
