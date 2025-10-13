"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";

/**
 * Hook pour gérer les changements d'organisation
 * Redirige IMMÉDIATEMENT vers la liste lors d'un changement d'organisation
 */
export function useOrganizationChange({ 
  resourceId, 
  listUrl,
  enabled = true 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const previousOrgIdRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Écouter l'événement custom de changement d'organisation
  useEffect(() => {
    if (!enabled || !resourceId) return;

    // Initialiser avec l'organisation actuelle
    const currentOrgId = activeOrganization?.id;
    if (currentOrgId && !isInitializedRef.current) {
      previousOrgIdRef.current = currentOrgId;
      isInitializedRef.current = true;
      console.log("[useOrganizationChange] 🎯 Initialisation avec organisation:", currentOrgId);
    }

    // Écouter l'événement custom de changement d'organisation
    const handleOrganizationChange = (event) => {
      const { previousOrgId, newOrgId } = event.detail;
      
      console.log("[useOrganizationChange] 📢 Événement organizationChanged reçu", {
        previousOrgId,
        newOrgId,
        resourceId,
        pathname,
      });

      // Si on est sur une page de détail (avec resourceId), rediriger IMMÉDIATEMENT
      if (resourceId) {
        console.log("[useOrganizationChange] ➡️ REDIRECTION IMMEDIATE vers", listUrl);
        router.push(listUrl);
      }

      // Mettre à jour la référence
      previousOrgIdRef.current = newOrgId;
    };

    window.addEventListener('organizationChanged', handleOrganizationChange);

    return () => {
      window.removeEventListener('organizationChanged', handleOrganizationChange);
    };
  }, [resourceId, listUrl, router, pathname, enabled, activeOrganization?.id]);

  return {
    hasChangedOrganization: isInitializedRef.current && previousOrgIdRef.current !== activeOrganization?.id,
    currentOrganizationId: activeOrganization?.id,
    previousOrganizationId: previousOrgIdRef.current,
  };
}
