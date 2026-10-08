"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getOrganizationIdForApollo } from "@/src/lib/apolloClient";
import { toast } from "@/src/components/ui/sonner";
import {
  consumeWorkspaceSwitchToast,
  reloadIntoWorkspace,
} from "@/src/utils/orgRedirect";

/**
 * Détecte un changement d'organisation effectué dans UN AUTRE onglet.
 *
 * La session Better Auth est partagée entre les onglets : l'espace actif est
 * celui du dernier setActive(), quel que soit l'onglet. Mais chaque onglet
 * garde en mémoire l'espace qu'il affiche (store Better Auth, en-tête
 * x-organization-id, variables des requêtes) et Better Auth ne prévient pas
 * les autres onglets d'un setActive(). Un onglet resté sur l'ancien espace
 * finit donc par mélanger les deux : données d'un espace, requêtes vers
 * l'autre, « Ressource introuvable » sur les pages de détail.
 *
 * Signal : l'événement `storage`, émis quand le sélecteur de l'autre onglet
 * écrit `active_organization_id` (juste après un setActive réussi). L'onglet
 * se recharge alors sur le nouvel espace (la liste s'il était sur une page de
 * détail) : tout de suite s'il est visible, sinon quand l'utilisateur y
 * revient.
 *
 * Monté une fois dans le layout du dashboard, il affiche aussi le toast laissé
 * par reloadIntoWorkspace avant le rechargement.
 */
export function OrgChangeCrossTabDetector() {
  const pathname = usePathname();

  // Le listener est monté une fois pour toute la durée de vie du layout :
  // le pathname est lu via une ref pour recharger depuis la page courante
  // au moment du rechargement, pas celle du montage.
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  // Toast du changement d'espace qui vient de recharger la page. Différé
  // d'un tick : le Toaster (layout racine) s'abonne après ce composant, un
  // toast émis au montage serait perdu.
  useEffect(() => {
    const pending = consumeWorkspaceSwitchToast();
    if (!pending?.message) return;
    const timer = setTimeout(() => {
      const show = toast[pending.type] || toast.success;
      show(pending.message);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let reloadPending = false;

    const reload = () => {
      reloadIntoWorkspace(pathnameRef.current, {
        type: "info",
        message: "L'espace a été changé dans un autre onglet",
      });
    };

    const handleStorage = (event) => {
      if (event.key !== "active_organization_id") return;
      // Suppression de la clé = logout (géré par SessionValidityDetector) ;
      // première écriture (oldValue null) = initialisation de session, pas
      // un changement d'espace.
      if (!event.newValue || !event.oldValue) return;
      if (event.newValue === event.oldValue) return;

      // Retour vers l'espace que cet onglet affiche déjà (aller-retour dans
      // l'autre onglet) : plus rien à recharger.
      if (event.newValue === getOrganizationIdForApollo()) {
        reloadPending = false;
        return;
      }

      if (document.visibilityState === "visible") {
        reload();
      } else {
        reloadPending = true;
      }
    };

    const handleVisibilityChange = () => {
      if (reloadPending && document.visibilityState === "visible") {
        reloadPending = false;
        reload();
      }
    };

    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
