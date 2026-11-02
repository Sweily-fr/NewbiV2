"use client";

import { useCallback, useEffect, useState } from "react";
import { useApolloClient } from "@apollo/client";

const UNAVAILABLE = { month: false, year: false };

/**
 * Packs de stockage : disponibilité (prix Stripe configurés pour l'intervalle
 * de l'abonnement) et modification du nombre de packs.
 */
export function useStoragePacks(organizationId, { enabled = true } = {}) {
  const client = useApolloClient();
  const [available, setAvailable] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!enabled || !organizationId) return undefined;
    let cancelled = false;
    fetch(
      `/api/billing/storage-packs?organizationId=${encodeURIComponent(organizationId)}`,
      { credentials: "include" },
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        // Réponse illisible ou refusée : packs indisponibles (et non « en
        // attente » pour toujours)
        if (!cancelled) setAvailable(data?.available || UNAVAILABLE);
      })
      .catch(() => {
        if (!cancelled) setAvailable(UNAVAILABLE);
      });
    return () => {
      cancelled = true;
    };
  }, [organizationId, enabled]);

  /** Fixe le nombre total de packs. Lève une Error au message lisible. */
  const setPacks = useCallback(
    async (quantity) => {
      setSaving(true);
      try {
        const response = await fetch("/api/billing/storage-packs", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId, quantity }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            data?.error || "Le stockage n'a pas pu être modifié.",
          );
        }
        await client.refetchQueries({ include: ["GetWorkspaceStorage"] });
        return data;
      } finally {
        setSaving(false);
      }
    },
    [client, organizationId],
  );

  return {
    /** null tant que la réponse n'est pas arrivée */
    isAvailableFor: (interval) =>
      available
        ? Boolean(available[interval === "year" ? "year" : "month"])
        : false,
    loaded: available !== null,
    setPacks,
    saving,
  };
}

/** Ouvre les paramètres sur l'onglet Abonnement (changement d'offre). */
export function openSubscriptionSettings() {
  window.dispatchEvent(
    new CustomEvent("newbi:open-settings", { detail: { tab: "subscription" } }),
  );
}

/** Ouvre les paramètres sur l'onglet Stockage. */
export function openStorageSettings() {
  window.dispatchEvent(
    new CustomEvent("newbi:open-settings", { detail: { tab: "stockage" } }),
  );
}
