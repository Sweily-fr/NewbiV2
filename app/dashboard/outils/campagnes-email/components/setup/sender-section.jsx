"use client";

import { useState } from "react";
import { Clock, ShieldCheck } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";
import { isValidEmail } from "@/src/utils/email-campaigns";
import {
  effectiveSenderEmail,
  pendingDomainNotice,
  senderPanelLinkLabel,
} from "@/src/utils/email-sending-domain";
import { FOCUS_RING } from "../shared";
import { SendingDomainSheet } from "../sender/sending-domain-sheet";
import { Field, SetupSection } from "./setup-section";

const MAX_FROM_NAME = 60;

const LINK_CLASS = cn(
  "cursor-pointer rounded-sm font-medium whitespace-nowrap text-[#5a50ff] hover:underline dark:text-[#8b7fff]",
  FOCUS_RING,
);

/** « Votre domaine X est en cours de validation : en attendant… » */
function PendingDomainText({ notice }) {
  return (
    <>
      Votre domaine <span className="font-medium">{notice.domain}</span>{" "}
      {notice.validating
        ? "est en cours de validation"
        : "n'est pas encore validé"}{" "}
      : en attendant, vos campagnes partent de{" "}
      <span className="font-medium break-all">{notice.fallbackEmail}</span>.
    </>
  );
}

/**
 * Expéditeur : nom affiché et adresse de réponse. L'adresse d'envoi est
 * celle de Newbi (« atelier-martin@envoi.newbi.fr »), ou celle du domaine
 * de l'entreprise une fois connecté et validé : jamais une adresse Gmail
 * ou Orange, que les messageries rejetteraient (DMARC).
 */
export function SenderSection({
  campaign,
  settings,
  workspaceId,
  complete,
  canEdit,
  onSave,
}) {
  const [editing, setEditing] = useState(false);
  const [fromName, setFromName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const [domainOpen, setDomainOpen] = useState(false);

  const startEdit = () => {
    setFromName(campaign.fromName || settings?.defaultFromName || "");
    setReplyTo(campaign.replyTo || settings?.defaultReplyTo || "");
    setTouched(false);
    setEditing(true);
  };

  const nameError = !fromName.trim()
    ? "Indiquez le nom que vos contacts verront."
    : null;
  const replyError =
    replyTo.trim() && !isValidEmail(replyTo)
      ? "Cette adresse n'est pas valide."
      : !replyTo.trim()
        ? "Indiquez l'adresse qui recevra les réponses."
        : null;

  const save = async () => {
    setTouched(true);
    if (nameError || replyError) return;
    setSaving(true);
    const ok = await onSave({
      fromName: fromName.trim(),
      replyTo: replyTo.trim().toLowerCase(),
    });
    setSaving(false);
    if (ok) setEditing(false);
  };

  const senderEmail = effectiveSenderEmail(campaign, settings);
  // L'adresse d'un brouillon suit le domaine jusqu'au lancement
  const notice =
    campaign.status === "DRAFT" ? pendingDomainNotice(settings) : null;
  const panelLink = settings ? (
    <button
      type="button"
      className={LINK_CLASS}
      onClick={() => setDomainOpen(true)}
    >
      {senderPanelLinkLabel(settings.sendingDomain)}
    </button>
  ) : null;

  const nameSummary = complete ? (
    <>
      <span className="font-medium text-foreground">{campaign.fromName}</span>
      <span className="mx-1.5 text-muted-foreground/60">·</span>
      réponses à {campaign.replyTo}
    </>
  ) : campaign.fromName ? (
    <>
      <span className="font-medium text-foreground">{campaign.fromName}</span>
      <span className="mx-1.5 text-muted-foreground/60">·</span>
      <span className="text-amber-700 dark:text-amber-400">
        ajoutez une adresse de réponse
      </span>
    </>
  ) : (
    "Le nom qui s'affiche dans la boîte de réception, et l'adresse des réponses."
  );

  const senderLine =
    notice || senderEmail ? (
      <span className="mt-1 flex items-start gap-1.5 text-xs leading-5">
        {notice && (
          <Clock
            className="mt-[3px] size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
        )}
        <span className="min-w-0">
          {notice ? (
            <span className="text-amber-800 dark:text-amber-300">
              <PendingDomainText notice={notice} />
            </span>
          ) : (
            <>
              Envoyé depuis{" "}
              <span className="font-medium break-all text-foreground">
                {senderEmail}
              </span>
            </>
          )}
          {panelLink && (
            <>
              <span className="mx-1.5 text-muted-foreground/60">·</span>
              {panelLink}
            </>
          )}
        </span>
      </span>
    ) : null;

  return (
    <>
      <SetupSection
        id="expediteur"
        step={1}
        title="Expéditeur"
        complete={complete}
        summary={
          <>
            {nameSummary}
            {senderLine}
          </>
        }
        editing={editing}
        canEdit={canEdit}
        onEdit={startEdit}
        onCancel={() => setEditing(false)}
        onSave={save}
        saving={saving}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nom de l'expéditeur"
            htmlFor="from-name"
            error={touched ? nameError : null}
            hint="Le plus souvent, le nom de votre entreprise."
          >
            <Input
              id="from-name"
              value={fromName}
              maxLength={MAX_FROM_NAME}
              onChange={(event) => setFromName(event.target.value)}
              autoComplete="off"
            />
          </Field>
          <Field
            label="Adresse de réponse"
            htmlFor="reply-to"
            error={touched ? replyError : null}
            hint="Les réponses de vos contacts arrivent ici."
          >
            <Input
              id="reply-to"
              type="email"
              inputMode="email"
              value={replyTo}
              onChange={(event) => setReplyTo(event.target.value)}
              autoComplete="off"
            />
          </Field>
        </div>
        {senderEmail && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-[#f7f7f8] px-3 py-2.5 text-xs leading-5 text-muted-foreground dark:bg-white/[0.04]">
            <ShieldCheck
              className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
              aria-hidden
            />
            <div className="min-w-0">
              <p>
                Envoyé depuis{" "}
                <span className="font-medium break-all text-foreground">
                  {senderEmail}
                </span>{" "}
                au nom de{" "}
                <span className="font-medium text-foreground">
                  {fromName.trim() || "votre entreprise"}
                </span>
                . Cette adresse authentifiée évite que vos e-mails finissent en
                spam ; vos contacts voient votre nom et leurs réponses vous
                parviennent directement.
              </p>
              {notice && (
                <p className="mt-1.5 text-amber-800 dark:text-amber-300">
                  <PendingDomainText notice={notice} />
                </p>
              )}
              {panelLink && <p className="mt-1.5">{panelLink}</p>}
            </div>
          </div>
        )}
      </SetupSection>

      <SendingDomainSheet
        open={domainOpen}
        onOpenChange={setDomainOpen}
        workspaceId={workspaceId}
        settings={settings}
      />
    </>
  );
}
