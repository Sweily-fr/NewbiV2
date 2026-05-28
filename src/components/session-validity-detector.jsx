"use client";

import { useEffect, useRef } from "react";
import { authClient } from "@/src/lib/auth-client";

/**
 * Détecte la révocation distante de la session (limite maxSessions atteinte,
 * déconnexion depuis un autre appareil, etc.) et redirige l'utilisateur vers
 * la page session-expired sans attendre sa prochaine navigation.
 *
 * Polling toutes les 30 secondes + check immédiat au retour de focus sur l'onglet.
 */
export function SessionValidityDetector({ intervalMs = 30000 }) {
  const redirectingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const redirect = () => {
      if (redirectingRef.current) return;
      redirectingRef.current = true;
      window.location.href = "/auth/session-expired?reason=revoked";
    };

    const check = async () => {
      if (cancelled || redirectingRef.current) return;
      try {
        const { data } = await authClient.getSession();
        if (!cancelled && !data?.user) {
          redirect();
        }
      } catch {
        // Erreur réseau : ignorer, on retentera à la prochaine itération.
      }
    };

    const id = setInterval(check, intervalMs);
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [intervalMs]);

  return null;
}
