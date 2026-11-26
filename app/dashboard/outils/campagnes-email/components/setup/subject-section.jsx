"use client";

import { useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";
import {
  exampleValues,
  fillVariables,
  unknownVariables,
} from "@/src/utils/email-campaign-variables";
import { InboxRow } from "../preview-dialog";
import { VariableMenu, insertIntoField } from "../variable-menu";
import { Field, SetupSection } from "./setup-section";

const SUBJECT_MAX = 150;
const PREHEADER_MAX = 200;

/** Compteur de caractères, orange hors de la longueur conseillée. */
function Counter({ value, min, max, label }) {
  const length = value.length;
  const off = length > 0 && (length < min || length > max);
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        off ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground",
      )}
      title={`${label} : entre ${min} et ${max} caractères conseillés`}
    >
      {length} / {max}
    </span>
  );
}

/** Texte avec ses variables en pastille (résumé de l'étape). */
export function TextWithVariables({ text }) {
  const parts = String(text || "").split(/(\{\{[^{}]*\}\})/g);
  return parts.map((part, index) =>
    /^\{\{[^{}]*\}\}$/.test(part) ? (
      <span
        key={index}
        className="rounded bg-[#5a50ff]/10 px-1 text-[#4a41e0] dark:bg-[#8b7fff]/15 dark:text-[#b5adff]"
      >
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export function UnknownWarning({ keys }) {
  if (!keys.length) return null;
  return (
    <p className="flex items-start gap-1.5 text-xs text-red-700 dark:text-red-400">
      <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
      Variable inconnue : {keys.map((key) => `{{${key}}}`).join(", ")}.
      Choisissez-la dans le menu « Variable ».
    </p>
  );
}

/**
 * Objet et texte d'aperçu (affiché après l'objet dans la boîte de
 * réception), compteurs, insertion de variable et aperçu de la ligne telle
 * que vos contacts la verront.
 */
export function SubjectSection({
  campaign,
  complete,
  canEdit,
  variables,
  onSave,
}) {
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [saving, setSaving] = useState(false);
  const subjectRef = useRef(null);
  const preheaderRef = useRef(null);

  const startEdit = () => {
    setSubject(campaign.subject || "");
    setPreheader(campaign.preheader || "");
    setEditing(true);
  };

  const unknownSubject = unknownVariables(subject, variables);
  const unknownPreheader = unknownVariables(preheader, variables);
  const examples = exampleValues(variables);

  const save = async () => {
    setSaving(true);
    const ok = await onSave({
      subject: subject.trim(),
      preheader: preheader.trim(),
    });
    setSaving(false);
    if (ok) setEditing(false);
  };

  const summary = campaign.subject ? (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate font-medium text-foreground">
        <TextWithVariables text={campaign.subject} />
      </span>
      {campaign.preheader ? (
        <span className="truncate">
          <TextWithVariables text={campaign.preheader} />
        </span>
      ) : (
        <span className="text-muted-foreground/80">
          Sans texte d&apos;aperçu
        </span>
      )}
    </div>
  ) : (
    <span className="text-amber-700 dark:text-amber-400">
      Ajoutez l&apos;objet de votre e-mail.
    </span>
  );

  return (
    <SetupSection
      id="objet"
      step={3}
      title="Objet"
      complete={complete}
      summary={summary}
      editing={editing}
      canEdit={canEdit}
      onEdit={startEdit}
      onCancel={() => setEditing(false)}
      onSave={save}
      saving={saving}
      saveDisabled={!subject.trim()}
    >
      <div className="flex flex-col gap-4">
        <Field
          label="Objet"
          htmlFor="campaign-subject"
          action={
            <span className="flex items-center gap-1">
              <Counter value={subject} min={15} max={70} label="Objet" />
              <VariableMenu
                variables={variables}
                onInsert={(token) =>
                  insertIntoField(subjectRef, subject, setSubject, token)
                }
              />
            </span>
          }
          hint="Entre 15 et 70 caractères : court, précis, sans majuscules ni points d'exclamation en série."
        >
          <Input
            ref={subjectRef}
            id="campaign-subject"
            value={subject}
            maxLength={SUBJECT_MAX}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Ex. : Nos nouveautés de décembre"
            autoComplete="off"
          />
        </Field>
        <UnknownWarning keys={unknownSubject} />
        <Field
          label="Texte d'aperçu"
          htmlFor="campaign-preheader"
          action={
            <span className="flex items-center gap-1">
              <Counter
                value={preheader}
                min={30}
                max={110}
                label="Texte d'aperçu"
              />
              <VariableMenu
                variables={variables}
                onInsert={(token) =>
                  insertIntoField(preheaderRef, preheader, setPreheader, token)
                }
              />
            </span>
          }
          hint="Affiché après l'objet dans la boîte de réception : il complète l'objet et donne envie d'ouvrir."
        >
          <Input
            ref={preheaderRef}
            id="campaign-preheader"
            value={preheader}
            maxLength={PREHEADER_MAX}
            onChange={(event) => setPreheader(event.target.value)}
            placeholder="Ex. : Livraison offerte jusqu'au 20 décembre"
            autoComplete="off"
          />
        </Field>
        <UnknownWarning keys={unknownPreheader} />

        <div className="overflow-hidden rounded-xl border border-[#EEEFF1] bg-white dark:border-[#232323]">
          <p className="border-b border-[#EEEFF1] bg-[#fafafa] px-4 py-1.5 text-[11px] font-medium tracking-wide text-[#6b7280] uppercase">
            Dans la boîte de réception
          </p>
          <InboxRow
            fromName={campaign.fromName}
            subject={fillVariables(subject, examples, variables)}
            preheader={fillVariables(preheader, examples, variables)}
          />
        </div>
      </div>
    </SetupSection>
  );
}
