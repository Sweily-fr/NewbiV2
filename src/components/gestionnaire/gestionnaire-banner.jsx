"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Briefcase } from "lucide-react";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { useAccountManager } from "@/src/hooks/useAccountManager";
import {
  GESTIONNAIRE_PATH,
  isGestionnairePath,
} from "@/src/lib/gestionnaire-paths";

/**
 * Bandeau du tableau de bord, dans le dossier d'un client d'un gestionnaire :
 * rappelle qu'on agit pour le compte du cabinet et ramène à l'espace
 * gestionnaire. Rien ailleurs (le menu et l'en-tête donnent déjà l'accès).
 */
export function GestionnaireBanner() {
  const pathname = usePathname();
  const { organization } = useActiveOrganization();
  const manager = useAccountManager();

  if (!manager?.isManager || isGestionnairePath(pathname)) return null;
  if (
    !organization?.id ||
    !manager.managedOrganizationIds?.includes(organization.id)
  ) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#5a50ff]/15 bg-[#5a50ff]/[0.06] px-4 py-2 text-[13px] lg:px-6">
      <Briefcase className="size-4 shrink-0 text-[#5a50ff]" />
      <span className="min-w-0 flex-1">
        Vous êtes dans l&apos;espace de{" "}
        <span className="font-medium">{organization.name}</span>, en tant que{" "}
        <span className="font-medium">{manager.name}</span> (droits Comptable).
      </span>
      <Link
        href={GESTIONNAIRE_PATH}
        className="inline-flex items-center gap-1 font-medium text-[#5a50ff] hover:underline underline-offset-4"
      >
        <ArrowLeft className="size-3.5" />
        Retour à l&apos;espace gestionnaire
      </Link>
    </div>
  );
}
