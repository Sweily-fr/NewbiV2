"use client";

import { Textarea } from "@/src/components/ui/textarea";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { generateDynamicFooter } from "@/src/utils/document-suggestions";
import ColorField from "./ColorField";
import {
  AddChips,
  CheckedInput,
  ResetLink,
  Row,
  Section,
  SwitchRow,
  Warning,
} from "./controls";
import {
  ctaLabelProblem,
  ctaLinkHint,
  ctaLinkProblem,
  linkProblem,
} from "../links";
import ImageField from "./ImageField";

/**
 * Texte lisible sur un fond : blanc ou #1f1f1f, celui qui contraste le plus
 * (formule WCAG), comme le texte automatique du bouton dans le rendu.
 */
function readableOn(background) {
  const hex = /^#?([0-9a-f]{6})$/i.exec(String(background || "").trim());
  const luminance = (c) => {
    const channel = (i) => {
      const v = parseInt(c.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  };
  const l = luminance(hex ? hex[1] : "000000");
  const onDark = (l + 0.05) / (luminance("1f1f1f") + 0.05);
  return onDark > 1.05 / (l + 0.05) ? "#1f1f1f" : "#ffffff";
}

/**
 * Couleurs du bouton d'action. Vides, elles sont automatiques : le fond
 * suit la couleur principale (changer celle-ci ou appliquer un modèle
 * recolore le bouton), le texte est blanc ou foncé selon ce fond. Une
 * couleur choisie à la main se retire par « Couleur principale » ou
 * « Automatique ». Partagé avec le panneau du bouton.
 */
export function CtaColorFields({ cta, primaryColor, update }) {
  const background = cta.backgroundColor || primaryColor;
  return (
    <div className="grid grid-cols-2 gap-4">
      <Row
        label="Fond"
        hint={cta.backgroundColor ? null : "Suit la couleur principale."}
        action={
          cta.backgroundColor ? (
            <ResetLink onClick={() => update({ cta: { backgroundColor: "" } })}>
              Couleur principale
            </ResetLink>
          ) : null
        }
      >
        <ColorField
          label="Fond du bouton"
          value={background}
          onChange={(v) => update({ cta: { backgroundColor: v } })}
        />
      </Row>
      <Row
        label="Texte"
        hint={cta.textColor ? null : "Blanc ou foncé selon le fond."}
        action={
          cta.textColor ? (
            <ResetLink onClick={() => update({ cta: { textColor: "" } })}>
              Automatique
            </ResetLink>
          ) : null
        }
      >
        <ColorField
          label="Texte du bouton"
          value={cta.textColor || readableOn(background)}
          onChange={(v) => update({ cta: { textColor: v } })}
        />
      </Row>
    </div>
  );
}

/** Espace insécable : « 5 000 € » ou un groupe de chiffres ne se coupe pas. */
const NBSP = "\u00a0";

/** Textes prêts à insérer dans la mention : sobres, sans promesse juridique. */
const CONFIDENTIALITY =
  "Ce message et ses pièces jointes sont confidentiels et destinés exclusivement à leurs destinataires. Si vous l'avez reçu par erreur, merci d'en avertir l'expéditeur et de le supprimer.";
const ECOLOGY = `Pensez à l'environnement${NBSP}: n'imprimez ce message que si nécessaire.`;

/**
 * Mentions légales de l'entreprise, comme en pied de page des factures
 * (forme juridique, capital, SIRET, RCS, siège, TVA), avec des espaces
 * insécables dans les groupes de chiffres et devant « € » et « : ». Vide
 * sans SIRET ni RCS : rien de légal à mentionner.
 */
export function legalMention(organization) {
  if (!organization?.siret && !organization?.rcs) return "";
  return generateDynamicFooter(organization, "standard-compact")
    .replace(/^\s*•\s*/, "")
    .replace(/(\d) (?=\d)/g, `$1${NBSP}`)
    .replace(/(\d) ?€/g, `$1${NBSP}€`)
    .replace(/(\S) ?: /g, `$1${NBSP}: `)
    .trim();
}

/** Lignes de la mention gardées par le rendu (une ligne vide au plus). */
const MAX_LINES = 8;
const lineCount = (text) =>
  String(text || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .split("\n").length;

/**
 * Texte de la mention, en paragraphes, et des textes prêts à insérer :
 * confidentialité, mentions légales de l'entreprise, écologie. Champ vide,
 * le texte le remplit ; sinon il s'ajoute en nouveau paragraphe (⌘Z
 * l'annule). Partagé avec le panneau de la mention.
 */
export function DisclaimerField({ id, value, onChange, placeholder }) {
  const { organization } = useActiveOrganization();
  const legal = legalMention(organization);
  const snippets = [
    { key: "confidentiality", label: "Confidentialité", text: CONFIDENTIALITY },
    legal ? { key: "legal", label: "Mentions légales", text: legal } : null,
    { key: "ecology", label: "Écologie", text: ECOLOGY },
  ].filter(Boolean);
  const text = value || "";
  const insert = (snippet) => {
    const current = text.replace(/\s+$/, "");
    // Déjà dans la mention : rien à ajouter
    if (current.includes(snippet)) return;
    onChange((current ? `${current}\n\n${snippet}` : snippet).slice(0, 1000));
  };
  return (
    <div className="space-y-2">
      <Textarea
        id={id}
        value={text}
        maxLength={1000}
        rows={3}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
        <span>Insérer :</span>
        {snippets.map((s, i) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">·</span>}
            <button
              type="button"
              title={s.text}
              onClick={() => insert(s.text)}
              className="font-medium text-[#5b4fff] hover:underline cursor-pointer"
            >
              {s.label}
            </button>
          </span>
        ))}
      </p>
      {text.trim() && lineCount(text) > MAX_LINES && (
        <Warning>
          Au-delà de 8 lignes, la fin de la mention n&apos;apparaît pas dans
          la signature.
        </Warning>
      )}
    </div>
  );
}

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
      description:
        "Un lien mis en avant : prise de rendez-vous, site, appel, e-mail…",
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
          <Row label="Lien" htmlFor="sig-cta-url" hint={ctaLinkHint(cta.url)}>
            <CheckedInput
              id="sig-cta-url"
              value={cta.url}
              placeholder="calendly.com/votre-nom"
              warning={ctaLinkProblem(cta)}
              onChange={(e) => update({ cta: { url: e.target.value } })}
            />
          </Row>
          <CtaColorFields
            cta={cta}
            primaryColor={style.primaryColor}
            update={update}
          />
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
          <DisclaimerField
            id="sig-disclaimer-text"
            value={disclaimer.text}
            placeholder="Ce message et ses pièces jointes sont confidentiels…"
            onChange={(text) => update({ disclaimer: { text } })}
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
