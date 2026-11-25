"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Info, MailCheck, Send } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import {
  GET_PROSPECTING_VERIFICATION,
  UPDATE_PROSPECTING_SEQUENCE,
} from "@/src/graphql/prospectingQueries";
import { formatDateTime } from "@/src/utils/email-campaigns";
import {
  PROSPECTING_URL,
  PROSPECTING_VARIABLES,
  sequenceCompletion,
} from "@/src/utils/prospecting";
import { CampaignHeader } from "@/app/dashboard/outils/campagnes-email/components/campaign-header";
import { MailboxSettingsSheet } from "../mailbox-settings-sheet";
import { PreviewSection } from "../message-preview";
import {
  Notice,
  SequenceStatusBadge,
  errorMessage,
  useProspectingAccess,
} from "../shared";
import { LaunchDialog } from "./launch-dialog";
import { MailboxSection } from "./mailbox-section";
import { MessageSection } from "./message-section";
import { RecipientsSection } from "./recipients-section";
import { TestDialog } from "./test-dialog";
import { VerificationPanel } from "./verification-panel";

/**
 * Brouillon d'une prospection, façon campagnes : une carte par étape (boîte,
 * destinataires, message), l'aperçu avec un vrai prospect, la vérification
 * à côté, puis « M'envoyer un test » et le lancement (case obligatoire).
 */
export function SequenceSetup({ sequence, workspaceId, settings }) {
  const access = useProspectingAccess();
  const canEdit = access.canEdit && !access.readOnly;
  const variables = settings?.variables?.length
    ? settings.variables
    : PROSPECTING_VARIABLES;
  const completion = sequenceCompletion(sequence);
  const mailbox = sequence.mailbox;
  const ownMailbox = Boolean(mailbox?.isMine);

  const [testOpen, setTestOpen] = useState(false);
  const [launchOpen, setLaunchOpen] = useState(false);
  const [mailboxOpen, setMailboxOpen] = useState(false);
  // Objet et texte en cours de saisie, montrés dans l'aperçu
  const [messageDraft, setMessageDraft] = useState(null);

  const verificationQuery = useQuery(GET_PROSPECTING_VERIFICATION, {
    variables: { workspaceId, id: sequence.id },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
    context: { skipErrorToast: true },
  });
  const verification =
    (verificationQuery.data || verificationQuery.previousData)
      ?.prospectingVerification || null;
  const refreshVerification = () => verificationQuery.refetch().catch(() => {});

  const [updateSequence] = useMutation(UPDATE_PROSPECTING_SEQUENCE, {
    errorPolicy: "none",
  });

  /** Enregistre une étape ; rend true si l'API l'a acceptée. */
  const save = async (input, { quiet = false } = {}) => {
    try {
      await updateSequence({
        variables: { workspaceId, id: sequence.id, input },
      });
      if (!quiet) toast.success("Modifications enregistrées");
      refreshVerification();
      return true;
    } catch (saveError) {
      toast.error("Enregistrement impossible", {
        description: errorMessage(saveError),
      });
      return false;
    }
  };

  const firstError = verification?.checks?.find(
    (check) => check.level === "ERROR",
  );
  const launchBlockedReason = access.readOnly
    ? access.readOnlyReason
    : !verification
      ? "Vérification en cours…"
      : !verification.canSend
        ? firstError?.title ||
          "Corrigez les points bloquants de la vérification."
        : null;

  const meta = [
    `Brouillon modifié le ${formatDateTime(sequence.updatedAt)}`,
    mailbox?.accountEmail && `depuis ${mailbox.accountEmail}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const actions = (
    <>
      {ownMailbox && (access.canEdit || access.canSend) && (
        <Button
          variant="outline"
          onClick={() => setTestOpen(true)}
          disabled={access.readOnly}
          title={access.readOnlyReason || undefined}
        >
          <MailCheck className="size-3.5" aria-hidden />
          M&apos;envoyer un test
        </Button>
      )}
      {sequence.canSend && (
        <span title={launchBlockedReason || undefined}>
          <Button
            variant="primary"
            onClick={() => setLaunchOpen(true)}
            disabled={Boolean(launchBlockedReason)}
          >
            <Send className="size-3.5" aria-hidden />
            Lancer la prospection
          </Button>
        </span>
      )}
    </>
  );

  return (
    <div className="h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] overflow-y-auto">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-4 pt-4 pb-10 sm:px-6 sm:pt-6">
        <CampaignHeader
          campaign={sequence}
          meta={meta}
          actions={actions}
          onRename={
            canEdit ? (name) => save({ name }, { quiet: true }) : undefined
          }
          backHref={PROSPECTING_URL}
          backLabel="Prospection"
          badge={<SequenceStatusBadge status={sequence.status} />}
          nameLabel="Nom de la prospection"
        />

        {!ownMailbox && mailbox && (
          <Notice tone="info" icon={Info}>
            Cette prospection part de la boîte de{" "}
            {mailbox.ownerName || mailbox.accountEmail} : seul son propriétaire
            peut l&apos;essayer et la lancer.
          </Notice>
        )}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-3">
            <MailboxSection
              mailbox={mailbox}
              complete={completion.mailbox}
              onOpenSettings={() => setMailboxOpen(true)}
            />
            <RecipientsSection
              sequence={sequence}
              workspaceId={workspaceId}
              complete={completion.audience}
              canEdit={canEdit}
              savedCount={verification?.audience}
              onSave={save}
            />
            <MessageSection
              sequence={sequence}
              complete={completion.message}
              canEdit={canEdit}
              variables={variables}
              onSave={save}
              onDraftChange={setMessageDraft}
            />
            <PreviewSection
              workspaceId={workspaceId}
              sequence={sequence}
              draft={messageDraft}
              variables={variables}
            />
          </div>
          <VerificationPanel
            className="xl:sticky xl:top-6"
            verification={verification}
            loading={verificationQuery.loading}
            error={verificationQuery.error}
            onRefresh={refreshVerification}
            canEdit={canEdit}
          />
        </div>
      </div>

      <TestDialog
        open={testOpen}
        onOpenChange={setTestOpen}
        workspaceId={workspaceId}
        sequence={sequence}
        unsaved={Boolean(messageDraft)}
      />
      <LaunchDialog
        open={launchOpen}
        onOpenChange={setLaunchOpen}
        workspaceId={workspaceId}
        sequence={sequence}
        verification={verification}
      />
      {ownMailbox && (
        <MailboxSettingsSheet
          open={mailboxOpen}
          onOpenChange={(open) => {
            setMailboxOpen(open);
            // Rythme ou signature changés : fin prévue relue
            if (!open) refreshVerification();
          }}
          workspaceId={workspaceId}
          mailbox={mailbox}
          settings={settings}
          canEdit={!access.readOnly}
        />
      )}
    </div>
  );
}
