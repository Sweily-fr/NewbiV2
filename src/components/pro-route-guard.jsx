"use client";

import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";

/**
 * ProRouteGuard - Garde de route pour les fonctionnalités Pro
 *
 * 🔒 SÉCURISÉ: Bloque l'accès pendant le chargement (affiche un loader)
 * Ne révèle le contenu qu'après confirmation de l'abonnement
 */
export function ProRouteGuard({
  children,
  pageName,
  requirePaidSubscription = false,
}) {
  const { isActive, loading, subscription, hasInitialized } = useSubscription();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false); // 🔒 Par défaut false (bloqué)
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // 🔒 Pendant le chargement, garder l'accès bloqué
    if (loading || !hasInitialized) {
      setHasAccess(false);
      return;
    }

    // Vérifier l'accès avec isActive() qui gère déjà "trialing"
    const hasActiveSubscription = isActive(requirePaidSubscription);

    if (hasActiveSubscription) {
      setHasAccess(true);
      hasRedirectedRef.current = false;
      return;
    }

    // 🔒 Pas d'abonnement valide - rediriger
    if (!hasActiveSubscription && subscription !== undefined) {
      setHasAccess(false);
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        router.replace("/dashboard?access=restricted");
      }
    }
  }, [
    loading,
    hasInitialized,
    subscription,
    router,
    isActive,
    requirePaidSubscription,
  ]);

  // 🔒 Afficher un loader pendant la vérification (sécurisé)
  if (loading || !hasInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#5A50FF] mx-auto" />
          <p className="text-sm text-muted-foreground">
            Vérification de l'accès...
          </p>
        </div>
      </div>
    );
  }

  // ✅ Afficher le contenu si l'accès est autorisé
  if (hasAccess) {
    return children;
  }

  // 🔒 Si pas d'accès, afficher le loader (redirection en cours)
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#5A50FF] mx-auto" />
        <p className="text-sm text-muted-foreground">Redirection...</p>
      </div>
    </div>
  );
}
