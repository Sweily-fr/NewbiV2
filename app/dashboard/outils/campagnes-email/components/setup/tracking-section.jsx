"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import {
  formatCount,
  isCampaignTracked,
  plural,
  privacyPolicyUrlError,
} from "@/src/utils/email-campaigns";
import { CARD_CLASS } from "../shared";
import { TrackingConsentsSheet } from "../tracking-consents-sheet";
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
 * enregistré dès le changement. Activé, il ne s'applique qu'aux contacts
 * qui l'ont accepté (accords de suivi de l'espace, gérés dans une fenêtre
 * latérale) ; les autres reçoivent le même e-mail sans suivi.
 * `audienceCount` : décompte de l'audience enregistrée (trackingGranted sur
 * sendable). `canEditConsents` : droit de saisir des accords, que la
 * campagne soit modifiable ou non (ils valent pour tout l'espace).
 */
export function TrackingSection({
  campaign,
  canEdit,
  onSave,
  workspaceId,
  audienceCount,
  canEditConsents = false,
}) {
  const [saving, setSaving] = useState(null);
  const [consentsOpen, setConsentsOpen] = useState(false);
  const editable = canEdit && campaign.status === "DRAFT";
  const tracked = isCampaignTracked(campaign);
  const granted = audienceCount?.trackingGranted;
  const sendable = audienceCount?.sendable;
  const share =
    Number.isFinite(granted) && Number.isFinite(sendable)
      ? `${formatCount(granted)} sur ${plural(sendable, "destinataire")} de cette campagne`
      : null;

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
            Désactivé par défaut. Activé, il ne concerne que les contacts qui
            l&apos;ont accepté.
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
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <p>
              Le suivi ne s&apos;applique qu&apos;aux contacts qui l&apos;ont
              accepté
              {share ? (
                <>
                  {" "}
                  : <span className="font-medium">{share}</span>
                </>
              ) : null}
              . Les autres reçoivent le même e-mail, sans suivi. Chaque e-mail
              contient un lien « Gérer mes préférences » pour accepter ou
              refuser ; un refus efface ce qui a déjà été enregistré. Le détail
              par destinataire est effacé au bout de 13 mois.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 bg-white dark:bg-transparent"
              onClick={() => setConsentsOpen(true)}
            >
              <ShieldCheck className="size-3.5" aria-hidden />
              Gérer les accords
            </Button>
          </div>
          <PrivacyPolicyField
            campaign={campaign}
            editable={editable}
            onSave={onSave}
          />
        </div>
      )}
      <TrackingConsentsSheet
        open={consentsOpen}
        onOpenChange={setConsentsOpen}
        workspaceId={workspaceId}
        canEdit={canEditConsents}
      />
    </section>
  );
}
