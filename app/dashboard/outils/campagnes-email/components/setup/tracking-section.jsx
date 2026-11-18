"use client";

import { useState } from "react";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { CARD_CLASS } from "../shared";
import { StepIcon } from "./setup-section";

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

/**
 * Suivi des ouvertures et des clics : enregistré dès le changement (rien
 * d'autre à saisir), toujours complet.
 */
export function TrackingSection({ campaign, canEdit, onSave }) {
  const [saving, setSaving] = useState(null);
  const editable = canEdit && campaign.status === "DRAFT";

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
            Mesurez qui ouvre l&apos;e-mail et clique sur ses liens.
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
    </section>
  );
}
