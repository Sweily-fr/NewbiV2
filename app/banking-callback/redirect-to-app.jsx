"use client";

import { useEffect } from "react";

// Scheme custom de l'app mobile (cf. app-newbi/app.json → expo.scheme).
// Doit correspondre au returnUrl passé à WebBrowser.openAuthSessionAsync côté app.
const APP_DEEP_LINK = "newbi://banking-callback";

/**
 * Rebondit automatiquement vers l'app mobile après le retour de Bridge.
 *
 * Bridge ne sait rediriger que vers une URL https (callback_url whitelisté).
 * Mais ASWebAuthenticationSession (iOS) / Custom Tabs (Android) ne ferment la
 * session d'auth que sur un SCHEME PERSONNALISÉ. On force donc la navigation
 * vers `newbi://banking-callback` : la session se ferme et l'app reprend la main
 * pour déclencher la synchronisation des comptes.
 *
 * Sur un navigateur desktop (app non installée), la navigation échoue
 * silencieusement et l'utilisateur garde l'UI de repli (bouton de téléchargement).
 */
export default function RedirectToApp() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = APP_DEEP_LINK;
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
