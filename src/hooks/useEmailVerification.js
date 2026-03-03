"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/src/lib/auth-client";

// Singleton : un seul polling partagé entre tous les consommateurs
let _listeners = new Set();
let _interval = null;
let _lastVerified = true;

async function _pollSession() {
  try {
    const { data: session } = await authClient.getSession();
    const verified = session?.user?.emailVerified ?? true;
    if (verified !== _lastVerified) {
      _lastVerified = verified;
      _listeners.forEach((fn) => fn(verified));
    }
  } catch {
    // Silencieux en cas d'erreur réseau
  }
}

function _subscribe(listener) {
  _listeners.add(listener);
  // Premier appel immédiat
  _pollSession();
  // Démarrer le polling s'il n'est pas déjà actif
  if (!_interval) {
    _interval = setInterval(_pollSession, 30000);
  }
  return () => {
    _listeners.delete(listener);
    if (_listeners.size === 0 && _interval) {
      clearInterval(_interval);
      _interval = null;
    }
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
