"use client";

import { useState, useCallback } from "react";
import { useSession } from "@/src/lib/auth-client";
import { gql, useQuery, useMutation } from "@apollo/client";

// Requête GraphQL pour obtenir le statut de la période d'essai
const GET_TRIAL_STATUS = gql`
  query GetTrialStatus {
    getTrialStatus {
      success
      message
      data {
        isTrialActive
        trialEndDate
        daysRemaining
        hasPremiumAccess
        hasUsedTrial
      }
    }
  }
`;

// Mutation pour démarrer une période d'essai
const START_TRIAL = gql`
  mutation StartTrial {
    startTrial {
      success
      message
      data {
        isTrialActive
        trialEndDate
        daysRemaining
        hasPremiumAccess
        hasUsedTrial
      }
    }
  }
`;

/**
 * Hook pour gérer la période d'essai de l'utilisateur
 */
export function useTrial() {
  const { data: session } = useSession();
  const [trialStatus, setTrialStatus] = useState(null);

  // Requête pour obtenir le statut de la période d'essai
  const { loading, error, refetch } = useQuery(GET_TRIAL_STATUS, {
    skip: !session?.user,
    onCompleted: (data) => {
      if (data?.getTrialStatus?.success) {
        setTrialStatus(data.getTrialStatus.data);
      }
    },
  });

  // Mutation pour démarrer une période d'essai
  const [startTrialMutation, { loading: startingTrial }] = useMutation(START_TRIAL, {
    onCompleted: (data) => {
      if (data?.startTrial?.success) {
        setTrialStatus(data.startTrial.data);
      }
    },
  });

  // Calculer le statut de la période d'essai à partir des données de session
  const getTrialStatusFromSession = useCallback(() => {
    if (!session?.user) return null;

    const user = session.user;
    const now = new Date();
    
    // Vérifier si l'utilisateur a une période d'essai active
    if (user.isTrialActive && user.trialEndDate) {
      const trialEndDate = new Date(user.trialEndDate);
      const isExpired = now > trialEndDate;
      
      if (isExpired) {
        return {
          isTrialActive: false,
          trialEndDate: user.trialEndDate,
          daysRemaining: 0,
          hasPremiumAccess: false,
          hasUsedTrial: user.hasUsedTrial || false,
        };
      }

      const diffTime = trialEndDate - now;
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        isTrialActive: true,
        trialEndDate: user.trialEndDate,
        daysRemaining: Math.max(0, daysRemaining),
        hasPremiumAccess: true,
        hasUsedTrial: user.hasUsedTrial || false,
      };
    }

    return {
      isTrialActive: false,
      trialEndDate: null,
      daysRemaining: 0,
      hasPremiumAccess: false,
      hasUsedTrial: user.hasUsedTrial || false,
    };
  }, [session]);

  // Utiliser les données GraphQL si disponibles, sinon les données de session
  const currentTrialStatus = trialStatus || getTrialStatusFromSession();

  // Démarrer une période d'essai
  const startTrial = useCallback(async () => {
    try {
      await startTrialMutation();
      // Rafraîchir les données après avoir démarré l'essai
      await refetch();
    } catch (error) {
      console.error("Erreur lors du démarrage de la période d'essai:", error);
      throw error;
    }
  }, [startTrialMutation, refetch]);

  // Vérifier si l'utilisateur peut démarrer une période d'essai
  const canStartTrial = useCallback(() => {
    return currentTrialStatus && !currentTrialStatus.hasUsedTrial;
  }, [currentTrialStatus]);

  // Vérifier si l'utilisateur a accès aux fonctionnalités premium
  const hasPremiumAccess = useCallback(() => {
    if (!currentTrialStatus) return false;
    return currentTrialStatus.hasPremiumAccess;
  }, [currentTrialStatus]);

  // Obtenir le message d'état de la période d'essai
  const getTrialMessage = useCallback(() => {
    if (!currentTrialStatus) return null;

    if (currentTrialStatus.isTrialActive) {
      const days = currentTrialStatus.daysRemaining;
      if (days === 0) {
        return "Votre période d'essai expire aujourd'hui";
      } else if (days === 1) {
        return "Il vous reste 1 jour d'essai gratuit";
      } else {
        return `Il vous reste ${days} jours d'essai gratuit`;
      }
    }

    if (currentTrialStatus.hasUsedTrial) {
      return "Votre période d'essai gratuite est terminée";
    }

    return "Démarrez votre essai gratuit de 14 jours";
  }, [currentTrialStatus]);

  // Rafraîchir le statut de la période d'essai
  const refreshTrialStatus = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error("Erreur lors du rafraîchissement du statut d'essai:", error);
    }
  }, [refetch]);

  return {
    // État
    trialStatus: currentTrialStatus,
    loading: loading || startingTrial,
    error,

    // Actions
    startTrial,
    refreshTrialStatus,

    // Helpers
    canStartTrial: canStartTrial(),
    hasPremiumAccess: hasPremiumAccess(),
    trialMessage: getTrialMessage(),
    
    // Données spécifiques
    isTrialActive: currentTrialStatus?.isTrialActive || false,
    daysRemaining: currentTrialStatus?.daysRemaining || 0,
    hasUsedTrial: currentTrialStatus?.hasUsedTrial || false,
  };
}
