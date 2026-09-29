"use client";

import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import ColorField from "./ColorField";
import { Row, Section, SwitchRow } from "./controls";

/**
 * Un extra : section de la plateforme, interrupteur dans un encadré gris,
 * puis ses réglages une fois activé.
 */
function Extra({
  id,
  name,
  title,
  switchLabel,
  description,
  enabled,
  onToggle,
  children,
}) {
  return (
    <Section id={id} title={title}>
      <SwitchRow
        id={`sig-${name}-switch`}
        label={switchLabel}
        description={description}
        checked={enabled}
        onCheckedChange={onToggle}
      />
      {enabled && <div className="space-y-4">{children}</div>}
    </Section>
  );
}

/**
 * Panneau « Extras » : bouton d'action, bandeau, mention légale.
 */
export default function ExtrasPanel({ sig, update }) {
  const { cta, banner, disclaimer, images, style } = sig;

  return (
    <div className="space-y-8">
      <Extra
        id="sig-field-cta"
        name="cta"
        title="Bouton d'action"
        switchLabel="Afficher un bouton"
        description="Un lien mis en avant : prise de rendez-vous, site, catalogue…"
        enabled={cta.enabled}
        onToggle={(v) => update({ cta: { enabled: v } })}
      >
        <Row label="Texte du bouton" htmlFor="sig-cta-label">
          <Input
            id="sig-cta-label"
            value={cta.label}
            maxLength={60}
            placeholder="Prendre rendez-vous"
            onChange={(e) => update({ cta: { label: e.target.value } })}
          />
        </Row>
        <Row label="Lien" htmlFor="sig-cta-url">
          <Input
            id="sig-cta-url"
            value={cta.url}
            placeholder="calendly.com/votre-nom"
            onChange={(e) => update({ cta: { url: e.target.value } })}
          />
        </Row>
        <div className="grid grid-cols-2 gap-4">
          <Row label="Fond">
            <ColorField
              value={cta.backgroundColor || style.primaryColor}
              onChange={(v) => update({ cta: { backgroundColor: v } })}
            />
          </Row>
          <Row label="Texte">
            <ColorField
              value={cta.textColor}
              onChange={(v) => update({ cta: { textColor: v } })}
            />
          </Row>
        </div>
      </Extra>

      <Extra
        name="banner"
        title="Bandeau"
        switchLabel="Afficher le bandeau"
        description={
          images.banner
            ? "Une image pleine largeur sous la signature, cliquable."
            : "Ajoutez d'abord une image de bandeau dans l'onglet Contenu."
        }
        enabled={banner.enabled}
        onToggle={(v) => update({ banner: { enabled: v } })}
      >
        <Row label="Lien au clic" htmlFor="sig-banner-url">
          <Input
            id="sig-banner-url"
            value={banner.url}
            placeholder="votre-site.fr/offre"
            onChange={(e) => update({ banner: { url: e.target.value } })}
          />
        </Row>
        <Row label="Texte alternatif" htmlFor="sig-banner-alt">
          <Input
            id="sig-banner-alt"
            value={banner.alt}
            maxLength={120}
            placeholder="Description de l'image"
            onChange={(e) => update({ banner: { alt: e.target.value } })}
          />
        </Row>
      </Extra>

      <Extra
        id="sig-field-disclaimer"
        name="disclaimer"
        title="Mention"
        switchLabel="Afficher une mention"
        description="Confidentialité, mention légale ou message écologique, en petit."
        enabled={disclaimer.enabled}
        onToggle={(v) => update({ disclaimer: { enabled: v } })}
      >
        <Row label="Texte de la mention" htmlFor="sig-disclaimer-text">
          <Textarea
            id="sig-disclaimer-text"
            value={disclaimer.text}
            maxLength={1000}
            rows={3}
            placeholder="Ce message et ses pièces jointes sont confidentiels…"
            onChange={(e) => update({ disclaimer: { text: e.target.value } })}
          />
        </Row>
      </Extra>
    </div>
  );
}
