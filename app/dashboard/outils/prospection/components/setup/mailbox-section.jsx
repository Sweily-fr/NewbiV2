"use client";

import Link from "next/link";
import { Settings2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { SetupSection } from "@/app/dashboard/outils/campagnes-email/components/setup/setup-section";
import { formatCount } from "@/src/utils/email-campaigns";
import {
  PROSPECTING_URL,
  formatSendWindow,
  mailboxState,
} from "@/src/utils/prospecting";
import { MailboxStatusBadge } from "../shared";

/**
 * Étape « Boîte d'envoi » : la boîte d'où part la prospection (celle du
 * membre qui l'a créée), son rythme et l'accès à ses réglages.
 */
export function MailboxSection({ mailbox, complete, onOpenSettings }) {
  const state = mailboxState(mailbox);
  const summary =
    state === "none" ? (
      <span className="text-amber-700 dark:text-amber-400">
        Aucune boîte connectée.{" "}
        <Link
          href={PROSPECTING_URL}
          className="font-medium text-[#5a50ff] hover:underline dark:text-[#8b7fff]"
        >
          Connecter une boîte
        </Link>
      </span>
    ) : (
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 font-medium text-foreground [overflow-wrap:anywhere]">
            {mailbox.accountEmail}
          </span>
          {state !== "active" && <MailboxStatusBadge status={mailbox.status} />}
        </span>
        <span>
          {formatCount(mailbox.dailyLimit)} e-mails par jour au plus ·{" "}
          {formatSendWindow(mailbox.sendWindow)}
        </span>
        {!mailbox.isMine && mailbox.ownerName && (
          <span>Boîte de {mailbox.ownerName}</span>
        )}
      </div>
    );

  return (
    <SetupSection
      id="boite"
      step={1}
      title="Boîte d'envoi"
      complete={complete}
      summary={summary}
      aside={
        mailbox?.isMine && state !== "none" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            className="shrink-0"
          >
            <Settings2 className="size-3.5" aria-hidden />
            Réglages
          </Button>
        ) : null
      }
    />
  );
}
