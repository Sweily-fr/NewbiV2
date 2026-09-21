"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDeliveryNotesAccess } from "@/src/hooks/useDeliveryNotesAccess";

/**
 * Garde d'accès aux pages Bons de livraison (fonctionnalité en déploiement
 * restreint) : redirige vers le tableau de bord si le compte n'y a pas droit.
 */
export function DeliveryNotesAccessGuard({ children, fallback = null }) {
  const router = useRouter();
  const { allowed, loading } = useDeliveryNotesAccess();

  useEffect(() => {
    if (!loading && !allowed) {
      router.replace("/dashboard");
    }
  }, [allowed, loading, router]);

  if (loading || !allowed) return fallback;
  return children;
}
