"use client";

import { useEffect } from "react";
import { captureAttributionFromLocation } from "@/src/lib/attribution";

// Monté une fois dans le layout racine : lit gclid/UTM dans l'URL d'arrivée
// et les persiste (voir src/lib/attribution.js pour la règle de consentement).
// Ré-exécuté quand l'utilisateur accepte les cookies, pour rattraper le gclid
// si la bannière a été acceptée sur la page d'arrivée elle-même.
export default function AttributionCapture() {
  useEffect(() => {
    captureAttributionFromLocation();
    const onConsent = () => captureAttributionFromLocation();
    window.addEventListener("cookieConsentUpdated", onConsent);
    return () => window.removeEventListener("cookieConsentUpdated", onConsent);
  }, []);
  return null;
}
