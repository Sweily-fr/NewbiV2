"use client";

import { Textarea } from "@/src/components/ui/textarea";
import ColorField from "./ColorField";
import { AddChips, CheckedInput, Row, Section, SwitchRow } from "./controls";
import { ctaLabelProblem, ctaLinkProblem, linkProblem } from "../links";
import ImageField from "./ImageField";

/**
 * « En plus », en bas de l'onglet Contenu : bouton d'action, bannière,
 * mention. Absents, ce sont de petits boutons « + Bouton d'action »… ;
 * ajoutés, leur encadré s'ouvre avec ses réglages, et son interrupteur
 * les retire.
 */
export default function ExtrasSection({ id, sig, update, replace }) {
  const { cta, banner, disclaimer, images, style } = sig;
  const extras = [
    {
      key: "cta",
      label: "Bouton d'action",
      description: "Un lien mis en avant : prise de rendez-vous, site, catalogue…",
      enabled: cta.enabled,
      toggle: (v) => update({ cta: { enabled: v } }),
      focus: "sig-cta-label",
      fields: (
        <>
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
        </>
      ),
    },
    {
      key: "banner",
      label: "Bannière",
      description: "Une image large sous la signature : offre, événement, salon…",
      enabled: banner.enabled,
      toggle: (v) => update({ banner: { enabled: v } }),
      focus: "sig-field-banner",
      fields: (
        <>
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
        </>
      ),
    },
    {
      key: "disclaimer",
      label: "Mention",
      description: "Confidentialité, mention légale ou message écologique, en petit.",
      enabled: disclaimer.enabled,
      toggle: (v) => update({ disclaimer: { enabled: v } }),
      focus: "sig-disclaimer-text",
      fields: (
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
      ),
    },
  ];
  const add = (key) => {
    const extra = extras.find((x) => x.key === key);
    extra.toggle(true);
    setTimeout(() => document.getElementById(extra.focus)?.focus(), 60);
  };

  return (
    <Section
      id="sig-field-extras"
      title="En plus"
      description="Un bouton, une bannière ou une mention sous la signature."
    >
      {extras
        .filter((x) => x.enabled)
        .map((x) => (
          <div key={x.key} id={`sig-extra-${x.key}`}>
            <SwitchRow
              id={`sig-${x.key}-switch`}
              label={x.label}
              description={x.description}
              checked
              onCheckedChange={x.toggle}
            >
              {x.fields}
            </SwitchRow>
          </div>
        ))}
      <AddChips items={extras.filter((x) => !x.enabled)} onAdd={add} />
    </Section>
  );
}
