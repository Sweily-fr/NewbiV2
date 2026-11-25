"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import { CircleAlert, Eye } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { cn } from "@/src/lib/utils";
import { GET_PROSPECTING_PREVIEW } from "@/src/graphql/prospectingQueries";
import { PROSPECTING_VARIABLES } from "@/src/utils/prospecting";
import { ContactPicker } from "@/app/dashboard/outils/campagnes-email/components/contact-picker";
import { EmailFrame } from "@/app/dashboard/outils/campagnes-email/components/email-frame";
import { InboxRow } from "@/app/dashboard/outils/campagnes-email/components/preview-dialog";
import { CARD_CLASS } from "./shared";

const snippet = (text) =>
  String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);

/**
 * Message rendu par l'API (HTML d'envoi, signature et pied légal compris),
 * personnalisé pour un vrai prospect ou avec les valeurs d'exemple.
 * `draft` : objet et texte en cours de saisie, montrés sans être
 * enregistrés.
 */
export function useProspectingPreview({
  workspaceId,
  sequence,
  draft = null,
  contact = null,
  skip = false,
}) {
  const key = JSON.stringify(
    draft ? { subject: draft.subject, body: draft.body } : null,
  );
  const debouncedKey = useDebouncedValue(key, 600);
  const typed = JSON.parse(debouncedKey);
  const query = useQuery(GET_PROSPECTING_PREVIEW, {
    variables: {
      workspaceId,
      id: sequence.id,
      subject: typed ? typed.subject : null,
      body: typed ? typed.body : null,
      clientId: contact?.id || null,
    },
    skip: skip || !workspaceId,
    fetchPolicy: "network-only",
    context: { skipErrorToast: true },
  });
  const { refetch } = query;
  // Version enregistrée changée (message, signature) : aperçu relu
  const savedAt = useRef(sequence.updatedAt);
  useEffect(() => {
    if (savedAt.current === sequence.updatedAt) return;
    savedAt.current = sequence.updatedAt;
    if (!skip && !draft) refetch().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequence.updatedAt]);
  return {
    preview: (query.data || query.previousData)?.prospectingPreview || null,
    loading: query.loading || key !== debouncedKey,
    error: query.error,
    refetch,
  };
}

/** En-tête de boîte de réception et message, dans un cadre blanc. */
export function MessagePreviewBody({
  preview,
  loading,
  error,
  onRetry,
  fromName,
  senderEmail,
  fallbackSubject,
  frameClassName,
}) {
  if (!preview && loading) {
    return (
      <div className="flex flex-col gap-3 p-5">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-4 h-3 w-1/2" />
      </div>
    );
  }
  if (!preview && error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <CircleAlert className="size-7 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          L&apos;aperçu n&apos;a pas pu être préparé.
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Réessayer
          </Button>
        )}
      </div>
    );
  }
  return (
    <>
      <div className="shrink-0 border-b border-[#EEEFF1]">
        <InboxRow
          fromName={fromName}
          senderEmail={senderEmail}
          subject={preview?.subject ?? fallbackSubject}
          preheader={snippet(preview?.text)}
        />
      </div>
      <EmailFrame
        html={preview?.html}
        title="Aperçu du message"
        fit
        className={frameClassName}
      />
    </>
  );
}

const exampleName = (variables) =>
  (variables?.length ? variables : PROSPECTING_VARIABLES).find(
    (variable) => variable.key === "nom_complet",
  )?.example;

/**
 * Aperçu du brouillon (étape de la page) : choix d'un vrai prospect, puis
 * le message tel qu'il le recevra.
 */
export function PreviewSection({
  workspaceId,
  sequence,
  draft,
  variables,
  className,
}) {
  const [contact, setContact] = useState(null);
  const { preview, loading, error, refetch } = useProspectingPreview({
    workspaceId,
    sequence,
    draft,
    contact,
  });
  const mailbox = sequence.mailbox;
  return (
    <section
      aria-labelledby="apercu-title"
      className={cn(CARD_CLASS, "overflow-hidden", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f1f1f3] text-[#4b4d55] dark:bg-white/10 dark:text-white/70">
            <Eye className="size-3.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="apercu-title" className="text-[15px] leading-6 font-medium">
              Aperçu
            </h2>
            <p className="text-sm text-muted-foreground">
              {draft
                ? "Votre saisie, avant enregistrement."
                : "Tel que votre prospect le recevra, pied de message compris."}
            </p>
          </div>
        </div>
        <ContactPicker
          workspaceId={workspaceId}
          value={contact}
          onChange={setContact}
          exampleName={exampleName(variables)}
          className="max-w-[240px]"
        />
      </div>
      <div className="border-t border-[#EEEFF1] bg-[#f4f4f5] p-3 sm:p-5 dark:border-[#232323] dark:bg-neutral-900">
        <div className="overflow-hidden rounded-xl border border-[#e4e4e7] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-[#2E2E32]">
          <MessagePreviewBody
            preview={preview}
            loading={loading}
            error={error}
            onRetry={() => refetch().catch(() => {})}
            fromName={mailbox?.accountName || mailbox?.accountEmail}
            senderEmail={mailbox?.accountEmail}
            fallbackSubject={draft?.subject ?? sequence.subject}
          />
        </div>
      </div>
    </section>
  );
}

/** « Voir le message » d'une prospection lancée. */
export function MessagePreviewDialog({
  open,
  onOpenChange,
  workspaceId,
  sequence,
  variables,
}) {
  const [contact, setContact] = useState(null);
  const { preview, loading, error, refetch } = useProspectingPreview({
    workspaceId,
    sequence,
    contact,
    skip: !open,
  });
  const mailbox = sequence.mailbox;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,940px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[820px]">
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[#EEEFF1] px-5 py-3.5 pr-12 dark:border-[#232323]">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-medium">
              Message envoyé
            </DialogTitle>
            <DialogDescription className="sr-only">
              Le message tel que vos prospects l&apos;ont reçu.
            </DialogDescription>
          </div>
          <ContactPicker
            workspaceId={workspaceId}
            value={contact}
            onChange={setContact}
            exampleName={exampleName(variables)}
            className="max-w-[230px]"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f4f4f5] p-3 sm:p-5 dark:bg-neutral-900">
          <div className="overflow-hidden rounded-xl border border-[#e4e4e7] bg-white dark:border-[#2E2E32]">
            <MessagePreviewBody
              preview={preview}
              loading={loading}
              error={error}
              onRetry={() => refetch().catch(() => {})}
              fromName={mailbox?.accountName || mailbox?.accountEmail}
              senderEmail={mailbox?.accountEmail}
              fallbackSubject={sequence.subject}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
