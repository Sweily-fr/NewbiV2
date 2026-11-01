"use client";

import { usePathname } from "next/navigation";
import { AccessDeniedPage } from "@/src/components/rbac/AccessDeniedPage";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import {
  isHiddenForRole,
  actionForPath,
  moduleForPath,
} from "@/src/lib/route-modules";

/**
 * Garde des pages du tableau de bord selon le rôle (Paramètres > Membres >
 * Rôles) : « Voir » pour une page, « Créer » pour une création, « Modifier »
 * pour une édition. Pendant le chargement de la grille, rien n'est monté :
 * une page hors du rôle lançait ses requêtes (refusées par l'API, erreurs
 * en console) avant d'être remplacée par le refus. En cas d'erreur réseau,
 * la page s'affiche : l'API refuse de toute façon les données interdites.
 */
export function ModuleRouteGuard({ children }) {
  const pathname = usePathname();
  const { canDo, isReady, loading, role, actions } = useMyPermissions();
  const moduleKey = moduleForPath(pathname);

  if (!moduleKey) return children;
  if (!isReady) return loading ? null : children;

  const action = actionForPath(pathname);
  const hidden = isHiddenForRole(role, actions, moduleKey, { page: true });
  if (canDo(moduleKey, action) && !hidden) return children;

  const canView = !hidden && canDo(moduleKey, "view");
  return (
    <AccessDeniedPage moduleKey={moduleKey} action={action} canView={canView} />
  );
}
