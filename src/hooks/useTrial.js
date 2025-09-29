"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  const isMountedRef = useRef(false);

  // Marquer le composant comme monté
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Requête pour obtenir le statut de la période d'essai avec protections
  const { loading, error, refetch, data: queryData } = useQuery(GET_TRIAL_STATUS, {
    skip: !session?.user,
    fetchPolicy: 'cache-first', // Utiliser le cache en priorité pour éviter les requêtes excessives
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: false, // Éviter les re-renders inutiles
    pollInterval: 0, // Pas de polling automatique
  });

  // Gérer les données de la requête dans useEffect
  useEffect(() => {
    if (isMountedRef.current && queryData?.getTrialStatus?.success) {
      setTrialStatus(queryData.getTrialStatus.data);
    }
  }, [queryData]);

  // Gérer les erreurs dans useEffect
  useEffect(() => {
    if (isMountedRef.current && error) {
      console.error('Erreur GraphQL trial:', error);
      // En cas d'erreur, utiliser les données de session comme fallback
      setTrialStatus(null);
    }
  }, [error]);

  // Mutation pour démarrer une période d'essai
  const [startTrialMutation, { loading: startingTrial, data: mutationData }] = useMutation(START_TRIAL);

  // Gérer les données de la mutation dans useEffect
  useEffect(() => {
    if (isMountedRef.current && mutationData?.startTrial?.success) {
      setTrialStatus(mutationData.startTrial.data);
    }
  }, [mutationData]);

  // Extraire les informations de trial depuis la session (support des deux structures)
  const getTrialStatusFromSession = useCallback(() => {
    if (!session?.user?.organization) return null;

    const organization = session.user.organization;
    const now = new Date();

    // Structure moderne : subscription.plan = 'trial'
    if (organization.subscription && organization.subscription.plan === 'trial') {
      const subscription = organization.subscription;
      const isActive = subscription.status === 'active';
      const trialEndDate = subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
      
      if (!trialEndDate || trialEndDate <= now) {
        // Trial expiré ou pas de date de fin
        return {
          isTrialActive: false,
          trialEndDate: trialEndDate,
          daysRemaining: 0,
          hasPremiumAccess: false,
          hasUsedTrial: subscription.hasUsedTrial || true, // Si plan=trial, alors utilisé
          structure: 'modern'
        };
      }

      const diffTime = trialEndDate - now;
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        isTrialActive: isActive,
        trialEndDate: trialEndDate,
        daysRemaining: Math.max(0, daysRemaining),
        hasPremiumAccess: isActive,
        hasUsedTrial: subscription.hasUsedTrial || true,
        structure: 'modern'
      };
    }

    // Structure ancienne : champs plats
    if (organization.isTrialActive && organization.trialEndDate) {
      const trialEndDate = new Date(organization.trialEndDate);
      
      if (trialEndDate <= now) {
        // Trial expiré
        return {
          isTrialActive: false,
          trialEndDate: organization.trialEndDate,
          daysRemaining: 0,
          hasPremiumAccess: false,
          hasUsedTrial: organization.hasUsedTrial || false,
          structure: 'legacy'
        };
      }

      const diffTime = trialEndDate - now;
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        isTrialActive: true,
        trialEndDate: organization.trialEndDate,
        daysRemaining: Math.max(0, daysRemaining),
        hasPremiumAccess: true,
        hasUsedTrial: organization.hasUsedTrial || false,
        structure: 'legacy'
      };
    }

    // Aucun trial actif
    return {
      isTrialActive: false,
      trialEndDate: null,
      daysRemaining: 0,
      hasPremiumAccess: false,
      hasUsedTrial: organization.hasUsedTrial || organization.subscription?.hasUsedTrial || false,
      structure: organization.subscription ? 'modern' : 'legacy'
    };
  }, [session]);

  // Utiliser les données GraphQL si disponibles, sinon les données de session
  const currentTrialStatus = trialStatus || getTrialStatusFromSession();
  // DÉSACTIVÉ TEMPORAIREMENT - Démarrer automatiquement la période d'essai à la première connexion
  // Cause une boucle infinie avec rate limiting
  // Activation automatique du trial à la première connexion
  useEffect(() => {
    const autoStartTrial = async () => {
      if (!session?.user || loading || startingTrial) return;
      
      const sessionTrialStatus = getTrialStatusFromSession();
      
      // Si l'utilisateur n'a jamais utilisé de trial et n'en a pas d'actif, démarrer automatiquement
      if (sessionTrialStatus && 
          !sessionTrialStatus.hasUsedTrial && 
          !sessionTrialStatus.isTrialActive) {
        try {
          console.log("Démarrage automatique de la période d'essai pour l'utilisateur:", session.user.email);
          await startTrialMutation();
        } catch (error) {
          console.error("Erreur lors du démarrage automatique de la période d'essai:", error);
        }
      }
    };

    autoStartTrial();
  }, [session?.user, loading, startingTrial, getTrialStatusFromSession, startTrialMutation]);

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
