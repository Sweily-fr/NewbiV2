"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";

/**
 * Composant pour rediriger automatiquement vers la page parent
 * quand une ressource n'existe pas (typiquement après un changement d'organisation)
 *
 * Exemples:
 * - /dashboard/outils/kanban/68e14533909f470e40a49754 → /dashboard/outils/kanban
 * - /dashboard/outils/factures/123/editer → /dashboard/outils/factures
 * - /dashboard/outils/devis/456 → /dashboard/outils/devis
 */
export function ResourceNotFound({ listUrl, homeUrl = "/dashboard" }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Si une URL de liste est fournie, l'utiliser
    if (listUrl) {
      console.log("🔄 Redirection vers:", listUrl);
      router.replace(listUrl);
      return;
    }

    // Sinon, extraire la page parent depuis l'URL actuelle
    // Exemple: /dashboard/outils/kanban/68e14533909f470e40a49754 → /dashboard/outils/kanban
    const pathSegments = pathname.split("/").filter(Boolean);

    if (pathSegments.length > 1) {
      // Retirer le dernier segment (l'ID de la ressource)
      pathSegments.pop();

      // Si le dernier segment est "editer", "edit", "new", "nouveau", le retirer aussi
      const lastSegment = pathSegments[pathSegments.length - 1];
      if (
        ["editer", "edit", "new", "nouveau", "view", "voir"].includes(
          lastSegment
        )
      ) {
        pathSegments.pop();
      }

      const parentUrl = "/" + pathSegments.join("/");
      console.log("🔄 Redirection vers la page parent:", parentUrl);
      router.replace(parentUrl);
    } else {
      // Fallback: retour à la page d'accueil
      console.log("🔄 Redirection vers la page d'accueil:", homeUrl);
      router.replace(homeUrl);
    }
  }, [pathname, listUrl, homeUrl, router]);

  // Afficher un loader pendant la redirection
  return (
    <div className="flex items-center justify-center min-h-[90vh]">
      <div className="text-center">
        <LoaderCircle className="h-8 w-8 text-[#5a50ff] mx-auto mb-4 animate-spin" />
        <p className="text-sm text-muted-foreground">Redirection en cours...</p>
      </div>
    </div>
  );
}
