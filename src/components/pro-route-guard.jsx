"use client";

import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";

/**
 * ProRouteGuard - Garde de route pour les fonctionnalités Pro
 *
 * ✅ MODIFIÉ: Logique simplifiée pour accepter "trialing" comme statut valide
 * et éviter les redirections inutiles pendant le chargement
 */
export function ProRouteGuard({
  children,
  pageName,
  requirePaidSubscription = false,
}) {
  const { isActive, loading, subscription, hasInitialized } = useSubscription();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(true); // ✅ Par défaut true pour éviter les flashs
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // ✅ Pendant le chargement, autoriser l'accès par défaut
    if (loading || !hasInitialized) {
      setHasAccess(true);
      setIsChecking(true);
      return;
    }

    // Vérifier l'accès avec isActive() qui gère déjà "trialing"
    const hasActiveSubscription = isActive(requirePaidSubscription);

    if (hasActiveSubscription) {
      setHasAccess(true);
      setIsChecking(false);
      hasRedirectedRef.current = false;
      return;
    }

    // ✅ Ne rediriger que si on est sûr qu'il n'y a pas d'abonnement
    // et que ce n'est pas un problème de chargement
    if (!hasActiveSubscription && subscription !== undefined) {
      // L'abonnement a été vérifié et l'accès est refusé
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        // Utiliser un délai pour éviter les redirections pendant les transitions
        const timeout = setTimeout(() => {
          router.replace("/dashboard?access=restricted");
        }, 500);
        return () => clearTimeout(timeout);
      }
    }

    setIsChecking(false);
  }, [
    loading,
    hasInitialized,
    subscription,
    router,
    isActive,
    requirePaidSubscription,
  ]);

  // ✅ Toujours afficher le contenu pendant le chargement
  // Cela évite les flashs et améliore l'UX
  if (isChecking || loading || !hasInitialized) {
    return <>{children}</>;
  }

  // Afficher le contenu si l'accès est autorisé
  if (hasAccess) {
    return children;
  }

  // Si pas d'accès, retourner null (la redirection est en cours)
  return null;
}
