"use client";

import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";

/**
 * ProRouteGuard - Garde de route pour les fonctionnalités Pro
 *
 * Comportement :
 * - Abonnement actif → accès complet
 * - Abonnement expiré + page de consultation (listing, détail) → accès lecture seule
 * - Abonnement expiré + page de création/édition (/new, /edit, /nouveau, /editer, /avoir) → redirection
 *
 * Les mutations write sont aussi bloquées côté backend (403 SUBSCRIPTION_READ_ONLY)
 */

const WRITE_PATH_PATTERNS = ["/new", "/nouveau", "/edit", "/editer", "/avoir/"];

export function ProRouteGuard({
  children,
  pageName,
  requirePaidSubscription = false,
}) {
  const { isActive, loading, hasInitialized } = useSubscription();
  const pathname = usePathname();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const hasRedirectedRef = useRef(false);

  const isWritePage = WRITE_PATH_PATTERNS.some((p) => pathname?.includes(p));

  useEffect(() => {
    if (!loading && hasInitialized) {
      setIsReady(true);
    }
  }, [loading, hasInitialized]);

  useEffect(() => {
    if (!isReady) return;

    const hasActiveSubscription = isActive(requirePaidSubscription);

    // Si abonnement inactif ET page de création/édition → rediriger
    if (!hasActiveSubscription && isWritePage && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      router.replace("/dashboard");
    }
  }, [isReady, isActive, isWritePage, requirePaidSubscription, router]);

  // Loader pendant le chargement
  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Si page write + abonnement inactif → loader pendant la redirection
  if (!isActive(requirePaidSubscription) && isWritePage) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Pages de consultation → toujours accessibles (lecture seule)
  return children;
}
