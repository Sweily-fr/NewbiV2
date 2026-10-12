"use client";

import { useEffect, useState } from "react";

/**
 * Nom du cabinet qui paie l'abonnement de l'espace (compte gestionnaire),
 * ou null. Le client n'y choisit ni ne résilie l'offre : c'est le cabinet.
 */
export function useOrgPaidByManager(organizationId) {
  const [managerName, setManagerName] = useState(null);
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
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [organizationId]);
  return managerName;
}
