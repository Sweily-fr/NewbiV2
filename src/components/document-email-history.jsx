"use client";

import { useRouter } from "next/navigation";
import { Separator } from "@/src/components/ui/separator";
import { EmailTrackingStatus } from "@/src/components/email-tracking-status";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useDocumentEmailLogs } from "@/src/graphql/documentEmailQueries";
import {
  emailLogTracking,
  formatEmailLogDate,
} from "@/src/utils/document-email-log";

/**
 * Envois par e-mail d'un document (panneau de détail) : chaque envoi avec sa
 * date, son destinataire et son état ; un clic ouvre l'e-mail tel que le
 * client l'a reçu. Rien n'est affiché sans envoi journalisé (envois
 * antérieurs à l'historique compris).
 */
export function DocumentEmailHistory({
  documentType,
  documentId,
  enabled = true,
  onNavigate,
}) {
  const router = useRouter();
  const { workspaceId } = useRequiredWorkspace();
  const { data } = useDocumentEmailLogs({
    workspaceId,
    documentType,
    documentId,
    // Document jamais envoyé : pas de requête
    skip: !enabled,
  });
  const logs = data?.documentEmailLogs || [];

  if (logs.length === 0) return null;

  return (
    <>
      <Separator />
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
          Envois par e-mail
        </p>
        <div className="space-y-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between gap-2 text-sm rounded px-2 py-1.5 -mx-2 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => {
                router.push(`/dashboard/emails-envoyes/${log.id}`);
                onNavigate?.();
              }}
            >
              <span className="min-w-0">
                <span className="block truncate">{log.to}</span>
                <span className="block text-xs text-muted-foreground">
                  {formatEmailLogDate(log.sentAt)}
                </span>
              </span>
              <span className="shrink-0">
                <EmailTrackingStatus emailTracking={emailLogTracking(log)} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
