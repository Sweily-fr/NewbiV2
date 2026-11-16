"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { isValidEmail } from "@/src/utils/email-campaigns";
import { Field, SetupSection } from "./setup-section";

const MAX_FROM_NAME = 60;

/**
 * Expéditeur : nom affiché et adresse de réponse. L'adresse d'envoi est
 * celle de Newbi (domaine authentifié) : jamais celle du client, que
 * Gmail ou Outlook rejetteraient (DMARC).
 */
export function SenderSection({
  campaign,
  settings,
  complete,
  canEdit,
  onSave,
}) {
  const [editing, setEditing] = useState(false);
  const [fromName, setFromName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

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

  const senderEmail = campaign.senderEmail || settings?.senderEmail;
  const summary = complete ? (
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

  return (
    <SetupSection
      id="expediteur"
      step={1}
      title="Expéditeur"
      complete={complete}
      summary={summary}
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
          <p>
            Envoyé depuis{" "}
            <span className="font-medium text-foreground">{senderEmail}</span>{" "}
            au nom de{" "}
            <span className="font-medium text-foreground">
              {fromName.trim() || "votre entreprise"}
            </span>
            . Cette adresse authentifiée évite que vos e-mails finissent en spam
            ; vos contacts voient votre nom et leurs réponses vous parviennent
            directement.
          </p>
        </div>
      )}
    </SetupSection>
  );
}
