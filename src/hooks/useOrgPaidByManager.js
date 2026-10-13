"use client";

import { useEffect, useState } from "react";

/**
 * Prise en charge de l'abonnement de l'espace par un cabinet (compte
 * gestionnaire) :
 * - undefined tant que ce n'est pas vérifié (ne rien autoriser) ;
 * - null si l'espace paie lui-même ;
 * - { managerName, subscriptionStatus, viewerIsManager, linkId? } sinon.
 * Le client n'y choisit ni ne résilie l'offre : c'est son cabinet.
 */
export function useOrgPaidByManager(organizationId) {
  const [cabinet, setCabinet] = useState(undefined);
  useEffect(() => {
    if (!organizationId) {
      setCabinet(undefined);
      return;
    }
    let cancelled = false;
    setCabinet(undefined);
    fetch(`/api/organizations/${organizationId}/cabinet`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        setCabinet(
          data?.paidByManager
            ? {
                managerName: data.managerName,
                subscriptionStatus: data.subscriptionStatus || null,
                viewerIsManager: Boolean(data.viewerIsManager),
                linkId: data.linkId || null,
              }
            : null,
        );
      })
      .catch(() => !cancelled && setCabinet(null));
    return () => {
      cancelled = true;
    };
  }, [organizationId]);
  return cabinet;
}
