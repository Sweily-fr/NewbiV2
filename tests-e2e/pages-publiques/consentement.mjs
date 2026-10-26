/**
 * Choix des cookies déjà fait (« Fermer & refuser ») : sans lui, la fenêtre de
 * consentement s'ouvre au-dessus des pages publiques et de la page
 * d'invitation, et masque leurs boutons. Le consentement lui-même n'est pas
 * l'objet de ces tests.
 */
import { BASE_URL, sessionCookie } from "../config.mjs";

export const CONSENTEMENT = {
  origin: BASE_URL,
  localStorage: [
    { name: "cookie_consent", value: JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false }) },
    { name: "cookie_consent_date", value: new Date().toISOString() },
  ],
};

/** Visiteur sans session, choix des cookies déjà fait. */
export const visiteur = () => ({ cookies: [], origins: [CONSENTEMENT] });

/** Session d'un compte de test, choix des cookies déjà fait. */
export const connecteAvecConsentement = (token) => ({ cookies: [sessionCookie(token)], origins: [CONSENTEMENT] });
