"use client";

import { useEffect, useState } from "react";

// Une seule requête par chargement de page, partagée par la barre latérale,
// l'en-tête et le bandeau (la déconnexion recharge la page)
let request = null;

function loadAccountManager() {
  request ||= fetch("/api/gestionnaire/me")
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => data || { isManager: false })
    .catch(() => {
      request = null;
      return { isManager: false };
    });
  return request;
}

/**
 * Compte gestionnaire de l'utilisateur connecté :
 * { isManager, readOnly, name, managedOrganizationIds } ou null pendant le
 * chargement. readOnly : cabinet suspendu par Newbi (consultation seulement).
 */
export function useAccountManager() {
  const [manager, setManager] = useState(null);
  useEffect(() => {
    let cancelled = false;
    loadAccountManager().then((data) => {
      if (!cancelled) setManager(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return manager;
}
