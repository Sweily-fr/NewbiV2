"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import {
  isHiddenForRole,
  levelForPath,
  moduleForPath,
} from "@/src/lib/route-modules";

/**
 * Garde des pages du tableau de bord selon le rôle (Paramètres > Membres >
 * Rôles) : lecture pour une page, écriture pour une création ou une
 * édition. Tant que la grille n'est pas chargée (ou en cas d'erreur réseau),
 * la page s'affiche : l'API refuse de toute façon les données interdites.
 */
export function ModuleRouteGuard({ children }) {
  const pathname = usePathname();
  const { can, isReady, role, levels } = useMyPermissions();
  const moduleKey = moduleForPath(pathname);

  if (!moduleKey || !isReady) return children;

  const level = levelForPath(pathname);
  const hidden = isHiddenForRole(role, levels, moduleKey, { page: true });
  if (can(moduleKey, level) && !hidden) return children;

  const canRead = !hidden && level === "write" && can(moduleKey, "read");
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
          <Lock className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h1 className="text-base font-medium">Accès non autorisé</h1>
          <p className="text-sm text-muted-foreground">
            {canRead
              ? "Votre rôle permet de consulter cette page, mais pas de créer ni de modifier."
              : "Votre rôle ne donne pas accès à cette page."}{" "}
            Le super admin de l'espace peut modifier vos droits.
          </p>
        </div>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/dashboard">Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  );
}
