"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  TriangleAlert,
  CalendarClock,
  Eye,
  Loader2,
  MailCheck,
  Send,
  Undo2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import {
  GET_EMAIL_CAMPAIGN_DELIVERABILITY,
  UNSCHEDULE_EMAIL_CAMPAIGN,
  UPDATE_EMAIL_CAMPAIGN,
} from "@/src/graphql/emailCampaignQueries";
import {
  campaignCompletion,
  formatDateTime,
  formatLongDateTime,
} from "@/src/utils/email-campaigns";
import { CampaignHeader } from "../campaign-header";
import { PreviewDialog } from "../preview-dialog";
import { TestEmailDialog } from "../test-email-dialog";
import { errorMessage, useCampaignAccess } from "../shared";
import { AudienceSection, useAudienceCount } from "./audience-section";
import { ContentSection } from "./content-section";
import { DeliverabilityPanel } from "./deliverability-panel";
import { SendDialog } from "./send-dialog";
import { SenderSection } from "./sender-section";
import { SubjectSection } from "./subject-section";
import { TrackingSection } from "./tracking-section";

/**
 * Page d'une campagne en brouillon ou programmée, façon Brevo : une carte
 * par étape (coche verte quand c'est complet), la vérification avant envoi
 * à côté, puis test, programmation ou envoi.
 */
export function CampaignSetup({ campaign, workspaceId, settings }) {
  const access = useCampaignAccess();
  const draft = campaign.status === "DRAFT";
  const scheduled = campaign.status === "SCHEDULED";
  const canEdit = draft && access.canEdit && !access.readOnly;
  const canSend = access.canSend && !access.readOnly;
  const variables = settings?.variables;
  const completion = campaignCompletion(campaign);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [sendMode, setSendMode] = useState(null);

  const savedAudience = useAudienceCount(workspaceId, campaign.audience);
  const deliverabilityQuery = useQuery(GET_EMAIL_CAMPAIGN_DELIVERABILITY, {
    variables: { workspaceId, id: campaign.id },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    context: { skipErrorToast: true },
  });
  const deliverability = deliverabilityQuery.data?.emailCampaignDeliverability;

  const [updateCampaign] = useMutation(UPDATE_EMAIL_CAMPAIGN, {
    errorPolicy: "none",
  });
  const [unschedule, { loading: unscheduling }] = useMutation(
    UNSCHEDULE_EMAIL_CAMPAIGN,
    { errorPolicy: "none" },
  );

  /** Enregistre une étape ; rend true si l'API l'a acceptée. */
  const save = async (input, { quiet = false } = {}) => {
    try {
      await updateCampaign({
        variables: { workspaceId, id: campaign.id, input },
      });
      if (!quiet) toast.success("Modifications enregistrées");
      deliverabilityQuery.refetch().catch(() => {});
      return true;
    } catch (saveError) {
      toast.error("Enregistrement impossible", {
        description: errorMessage(saveError),
      });
      return false;
    }
  };

  const handleUnschedule = async () => {
    try {
      await unschedule({ variables: { workspaceId, id: campaign.id } });
      toast.success("Programmation annulée", {
        description: "La campagne est de nouveau un brouillon modifiable.",
      });
      deliverabilityQuery.refetch().catch(() => {});
    } catch (unscheduleError) {
      toast.error("Annulation impossible", {
        description: errorMessage(unscheduleError),
      });
    }
  };

  const firstError = deliverability?.checks?.find(
    (check) => check.level === "ERROR",
  );
  const sendBlockedReason = !deliverability
    ? "Vérification en cours…"
    : !deliverability.canSend
      ? firstError?.title || "Corrigez les points bloquants de la vérification."
      : null;

  const meta = scheduled
    ? `Départ prévu le ${formatLongDateTime(campaign.scheduledAt)} (heure de Paris)`
    : `Brouillon modifié le ${formatDateTime(campaign.updatedAt)}`;

  const actions = (
    <>
      <Button variant="ghost" onClick={() => setPreviewOpen(true)}>
        <Eye className="size-3.5" aria-hidden />
        Aperçu
      </Button>
      {(access.canEdit || access.canSend) && (
        <Button
          variant="outline"
          onClick={() => setTestOpen(true)}
          disabled={access.readOnly}
          title={access.readOnlyReason || undefined}
        >
          <MailCheck className="size-3.5" aria-hidden />
          Envoyer un test
        </Button>
      )}
      {scheduled && canSend && (
        <Button
          variant="outline"
          onClick={handleUnschedule}
          disabled={unscheduling}
        >
          {unscheduling ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Undo2 className="size-3.5" aria-hidden />
          )}
          Annuler la programmation
        </Button>
      )}
      {draft && canSend && (
        <>
          <span title={sendBlockedReason || undefined}>
            <Button
              variant="outline"
              onClick={() => setSendMode("schedule")}
              disabled={Boolean(sendBlockedReason)}
            >
              <CalendarClock className="size-3.5" aria-hidden />
              Programmer
            </Button>
          </span>
          <span title={sendBlockedReason || undefined}>
            <Button
              variant="primary"
              onClick={() => setSendMode("now")}
              disabled={Boolean(sendBlockedReason)}
            >
              <Send className="size-3.5" aria-hidden />
              Envoyer
            </Button>
          </span>
        </>
      )}
    </>
  );

  return (
    <div className="h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] overflow-y-auto">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-4 pt-4 pb-10 sm:px-6 sm:pt-6">
        <CampaignHeader
          campaign={campaign}
          meta={meta}
          actions={actions}
          onRename={
            canEdit ? (name) => save({ name }, { quiet: true }) : undefined
          }
        />

        {draft && campaign.pausedReason && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100"
          >
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="font-medium">
                L&apos;envoi programmé n&apos;a pas pu partir
              </p>
              <p className="mt-0.5 leading-5 text-amber-900/80 dark:text-amber-100/80">
                {campaign.pausedReason} La campagne est redevenue un brouillon :
                corrigez ce qui bloque, puis programmez-la de nouveau.
              </p>
            </div>
          </div>
        )}

        {scheduled && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100">
            <p className="flex items-center gap-2">
              <CalendarClock className="size-4 shrink-0" aria-hidden />
              <span>
                Envoi programmé le{" "}
                <span className="font-medium">
                  {formatLongDateTime(campaign.scheduledAt)}
                </span>{" "}
                (heure de Paris). Pour modifier la campagne, annulez la
                programmation.
              </span>
            </p>
          </div>
        )}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-3">
            <SenderSection
              campaign={campaign}
              settings={settings}
              complete={completion.sender}
              canEdit={canEdit}
              onSave={save}
            />
            <AudienceSection
              campaign={campaign}
              workspaceId={workspaceId}
              complete={completion.audience}
              canEdit={canEdit}
              savedCount={savedAudience.count}
              quota={settings?.quota}
              onSave={save}
            />
            <SubjectSection
              campaign={campaign}
              complete={completion.subject}
              canEdit={canEdit}
              variables={variables}
              onSave={save}
            />
            <ContentSection
              campaign={campaign}
              workspaceId={workspaceId}
              complete={completion.content}
              canEdit={access.canEdit && !access.readOnly}
              onPreview={() => setPreviewOpen(true)}
            />
            <TrackingSection
              campaign={campaign}
              canEdit={canEdit}
              onSave={save}
            />
          </div>
          <DeliverabilityPanel
            className="xl:sticky xl:top-6"
            deliverability={deliverability}
            loading={deliverabilityQuery.loading}
            error={deliverabilityQuery.error}
            onRefresh={() => deliverabilityQuery.refetch().catch(() => {})}
            campaignId={campaign.id}
            canEdit={canEdit}
          />
        </div>
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
        variables={variables}
      />
      <TestEmailDialog
        open={testOpen}
        onOpenChange={setTestOpen}
        workspaceId={workspaceId}
        campaignId={campaign.id}
        sendMode={settings?.sendMode}
        variables={variables}
      />
      <SendDialog
        open={Boolean(sendMode)}
        onOpenChange={(open) => !open && setSendMode(null)}
        mode={sendMode || "now"}
        workspaceId={workspaceId}
        campaign={campaign}
        audienceCount={savedAudience.count}
        settings={settings}
      />
    </div>
  );
}
