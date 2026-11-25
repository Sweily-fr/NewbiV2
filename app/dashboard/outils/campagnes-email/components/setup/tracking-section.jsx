"use client";

import { useEffect, useState } from "react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import {
  isCampaignTracked,
  privacyPolicyUrlError,
} from "@/src/utils/email-campaigns";
import { CARD_CLASS } from "../shared";
import { Field, StepIcon } from "./setup-section";

function TrackingRow({ id, label, description, checked, disabled, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        className="mt-0.5 data-[state=checked]:bg-[#5a50ff]"
      />
    </div>
  );
}

/** Lien vers la politique de confidentialité, enregistré en quittant le champ. */
function PrivacyPolicyField({ campaign, editable, onSave }) {
  const saved = campaign.privacyPolicyUrl || "";
  const [value, setValue] = useState(saved);
  const [saving, setSaving] = useState(false);

  useEffect(() => setValue(saved), [saved]);

  const error = privacyPolicyUrlError(value);
  const save = async () => {
    const next = value.trim();
    if (error || next === saved) return;
    setSaving(true);
    await onSave({ privacyPolicyUrl: next }, { quiet: true });
    setSaving(false);
  };

  return (
    <Field
      label="Lien vers votre politique de confidentialité"
      htmlFor="privacy-policy-url"
      error={error}
      hint="Recommandé : il est ajouté à côté de la phrase qui annonce le suivi."
    >
      <Input
        id="privacy-policy-url"
        type="url"
        inputMode="url"
        placeholder="https://votre-site.fr/confidentialite"
        value={value}
        disabled={!editable || saving}
        aria-invalid={Boolean(error)}
        onChange={(event) => setValue(event.target.value)}
        onBlur={save}
        autoComplete="off"
      />
    </Field>
  );
}

/**
 * Suivi des ouvertures et des clics : coupé par défaut (recommandation CNIL
 * sur les pixels de suivi : accord préalable de chaque destinataire),
 * enregistré dès le changement. Activé, l'envoi demande d'attester cet
 * accord et une phrase en bas de l'e-mail l'annonce aux destinataires.
 */
export function TrackingSection({ campaign, canEdit, onSave }) {
  const [saving, setSaving] = useState(null);
  const editable = canEdit && campaign.status === "DRAFT";
  const tracked = isCampaignTracked(campaign);

  const toggle = async (field, value) => {
    setSaving(field);
    await onSave({ [field]: value }, { quiet: true });
    setSaving(null);
  };

  return (
    <section
      id="suivi"
      aria-labelledby="suivi-title"
      className={`${CARD_CLASS} p-4 sm:p-5`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <StepIcon complete step={5} />
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 id="suivi-title" className="text-[15px] leading-6 font-medium">
            Suivi
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Désactivé par défaut : n&apos;activez le suivi que si vos
            destinataires l&apos;ont accepté.
          </p>
        </div>
      </div>
      <div className="mt-4 divide-y divide-[#EEEFF1] sm:pl-11 dark:divide-[#232323]">
        <TrackingRow
          id="track-opens"
          label="Suivre les ouvertures"
          description="Une image invisible indique qui a ouvert l'e-mail. Certaines messageries (Apple Mail) gonflent ce chiffre en ouvrant les e-mails elles-mêmes."
          checked={campaign.trackOpens}
          disabled={!editable || saving === "trackOpens"}
          onChange={(value) => toggle("trackOpens", value)}
        />
        <TrackingRow
          id="track-clicks"
          label="Suivre les clics"
          description="Les liens passent par Newbi pour compter les clics, puis mènent directement à la bonne page."
          checked={campaign.trackClicks}
          disabled={!editable || saving === "trackClicks"}
          onChange={(value) => toggle("trackClicks", value)}
        />
      </div>
      {tracked && (
        <div className="mt-4 flex flex-col gap-4 sm:pl-11">
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            La CNIL exige l&apos;accord préalable de chaque destinataire pour ce
            suivi, clients compris. À l&apos;envoi, vous confirmerez
            l&apos;avoir obtenu ; une phrase en bas de l&apos;e-mail
            l&apos;annonce, et le détail par destinataire est effacé au bout de
            13 mois.
          </p>
          <PrivacyPolicyField
            campaign={campaign}
            editable={editable}
            onSave={onSave}
          />
        </div>
      )}
    </section>
  );
}
