"use client";

import { useEffect, useRef, useCallback } from "react";
import { performLogout } from "@/src/lib/auth-client";

// Événements qui indiquent que l'utilisateur est actif
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "pointerdown",
  "wheel",
];

// Clé localStorage pour synchroniser entre onglets
const LAST_ACTIVITY_KEY = "newbi_last_activity";

/**
 * Hook de détection d'inactivité.
 * Track l'activité utilisateur et déclenche un logout automatique
 * après le timeout configuré dans les session settings de l'organisation.
 *
 * @param {Object} options
 * @param {number} options.timeoutHours - Timeout en heures (default: 12)
 * @param {boolean} options.enabled - Activer/désactiver la détection (default: true)
 */
export function useInactivityDetector({
  timeoutHours = 12,
  enabled = true,
} = {}) {
  const timerRef = useRef(null);
  const isLoggingOutRef = useRef(false);

  const timeoutMs = timeoutHours * 60 * 60 * 1000;

  const handleLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    await performLogout({
      redirectTo: "/auth/session-expired?reason=inactivity",
    });
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled || isLoggingOutRef.current) return;

    // Mettre à jour le timestamp d'activité (sync cross-tab)
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } catch {}

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(handleLogout, timeoutMs);
  }, [enabled, timeoutMs, handleLogout]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // Initialiser le timestamp d'activité
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } catch {}

    // Démarrer le timer
    timerRef.current = setTimeout(handleLogout, timeoutMs);

    // Throttle les événements d'activité (1 reset max par 30s)
    let lastReset = Date.now();
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastReset > 30_000) {
        lastReset = now;
        resetTimer();
      }
    };

    // Écouter les événements d'activité
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, throttledReset, { passive: true });
    });

    // Synchronisation cross-tab : vérifier si un autre onglet a été actif
    const handleStorage = (e) => {
      if (e.key === LAST_ACTIVITY_KEY && e.newValue) {
        // Un autre onglet a signalé de l'activité → reset notre timer aussi
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(handleLogout, timeoutMs);
      }
    };

    window.addEventListener("storage", handleStorage);

    // Vérifier au focus si on a dépassé le timeout pendant que l'onglet était inactif
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        try {
          const lastActivity = parseInt(
            localStorage.getItem(LAST_ACTIVITY_KEY) || "0",
            10,
          );
          const elapsed = Date.now() - lastActivity;
          if (elapsed >= timeoutMs) {
            handleLogout();
          } else {
            // Recalibrer le timer avec le temps restant
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(handleLogout, timeoutMs - elapsed);
          }
        } catch {}
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, throttledReset);
      });
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, timeoutMs, handleLogout, resetTimer]);
}
