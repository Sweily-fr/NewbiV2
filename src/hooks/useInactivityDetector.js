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
 * @param {string|Date} options.sessionCreatedAt - Date de création de la session
 *   Better Auth. Sert de plancher au timestamp d'activité : un timestamp
 *   resté en localStorage après un logout ne peut pas déconnecter une
 *   session fraîchement créée.
 * @param {boolean} options.enabled - Activer/désactiver la détection (default: true)
 */
export function useInactivityDetector({
  timeoutHours = 12,
  sessionCreatedAt = null,
  enabled = true,
} = {}) {
  const timerRef = useRef(null);
  const isLoggingOutRef = useRef(false);

  const timeoutMs = timeoutHours * 60 * 60 * 1000;
  const sessionCreatedAtMs = sessionCreatedAt
    ? new Date(sessionCreatedAt).getTime()
    : 0;

  // Dernier timestamp d'activité connu (partagé entre onglets), avec la
  // création de session comme plancher. Retourne 0 si aucun timestamp.
  const readLastActivityMs = useCallback(() => {
    try {
      const stored = parseInt(
        localStorage.getItem(LAST_ACTIVITY_KEY) || "0",
        10,
      );
      if (stored > 0) return Math.max(stored, sessionCreatedAtMs);
    } catch {}
    return 0;
  }, [sessionCreatedAtMs]);

  const handleLogout = useCallback(
    async (source = "timer") => {
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;

      // Breadcrumb de diagnostic : survit à la redirection via localStorage.
      // À lire après coup avec :
      //   localStorage.getItem("newbi_last_inactivity_logout")
      try {
        const lastActivity = readLastActivityMs();
        const details = {
          at: new Date().toISOString(),
          source,
          timeoutHours,
          elapsedMinutes:
            lastActivity > 0
              ? Math.round((Date.now() - lastActivity) / 60000)
              : null,
          lastActivity:
            lastActivity > 0 ? new Date(lastActivity).toISOString() : null,
          sessionCreatedAt: sessionCreatedAtMs
            ? new Date(sessionCreatedAtMs).toISOString()
            : null,
        };
        console.warn("[InactivityDetector] Déconnexion inactivité:", details);
        localStorage.setItem(
          "newbi_last_inactivity_logout",
          JSON.stringify(details),
        );
      } catch {}

      await performLogout({
        redirectTo: "/auth/session-expired?reason=inactivity",
      });
    },
    [readLastActivityMs, timeoutHours, sessionCreatedAtMs],
  );

  const resetTimer = useCallback(() => {
    if (!enabled || isLoggingOutRef.current) return;

    // Un setTimeout ne compte pas le temps de veille de la machine et peut
    // être fortement throttlé dans un onglet caché. Si le timeout est déjà
    // dépassé au moment où l'activité reprend, on déconnecte au lieu de
    // repartir pour un cycle complet (sinon le premier mouvement de souris
    // au réveil annule la déconnexion attendue).
    const lastActivity = readLastActivityMs();
    if (lastActivity > 0 && Date.now() - lastActivity >= timeoutMs) {
      handleLogout("activity-after-timeout");
      return;
    }

    // Mettre à jour le timestamp d'activité (sync cross-tab)
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } catch {}

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => handleLogout("timer"), timeoutMs);
  }, [enabled, timeoutMs, handleLogout, readLastActivityMs]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // Reprendre le décompte là où il en était : si l'app a été fermée puis
    // rouverte, le timestamp en localStorage permet de détecter une
    // inactivité qui a dépassé le timeout pendant la fermeture (avant ce
    // check, le timestamp était écrasé au mount et le timeout ne
    // s'appliquait jamais après réouverture). La date de création de la
    // session sert de plancher pour ne pas déconnecter un login tout frais
    // sur la base d'un timestamp d'une session précédente.
    let initialDelay = timeoutMs;
    const lastActivityAtMount = readLastActivityMs();
    if (lastActivityAtMount > 0) {
      const elapsed = Date.now() - lastActivityAtMount;
      if (elapsed >= timeoutMs) {
        handleLogout("mount-check");
        return;
      }
      initialDelay = timeoutMs - elapsed;
    } else {
      // Pas de timestamp (premier lancement ou storage nettoyé) : on ne
      // peut rien déduire, on repart de maintenant.
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      } catch {}
    }

    // Démarrer le timer
    timerRef.current = setTimeout(() => handleLogout("timer"), initialDelay);

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
        timerRef.current = setTimeout(() => handleLogout("timer"), timeoutMs);
      }
    };

    window.addEventListener("storage", handleStorage);

    // Vérifier si le timeout est dépassé, sinon recalibrer le timer avec le
    // temps restant réel. Utilisé au retour de visibilité/focus et par le
    // watchdog : c'est l'horloge murale qui fait foi, pas le setTimeout
    // (suspendu pendant la veille machine, throttlé onglet caché).
    const checkExpired = (source) => {
      if (isLoggingOutRef.current) return;
      const lastActivity = readLastActivityMs();
      if (lastActivity <= 0) return;
      const elapsed = Date.now() - lastActivity;
      if (elapsed >= timeoutMs) {
        handleLogout(source);
      } else {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(
          () => handleLogout("timer"),
          timeoutMs - elapsed,
        );
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkExpired("visibility-return");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    // Le focus peut revenir sans changement de visibilité (fenêtre restée
    // affichée pendant qu'une autre app était au premier plan).
    const handleFocus = () => checkExpired("focus-return");
    window.addEventListener("focus", handleFocus);

    // Watchdog : filet de sécurité périodique pour déclencher la déconnexion
    // proche de la durée configurée même sans interaction ni changement de
    // visibilité (ex: timer étiré par une mise en veille, onglet visible).
    const watchdogId = setInterval(() => checkExpired("watchdog"), 30_000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, throttledReset);
      });
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      clearInterval(watchdogId);
    };
  }, [enabled, timeoutMs, readLastActivityMs, handleLogout, resetTimer]);
}
