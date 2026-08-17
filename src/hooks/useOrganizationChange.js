"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";

/**
 * Hook pour les pages de détail (URL contenant un id de ressource).
 *
 * Un id de ressource appartient à une organisation. Dès que l'utilisateur
 * change d'espace, cet id n'existe plus : il faut quitter la page avant que la
 * moindre requête ne parte avec l'ancien id et la nouvelle organisation, sinon
 * le serveur répond "ressource introuvable" et l'erreur remonte dans
 * l'alerting alors que c'est un cas nominal.
 *
 * Deux signaux, avec deux effets distincts :
 *  1. l'événement `organizationChanged`, émis par les switchers AVANT
 *     `setActive()` : la page gèle son rendu et ses requêtes, mais ne navigue
 *     pas — c'est le switcher qui redirige, une fois le cache Apollo vidé,
 *     pour que la page liste ne se monte pas sur l'ancienne organisation.
 *     `organizationChangeAborted` dégèle si le changement a échoué ;
 *  2. la divergence entre l'organisation active et celle du mount : filet de
 *     sécurité pour les bascules qui ne passent pas par un switcher (refresh
 *     de session). Là, la page redirige elle-même. Le cas du switch depuis un
 *     AUTRE onglet est couvert en amont par OrgChangeCrossTabDetector (layout
 *     dashboard), qui réagit à l'événement `storage` avant que ce filet ne
 *     voie la divergence.
 *
 * `resourceExists`, passé par certains appelants, n'est pas utilisé : la sortie
 * ne dépend que du changement d'espace.
 */
export function useOrganizationChange({ resourceId, listUrl, enabled = true }) {
  const router = useRouter();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const organizationId = activeOrganization?.id;

  // Organisation verrouillée au premier render utile : c'est celle à laquelle
  // appartient l'id présent dans l'URL.
  const mountedOrgIdRef = useRef(null);
  if (organizationId && !mountedOrgIdRef.current) {
    mountedOrgIdRef.current = organizationId;
  }

  const [switchAnnounced, setSwitchAnnounced] = useState(false);

  const isActive = enabled && !!resourceId;
  const hasDivergedFromMount =
    !!organizationId &&
    !!mountedOrgIdRef.current &&
    organizationId !== mountedOrgIdRef.current;

  // Vrai dès l'annonce : la page doit cesser de rendre et de requêter.
  const hasChangedOrganization =
    isActive && (switchAnnounced || hasDivergedFromMount);

  const handleAnnounce = useCallback(() => setSwitchAnnounced(true), []);
  const handleAbort = useCallback(() => setSwitchAnnounced(false), []);

  useEffect(() => {
    if (!isActive) return;
    window.addEventListener("organizationChanged", handleAnnounce);
    window.addEventListener("organizationChangeAborted", handleAbort);
    return () => {
      window.removeEventListener("organizationChanged", handleAnnounce);
      window.removeEventListener("organizationChangeAborted", handleAbort);
    };
  }, [isActive, handleAnnounce, handleAbort]);

  // Redirection seulement sur divergence réelle : sur simple annonce, c'est le
  // switcher qui navigue après avoir vidé le cache Apollo.
  useEffect(() => {
    if (isActive && hasDivergedFromMount && listUrl) {
      router.replace(listUrl);
    }
  }, [isActive, hasDivergedFromMount, listUrl, router]);

  return {
    hasChangedOrganization,
    currentOrganizationId: organizationId,
    previousOrganizationId: mountedOrgIdRef.current,
  };
}
