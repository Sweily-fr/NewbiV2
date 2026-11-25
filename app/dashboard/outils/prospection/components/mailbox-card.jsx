"use client";

import {
  Inbox,
  Info,
  Loader2,
  PauseCircle,
  Settings2,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useMailboxConnect } from "@/src/hooks/useProspecting";
import { cn } from "@/src/lib/utils";
import {
  formatSendWindow,
  mailboxState,
  providerLabel,
  rampUpHint,
  sentTodayLabel,
} from "@/src/utils/prospecting";
import { formatCount } from "@/src/utils/email-campaigns";
import {
  CARD_CLASS,
  GoogleIcon,
  MailboxStatusBadge,
  MicrosoftIcon,
  Notice,
  ProviderBadge,
} from "./shared";

const PROVIDER_BUTTONS = [
  { provider: "GOOGLE", key: "google", icon: GoogleIcon },
  { provider: "MICROSOFT", key: "microsoft", icon: MicrosoftIcon },
];

/** « Connecter Gmail » / « Connecter Outlook » (désactivé si non configuré). */
function ConnectButton({
  provider,
  icon: Icon,
  available,
  blockedReason,
  connecting,
  onConnect,
  label,
}) {
  const reason =
    blockedReason ||
    (available
      ? null
      : `La connexion ${providerLabel(provider)} n'est pas encore disponible.`);
  return (
    <span title={reason || undefined} className="inline-flex">
      <Button
        variant="outline"
        onClick={() => onConnect(provider)}
        disabled={Boolean(reason) || Boolean(connecting)}
        className="w-full"
      >
        {connecting === provider ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Icon className="size-3.5" />
        )}
        {label || `Connecter ${providerLabel(provider)}`}
      </Button>
    </span>
  );
}

/** Envois du jour sur la limite du jour (montée progressive comprise). */
function TodayMeter({ mailbox }) {
  const limit = mailbox.effectiveDailyLimit || 0;
  const share = limit > 0 ? Math.min(1, (mailbox.sentToday || 0) / limit) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="h-1.5 w-16 overflow-hidden rounded-full bg-[#EEEFF1] dark:bg-white/10"
        role="progressbar"
        aria-label="E-mails envoyés aujourd'hui"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={mailbox.sentToday || 0}
      >
        <div
          className="h-full rounded-full bg-[#5a50ff]"
          style={{ width: `${Math.max(share > 0 ? 4 : 0, share * 100)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {sentTodayLabel(mailbox)}
      </span>
    </div>
  );
}

/**
 * Carte « Boîte d'envoi » : boutons de connexion (Gmail, Outlook), ou la
 * boîte du membre (adresse, statut, envois du jour, rythme, « Réglages »),
 * bandeau pour la reconnecter si l'accès a expiré, conseil d'adresse pro.
 */
export function MailboxCard({
  settings,
  loading,
  access,
  onOpenSettings,
  className,
}) {
  const { connect, connecting } = useMailboxConnect();
  const mailbox = settings?.myMailbox || null;
  const state = mailboxState(mailbox);
  const providers = settings?.providers || {};
  const blockedReason = access.readOnly
    ? access.readOnlyReason
    : access.canCreate
      ? null
      : "Votre rôle ne permet pas de connecter une boîte d'envoi.";
  const ramp = mailbox
    ? rampUpHint(mailbox.connectedAt, mailbox.dailyLimit)
    : null;
  const team = (settings?.mailboxes || []).filter(
    (item) => !item.isMine && item.status !== "DISCONNECTED",
  );

  if (!settings && loading) {
    return (
      <div
        className={cn(
          CARD_CLASS,
          "flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5",
          className,
        )}
      >
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-56 max-w-full" />
          <Skeleton className="h-3 w-80 max-w-full" />
        </div>
        <Skeleton className="h-8 w-28 rounded-[9px]" />
      </div>
    );
  }

  return (
    <section
      aria-labelledby="boite-envoi-title"
      className={cn(CARD_CLASS, "flex flex-col gap-4 p-4 sm:p-5", className)}
    >
      {state === "none" ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#8b7fff]/15 dark:text-[#b5adff]">
              <Inbox className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2
                id="boite-envoi-title"
                className="text-[15px] leading-6 font-medium"
              >
                Boîte d&apos;envoi
              </h2>
              <p className="mt-0.5 max-w-xl text-sm leading-5 text-muted-foreground">
                Connectez la boîte mail d&apos;où partiront vos messages : vos
                prospects vous répondent directement. Newbi demande seulement le
                droit d&apos;envoyer, jamais celui de lire vos e-mails.
              </p>
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            {PROVIDER_BUTTONS.map(({ provider, key, icon }) => (
              <ConnectButton
                key={provider}
                provider={provider}
                icon={icon}
                available={Boolean(providers[key])}
                blockedReason={blockedReason}
                connecting={connecting}
                onConnect={connect}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <ProviderBadge provider={mailbox.provider} />
              <div className="flex min-w-0 flex-col gap-1">
                <h2 id="boite-envoi-title" className="sr-only">
                  Boîte d&apos;envoi
                </h2>
                <p className="text-xs text-muted-foreground">
                  Boîte d&apos;envoi · {providerLabel(mailbox.provider)}
                </p>
                <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="min-w-0 text-[15px] leading-6 font-medium [overflow-wrap:anywhere]">
                    {mailbox.accountEmail}
                  </span>
                  <MailboxStatusBadge status={mailbox.status} />
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  {formatCount(mailbox.dailyLimit)} e-mails par jour au plus ·{" "}
                  {formatSendWindow(mailbox.sendWindow)}
                </p>
                {state === "active" && (
                  <div className="mt-1">
                    <TodayMeter mailbox={mailbox} />
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={onOpenSettings}
              className="shrink-0 self-start"
            >
              <Settings2 className="size-3.5" aria-hidden />
              Réglages
            </Button>
          </div>

          {state === "expired" && (
            <Notice
              tone="danger"
              icon={TriangleAlert}
              title="Reconnectez votre boîte"
              action={
                <ConnectButton
                  provider={mailbox.provider}
                  icon={
                    mailbox.provider === "MICROSOFT"
                      ? MicrosoftIcon
                      : GoogleIcon
                  }
                  available={Boolean(
                    providers[
                      mailbox.provider === "MICROSOFT" ? "microsoft" : "google"
                    ],
                  )}
                  blockedReason={blockedReason}
                  connecting={connecting}
                  onConnect={connect}
                  label="Reconnecter"
                />
              }
            >
              L&apos;accès de Newbi à {mailbox.accountEmail} a expiré ou a été
              retiré. Vos prospections en cours attendent la reconnexion.
            </Notice>
          )}

          {state === "paused" && (
            <Notice tone="warning" icon={PauseCircle} title="Envois suspendus">
              {`${mailbox.pausedReason ? `${mailbox.pausedReason} ` : ""}Pour reprendre, ouvrez une prospection en pause puis cliquez sur «\u00a0Reprendre\u00a0».`}
            </Notice>
          )}

          {state === "active" && ramp && (
            <p className="text-xs leading-5 text-muted-foreground">
              {ramp} Une boîte qui démarre en douceur reste mieux vue des
              messageries.
            </p>
          )}

          {mailbox.isPersonalAddress && (
            <Notice tone="info" icon={Info}>
              Conseil : une adresse à votre nom de domaine
              (vous@votre-entreprise.fr) inspire plus confiance et arrive plus
              souvent en boîte de réception qu&apos;une adresse gratuite.
            </Notice>
          )}
        </>
      )}

      {team.length > 0 && (
        <p className="border-t border-[#EEEFF1] pt-3 text-xs leading-5 text-muted-foreground dark:border-[#232323]">
          Aussi connectées dans l&apos;espace :{" "}
          {team
            .map((item) =>
              item.ownerName
                ? `${item.accountEmail} (${item.ownerName})`
                : item.accountEmail,
            )
            .join(", ")}
          . Chaque membre lance ses prospections depuis sa propre boîte.
        </p>
      )}
    </section>
  );
}
