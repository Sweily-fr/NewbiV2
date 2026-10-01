"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Textarea } from "@/src/components/ui/textarea";
import { PhotoBorderControls } from "./StylePanel";
import {
  CheckedInput,
  Choice,
  ColorRow,
  Hint,
  Nested,
  Row,
  Section,
  SliderRow,
  SwitchRow,
} from "./controls";
import TextStyleControls from "./TextStyleControls";
import { PartLinks, PlaceRow } from "./LevelPanels";
import {
  RULE_COLORS,
  elementSlot,
  removeRule,
  shownItems,
  slotLabel,
} from "../slots";
import { Field, ImageField, SocialLinks, TextField } from "./ContentPanel";
import ColorField from "./ColorField";
import BlockControls from "./BlockControls";
import {
  ctaLabelProblem,
  ctaLinkProblem,
  emailProblem,
  linkProblem,
} from "../links";
import {
  AccentControls,
  ContactStyleControl,
  DividerControls,
  FooterPairControl,
  IdentityControls,
  IdentityZoneControl,
  LogoPositionControl,
  LogoWidthRow,
  PhotoLayoutControls,
  SocialPositionControl,
  SocialRowsControl,
  TitleStyleControl,
} from "./LayoutControls";

/** Élément de la signature piloté par chaque champ cliquable de l'aperçu. */
export const FIELD_ELEMENT = {
  firstName: "name",
  lastName: "name",
  // Repères d'éléments (data-sig-block) sans champ propre
  name: "name",
  title: "jobTitle",
  accent: "accent",
  jobTitle: "jobTitle",
  company: "company",
  tagline: "tagline",
  phone: "contact",
  mobile: "contact",
  email: "contact",
  website: "contact",
  address: "contact",
  social: "social",
  photo: "photo",
  logo: "logo",
  banner: "banner",
  cta: "cta",
  disclaimer: "disclaimer",
  rule1: "rule1",
  rule2: "rule2",
  rule3: "rule3",
};

/**
 * « Disposition » d'un élément : repliée par défaut (le panneau s'ouvre sur
 * son contenu et sa mise en forme), choix gardé pendant la session.
 */
let layoutOpenPref = false;

/** Éléments dont la place se choisit dans une liste (les autres ont la leur). */
const PLACE_IN_LIST = new Set([
  "name",
  "accent",
  "jobTitle",
  "company",
  "tagline",
  "contact",
  "cta",
  "banner",
  "disclaimer",
  "rule1",
  "rule2",
  "rule3",
]);

/**
 * Panneau d'un élément de l'aperçu : son contenu et tous ses réglages au
 * même endroit. `onSelect(sélection)` : ouvre une partie seule (prénom, une
 * ligne de coordonnées).
 */
export default function ElementPanel({
  element,
  id,
  sig,
  update,
  replace,
  catalog,
  resolved,
  lines,
  onSelect,
}) {
  const { identity, contact, images, style: st, cta, banner, disclaimer } = sig;
  const setStyle = (patch) => update({ style: patch });
  const textProps = { sig, update, resolved, catalog };
  const [layoutOpen, setLayoutOpen] = useState(layoutOpenPref);
  const place = slotLabel(elementSlot(st, shownItems(sig), element), st);
  // Plafonds du modèle : les curseurs s'arrêtent à ce qui s'affiche
  const photoMax = lines?.photoMax || 160;
  const iconMax = lines?.iconMax || 40;

  // Trois parties pour chaque élément : Contenu, Mise en forme (dans
  // `body`) puis Disposition (`layout`, suivie de sa largeur, de ses espaces
  // et de son alignement)
  let body = null;
  let layout = null;
  switch (element) {
    case "name":
      body = (
        <>
          <Section title="Contenu">
            <div className="grid grid-cols-2 gap-4">
              <TextField
                id="sig-field-firstName"
                label="Prénom"
                value={identity.firstName}
                onChange={(v) => update({ identity: { firstName: v } })}
                maxLength={80}
              />
              <TextField
                label="Nom"
                value={identity.lastName}
                onChange={(v) => update({ identity: { lastName: v } })}
                maxLength={80}
              />
            </div>
          </Section>
          {/* Le prénom ou le nom seul : son propre niveau (clic dans
              l'aperçu, ou ce raccourci) */}
          <TextStyleControls
            elementKey="name"
            {...textProps}
            intro={<PartLinks element="name" sig={sig} onSelect={onSelect} />}
          />
        </>
      );
      layout = (
        <>
          <IdentityZoneControl st={st} setStyle={setStyle} />
          <IdentityControls st={st} setStyle={setStyle} withTitle={false} />
        </>
      );
      break;
    case "accent":
      body = (
        <Section title="Mise en forme">
          <AccentControls st={st} setStyle={setStyle} lines={lines} />
        </Section>
      );
      break;
    case "jobTitle":
      body = (
        <>
          <Section title="Contenu">
            <TextField
              id="sig-field-jobTitle"
              label="Poste"
              value={identity.jobTitle}
              placeholder="Directrice artistique"
              onChange={(v) => update({ identity: { jobTitle: v } })}
              maxLength={120}
            />
            <TextField
              label="Service"
              value={identity.department}
              placeholder="Studio"
              onChange={(v) => update({ identity: { department: v } })}
              maxLength={120}
            />
          </Section>
          <TextStyleControls elementKey="jobTitle" {...textProps} />
        </>
      );
      layout = <TitleStyleControl st={st} setStyle={setStyle} />;
      break;
    case "company":
      body = (
        <>
          <Section title="Contenu">
            <TextField
              id="sig-field-company"
              label="Entreprise"
              value={identity.company}
              onChange={(v) => update({ identity: { company: v } })}
              maxLength={120}
            />
          </Section>
          <TextStyleControls elementKey="company" {...textProps} />
        </>
      );
      break;
    case "tagline":
      body = (
        <>
          <Section title="Contenu">
            <TextField
              id="sig-field-tagline"
              label="Accroche"
              value={identity.tagline}
              placeholder="Une phrase, en italique sous le nom"
              onChange={(v) => update({ identity: { tagline: v } })}
              maxLength={200}
            />
          </Section>
          <TextStyleControls elementKey="tagline" {...textProps} />
        </>
      );
      break;
    case "contact":
      body = (
        <>
          <Section title="Contenu">
            <TextField
              id="sig-field-email"
              label="E-mail"
              type="email"
              value={contact.email}
              onChange={(v) => update({ contact: { email: v } })}
              maxLength={200}
              warning={emailProblem(contact.email)}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                id="sig-field-phone"
                label="Téléphone"
                type="tel"
                value={contact.phone}
                onChange={(v) => update({ contact: { phone: v } })}
                maxLength={40}
              />
              <TextField
                id="sig-field-mobile"
                label="Mobile"
                type="tel"
                value={contact.mobile}
                onChange={(v) => update({ contact: { mobile: v } })}
                maxLength={40}
              />
            </div>
            <TextField
              id="sig-field-website"
              label="Site web"
              value={contact.website}
              onChange={(v) => update({ contact: { website: v } })}
              maxLength={300}
              warning={linkProblem(contact.website)}
            />
            <TextField
              id="sig-field-address"
              label="Adresse"
              value={contact.address}
              onChange={(v) => update({ contact: { address: v } })}
              maxLength={300}
            />
          </Section>
          <TextStyleControls
            elementKey="contact"
            {...textProps}
            intro={
              <PartLinks element="contact" sig={sig} onSelect={onSelect} />
            }
            footer={
              st.contactStyle === "icons" ? (
                <SliderRow
                  label="Taille des icônes"
                  value={st.contactIconSize || 16}
                  min={12}
                  max={32}
                  onChange={(v) => setStyle({ contactIconSize: v })}
                />
              ) : null
            }
          />
        </>
      );
      layout = (
        <ContactStyleControl st={st} setStyle={setStyle} label="Présentation" />
      );
      break;
    case "social":
      body = (
        <>
          <Section title="Contenu">
            <div id="sig-field-social" tabIndex={-1} className="outline-none" />
            <SocialLinks
              social={sig.social}
              networks={catalog?.networks || []}
              update={update}
            />
          </Section>
          <Section title="Mise en forme">
            <Row label="Forme">
              <Choice
                value={st.iconStyle}
                onChange={(v) => setStyle({ iconStyle: v })}
                options={[
                  { value: "circle", label: "Rond" },
                  { value: "rounded", label: "Arrondi" },
                  { value: "square", label: "Carré" },
                  { value: "plain", label: "Simple" },
                ]}
              />
            </Row>
            <Row label="Couleur">
              <Choice
                value={st.iconColorMode}
                onChange={(v) => setStyle({ iconColorMode: v })}
                options={[
                  { value: "brand", label: "Marque" },
                  { value: "primary", label: "Principale" },
                  { value: "custom", label: "Autre" },
                ]}
              />
            </Row>
            {st.iconColorMode === "custom" && (
              <Nested>
                <ColorRow
                  label="Couleur personnalisée"
                  value={st.iconColor}
                  onChange={(v) => setStyle({ iconColor: v })}
                />
              </Nested>
            )}
            <SliderRow
              label="Taille"
              value={Math.min(st.iconSize, iconMax)}
              min={16}
              max={iconMax}
              step={2}
              hint={
                iconMax < 40
                  ? `Ce modèle limite les icônes à ${iconMax} px.`
                  : null
              }
              onChange={(v) => setStyle({ iconSize: v })}
            />
          </Section>
        </>
      );
      layout = (
        <>
          <SocialRowsControl
            st={st}
            setStyle={setStyle}
            count={sig.social.filter((s) => s.url?.trim()).length}
          />
          <SocialPositionControl st={st} setStyle={setStyle} />
          <FooterPairControl st={st} setStyle={setStyle} shown={shownItems(sig)} />
        </>
      );
      break;
    case "photo":
      body = (
        <>
          <Section title="Contenu">
            <ImageField
              id={id}
              kind="PHOTO"
              fieldId="sig-field-photo"
              label="Photo"
              hint="Recadrée automatiquement en carré, nette sur écran retina."
              image={images.photo}
              onChanged={replace}
            />
          </Section>
          <Section title="Mise en forme">
            <Row label="Forme">
              <Choice
                value={st.photoShape}
                onChange={(v) => setStyle({ photoShape: v })}
                options={[
                  { value: "circle", label: "Ronde" },
                  { value: "rounded", label: "Arrondie" },
                  { value: "square", label: "Carrée" },
                ]}
              />
            </Row>
            <SliderRow
              label="Taille"
              value={Math.min(st.photoSize, photoMax)}
              min={40}
              max={photoMax}
              step={4}
              hint={
                photoMax < 160
                  ? `Ce modèle limite la photo à ${photoMax} px.`
                  : null
              }
              onChange={(v) => setStyle({ photoSize: v })}
            />
            <PhotoBorderControls st={st} setStyle={setStyle} />
          </Section>
        </>
      );
      layout = (
        <>
          <PhotoLayoutControls
            st={st}
            setStyle={setStyle}
            shown={shownItems(sig)}
          />
          <DividerControls
            st={st}
            setStyle={setStyle}
            lines={lines}
            shown={shownItems(sig)}
          />
        </>
      );
      break;
    case "logo":
      body = (
        <>
          <Section title="Contenu">
            <ImageField
              id={id}
              kind="LOGO"
              fieldId="sig-field-logo"
              label="Logo"
              hint="Privilégiez un PNG à fond transparent : il s'adapte à tous les clients mail, y compris en mode sombre."
              image={images.logo}
              onChanged={replace}
              aspect="logo"
            />
          </Section>
          <Section title="Mise en forme">
            <LogoWidthRow sig={sig} setStyle={setStyle} />
          </Section>
        </>
      );
      layout = (
        <>
          <LogoPositionControl st={st} setStyle={setStyle} />
          <FooterPairControl st={st} setStyle={setStyle} shown={shownItems(sig)} />
        </>
      );
      break;
    case "banner":
      body = (
        <Section title="Contenu">
          <ImageField
            id={id}
            kind="BANNER"
            fieldId="sig-field-banner"
            label="Image"
            image={images.banner}
            onChanged={replace}
            aspect="wide"
          />
          <SwitchRow
            id="sig-banner-visible"
            label="Afficher la bannière"
            checked={banner.enabled}
            onCheckedChange={(v) => update({ banner: { enabled: v } })}
          >
            <Field label="Lien au clic">
              <CheckedInput
                value={banner.url}
                placeholder="votre-site.fr/offre"
                warning={linkProblem(banner.url)}
                onChange={(e) => update({ banner: { url: e.target.value } })}
              />
            </Field>
          </SwitchRow>
        </Section>
      );
      break;
    case "cta":
      body = (
        <>
          <Section title="Contenu">
            <Field label="Texte du bouton">
              <CheckedInput
                id="sig-field-cta"
                value={cta.label}
                maxLength={60}
                placeholder="Prendre rendez-vous"
                warning={ctaLabelProblem(cta)}
                onChange={(e) => update({ cta: { label: e.target.value } })}
              />
            </Field>
            <Field label="Lien">
              <CheckedInput
                value={cta.url}
                placeholder="calendly.com/votre-nom"
                warning={ctaLinkProblem(cta)}
                onChange={(e) => update({ cta: { url: e.target.value } })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fond">
                <ColorField
                  label="Fond du bouton"
                  value={cta.backgroundColor || st.primaryColor}
                  onChange={(v) => update({ cta: { backgroundColor: v } })}
                />
              </Field>
              <Field label="Texte">
                <ColorField
                  label="Texte du bouton"
                  value={cta.textColor}
                  onChange={(v) => update({ cta: { textColor: v } })}
                />
              </Field>
            </div>
          </Section>
          <TextStyleControls
            elementKey="cta"
            withColor={false}
            {...textProps}
          />
        </>
      );
      break;
    case "disclaimer":
      body = (
        <>
          <Section title="Contenu">
            <Textarea
              id="sig-field-disclaimer"
              value={disclaimer.text}
              maxLength={1000}
              rows={3}
              onChange={(e) => update({ disclaimer: { text: e.target.value } })}
            />
          </Section>
          <TextStyleControls elementKey="disclaimer" {...textProps} />
        </>
      );
      break;
    case "rule1":
    case "rule2":
    case "rule3": {
      // Trait libre : sa forme ; sa place se règle comme celle d'un élément
      const rule = st.rules?.[element];
      const setRule = (patch) =>
        setStyle({
          rules: { ...(st.rules || {}), [element]: { ...rule, ...patch } },
        });
      body = rule ? (
        <Section title="Mise en forme">
          <SliderRow
            label="Longueur"
            value={rule.length}
            min={16}
            max={640}
            step={4}
            hint="Vous pouvez aussi tirer le bord du cadre dans l'aperçu."
            onChange={(v) => setRule({ length: v })}
          />
          <SliderRow
            label="Épaisseur"
            value={rule.thickness}
            min={1}
            max={8}
            onChange={(v) => setRule({ thickness: v })}
          />
          <Row label="Couleur">
            <Choice
              label="Couleur du trait"
              value={rule.color}
              onChange={(v) => setRule({ color: v })}
              options={RULE_COLORS}
            />
          </Row>
          <button
            type="button"
            onClick={() => setStyle(removeRule(st, element))}
            className="text-xs font-medium text-red-600 hover:underline cursor-pointer"
          >
            Retirer ce trait
          </button>
        </Section>
      ) : (
        <Hint>Ce trait a été retiré.</Hint>
      );
      break;
    }
    default:
      body = null;
  }

  return (
    <div className="space-y-8">
      {body}
      {body && (
        <Section
          title="Disposition"
          collapsible
          open={layoutOpen}
          onToggle={() => {
            layoutOpenPref = !layoutOpen;
            setLayoutOpen(!layoutOpen);
          }}
          summary={
            place
              ? `${place} · largeur, espaces, alignement`
              : "Place, largeur, espaces, alignement"
          }
        >
          {PLACE_IN_LIST.has(element) && (
            <PlaceRow element={element} sig={sig} setStyle={setStyle} />
          )}
          {layout}
          <BlockControls
            element={element}
            sig={sig}
            setStyle={setStyle}
            alignLabel={
              element === "photo" ? "Alignement horizontal" : undefined
            }
          />
        </Section>
      )}
    </div>
  );
}
