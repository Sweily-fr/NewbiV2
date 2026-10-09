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
 * pour une édition. Tant que la grille n'est pas chargée (ou en cas d'erreur
 * réseau), la page s'affiche : l'API refuse de toute façon les données
 * interdites.
 */
export function ModuleRouteGuard({ children }) {
  const pathname = usePathname();
  const { canDo, isReady, role, levels } = useMyPermissions();
  const moduleKey = moduleForPath(pathname);

  if (!moduleKey || !isReady) return children;

  const action = actionForPath(pathname);
  const hidden = isHiddenForRole(role, levels, moduleKey, { page: true });
  if (canDo(moduleKey, action) && !hidden) return children;

  const canView = !hidden && canDo(moduleKey, "view");
  return (
    <AccessDeniedPage moduleKey={moduleKey} action={action} canView={canView} />
  );
}
