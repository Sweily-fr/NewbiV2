"use client";

/**
 * Accès à la fonctionnalité « Bons de livraison » : ouverte à tous les comptes
 * (elle était réservée aux e-mails @sweily.fr pendant le déploiement).
 *
 * Le hook et la fonction sont conservés pour que les menus, la palette ⌘K, les
 * actions devis/factures et les pages gardent la même interface ; l'accès réel
 * reste contrôlé par les permissions de l'espace de travail (`deliveryNotes`).
 */
export function isDeliveryNotesAllowed() {
  return true;
}

/**
 * @returns {{ allowed: boolean, loading: boolean }}
 */
export function useDeliveryNotesAccess() {
  return { allowed: true, loading: false };
}
