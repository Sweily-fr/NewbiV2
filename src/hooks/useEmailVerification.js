"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/src/lib/auth-client";

// Singleton : un seul polling partagé entre tous les consommateurs
let _listeners = new Set();
let _interval = null;
let _lastVerified = true;

function _stopPolling() {
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
}

async function _pollSession() {
  // Onglet en arrière-plan : ne pas interroger la session, mais garder un
  // tick pour revérifier quand l'onglet redeviendra visible.
  if (typeof document !== "undefined" && document.hidden) {
    if (!_interval && _listeners.size > 0) {
      _interval = setInterval(_pollSession, 30000);
    }
    return;
  }
  try {
    const { data: session } = await authClient.getSession();
    const verified = session?.user?.emailVerified ?? true;
    if (verified !== _lastVerified) {
      _lastVerified = verified;
      _listeners.forEach((fn) => fn(verified));
    }
    if (verified) {
      // Email vérifié : l'état ne peut plus régresser, inutile de continuer
      // à interroger la session toutes les 30 s.
      _stopPolling();
    } else if (!_interval && _listeners.size > 0) {
      // Email non vérifié : polling jusqu'à vérification
      _interval = setInterval(_pollSession, 30000);
    }
  } catch {
    // Silencieux en cas d'erreur réseau
  }
}

function _subscribe(listener) {
  _listeners.add(listener);
  // Premier appel immédiat ; le polling ne démarre que si l'email n'est pas
  // vérifié (cas minoritaire), au lieu de tourner en permanence pour tous.
  _pollSession();
  return () => {
    _listeners.delete(listener);
    if (_listeners.size === 0) _stopPolling();
  };
}

/**
 * Hook partagé pour le statut de vérification email.
 * Un seul polling actif quel que soit le nombre de composants montés.
 */
export function useEmailVerification() {
  const [isVerified, setIsVerified] = useState(_lastVerified);

  useEffect(() => {
    return _subscribe(setIsVerified);
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    const { data: session } = await authClient.getSession();
    if (session?.user?.email) {
      await authClient.sendVerificationEmail({
        email: session.user.email,
        callbackURL: `${window.location.origin}/api/auth/verify-email`,
      });
    }
  }, []);

  return { isVerified, resendVerificationEmail };
}
