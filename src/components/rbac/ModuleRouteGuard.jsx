"use client";

import { notFound, usePathname } from "next/navigation";
import { AccessDeniedPage } from "@/src/components/rbac/AccessDeniedPage";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { useWorkspaceFeatures } from "@/src/hooks/useWorkspaceFeatures";
import {
  isHiddenForRole,
  actionForPath,
  featureForModule,
  moduleForPath,
} from "@/src/lib/route-modules";

/**
 * Garde des pages du tableau de bord selon le rôle (Paramètres > Membres >
 * Rôles) : « Voir » pour une page, « Créer » pour une création, « Modifier »
 * pour une édition. Pendant le chargement de la grille, rien n'est monté :
 * une page hors du rôle lançait ses requêtes (refusées par l'API, erreurs
 * en console) avant d'être remplacée par le refus. En cas d'erreur réseau,
 * la page s'affiche : l'API refuse de toute façon les données interdites.
 *
 * Page en accès anticipé (TVA, prise de rendez-vous) : introuvable pour un
 * espace qui n'y a pas accès, comme si elle n'existait pas encore.
 */
export function ModuleRouteGuard({ children }) {
  const pathname = usePathname();
  const { canDo, isReady, loading, role, actions } = useMyPermissions();
  const { isEnabled, isReady: featuresReady } = useWorkspaceFeatures();
  const moduleKey = moduleForPath(pathname);
  const feature = featureForModule(moduleKey);

  if (!moduleKey) return children;
  if (feature) {
    // Rien de monté avant la réponse : pas de requête refusée par l'API
    if (!featuresReady) return null;
    if (!isEnabled(feature)) notFound();
  }
  if (!isReady) return loading ? null : children;

  const action = actionForPath(pathname);
  const hidden = isHiddenForRole(role, actions, moduleKey, { page: true });
  if (canDo(moduleKey, action) && !hidden) return children;

  const canView = !hidden && canDo(moduleKey, "view");
  return (
    <AccessDeniedPage moduleKey={moduleKey} action={action} canView={canView} />
  );
}
