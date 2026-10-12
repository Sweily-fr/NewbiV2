"use client";

import { useEffect, useState } from "react";

/**
 * Nom du cabinet qui paie l'abonnement de l'espace (compte gestionnaire),
 * null s'il n'y en a pas, undefined tant que ce n'est pas vérifié. Le client
 * n'y choisit ni ne résilie l'offre : c'est le cabinet.
 */
export function useOrgPaidByManager(organizationId) {
  const [managerName, setManagerName] = useState(undefined);
  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    fetch(`/api/organizations/${organizationId}/cabinet`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) {
          setManagerName(data?.paidByManager ? data.managerName : null);
        }
      })
      .catch(() => !cancelled && setManagerName(null));
    return () => {
      cancelled = true;
    };
  }, [organizationId]);
  return managerName;
}
