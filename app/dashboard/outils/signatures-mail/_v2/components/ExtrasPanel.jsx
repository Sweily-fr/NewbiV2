"use client";

import { Textarea } from "@/src/components/ui/textarea";
import ColorField from "./ColorField";
import { CheckedInput, Row, Section, SwitchRow } from "./controls";
import { ctaLabelProblem, ctaLinkProblem, linkProblem } from "../links";
import { ImageField } from "./ContentPanel";

/**
 * Un extra : section de la plateforme, interrupteur dans un encadré gris,
 * ses réglages dépliés dessous une fois activé.
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
      >
        {children}
      </SwitchRow>
    </Section>
  );
}

/**
 * Panneau « Extras » : bouton d'action, bannière (image comprise), mention
 * légale.
 */
export default function ExtrasPanel({ id, sig, update, replace }) {
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
          <CheckedInput
            id="sig-cta-label"
            value={cta.label}
            maxLength={60}
            placeholder="Prendre rendez-vous"
            warning={ctaLabelProblem(cta)}
            onChange={(e) => update({ cta: { label: e.target.value } })}
          />
        </Row>
        <Row label="Lien" htmlFor="sig-cta-url">
          <CheckedInput
            id="sig-cta-url"
            value={cta.url}
            placeholder="calendly.com/votre-nom"
            warning={ctaLinkProblem(cta)}
            onChange={(e) => update({ cta: { url: e.target.value } })}
          />
        </Row>
        <div className="grid grid-cols-2 gap-4">
          <Row label="Fond">
            <ColorField
              label="Fond du bouton"
              value={cta.backgroundColor || style.primaryColor}
              onChange={(v) => update({ cta: { backgroundColor: v } })}
            />
          </Row>
          <Row label="Texte">
            <ColorField
              label="Texte du bouton"
              value={cta.textColor}
              onChange={(v) => update({ cta: { textColor: v } })}
            />
          </Row>
        </div>
      </Extra>

      <Extra
        name="banner"
        title="Bannière"
        switchLabel="Afficher une bannière"
        description="Une image large sous la signature : offre, événement, salon…"
        enabled={banner.enabled}
        onToggle={(v) => update({ banner: { enabled: v } })}
      >
        <ImageField
          id={id}
          kind="BANNER"
          fieldId="sig-field-banner"
          label="Image"
          hint="Une image large (1200 px de large par exemple), en JPG ou PNG."
          image={images.banner}
          onChanged={replace}
          aspect="wide"
        />
        <Row label="Lien au clic" htmlFor="sig-banner-url">
          <CheckedInput
            id="sig-banner-url"
            value={banner.url}
            placeholder="votre-site.fr/offre"
            warning={linkProblem(banner.url)}
            onChange={(e) => update({ banner: { url: e.target.value } })}
          />
        </Row>
        <Row
          label="Texte de remplacement"
          htmlFor="sig-banner-alt"
          hint="Affiché quand la messagerie bloque les images."
        >
          <CheckedInput
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
