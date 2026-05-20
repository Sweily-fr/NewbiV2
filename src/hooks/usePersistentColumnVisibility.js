"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * Persist TanStack Table column visibility in localStorage.
 *
 * Returns [columnVisibility, setColumnVisibility] — wire `setColumnVisibility`
 * to TanStack's `onColumnVisibilityChange` and `columnVisibility` to
 * `state.columnVisibility`. The setter accepts both a value and a TanStack
 * updater function.
 */
export function usePersistentColumnVisibility(
  storageKey,
  defaultVisibility = {},
) {
  const [columnVisibility, setColumnVisibilityState] =
    useState(defaultVisibility);

  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        setColumnVisibilityState((prev) => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.warn(`Erreur lors du chargement de ${storageKey}:`, error);
    }
  }, [storageKey]);

  const setColumnVisibility = useCallback(
    (updaterOrValue) => {
      setColumnVisibilityState((prev) => {
        const next =
          typeof updaterOrValue === "function"
            ? updaterOrValue(prev)
            : updaterOrValue;
        try {
          if (typeof window !== "undefined" && storageKey) {
            window.localStorage.setItem(storageKey, JSON.stringify(next));
          }
        } catch (error) {
          console.warn(`Erreur lors de la sauvegarde de ${storageKey}:`, error);
        }
        return next;
      });
    },
    [storageKey],
  );

  return [columnVisibility, setColumnVisibility];
}
