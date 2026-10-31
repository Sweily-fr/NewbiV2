"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  captureAttributionFromLocation,
  rememberLastPage,
} from "@/src/lib/attribution";

// Monté une fois dans le layout racine : lit la provenance de la visite
// (gclid/UTM, site d'origine, page d'arrivée) et la persiste (voir
// src/lib/attribution.js pour la règle de consentement).
// Ré-exécuté quand l'utilisateur accepte les cookies, pour rattraper le gclid
// si la bannière a été acceptée sur la page d'arrivée elle-même.
export default function AttributionCapture() {
  const pathname = usePathname();

  // Déclaré avant le suivi de page : au premier rendu, la capture doit créer
  // l'enregistrement avant que la dernière page y soit notée.
  useEffect(() => {
    captureAttributionFromLocation();
    const onConsent = () => captureAttributionFromLocation();
    window.addEventListener("cookieConsentUpdated", onConsent);
    return () => window.removeEventListener("cookieConsentUpdated", onConsent);
  }, []);

  useEffect(() => {
    rememberLastPage(pathname);
  }, [pathname]);

  return null;
}
