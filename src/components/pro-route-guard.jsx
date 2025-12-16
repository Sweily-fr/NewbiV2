"use client";

import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";

export function ProRouteGuard({
  children,
  pageName,
  requirePaidSubscription = false,
}) {
  const { isActive, loading, subscription, hasInitialized, trial } =
    useSubscription();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const checkTimeoutRef = useRef(null);
  const hasRedirectedRef = useRef(false);
  const initialCheckDoneRef = useRef(false);

  useEffect(() => {
    // Nettoyer le timeout précédent
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    // Attendre que l'initialisation soit complète
    if (!loading && hasInitialized) {
      // Ajouter un délai pour permettre la synchronisation complète des données
      checkTimeoutRef.current = setTimeout(() => {
        const hasActiveSubscription = isActive();
        const isPaidSubscription = subscription?.status === "active";

        // Vérifier si l'accès est autorisé
        const accessGranted = requirePaidSubscription
          ? isPaidSubscription
          : hasActiveSubscription;

        // ⚠️ IMPORTANT: Vérifier si l'abonnement est vraiment chargé
        // Si subscription est undefined/null ET qu'on n'a pas de trial, c'est en cours de chargement
        const isSubscriptionDataLoaded =
          subscription !== undefined ||
          trial?.isTrialActive === true ||
          trial?.hasUsedTrial === true;

        // Ne pas rediriger au premier chargement si les données ne sont pas encore chargées
        if (!isSubscriptionDataLoaded && !initialCheckDoneRef.current) {
          return;
        }

        // Marquer que le premier check est fait
        if (isSubscriptionDataLoaded && !initialCheckDoneRef.current) {
          initialCheckDoneRef.current = true;
        }

        // Ne rediriger que si les données sont chargées ET l'accès est refusé
        if (
          !accessGranted &&
          !hasRedirectedRef.current &&
          isSubscriptionDataLoaded
        ) {
          hasRedirectedRef.current = true;
          router.replace("/dashboard?access=restricted");
        } else if (accessGranted) {
          setHasAccess(true);
          hasRedirectedRef.current = false; // Reset pour permettre les futures redirections
        } else if (!isSubscriptionDataLoaded) {
          return;
        }

        setIsChecking(false);
      }, 300); // Délai de 300ms pour la synchronisation
    }

    // Cleanup
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [
    loading,
    hasInitialized,
    subscription?.status,
    router,
    isActive,
    pageName,
    requirePaidSubscription,
    trial?.isTrialActive,
  ]);

  // Afficher le contenu pendant la vérification (les pages gèrent leurs propres skeletons)
  if (isChecking || loading || !hasInitialized) {
    return <>{children}</>;
  }

  // Afficher le contenu seulement si l'accès est autorisé
  if (!hasAccess) {
    return null;
  }

  return children;
}
