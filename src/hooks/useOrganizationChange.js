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
    }

    // Écouter l'événement custom de changement d'organisation
    const handleOrganizationChange = (event) => {
      const { newOrgId } = event.detail;

      if (resourceId) {
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
