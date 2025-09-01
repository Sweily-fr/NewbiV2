import { useState, useEffect } from 'react';
import { useSession } from '@/src/lib/auth-client';
import { authClient } from '@/src/lib/auth-client';

export const useSubscription = () => {
  const { data: session, isLoading: sessionLoading } = useSession();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupérer les informations d'abonnement
  const fetchSubscription = async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await authClient.stripe.getSubscription();
      setSubscription(response.data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'abonnement:', err);
      setError(err.message);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  // Créer une session de checkout
  const createCheckoutSession = async (priceId, successUrl, cancelUrl) => {
    try {
      const response = await authClient.stripe.createCheckoutSession({
        priceId,
        successUrl: successUrl || `${window.location.origin}/dashboard/settings?tab=billing&success=true`,
        cancelUrl: cancelUrl || `${window.location.origin}/dashboard/settings?tab=billing&canceled=true`,
      });
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
      
      return response.data;
    } catch (err) {
      console.error('Erreur lors de la création de la session de checkout:', err);
      throw err;
    }
  };

  // Créer un portail client Stripe
  const createCustomerPortal = async () => {
    try {
      const response = await authClient.stripe.createCustomerPortal({
        returnUrl: `${window.location.origin}/dashboard/settings?tab=billing`,
      });
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
      
      return response.data;
    } catch (err) {
      console.error('Erreur lors de la création du portail client:', err);
      throw err;
    }
  };

  // Vérifier si l'utilisateur est en période d'essai
  const isInTrial = () => {
    if (!session?.user) return false;
    
    const createdAt = new Date(session.user.createdAt);
    const now = new Date();
    const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
    
    return daysSinceCreation <= 14 && !subscription?.status;
  };

  // Vérifier si l'essai a expiré
  const isTrialExpired = () => {
    if (!session?.user) return false;
    
    const createdAt = new Date(session.user.createdAt);
    const now = new Date();
    const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
    
    return daysSinceCreation > 14 && !subscription?.status;
  };

  // Calculer les jours restants d'essai
  const getTrialDaysRemaining = () => {
    if (!session?.user) return 0;
    
    const createdAt = new Date(session.user.createdAt);
    const now = new Date();
    const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
    
    return Math.max(0, Math.ceil(14 - daysSinceCreation));
  };

  // Vérifier si l'utilisateur a un abonnement actif
  const hasActiveSubscription = () => {
    return subscription?.status === 'active' || subscription?.status === 'trialing';
  };

  // Vérifier si l'utilisateur peut accéder à l'application
  const canAccessApp = () => {
    return isInTrial() || hasActiveSubscription();
  };

  useEffect(() => {
    if (!sessionLoading && session?.user) {
      fetchSubscription();
    }
  }, [session, sessionLoading]);

  return {
    subscription,
    loading: loading || sessionLoading,
    error,
    isInTrial: isInTrial(),
    isTrialExpired: isTrialExpired(),
    trialDaysRemaining: getTrialDaysRemaining(),
    hasActiveSubscription: hasActiveSubscription(),
    canAccessApp: canAccessApp(),
    createCheckoutSession,
    createCustomerPortal,
    refetch: fetchSubscription,
  };
};
