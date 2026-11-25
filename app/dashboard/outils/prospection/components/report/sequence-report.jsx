"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import {
  CalendarClock,
  CircleSlash,
  Eye,
  FlaskConical,
  Loader2,
  MessageSquareReply,
  Pause,
  PauseCircle,
  Play,
  Send,
  ShieldCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import {
  CANCEL_PROSPECTING_SEQUENCE,
  PAUSE_PROSPECTING_SEQUENCE,
  RESUME_PROSPECTING_SEQUENCE,
} from "@/src/graphql/prospectingQueries";
import {
  formatCount,
  formatDateTime,
  formatPercent,
  plural,
} from "@/src/utils/email-campaigns";
import {
  PROSPECTING_URL,
  estimatedEndLabel,
  formatSendWindow,
  isLive,
  replyRate,
  sequenceProgress,
  unsubscribeRate,
} from "@/src/utils/prospecting";
import { CampaignHeader } from "@/app/dashboard/outils/campagnes-email/components/campaign-header";
import { TextWithVariables } from "@/app/dashboard/outils/campagnes-email/components/setup/subject-section";
import { MessagePreviewDialog } from "../message-preview";
import {
  CARD_CLASS,
  Notice,
  SequenceStatusBadge,
  errorMessage,
  useProspectingAccess,
} from "../shared";
import { RecipientsTable } from "./recipients-table";

/** Indicateur principal : valeur, détail, jauge. */
function KpiTile({
  icon: Icon,
  label,
  value,
  detail,
  ratio,
  accent = "#5a50ff",
}) {
  return (
    <div className={cn(CARD_CLASS, "flex flex-col p-4")}>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </p>
      <p className="mt-2 text-2xl font-medium tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-0.5 min-h-4 text-xs text-muted-foreground">{detail}</p>
      {ratio !== undefined && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#EEEFF1] dark:bg-white/10">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, (ratio || 0) * 100))}%`,
              backgroundColor: accent,
            }}
          />
        </div>
      )}
    </div>
  );
}

function SmallStat({ label, count, warn = false }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-sm font-medium tabular-nums",
          warn && count > 0 && "text-red-700 dark:text-red-400",
        )}
      >
        {formatCount(count)}
      </span>
    </div>
  );
}

/** Raison de la pause, selon son origine. */
function pauseText(sequence) {
  if (sequence.pausedReason) return sequence.pausedReason;
  if (sequence.pauseKind === "MAILBOX")
    return "La boîte d'envoi n'est plus disponible (déconnectée ou accès expiré). Reconnectez-la depuis la page Prospection, puis reprenez.";
  if (sequence.pauseKind === "REPUTATION")
    return "Trop de désinscriptions récentes : les envois de la boîte sont suspendus pour protéger votre adresse.";
  return "Les messages restants partiront à la reprise.";
}

/**
 * Prospection lancée : avancement (relu toutes les 30 s pendant l'envoi),
 * pause et sa raison, indicateurs, destinataires avec « A répondu » et
 * « Ne plus contacter » ; pause, reprise et arrêt pour le propriétaire de
 * la boîte.
 */
export function SequenceReport({ sequence, workspaceId, settings }) {
  const access = useProspectingAccess();
  const canSend = sequence.canSend && !access.readOnly;
  const canMark = (access.canEdit || sequence.canSend) && !access.readOnly;
  const stats = sequence.stats || {};
  const progress = sequenceProgress(stats);
  const active = sequence.status === "ACTIVE";
  const paused = sequence.status === "PAUSED";
  const live = isLive(sequence.status);
  const mailbox = sequence.mailbox;
  const simulated = stats.simulated || 0;
  const replied = stats.replied || 0;
  const unsubscribed = stats.unsubscribed || 0;

  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const options = { errorPolicy: "none" };
  const [pauseSequence, { loading: pausing }] = useMutation(
    PAUSE_PROSPECTING_SEQUENCE,
    options,
  );
  const [resumeSequence, { loading: resuming }] = useMutation(
    RESUME_PROSPECTING_SEQUENCE,
    { ...options, refetchQueries: ["ProspectingSettings"] },
  );
  const [cancelSequence, { loading: canceling }] = useMutation(
    CANCEL_PROSPECTING_SEQUENCE,
    options,
  );

  const run = async (mutate, success, failure) => {
    try {
      await mutate({ variables: { workspaceId, id: sequence.id } });
      if (success) toast.success(success);
      return true;
    } catch (mutationError) {
      toast.error(failure, { description: errorMessage(mutationError) });
      return false;
    }
  };

  const meta = [
    sequence.status === "COMPLETED" &&
      `Terminée le ${formatDateTime(sequence.completedAt || sequence.updatedAt)}`,
    sequence.status === "CANCELED" &&
      `Arrêtée le ${formatDateTime(sequence.completedAt || sequence.updatedAt)}`,
    live &&
      sequence.startedAt &&
      `Lancée le ${formatDateTime(sequence.startedAt)}`,
    mailbox?.accountEmail && `depuis ${mailbox.accountEmail}`,
    plural(stats.recipients || 0, "destinataire"),
  ]
    .filter(Boolean)
    .join(" · ");

  const actions = (
    <>
      <Button variant="outline" onClick={() => setPreviewOpen(true)}>
        <Eye className="size-3.5" aria-hidden />
        Voir le message
      </Button>
      {canSend && active && (
        <Button
          variant="outline"
          onClick={() =>
            run(pauseSequence, "Prospection en pause", "Pause impossible")
          }
          disabled={pausing}
        >
          {pausing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Pause className="size-3.5" aria-hidden />
          )}
          Mettre en pause
        </Button>
      )}
      {canSend && paused && (
        <Button
          variant="primary"
          onClick={() =>
            run(resumeSequence, "Prospection reprise", "Reprise impossible")
          }
          disabled={resuming}
        >
          {resuming ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3.5" aria-hidden />
          )}
          Reprendre
        </Button>
      )}
      {canSend && live && (
        <Button
          variant="ghost"
          onClick={() => setConfirmCancel(true)}
          disabled={canceling}
          className="text-red-600 hover:text-red-700 dark:text-red-400"
        >
          <CircleSlash className="size-3.5" aria-hidden />
          Arrêter
        </Button>
      )}
    </>
  );

  const end = live ? estimatedEndLabel(sequence.estimatedEndDate) : null;

  return (
    <div className="h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] overflow-y-auto">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 pt-4 pb-10 sm:px-6 sm:pt-6">
        <CampaignHeader
          campaign={sequence}
          meta={meta}
          actions={actions}
          backHref={PROSPECTING_URL}
          backLabel="Prospection"
          badge={<SequenceStatusBadge status={sequence.status} />}
        />

        {sequence.subject && (
          <p className="-mt-2 truncate text-sm text-muted-foreground">
            Objet : <TextWithVariables text={sequence.subject} />
          </p>
        )}

        {paused && (
          <Notice
            tone="warning"
            icon={PauseCircle}
            title="Prospection en pause"
          >
            {pauseText(sequence)}
          </Notice>
        )}

        {live && (
          <section
            className={cn(CARD_CLASS, "p-4 sm:p-5")}
            aria-label="Avancement des envois"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {active && (
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5a50ff] opacity-60" />
                      <span className="relative inline-flex size-2 rounded-full bg-[#5a50ff]" />
                    </span>
                  )}
                  {active ? "Envois en cours" : "Envois interrompus"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground tabular-nums">
                    {formatCount(progress.processed)}
                  </span>{" "}
                  sur {formatCount(progress.total)} destinataires traités
                  {progress.pending > 0 && (
                    <> · {formatCount(progress.pending)} en attente</>
                  )}
                </p>
              </div>
              {end && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarClock className="size-3.5" aria-hidden />
                  {end}
                </p>
              )}
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-[#EEEFF1] dark:bg-white/10"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.processed}
              aria-label="Destinataires traités"
            >
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-700",
                  paused ? "bg-amber-500" : "bg-[#5a50ff]",
                )}
                style={{ width: `${Math.max(1, progress.ratio * 100)}%` }}
              />
            </div>
            {active && mailbox && (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Un message toutes les 3 à 8 minutes,{" "}
                {formatSendWindow(mailbox.sendWindow).toLowerCase()},
                jusqu&apos;à{" "}
                {formatCount(mailbox.effectiveDailyLimit || mailbox.dailyLimit)}{" "}
                par jour. Cette page se met à jour toute seule.
              </p>
            )}
          </section>
        )}

        {simulated > 0 && (
          <div className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100">
            <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p className="leading-5">
              <span className="font-medium">
                {plural(simulated, "envoi simulé", "envois simulés")}
              </span>{" "}
              : sur ce serveur de test, ces messages ne sont pas réellement
              partis. Le suivi avance comme pour un vrai envoi.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiTile
            icon={Users}
            label="Destinataires"
            value={formatCount(stats.recipients || 0)}
            detail={
              progress.pending
                ? `${formatCount(progress.pending)} en attente`
                : "Tous traités"
            }
          />
          <KpiTile
            icon={Send}
            label="Messages partis"
            value={formatCount(progress.sent)}
            detail={
              simulated
                ? `dont ${plural(simulated, "simulé", "simulés")}`
                : `${formatPercent(progress.total ? progress.sent / progress.total : 0) || "0 %"} des destinataires`
            }
            ratio={progress.total ? progress.sent / progress.total : 0}
            accent="#10b981"
          />
          <KpiTile
            icon={MessageSquareReply}
            label="Réponses"
            value={formatCount(replied)}
            detail={
              replied
                ? `${formatPercent(replyRate(stats))} des messages partis`
                : "Marquez « A répondu » ci-dessous"
            }
            ratio={replyRate(stats) ?? 0}
          />
          <KpiTile
            icon={UserMinus}
            label="Désinscriptions"
            value={formatCount(unsubscribed)}
            detail={
              unsubscribed
                ? `${formatPercent(unsubscribeRate(stats))} des messages partis`
                : "Aucune pour le moment"
            }
            ratio={unsubscribeRate(stats) ?? 0}
            accent="#f59e0b"
          />
        </div>

        <div
          className={cn(
            CARD_CLASS,
            "grid grid-cols-1 divide-y divide-[#EEEFF1] sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-[#232323]",
          )}
        >
          <SmallStat label="Non envoyés" count={stats.skipped || 0} />
          <SmallStat label="Rejets" count={stats.bounced || 0} warn />
          <SmallStat label="Échecs d'envoi" count={stats.failed || 0} warn />
        </div>

        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Les réponses arrivent dans votre boîte : marquez-les « A répondu »
          pour suivre vos retours. Aucun suivi d&apos;ouverture ni de clic,
          comme le recommande la CNIL.
        </p>

        <RecipientsTable
          workspaceId={workspaceId}
          sequence={sequence}
          canMark={canMark}
          live={active}
        />
      </div>

      <MessagePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        workspaceId={workspaceId}
        sequence={sequence}
        variables={settings?.variables}
      />

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arrêter la prospection ?</AlertDialogTitle>
            <AlertDialogDescription>
              {progress.pending > 0
                ? `Les ${formatCount(progress.pending)} messages en attente ne partiront pas. `
                : ""}
              Ceux déjà envoyés restent dans les boîtes de vos prospects. Cette
              action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuer</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (event) => {
                event.preventDefault();
                const ok = await run(
                  cancelSequence,
                  "Prospection arrêtée",
                  "Arrêt impossible",
                );
                if (ok) setConfirmCancel(false);
              }}
              disabled={canceling}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {canceling ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CircleSlash className="size-3.5" aria-hidden />
              )}
              Arrêter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
