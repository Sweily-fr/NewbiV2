"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { CircleAlert, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { cn } from "@/src/lib/utils";
import { GET_EMAIL_CAMPAIGN_PREVIEW } from "@/src/graphql/emailCampaignQueries";
import { DEFAULT_VARIABLES } from "@/src/utils/email-campaign-variables";
import { ContactPicker } from "./contact-picker";
import { EmailFrame } from "./email-frame";
import { FOCUS_RING } from "./shared";

const DEVICES = [
  { value: "desktop", label: "Ordinateur", icon: Monitor },
  { value: "mobile", label: "Mobile", icon: Smartphone },
];

function DeviceToggle({ value, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="Affichage"
      className="flex gap-0.5 rounded-[9px] bg-[#F5F5F5] p-0.5 dark:bg-neutral-900"
    >
      {DEVICES.map(({ value: device, label, icon: Icon }) => {
        const active = device === value;
        return (
          <button
            key={device}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(device)}
            className={cn(
              "flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-[color,background-color,box-shadow]",
              FOCUS_RING,
              active
                ? "bg-white text-[#242529] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)] dark:bg-[#2a2a2a] dark:text-white"
                : "text-[#606164] hover:text-[#242529] dark:text-white/55 dark:hover:text-white",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Ligne de la boîte de réception : expéditeur, objet, texte d'aperçu. */
export function InboxRow({
  fromName,
  senderEmail,
  subject,
  preheader,
  compact = false,
}) {
  const initial = (fromName || "?").trim().charAt(0).toUpperCase();
  return (
    <div
      className={cn(
        "flex items-start gap-3",
        compact ? "px-4 py-3" : "px-5 py-4",
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#5a50ff] text-sm font-medium text-white">
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 truncate text-sm">
            <span className="font-semibold text-[#111827]">
              {fromName || "Expéditeur"}
            </span>
            {!compact && senderEmail && (
              <span className="ml-1.5 text-xs text-[#6b7280]">
                &lt;{senderEmail}&gt;
              </span>
            )}
          </p>
          <span className="shrink-0 text-xs text-[#6b7280]">
            À l&apos;instant
          </span>
        </div>
        <p className="truncate text-sm font-medium text-[#111827]">
          {subject || <span className="text-[#9ca3af] italic">Sans objet</span>}
        </p>
        <p className="truncate text-sm text-[#6b7280]">{preheader}</p>
      </div>
    </div>
  );
}

/**
 * Aperçu de l'e-mail rendu par l'API (HTML d'envoi), sur ordinateur ou
 * mobile, personnalisé pour un contact ou avec les valeurs d'exemple. Le
 * design, l'objet et le texte d'aperçu en cours d'édition peuvent être
 * passés sans être enregistrés.
 */
export function PreviewDialog({
  open,
  onOpenChange,
  workspaceId,
  campaignId,
  design,
  subject,
  preheader,
  fromName,
  senderEmail,
  variables,
}) {
  const [device, setDevice] = useState("desktop");
  const [contact, setContact] = useState(null);
  const { data, loading, error, refetch } = useQuery(
    GET_EMAIL_CAMPAIGN_PREVIEW,
    {
      variables: {
        workspaceId,
        id: campaignId,
        design: design || null,
        subject: subject ?? null,
        preheader: preheader ?? null,
        clientId: contact?.id || null,
      },
      skip: !open || !workspaceId || !campaignId,
      fetchPolicy: "no-cache",
      context: { skipErrorToast: true },
    },
  );
  const preview = data?.emailCampaignPreview;
  const exampleName = (variables || DEFAULT_VARIABLES).find(
    (variable) => variable.key === "nom_complet",
  )?.example;

  const body =
    loading && !preview ? (
      <div className="flex flex-col gap-3 p-6">
        <Skeleton className="mx-auto h-10 w-1/3" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    ) : error && !preview ? (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <CircleAlert className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          L&apos;aperçu n&apos;a pas pu être préparé.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Réessayer
        </Button>
      </div>
    ) : (
      <EmailFrame
        html={preview?.html}
        title="Aperçu de l'e-mail"
        className="h-full"
      />
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(92vh,940px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[1040px]">
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[#EEEFF1] px-5 py-3.5 pr-12 dark:border-[#232323]">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-medium">
              Aperçu de l&apos;e-mail
            </DialogTitle>
            <DialogDescription className="sr-only">
              L&apos;e-mail tel que vos contacts le recevront.
            </DialogDescription>
          </div>
          <div className="hidden sm:block">
            <DeviceToggle value={device} onChange={setDevice} />
          </div>
          <ContactPicker
            workspaceId={workspaceId}
            value={contact}
            onChange={setContact}
            exampleName={exampleName}
            className="max-w-[230px]"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden bg-[#f4f4f5] dark:bg-neutral-900">
          {device === "desktop" ? (
            <div className="mx-auto flex h-full max-w-[860px] flex-col p-4 sm:p-6">
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#e4e4e7] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-[#2E2E32]">
                <div className="shrink-0 border-b border-[#EEEFF1]">
                  <InboxRow
                    fromName={fromName}
                    senderEmail={senderEmail}
                    subject={preview?.subject ?? subject}
                    preheader={preview?.preheader ?? preheader}
                  />
                </div>
                <div className="min-h-0 flex-1">{body}</div>
              </div>
            </div>
          ) : (
            <div className="flex h-full justify-center overflow-hidden p-4 sm:p-6">
              <div className="flex h-full w-[391px] flex-col overflow-hidden rounded-[40px] border-[8px] border-[#1f1f22] bg-white shadow-xl">
                <div className="flex h-7 shrink-0 items-center justify-center">
                  <span className="h-1.5 w-20 rounded-full bg-[#1f1f22]" />
                </div>
                <div className="shrink-0 border-b border-[#EEEFF1]">
                  <InboxRow
                    compact
                    fromName={fromName}
                    subject={preview?.subject ?? subject}
                    preheader={preview?.preheader ?? preheader}
                  />
                </div>
                <div className="min-h-0 flex-1">{body}</div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
