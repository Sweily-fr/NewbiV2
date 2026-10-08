"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_ORGANIZATION_ROLES } from "@/src/graphql/organizationRoleQueries";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import {
  DEFAULT_INVITE_ROLE,
  PREDEFINED_ROLE_LABELS,
} from "@/src/lib/role-labels";

export { PREDEFINED_ROLE_LABELS, DEFAULT_INVITE_ROLE };

const ROLE_BADGE_STYLES = {
  owner: "bg-green-50 border-green-200 text-green-600",
  admin: "bg-blue-100 border-blue-300 text-blue-800",
  member: "bg-gray-100 border-gray-300 text-gray-800",
  viewer: "bg-orange-100 border-orange-300 text-orange-800",
  accountant: "bg-purple-100 border-purple-300 text-purple-800",
  custom: "bg-[#5b4fff]/10 border-[#5b4fff]/30 text-[#5b4fff]",
};

export function roleBadgeStyle(role) {
  const key = String(role || "").toLowerCase();
  return `${ROLE_BADGE_STYLES[key] || ROLE_BADGE_STYLES.custom} font-normal`;
}

/**
 * Rôles d'un espace (prédéfinis + personnalisés). Par défaut l'espace actif ;
 * un autre espace dont l'utilisateur est membre peut être visé (l'API
 * vérifie l'appartenance), sans passer par le cache partagé.
 */
export function useOrganizationRoles(
  organizationId = null,
  { skip = false } = {},
) {
  const { workspaceId } = useWorkspace();
  const targetId = organizationId || workspaceId;
  const isActiveOrg = !organizationId || organizationId === workspaceId;

  const { data, loading, error, refetch } = useQuery(GET_ORGANIZATION_ROLES, {
    skip: skip || !targetId,
    fetchPolicy: isActiveOrg ? "cache-and-network" : "no-cache",
    context: isActiveOrg
      ? undefined
      : { headers: { "x-organization-id": targetId } },
  });

  const roles = useMemo(() => data?.organizationRoles || [], [data]);

  const getRoleLabel = useCallback(
    (role) => {
      const keys = String(role || "")
        .split(",")
        .map((r) => r.trim().toLowerCase())
        .filter(Boolean);
      if (!keys.length) return "";
      return keys
        .map(
          (key) =>
            roles.find((r) => r.key === key)?.name ||
            PREDEFINED_ROLE_LABELS[key] ||
            "Rôle supprimé",
        )
        .join(", ");
    },
    [roles],
  );

  return { roles, loading: loading && !data, error, refetch, getRoleLabel };
}
