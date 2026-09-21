"use client";

import { useSession } from "@/src/lib/auth-client";

/**
 * Accès à la fonctionnalité « Bons de livraison » (en cours de déploiement) :
 * réservée pour le moment aux comptes dont l'e-mail se termine par
 * @sweily.fr. À supprimer (ou élargir) au moment de l'ouverture à tous.
 */
export const DELIVERY_NOTES_ALLOWED_DOMAINS = ["sweily.fr"];

// Comptes de test hors domaine, autorisés UNIQUEMENT en développement local
// (jamais en production ni sur les previews Vercel)
export const DELIVERY_NOTES_DEV_ALLOWED_EMAILS = ["dylan.lobjois@outlook.com"];
const IS_DEV = process.env.NODE_ENV === "development";

export function isDeliveryNotesAllowed(email) {
  if (!email) return false;
  const normalized = String(email).trim().toLowerCase();
  if (IS_DEV && DELIVERY_NOTES_DEV_ALLOWED_EMAILS.includes(normalized)) {
    return true;
  }
  const domain = normalized.split("@")[1];
  return DELIVERY_NOTES_ALLOWED_DOMAINS.includes(domain);
}

/**
 * @returns {{ allowed: boolean, loading: boolean }}
 */
export function useDeliveryNotesAccess() {
  const { data: session, isPending } = useSession();
  return {
    allowed: isDeliveryNotesAllowed(session?.user?.email),
    loading: !!isPending,
  };
}
