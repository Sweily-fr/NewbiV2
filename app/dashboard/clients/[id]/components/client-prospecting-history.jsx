"use client";

import { useQuery } from "@apollo/client";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useWorkspaceFeatures } from "@/src/hooks/useWorkspaceFeatures";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { GET_CLIENT_PROSPECTING_HISTORY } from "@/src/graphql/prospectingQueries";
import { recipientHistoryLabel } from "@/src/utils/prospecting";
import { RecipientStatusBadge } from "@/app/dashboard/outils/prospection/components/shared";

/**
 * Envois de prospection reçus par le contact. Rien n'est demandé tant que
 * l'espace n'a pas la Prospection ou que le rôle ne permet pas de la voir.
 */
export function useClientProspectingHistory(clientId) {
  const { workspaceId } = useWorkspace();
  const { isEnabled, isReady: featuresReady } = useWorkspaceFeatures();
  const { canRead, isReady: permissionsReady } = useMyPermissions();
  const allowed =
    featuresReady &&
    isEnabled("prospecting") &&
    permissionsReady &&
    canRead("prospecting");
  const { data } = useQuery(GET_CLIENT_PROSPECTING_HISTORY, {
    variables: { workspaceId, clientId },
    skip: !allowed || !workspaceId || !clientId,
    fetchPolicy: "cache-and-network",
    context: { skipErrorToast: true },
  });
  return allowed ? data?.clientProspectingHistory || [] : [];
}

/** Section « Prospection » de la fiche contact : un envoi par ligne. */
export function ClientProspectingHistory({ items }) {
  return (
    <ul className="flex flex-col divide-y divide-[#eeeff1] dark:divide-[#232323]">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-1 py-2.5 first:pt-0">
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-[13px] text-[#242529] dark:text-foreground">
              Message de prospection
            </span>
            <RecipientStatusBadge status={item.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            {recipientHistoryLabel(item)}
          </p>
          <p className="truncate text-xs text-muted-foreground">{item.email}</p>
          {item.error && (
            <p className="text-xs text-red-700 dark:text-red-400">
              {item.error}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
