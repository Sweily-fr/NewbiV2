"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";

/**
 * Hook pour gérer les changements d'organisation
 * Redirige vers la liste appropriée si la ressource actuelle n'existe plus
 */
export function useOrganizationChange({ 
  resourceId, 
  resourceExists, 
  listUrl,
  enabled = true 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const previousOrgIdRef = useRef(activeOrganization?.id);

  useEffect(() => {
    if (!enabled || !activeOrganization) return;

    const currentOrgId = activeOrganization.id;
    const previousOrgId = previousOrgIdRef.current;

    // Détecter un changement d'organisation
    if (previousOrgId && previousOrgId !== currentOrgId) {
      console.log("[useOrganizationChange] Changement d'organisation détecté", {
        previousOrgId,
        currentOrgId,
        resourceId,
        resourceExists,
        pathname,
      });

      // Si on est sur une page de détail et que la ressource n'existe pas
      if (resourceId && resourceExists === false) {
        console.log("[useOrganizationChange] Ressource inexistante - Redirection vers", listUrl);
        router.push(listUrl);
      }
    }

    // Mettre à jour la référence
    previousOrgIdRef.current = currentOrgId;
  }, [activeOrganization?.id, resourceId, resourceExists, listUrl, router, pathname, enabled]);

  return {
    hasChangedOrganization: previousOrgIdRef.current !== activeOrganization?.id,
    currentOrganizationId: activeOrganization?.id,
    previousOrganizationId: previousOrgIdRef.current,
  };
}
