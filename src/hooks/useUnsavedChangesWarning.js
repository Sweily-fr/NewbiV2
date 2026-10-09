"use client";

import { useEffect } from "react";

/**
 * Tant que `hasUnsavedChanges` est vrai, le navigateur demande confirmation
 * avant de recharger ou de fermer l'onglet (« Les modifications ne seront
 * peut-être pas enregistrées »). Ne joue pas sur les navigations internes,
 * déjà gérées par la modale de confirmation des éditeurs.
 */
export function useUnsavedChangesWarning(hasUnsavedChanges) {
  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;
    const onBeforeUnload = (event) => {
      event.preventDefault();
      // Requis par certains navigateurs pour afficher la confirmation.
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChanges]);
}
