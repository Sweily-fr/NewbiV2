"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { GET_ROLE_CATALOG } from "@/src/graphql/organizationRoleQueries";
import {
  getFullOrganizationCached,
  peekFullOrganization,
} from "@/src/lib/full-organization-cache";
import { pathForModule } from "@/src/lib/route-modules";

// Super admin de l'espace : la personne qui peut donner l'accès
function findOwner(org) {
  const owner = org?.members?.find((m) =>
    String(m.role || "")
      .split(",")
      .includes("owner"),
  );
  return owner?.user || null;
}

// Guillemets français avec espaces insécables : jamais seuls en bout de ligne
const quote = (text) => `«\u00a0${text}\u00a0»`;

function initials(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}

/**
 * Page affichée quand le rôle ne permet pas d'ouvrir une page (aucun accès),
 * ou d'y créer ou modifier (consultation seulement). Indique quelle page est
 * concernée, avec quel rôle, et qui peut donner l'accès.
 *
 * @param {string} moduleKey - module de la page (grille des rôles)
 * @param {"view"|"create"|"edit"} action - action refusée
 * @param {boolean} canView - le rôle peut consulter la page
 */
export function AccessDeniedPage({ moduleKey, action, canView }) {
  const router = useRouter();
  const { roleName } = useMyPermissions();
  const { workspaceId, organization } = useWorkspace();
  const { data } = useQuery(GET_ROLE_CATALOG, { fetchPolicy: "cache-first" });

  const [owner, setOwner] = useState(() =>
    findOwner(peekFullOrganization(workspaceId)?.org),
  );
  useEffect(() => {
    let active = true;
    getFullOrganizationCached(workspaceId).then((org) => {
      if (active) setOwner(findOwner(org));
    });
    return () => {
      active = false;
    };
  }, [workspaceId]);

  const pageLabel =
    data?.roleCatalog?.modules?.find((m) => m.key === moduleKey)?.label ||
    "cette page";
  const listPath = pathForModule(moduleKey);
  const viewOnly = canView && action !== "view";

  const title = viewOnly
    ? action === "create"
      ? "Création non autorisée"
      : "Modification non autorisée"
    : "Cette page ne fait pas partie de votre rôle";
  const description = viewOnly
    ? `Votre rôle${roleName ? ` ${quote(roleName)}` : ""} permet de consulter ${quote(pageLabel)}, mais pas ${
        action === "create"
          ? "d'y créer de nouveaux éléments"
          : "de les modifier"
      }.`
    : `Votre rôle${roleName ? ` ${quote(roleName)}` : ""} ne donne pas accès à ${quote(pageLabel)}.`;

  const workspaceName = organization?.name
    ? ` dans l'espace ${organization.name}`
    : "";
  const mailto = owner?.email
    ? `mailto:${owner.email}?subject=${encodeURIComponent(
        `Accès à ${quote(pageLabel)} sur Newbi`,
      )}&body=${encodeURIComponent(
        `Bonjour,\n\nPourriez-vous m'ouvrir l'accès à ${quote(pageLabel)}${workspaceName} sur Newbi ?\n\nMerci !`,
      )}`
    : null;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 sm:py-24">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        {/* Illustration : cadenas dans des halos concentriques */}
        <div className="relative mb-8 flex size-28 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#5b4fff]/[0.04] ring-1 ring-[#5b4fff]/10" />
          <div className="absolute inset-4 rounded-full bg-[#5b4fff]/[0.06] ring-1 ring-[#5b4fff]/15" />
          <div className="relative flex size-14 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-[#5b4fff]/25">
            <LockKeyhole
              className="size-6 text-[#5b4fff] dark:text-[#8b85ff]"
              strokeWidth={1.75}
            />
          </div>
        </div>

        <span className="mb-3 inline-flex items-center rounded-full border border-[#5b4fff]/20 bg-[#5b4fff]/5 px-2.5 py-0.5 text-xs font-medium text-[#5b4fff] dark:text-[#8b85ff]">
          {viewOnly ? "Consultation seulement" : "Accès restreint"}
        </span>
        <h1 className="text-xl font-medium tracking-tight text-balance">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground text-balance">
          {description}
        </p>

        {/* Qui peut ouvrir l'accès */}
        <div className="mt-8 w-full rounded-xl border bg-muted/30 p-4 text-left">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Qui peut vous donner accès ?
          </p>
          {owner ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage
                  src={owner.image}
                  alt={owner.name || owner.email}
                />
                <AvatarFallback className="bg-[#5b4fff]/10 text-xs text-[#5b4fff] dark:text-[#8b85ff]">
                  {initials(owner.name || owner.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {owner.name || owner.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Super admin de l'espace
                </p>
              </div>
              {mailto && (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full cursor-pointer gap-1.5 sm:w-auto sm:shrink-0"
                >
                  <a href={mailto}>
                    <Mail className="size-3.5" />
                    Demander l'accès
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Le super admin de l'espace peut modifier les droits de votre rôle
              dans Paramètres, Membres, Rôles.
            </p>
          )}
        </div>

        <div className="mt-6 flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="ghost"
            className="cursor-pointer gap-1.5"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
            Page précédente
          </Button>
          {viewOnly && listPath ? (
            <Button asChild variant="primary" className="cursor-pointer">
              <Link href={listPath}>Revenir à {quote(pageLabel)}</Link>
            </Button>
          ) : (
            <Button asChild variant="primary" className="cursor-pointer">
              <Link href="/dashboard">Retour à l'accueil</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
