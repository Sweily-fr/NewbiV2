"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase } from "lucide-react";
import { useActiveOrganization } from "@/src/lib/organization-client";

/**
 * Bandeau du tableau de bord pour les comptes gestionnaires.
 * - Dans le dossier d'un client : rappelle qu'on agit pour le compte du
 *   cabinet, avec le retour à l'espace gestionnaire.
 * - Ailleurs (espace propre du cabinet) : simple accès à l'espace.
 * Rien pour les autres utilisateurs.
 */
export function GestionnaireBanner() {
  const { organization } = useActiveOrganization();
  const [me, setMe] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/gestionnaire/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!me?.isManager) return null;

  const inClientFolder =
    organization?.id && me.managedOrganizationIds?.includes(organization.id);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#5a50ff]/15 bg-[#5a50ff]/[0.06] px-4 py-2 text-[13px]">
      <Briefcase className="size-4 shrink-0 text-[#5a50ff]" />
      <span className="min-w-0 flex-1">
        {inClientFolder ? (
          <>
            Dossier de <span className="font-medium">{organization.name}</span>{" "}
            : vous agissez pour le compte de{" "}
            <span className="font-medium">{me.name}</span>.
          </>
        ) : (
          <>
            Vous êtes gestionnaire chez{" "}
            <span className="font-medium">{me.name}</span>.
          </>
        )}
      </span>
      <Link
        href="/gestionnaire"
        className="inline-flex items-center gap-1 font-medium text-[#5a50ff] hover:underline underline-offset-4"
      >
        <ArrowLeft className="size-3.5" />
        Espace gestionnaire
      </Link>
    </div>
  );
}
