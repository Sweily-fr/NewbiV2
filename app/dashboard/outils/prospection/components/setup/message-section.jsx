"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import { Input } from "@/src/components/ui/input";
import { GET_PROSPECTING_SIGNATURES } from "@/src/graphql/prospectingQueries";
import { unknownVariables } from "@/src/utils/email-campaign-variables";
import { NO_SIGNATURE, bodyExcerpt } from "@/src/utils/prospecting";
import { useRichTextEditor } from "@/app/dashboard/outils/campagnes-email/components/editor/rich-text-editor";
import {
  VariableMenu,
  insertIntoField,
} from "@/app/dashboard/outils/campagnes-email/components/variable-menu";
import {
  TextWithVariables,
  UnknownWarning,
} from "@/app/dashboard/outils/campagnes-email/components/setup/subject-section";
import {
  Field,
  SetupSection,
} from "@/app/dashboard/outils/campagnes-email/components/setup/setup-section";
import { SignatureSelect } from "../mailbox-settings-sheet";

const SUBJECT_MAX = 200;

// Texte d'un e-mail simple (gras, italique, liens, listes), variables en
// pastille ; mêmes balises que celles gardées par l'API
export const MESSAGE_RICH_CLASS =
  "break-words text-sm leading-6 text-foreground [&_a]:text-[#5a50ff] [&_a]:underline dark:[&_a]:text-[#8b7fff] [&_strong]:font-semibold [&_b]:font-semibold [&_em]:italic [&_i]:italic [&_p]:m-0 [&_p]:mb-3 [&_ul]:m-0 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:m-0 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_li_p]:mb-0 [&>:last-child]:mb-0 [&_.ec-var]:rounded-[4px] [&_.ec-var]:bg-[#5a50ff]/10 [&_.ec-var]:px-[3px] [&_.ec-var]:text-[#4a41e0] dark:[&_.ec-var]:bg-[#8b7fff]/15 dark:[&_.ec-var]:text-[#c9c3ff]";

/** Éditeur du message : barre de mise en forme et texte, dans un cadre. */
function MessageEditor({ html, onChange, variables }) {
  const { content, toolbar } = useRichTextEditor({
    html,
    onChange,
    variables,
    allowLists: true,
    allowUnderline: false,
    allowStrike: false,
    linkProtocols: ["http", "https", "mailto"],
    placeholder: "Écrivez votre message",
    richClass: MESSAGE_RICH_CLASS,
  });
  return (
    <div className="overflow-hidden rounded-[9px] border border-[#e6e7ea] transition-[border] focus-within:border-[#D1D3D8] dark:border-[#2E2E32] dark:focus-within:border-[#44444A]">
      <div className="flex border-b border-[#EEEFF1] bg-[#fafafa] p-1.5 dark:border-[#232323] dark:bg-white/[0.02]">
        {toolbar}
      </div>
      <div className="max-h-[440px] min-h-[220px] overflow-y-auto px-3.5 py-3">
        {content}
      </div>
    </div>
  );
}

/**
 * Message : objet, texte simple (variables, liens, listes) et signature.
 * `onDraftChange` : saisie en cours, pour l'aperçu (null hors modification).
 */
export function MessageSection({
  sequence,
  complete,
  canEdit,
  variables,
  onSave,
  onDraftChange,
}) {
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [signatureId, setSignatureId] = useState(NO_SIGNATURE);
  const [saving, setSaving] = useState(false);
  const subjectRef = useRef(null);

  const { data: signaturesData } = useQuery(GET_PROSPECTING_SIGNATURES, {
    skip: !sequence.signatureId,
    fetchPolicy: "cache-and-network",
    context: { skipErrorToast: true },
  });
  const signatureName = sequence.signatureId
    ? signaturesData?.emailSignaturesV2?.find(
        (item) => item.id === sequence.signatureId,
      )?.name || "Signature choisie"
    : null;

  useEffect(() => {
    onDraftChange?.(editing ? { subject, body } : null);
  }, [editing, subject, body, onDraftChange]);

  const startEdit = () => {
    setSubject(sequence.subject || "");
    setBody(sequence.body || "");
    setSignatureId(sequence.signatureId || NO_SIGNATURE);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    const ok = await onSave({
      subject: subject.trim(),
      body,
      signatureId: signatureId === NO_SIGNATURE ? null : signatureId,
    });
    setSaving(false);
    if (ok) setEditing(false);
  };

  const excerpt = bodyExcerpt(sequence.body, 160);
  const summary = sequence.subject ? (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate font-medium text-foreground">
        <TextWithVariables text={sequence.subject} />
      </span>
      {excerpt ? (
        <span className="line-clamp-2">
          <TextWithVariables text={excerpt} />
        </span>
      ) : (
        <span className="text-amber-700 dark:text-amber-400">
          Écrivez le message.
        </span>
      )}
      <span className="text-xs">
        {signatureName ? `Signature : ${signatureName}` : "Sans signature"}
      </span>
    </div>
  ) : (
    <span className="text-amber-700 dark:text-amber-400">
      Écrivez l&apos;objet et le message.
    </span>
  );

  return (
    <SetupSection
      id="message"
      step={3}
      title="Message"
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
          htmlFor="prospecting-subject"
          action={
            <VariableMenu
              variables={variables}
              onInsert={(token) =>
                insertIntoField(subjectRef, subject, setSubject, token)
              }
            />
          }
          hint="Court et personnel, comme un e-mail écrit à la main : ni majuscules ni points d'exclamation."
        >
          <Input
            ref={subjectRef}
            id="prospecting-subject"
            value={subject}
            maxLength={SUBJECT_MAX}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Ex. : Une question sur vos chantiers"
            autoComplete="off"
          />
        </Field>
        <UnknownWarning keys={unknownVariables(subject, variables)} />

        <Field
          label="Message"
          hint="Quelques lignes, une seule question à la fin : un message simple, sans image, arrive mieux. Votre entreprise, le lien de désinscription et la page « Vos données » sont ajoutés en pied de message."
        >
          <MessageEditor html={body} onChange={setBody} variables={variables} />
        </Field>
        <UnknownWarning keys={unknownVariables(body, variables)} />

        <Field
          label="Signature"
          htmlFor="prospecting-signature"
          hint="Votre signature Newbi, ajoutée sous le message."
        >
          <SignatureSelect
            id="prospecting-signature"
            value={signatureId}
            onChange={setSignatureId}
            skip={!editing}
          />
        </Field>
      </div>
    </SetupSection>
  );
}
