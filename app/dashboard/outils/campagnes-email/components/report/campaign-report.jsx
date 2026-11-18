"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import {
  CircleSlash,
  CopyPlus,
  Eye,
  FlaskConical,
  Loader2,
  MailOpen,
  MousePointerClick,
  Pause,
  Play,
  Send,
  TriangleAlert,
  Users,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
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
  CANCEL_EMAIL_CAMPAIGN,
  DUPLICATE_EMAIL_CAMPAIGN,
  GET_EMAIL_CAMPAIGN_LINK_STATS,
  PAUSE_EMAIL_CAMPAIGN,
  RESUME_EMAIL_CAMPAIGN,
} from "@/src/graphql/emailCampaignQueries";
import {
  campaignRates,
  formatCount,
  formatDateTime,
  formatPercent,
  plural,
  sendProgress,
} from "@/src/utils/email-campaigns";
import { CampaignHeader } from "../campaign-header";
import { PreviewDialog } from "../preview-dialog";
import { TextWithVariables } from "../setup/subject-section";
import {
  CARD_CLASS,
  campaignUrl,
  errorMessage,
  useCampaignAccess,
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

/** Indicateur secondaire (désinscriptions, rejets…). */
function SmallStat({ label, count, rate, warn = false }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-sm tabular-nums",
          warn && count > 0 && "text-red-700 dark:text-red-400",
        )}
      >
        <span className="font-medium">{formatCount(count)}</span>
        {rate !== null && rate !== undefined && (
          <span className="ml-1.5 text-xs text-muted-foreground">
            {formatPercent(rate)}
          </span>
        )}
      </span>
    </div>
  );
}

function LinksCard({ workspaceId, campaignId, live, trackClicks }) {
  const { data, loading } = useQuery(GET_EMAIL_CAMPAIGN_LINK_STATS, {
    variables: { workspaceId, campaignId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    pollInterval: live ? 15000 : 0,
    context: { skipErrorToast: true },
  });
  const links = [...(data?.emailCampaignLinkStats || [])]
    .sort((a, b) => b.uniqueClicks - a.uniqueClicks || b.clicks - a.clicks)
    .slice(0, 6);
  const max = Math.max(1, ...links.map((link) => link.uniqueClicks));

  return (
    <section
      aria-labelledby="liens-title"
      className={cn(CARD_CLASS, "p-4 sm:p-5")}
    >
      <h2 id="liens-title" className="text-[15px] font-medium">
        Liens les plus cliqués
      </h2>
      {!trackClicks ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Le suivi des clics était désactivé pour cette campagne.
        </p>
      ) : loading && !data ? (
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      ) : links.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Aucun clic pour le moment.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {links.map((link) => (
            <li key={link.url} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 truncate text-sm hover:underline"
                  title={link.url}
                >
                  {link.url.replace(/^https?:\/\/(www\.)?/, "")}
                </a>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  <span className="font-medium text-foreground">
                    {formatCount(link.uniqueClicks)}
                  </span>{" "}
                  contact{link.uniqueClicks > 1 ? "s" : ""} ·{" "}
                  {formatCount(link.clicks)} clic
                  {link.clicks > 1 ? "s" : ""}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#EEEFF1] dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-[#5a50ff]/80"
                  style={{ width: `${(link.uniqueClicks / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Rapport d'une campagne lancée : avancement (interrogé toutes les 5 s
 * pendant l'envoi), pause et sa raison, indicateurs, liens cliqués et
 * destinataires.
 */
export function CampaignReport({ campaign, workspaceId, settings }) {
  const router = useRouter();
  const access = useCampaignAccess();
  const canSend = access.canSend && !access.readOnly;
  const stats = campaign.stats || {};
  const rates = campaignRates(stats);
  const progress = sendProgress(stats);
  const sending = campaign.status === "SENDING";
  const paused = campaign.status === "PAUSED";
  const live = sending || paused;

  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const options = { errorPolicy: "none" };
  const [pauseCampaign, { loading: pausing }] = useMutation(
    PAUSE_EMAIL_CAMPAIGN,
    options,
  );
  const [resumeCampaign, { loading: resuming }] = useMutation(
    RESUME_EMAIL_CAMPAIGN,
    options,
  );
  const [cancelCampaign, { loading: canceling }] = useMutation(
    CANCEL_EMAIL_CAMPAIGN,
    options,
  );
  const [duplicateCampaign, { loading: duplicating }] = useMutation(
    DUPLICATE_EMAIL_CAMPAIGN,
    options,
  );

  const run = async (mutate, success, failure) => {
    try {
      await mutate({ variables: { workspaceId, id: campaign.id } });
      if (success) toast.success(success);
      return true;
    } catch (mutationError) {
      toast.error(failure, { description: errorMessage(mutationError) });
      return false;
    }
  };

  const handleDuplicate = async () => {
    try {
      const { data } = await duplicateCampaign({
        variables: { workspaceId, id: campaign.id },
      });
      toast.success("Campagne dupliquée");
      router.push(campaignUrl(data.duplicateEmailCampaign.id));
    } catch (duplicateError) {
      toast.error("Duplication impossible", {
        description: errorMessage(duplicateError),
      });
    }
  };

  const simulated = stats.simulated || 0;
  const meta = [
    campaign.status === "SENT" &&
      `Envoyée le ${formatDateTime(campaign.completedAt || campaign.startedAt)}`,
    sending &&
      campaign.startedAt &&
      `Démarrée le ${formatDateTime(campaign.startedAt)}`,
    paused &&
      campaign.startedAt &&
      `Démarrée le ${formatDateTime(campaign.startedAt)}`,
    campaign.status === "CANCELED" &&
      `Annulée le ${formatDateTime(campaign.completedAt || campaign.updatedAt)}`,
    `${plural(stats.recipients || 0, "destinataire")}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const actions = (
    <>
      <Button variant="outline" onClick={() => setPreviewOpen(true)}>
        <Eye className="size-3.5" aria-hidden />
        Voir l&apos;e-mail
      </Button>
      {access.canCreate && (
        <Button
          variant="outline"
          onClick={handleDuplicate}
          disabled={duplicating || access.readOnly}
          title={access.readOnlyReason || undefined}
        >
          {duplicating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <CopyPlus className="size-3.5" aria-hidden />
          )}
          Dupliquer
        </Button>
      )}
    </>
  );

  const reached = rates.reached;
  return (
    <div className="h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] overflow-y-auto">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 pt-4 pb-10 sm:px-6 sm:pt-6">
        <CampaignHeader campaign={campaign} meta={meta} actions={actions} />

        {campaign.subject && (
          <p className="-mt-2 truncate text-sm text-muted-foreground">
            Objet : <TextWithVariables text={campaign.subject} />
          </p>
        )}

        {paused && (
          <div
            role="status"
            className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100"
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden
              />
              <div className="min-w-0 text-sm">
                <p className="font-medium">Envoi en pause</p>
                <p className="mt-0.5 leading-5 text-amber-900/80 dark:text-amber-100/80">
                  {campaign.pausedReason ||
                    "L'envoi a été mis en pause. Les e-mails restants partiront à la reprise."}
                </p>
              </div>
            </div>
            {canSend && (
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmCancel(true)}
                  disabled={canceling}
                  className="bg-white dark:bg-transparent"
                >
                  Annuler l&apos;envoi
                </Button>
                <Button
                  variant="primary"
                  onClick={() =>
                    run(resumeCampaign, "Envoi repris", "Reprise impossible")
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
              </div>
            )}
          </div>
        )}

        {live && (
          <section
            className={cn(CARD_CLASS, "p-4 sm:p-5")}
            aria-label="Avancement de l'envoi"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {sending && (
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5a50ff] opacity-60" />
                      <span className="relative inline-flex size-2 rounded-full bg-[#5a50ff]" />
                    </span>
                  )}
                  {sending ? "Envoi en cours" : "Envoi interrompu"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground tabular-nums">
                    {formatCount(progress.processed)}
                  </span>{" "}
                  sur {formatCount(progress.total)} e-mails traités
                  {progress.remaining > 0 && (
                    <> · {formatCount(progress.remaining)} restants</>
                  )}
                </p>
              </div>
              {sending && canSend && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmCancel(true)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Annuler l&apos;envoi
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      run(
                        pauseCampaign,
                        "Envoi mis en pause",
                        "Pause impossible",
                      )
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
                </div>
              )}
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-[#EEEFF1] dark:bg-white/10"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.processed}
              aria-label="E-mails traités"
            >
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-700",
                  paused ? "bg-amber-500" : "bg-[#5a50ff]",
                )}
                style={{ width: `${Math.max(1, progress.ratio * 100)}%` }}
              />
            </div>
            {sending && (
              <p className="mt-2 text-xs text-muted-foreground">
                Les e-mails partent par lots, à un rythme qui protège votre
                réputation d&apos;expéditeur. Cette page se met à jour toute
                seule.
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
              : en mode test, ces e-mails ne sont pas réellement partis. Les
              statistiques avancent comme pour un vrai envoi.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiTile
            icon={Users}
            label="Destinataires"
            value={formatCount(stats.recipients || 0)}
            detail={
              stats.failed
                ? `${plural(stats.failed, "envoi en échec", "envois en échec")}`
                : `${formatCount(rates.sent)} e-mails partis`
            }
          />
          <KpiTile
            icon={Send}
            label={simulated && !stats.delivered ? "Partis (simulés)" : "Remis"}
            value={formatCount(
              simulated && !stats.delivered ? rates.sent : stats.delivered || 0,
            )}
            detail={
              simulated && !stats.delivered
                ? "Aucun envoi réel en mode test"
                : rates.sent
                  ? `${formatPercent((stats.delivered || 0) / rates.sent)} des e-mails partis`
                  : "En attente"
            }
            ratio={rates.sent ? (stats.delivered || simulated) / rates.sent : 0}
            accent="#10b981"
          />
          <KpiTile
            icon={MailOpen}
            label="Ouvertures uniques"
            value={
              campaign.trackOpens
                ? formatPercent(rates.openRate) || "0 %"
                : "Non suivies"
            }
            detail={
              campaign.trackOpens
                ? `${plural(stats.opened || 0, "contact")} · ${plural(stats.opens || 0, "ouverture")}`
                : "Suivi désactivé"
            }
            ratio={campaign.trackOpens ? rates.openRate : undefined}
          />
          <KpiTile
            icon={MousePointerClick}
            label="Clics uniques"
            value={
              campaign.trackClicks
                ? formatPercent(rates.clickRate) || "0 %"
                : "Non suivis"
            }
            detail={
              campaign.trackClicks
                ? `${plural(stats.clicked || 0, "contact")} · ${plural(stats.clicks || 0, "clic")}`
                : "Suivi désactivé"
            }
            ratio={campaign.trackClicks ? rates.clickRate : undefined}
            accent="#8b5cf6"
          />
        </div>

        <div
          className={cn(
            CARD_CLASS,
            "grid grid-cols-1 divide-y divide-[#EEEFF1] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x dark:divide-[#232323]",
          )}
        >
          <SmallStat
            label="Désinscriptions"
            count={stats.unsubscribed || 0}
            rate={reached ? rates.unsubscribeRate : null}
          />
          <SmallStat
            label="Rejets"
            count={stats.bounced || 0}
            rate={rates.sent ? rates.bounceRate : null}
            warn
          />
          <SmallStat
            label="Signalements en spam"
            count={stats.complained || 0}
            rate={reached ? rates.complaintRate : null}
            warn
          />
          <SmallStat label="Échecs d'envoi" count={stats.failed || 0} warn />
        </div>

        <LinksCard
          workspaceId={workspaceId}
          campaignId={campaign.id}
          live={sending}
          trackClicks={campaign.trackClicks}
        />

        <RecipientsTable
          workspaceId={workspaceId}
          campaignId={campaign.id}
          live={sending}
        />
      </div>

      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        workspaceId={workspaceId}
        campaignId={campaign.id}
        fromName={campaign.fromName}
        senderEmail={campaign.senderEmail}
        subject={campaign.subject}
        preheader={campaign.preheader}
        variables={settings?.variables}
      />

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler l&apos;envoi ?</AlertDialogTitle>
            <AlertDialogDescription>
              {progress.remaining > 0
                ? `Les ${formatCount(progress.remaining)} e-mails restants ne partiront pas. `
                : ""}
              Ceux déjà envoyés restent dans les boîtes de réception de vos
              contacts. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuer l&apos;envoi</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (event) => {
                event.preventDefault();
                const ok = await run(
                  cancelCampaign,
                  "Envoi annulé",
                  "Annulation impossible",
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
              Annuler l&apos;envoi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
