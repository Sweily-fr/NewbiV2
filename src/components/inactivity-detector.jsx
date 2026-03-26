"use client";

import { useState, useEffect, useCallback } from "react";
import { useInactivityDetector } from "@/src/hooks/useInactivityDetector";
import { useSession } from "@/src/lib/auth-client";

/**
 * Composant invisible qui détecte l'inactivité utilisateur
 * et déclenche un logout automatique selon les settings de l'organisation.
 * À placer dans le layout dashboard.
 *
 * Écoute l'événement custom "inactivitySettingsChanged" pour se mettre à jour
 * sans reload quand l'utilisateur change le timeout dans les paramètres.
 */
export function InactivityDetector() {
  const { data: session } = useSession();
  const [timeoutHours, setTimeoutHours] = useState(12);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const fetchSettings = useCallback(() => {
    fetch("/api/session-settings", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.inactivityTimeout != null) {
          setTimeoutHours(data.inactivityTimeout);
        }
        setSettingsLoaded(true);
      })
      .catch(() => {
        setSettingsLoaded(true);
      });
  }, []);

  // Charger les settings au mount
  useEffect(() => {
    if (!session?.user) return;
    fetchSettings();
  }, [session?.user, fetchSettings]);

  // Écouter les changements de settings depuis la page sécurité
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.inactivityTimeout != null) {
        setTimeoutHours(e.detail.inactivityTimeout);
      }
    };
    window.addEventListener("inactivitySettingsChanged", handler);
    return () =>
      window.removeEventListener("inactivitySettingsChanged", handler);
  }, []);

  // Activer la détection seulement quand on a une session et les settings
  useInactivityDetector({
    timeoutHours,
    enabled: settingsLoaded && !!session?.user,
  });

  return null;
}
