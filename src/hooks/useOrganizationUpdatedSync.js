"use client";

import { useEffect } from "react";

/**
 * Garde un état local d'organisation aligné sur ce que les modales
 * (CompanyInfoDialog, LegalInfoDialog, BankDetailsDialog, modal de paramètres)
 * viennent d'enregistrer, via l'événement "organizationUpdated".
 *
 * Les éditeurs de documents chargent l'organisation une fois au montage et la
 * vue paramètres est démontée/remontée à chaque ouverture : sans cette
 * synchronisation, une modale rouverte après un enregistrement repart des
 * valeurs périmées (impression de non-enregistrement).
 *
 * @param {Function} setOrganization - setter d'état React de l'organisation
 */
export function useOrganizationUpdatedSync(setOrganization) {
  useEffect(() => {
    const handleOrganizationUpdated = (event) => {
      const { organizationId, ...fields } = event.detail || {};
      // Ne fusionner que si l'organisation est déjà chargée : un objet
      // construit à partir du seul payload serait incomplet.
      setOrganization((prev) => (prev ? { ...prev, ...fields } : prev));
    };

    window.addEventListener("organizationUpdated", handleOrganizationUpdated);
    return () => {
      window.removeEventListener(
        "organizationUpdated",
        handleOrganizationUpdated,
      );
    };
  }, [setOrganization]);
}
