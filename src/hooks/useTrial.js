"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession, authClient } from "@/src/lib/auth-client";
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
  const { data: activeOrg } = authClient.useActiveOrganization();
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

  // Calculer le statut de la période d'essai à partir de l'organisation active Better Auth
  const getTrialStatusFromSession = useCallback(() => {
    // Utiliser activeOrg au lieu de session.user.organization
    if (!activeOrg) {
      console.log('🔍 useTrial - Pas d\'organisation active');
      return null;
    }

    const now = new Date();
    
    // Log pour diagnostiquer
    console.log('🔍 useTrial - Organisation active récupérée:', {
      activeOrg,
      isTrialActive: activeOrg.isTrialActive,
      trialEndDate: activeOrg.trialEndDate,
      hasUsedTrial: activeOrg.hasUsedTrial
    });
    
    // Vérifier si l'organisation a une période d'essai active
    if (activeOrg.isTrialActive && activeOrg.trialEndDate) {
      const trialEndDate = new Date(activeOrg.trialEndDate);
      const isExpired = now > trialEndDate;
      
      if (isExpired) {
        console.log('⏰ useTrial - Période d\'essai expirée');
        return {
          isTrialActive: false,
          trialEndDate: activeOrg.trialEndDate,
          daysRemaining: 0,
          hasPremiumAccess: false,
          hasUsedTrial: activeOrg.hasUsedTrial || false,
        };
      }

      const diffTime = trialEndDate - now;
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      console.log('✅ useTrial - Période d\'essai active:', {
        daysRemaining,
        trialEndDate
      });

      return {
        isTrialActive: true,
        trialEndDate: activeOrg.trialEndDate,
        daysRemaining: Math.max(0, daysRemaining),
        hasPremiumAccess: true,
        hasUsedTrial: activeOrg.hasUsedTrial || false,
      };
    }

    console.log('❌ useTrial - Pas de période d\'essai active');
    return {
      isTrialActive: false,
      trialEndDate: null,
      daysRemaining: 0,
      hasPremiumAccess: false,
      hasUsedTrial: activeOrg.hasUsedTrial || false,
    };
  }, [activeOrg]);

  // Utiliser les données de session en priorité (plus fiable que GraphQL)
  const currentTrialStatus = getTrialStatusFromSession() || trialStatus;

  console.log('📊 useTrial - Status calculé:', currentTrialStatus);

  // Activation automatique du trial à la première connexion (désactivée car trials déjà en base)
  // Cette fonction n'est plus nécessaire car les trials sont gérés par les scripts de migration
  /*
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
  */

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

  // Rafraîchir le statut de la période d'essai
  const refreshTrialStatus = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error("Erreur lors du rafraîchissement du statut d'essai:", error);
    }
  }, [refetch]);

  // Retourner directement les valeurs calculées au lieu de fonctions
  const finalStatus = {
    // État
    trialStatus: currentTrialStatus,
    loading: loading || startingTrial || !activeOrg,
    error,

    // Actions
    startTrial,
    refreshTrialStatus,

    // Helpers - Retourner les valeurs directement
    canStartTrial: currentTrialStatus && !currentTrialStatus.hasUsedTrial,
    hasPremiumAccess: currentTrialStatus?.hasPremiumAccess || false,
    trialMessage: currentTrialStatus?.isTrialActive 
      ? `Il vous reste ${currentTrialStatus.daysRemaining} jours d'essai gratuit`
      : currentTrialStatus?.hasUsedTrial 
        ? "Votre période d'essai gratuite est terminée"
        : "Démarrez votre essai gratuit de 14 jours",
    
    // Données spécifiques
    isTrialActive: currentTrialStatus?.isTrialActive || false,
    daysRemaining: currentTrialStatus?.daysRemaining || 0,
    hasUsedTrial: currentTrialStatus?.hasUsedTrial || false,
  };

  console.log('📤 useTrial - Retour final:', finalStatus);

  return finalStatus;
}
