"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  apolloClient,
  setOrganizationIdForApollo,
} from "@/src/lib/apolloClient";
import { stripIdFromPathname } from "@/src/utils/orgRedirect";

/**
 * Détecte un changement d'organisation effectué dans UN AUTRE onglet.
 *
 * La session Better Auth est partagée entre les onglets : quand un onglet
 * appelle setActive(), les requêtes des autres onglets partent aussitôt avec
 * la nouvelle organisation. Un onglet resté sur une page de détail (facture,
 * devis, bon de commande…) requête alors un id qui n'existe plus dans la
 * nouvelle org : le serveur répond "ressource introuvable" et l'erreur part
 * dans l'alerting alors que c'est un cas nominal.
 *
 * Le filet de sécurité de useOrganizationChange (divergence de
 * useActiveOrganization) ne réagit qu'au refetch du store, trop tard : les
 * queries sont déjà parties. Ici on s'appuie sur un signal immédiat, reçu
 * même en arrière-plan : l'événement `storage` déclenché quand le switcher
 * de l'autre onglet écrit `active_organization_id` (juste après un setActive
 * réussi). On rejoue alors le même flux que le switcher local :
 *   1. `organizationChanged` gèle les pages de détail montées ;
 *   2. resynchronisation de l'org id Apollo + vidage du cache ;
 *   3. sortie de la page de détail vers sa liste (stripIdFromPathname),
 *      sinon refresh SSR pour recharger la page sur la nouvelle org.
 */
export function OrgChangeCrossTabDetector() {
  const router = useRouter();
  const pathname = usePathname();

  // Le listener est monté une fois pour toute la durée de vie du layout :
  // le pathname est lu via une ref pour rediriger depuis la page courante
  // au moment de l'événement, pas celle du montage.
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const syncingRef = useRef(false);

  useEffect(() => {
    const handleStorage = async (event) => {
      if (event.key !== "active_organization_id") return;
      // Suppression de la clé = logout (géré par SessionValidityDetector) ;
      // première écriture (oldValue null) = initialisation de session, pas
      // un changement d'espace.
      if (!event.newValue || !event.oldValue) return;
      if (event.newValue === event.oldValue) return;
      if (syncingRef.current) return;
      syncingRef.current = true;

      try {
        window.dispatchEvent(
          new CustomEvent("organizationChanged", {
            detail: {
              previousOrgId: event.oldValue,
              newOrgId: event.newValue,
            },
          }),
        );

        setOrganizationIdForApollo(event.newValue);
        await apolloClient.clearStore();

        const currentPath = pathnameRef.current;
        const safePath = stripIdFromPathname(currentPath);
        if (safePath !== currentPath) {
          router.replace(safePath);
        } else {
          router.refresh();
        }
      } catch (error) {
        console.error(
          "[OrgChangeCrossTabDetector] Erreur de synchronisation:",
          error,
        );
      } finally {
        syncingRef.current = false;
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [router]);

  return null;
}
