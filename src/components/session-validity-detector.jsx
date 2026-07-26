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
    let consecutiveNulls = 0;
    let recheckTimeoutId = null;

    const redirect = () => {
      if (redirectingRef.current) return;
      redirectingRef.current = true;
      window.location.href = "/auth/session-expired?reason=revoked";
    };

    const check = async () => {
      if (cancelled || redirectingRef.current) return;
      try {
        // disableCookieCache : interroger la base directement, sinon le
        // cookieCache peut masquer une révocation pendant sa durée de vie.
        const { data, error } = await authClient.getSession({
          query: { disableCookieCache: true },
        });
        if (cancelled) return;
        // Ne rediriger que sur une réponse formelle "pas de session".
        // Une erreur (500, indispo, redirection) est transitoire : on
        // retentera à la prochaine itération plutôt que déconnecter à tort.
        if (!error && !data?.user) {
          // Exiger DEUX réponses vides consécutives avant de rediriger :
          // une seule réponse 200-sans-session peut être un blip transitoire
          // (cookie non joint, instant serverless) et déconnectait à tort.
          consecutiveNulls += 1;
          if (consecutiveNulls >= 2) {
            console.warn(
              "[SessionValidityDetector] Session absente confirmée par 2 vérifications, redirection.",
            );
            redirect();
          } else {
            recheckTimeoutId = setTimeout(check, 3000);
          }
        } else if (data?.user) {
          consecutiveNulls = 0;
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
      if (recheckTimeoutId) clearTimeout(recheckTimeoutId);
      window.removeEventListener("focus", onFocus);
    };
  }, [intervalMs]);

  return null;
}
