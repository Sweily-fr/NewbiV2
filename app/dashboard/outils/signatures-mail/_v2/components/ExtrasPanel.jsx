"use client";

import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Textarea } from "@/src/components/ui/textarea";
import { ColorPicker } from "@/src/components/ui/color-picker";

function Section({ title, description, enabled, onToggle, children }) {
  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          {description && (
            <p className="text-[11px] leading-snug text-muted-foreground">{description}</p>
          )}
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          className="scale-75 data-[state=checked]:bg-[#5a50ff]"
        />
      </div>
      {enabled && <div className="space-y-3">{children}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/**
 * Panneau « Extras » : bouton d'action, bandeau, mention légale.
 */
export default function ExtrasPanel({ sig, update }) {
  const { cta, banner, disclaimer, images, style } = sig;

  return (
    <div className="space-y-4">
      <Section
        title="Bouton d'action"
        description="Un lien mis en avant : prise de rendez-vous, site, catalogue…"
        enabled={cta.enabled}
        onToggle={(v) => update({ cta: { enabled: v } })}
      >
        <Field label="Texte du bouton">
          <Input
            value={cta.label}
            maxLength={60}
            placeholder="Prendre rendez-vous"
            onChange={(e) => update({ cta: { label: e.target.value } })}
          />
        </Field>
        <Field label="Lien">
          <Input
            value={cta.url}
            placeholder="calendly.com/votre-nom"
            onChange={(e) => update({ cta: { url: e.target.value } })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fond">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {cta.backgroundColor || style.primaryColor}
              </span>
              <ColorPicker
                color={cta.backgroundColor || style.primaryColor}
                onChange={(v) => update({ cta: { backgroundColor: v } })}
                align="start"
              />
            </div>
          </Field>
          <Field label="Texte">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{cta.textColor}</span>
              <ColorPicker
                color={cta.textColor}
                onChange={(v) => update({ cta: { textColor: v } })}
                align="start"
              />
            </div>
          </Field>
        </div>
      </Section>

      <Section
        title="Bandeau"
        description={
          images.banner
            ? "Une image pleine largeur sous la signature, cliquable."
            : "Ajoutez d'abord une image de bandeau dans l'onglet Contenu."
        }
        enabled={banner.enabled}
        onToggle={(v) => update({ banner: { enabled: v } })}
      >
        <Field label="Lien au clic">
          <Input
            value={banner.url}
            placeholder="votre-site.fr/offre"
            onChange={(e) => update({ banner: { url: e.target.value } })}
          />
        </Field>
        <Field label="Texte alternatif">
          <Input
            value={banner.alt}
            maxLength={120}
            placeholder="Description de l'image"
            onChange={(e) => update({ banner: { alt: e.target.value } })}
          />
        </Field>
      </Section>

      <Section
        title="Mention"
        description="Confidentialité, mention légale ou message écologique, en petit."
        enabled={disclaimer.enabled}
        onToggle={(v) => update({ disclaimer: { enabled: v } })}
      >
        <Textarea
          value={disclaimer.text}
          maxLength={1000}
          rows={3}
          placeholder="Ce message et ses pièces jointes sont confidentiels…"
          onChange={(e) => update({ disclaimer: { text: e.target.value } })}
        />
      </Section>
    </div>
  );
}
