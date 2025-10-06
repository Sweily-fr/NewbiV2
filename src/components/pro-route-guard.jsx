"use client";

import { useSubscription } from "@/src/contexts/subscription-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";

export function ProRouteGuard({
  children,
  pageName,
  requirePaidSubscription = false,
}) {
  const { isActive, loading, subscription, hasInitialized, trial } = useSubscription();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const checkTimeoutRef = useRef(null);
  const hasRedirectedRef = useRef(false);

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

        console.log(`[ProRouteGuard] ${pageName}`, {
          hasActiveSubscription,
          isPaidSubscription,
          requirePaidSubscription,
          accessGranted,
          subscriptionStatus: subscription?.status,
          trialActive: trial?.isTrialActive,
          trialDaysRemaining: trial?.daysRemaining,
        });

        if (!accessGranted && !hasRedirectedRef.current) {
          console.log(`[ProRouteGuard] ${pageName} - Accès refusé - Redirection vers /dashboard/outils`);
          hasRedirectedRef.current = true;
          router.replace("/dashboard/outils?access=restricted");
        } else if (accessGranted) {
          console.log(`[ProRouteGuard] ${pageName} - Accès autorisé`);
          setHasAccess(true);
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

  // Afficher un skeleton pendant la vérification initiale
  if (isChecking || loading || !hasInitialized) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
        <Skeleton className="h-[40px] w-[200px] rounded-xl" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-[40px] w-[300px] rounded-xl" />
          <Skeleton className="h-[40px] w-[150px] rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Afficher le contenu seulement si l'accès est autorisé
  if (!hasAccess) {
    return null;
  }

  return children;
}
