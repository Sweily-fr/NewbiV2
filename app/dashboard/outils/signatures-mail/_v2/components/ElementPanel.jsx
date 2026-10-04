"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { PHOTO_LABELS, PhotoBorderControls } from "./StylePanel";
import {
  CheckedInput,
  Choice,
  ColorRow,
  Hint,
  Nested,
  Row,
  Section,
  SliderRow,
  SpaceRow,
  SwitchRow,
} from "./controls";
import TextStyleControls from "./TextStyleControls";
import { PartLinks, PlaceRow } from "./LevelPanels";
import {
  RULE_COLORS,
  elementSlot,
  identityZone,
  removeRule,
  shownItems,
  slotLabel,
  slotOf,
} from "../slots";
import { distribute, socialRowOptions } from "../socialRows";
import { Field, ImageField, SocialLinks, TextField } from "./ContentPanel";
import BlockControls, { blockSummary } from "./BlockControls";
import { CtaColorFields, DisclaimerField } from "./ExtrasPanel";
import {
  bannerAltFallback,
  ctaLabelProblem,
  ctaLinkHint,
  ctaLinkProblem,
  emailProblem,
  linkProblem,
} from "../links";
import {
  AccentControls,
  ContactStyleControl,
  DividerControls,
  FooterPairControl,
  IconColorControls,
  IdentityControls,
  IdentityZoneControl,
  LogoPositionControl,
  LogoWidthRow,
  PhotoLayoutControls,
  SocialPositionControl,
  SocialRowsControl,
  TitleStyleControl,
  footerPaired,
  layoutState,
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
  divider: "divider",
};

/** Traits horizontaux : leurs marges (au-dessus, en dessous) se règlent avec eux. */
const HORIZONTAL_TRAITS = new Set(["accent", "rule1", "rule2", "rule3"]);

/** Marges d'un trait horizontal : au-dessus et en dessous. */
function TraitMargins({ element, st, setStyle }) {
  const blocks = st.blocks || {};
  const block = blocks[element] || {};
  const set = (patch) => {
    const next = Object.fromEntries(
      Object.entries({ ...block, ...patch }).filter(
        ([, v]) => v !== 0 && v !== null && v !== undefined && v !== "",
      ),
    );
    const all = { ...blocks };
    if (Object.keys(next).length > 0) all[element] = next;
    else delete all[element];
    setStyle({ blocks: all });
  };
  return (
    <div className="grid grid-cols-2 gap-4">
      <SpaceRow
        label="Marge au-dessus"
        value={block.spaceBefore || 0}
        onChange={(v) => set({ spaceBefore: v })}
      />
      <SpaceRow
        label="Marge en dessous"
        value={block.spaceAfter || 0}
        onChange={(v) => set({ spaceAfter: v })}
      />
    </div>
  );
}

/** Marges du séparateur vertical : à gauche et à droite du trait. */
function DividerMargins({ st, setStyle }) {
  const ds = st.dividerSpace || {};
  const set = (side, v) => {
    const next = { ...ds, [side]: v };
    if (!v) delete next[side];
    setStyle({ dividerSpace: next });
  };
  return (
    <div className="grid grid-cols-2 gap-4">
      <SpaceRow
        label="Marge à gauche"
        value={ds.left || 0}
        onChange={(v) => set("left", v)}
      />
      <SpaceRow
        label="Marge à droite"
        value={ds.right || 0}
        onChange={(v) => set("right", v)}
      />
    </div>
  );
}

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

const HEADER_PHOTO = { left: "à gauche", top: "au-dessus", right: "à droite" };
const FILL_SUMMARY = { tint: "fond teinté", solid: "fond de couleur" };

/**
 * Résumé de « Disposition » repliée : la place de l'élément d'abord (pour
 * la photo, sa position), puis les réglages de la section qui comptent,
 * avec leur valeur, comme les résumés de l'onglet Style ; jamais un réglage
 * que la section n'a pas. « Photo à gauche · fond teinté · séparateur »,
 * « Bas de la signature · sur une ligne · à côté du logo ».
 */
function layoutSummary(element, sig, withSpaces) {
  const st = sig.style;
  const shown = shownItems(sig);
  const L = layoutState(st, shown);
  const parts = [];
  if (element === "photo") {
    parts.push(
      PHOTO_LABELS[L.photo] || slotLabel(slotOf(st.slots, "photo"), st),
    );
    if (L.photo === "header") {
      parts.push(HEADER_PHOTO[st.headerPhoto]);
    } else {
      if (L.hasVisual) parts.push(FILL_SUMMARY[st.visualFill]);
      else if (st.align === "center") parts.push("texte centré");
    }
    if (st.divider !== "none") parts.push("séparateur");
  } else {
    parts.push(slotLabel(elementSlot(st, shown, element), st));
  }
  if (element === "name") {
    const zone = identityZone(st);
    if (zone === "band-top") parts.push("bloc de couleur en en-tête");
    if (zone === "band-left") parts.push("bloc de couleur à gauche");
    parts.push(
      st.identityStyle === "inline"
        ? "nom, poste et société sur une ligne"
        : st.nameLayout === "stacked"
          ? "prénom et nom l'un sous l'autre"
          : "prénom et nom sur une ligne",
    );
  }
  if (element === "social") {
    const count = sig.social.filter((s) => s.url?.trim()).length;
    const key = distribute(count, st.socialRows || []).join("+");
    const rows = socialRowOptions(count).find((o) => o.key === key);
    if (rows) {
      parts.push(
        rows.rows.length === 1
          ? "sur une ligne"
          : rows.label.charAt(0).toLowerCase() + rows.label.slice(1),
      );
    }
  }
  if ((element === "social" || element === "logo") && footerPaired(st, shown)) {
    parts.push(element === "social" ? "à côté du logo" : "à côté des réseaux");
  }
  parts.push(...blockSummary(element, sig, withSpaces));
  const text = parts.filter(Boolean).join(" · ");
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : null;
}

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
          <TraitMargins element="accent" st={st} setStyle={setStyle} />
        </Section>
      );
      break;
    case "divider":
      // Séparateur vertical : sa forme et ses marges (il ne se déplace pas)
      body = (
        <Section title="Mise en forme">
          <DividerControls
            st={st}
            setStyle={setStyle}
            lines={lines}
            shown={shownItems(sig)}
          />
          {st.divider !== "none" && (
            <DividerMargins st={st} setStyle={setStyle} />
          )}
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
          {/* En capitales : avec la mise en forme qu'il change, pas dans
              « Disposition » repliée */}
          <TextStyleControls
            elementKey="jobTitle"
            {...textProps}
            intro={<TitleStyleControl st={st} setStyle={setStyle} />}
          />
        </>
      );
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
          {/* Présentation en tête, la taille et la couleur des icônes
              juste dessous : sous le choix qui les fait apparaître */}
          <TextStyleControls
            elementKey="contact"
            {...textProps}
            intro={
              <>
                <ContactStyleControl
                  st={st}
                  setStyle={setStyle}
                  label="Présentation"
                />
                {st.contactStyle === "icons" && (
                  <Nested>
                    <SliderRow
                      label="Taille des icônes"
                      value={st.contactIconSize || 16}
                      min={12}
                      max={32}
                      onChange={(v) => setStyle({ contactIconSize: v })}
                    />
                    <IconColorControls
                      target="contact"
                      st={st}
                      setStyle={setStyle}
                    />
                  </Nested>
                )}
                <PartLinks element="contact" sig={sig} onSelect={onSelect} />
              </>
            }
          />
        </>
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
            <IconColorControls
              st={st}
              setStyle={setStyle}
              label="Couleur"
              hint="« Marque » : la couleur de chaque réseau."
            />
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
              hint="JPG, PNG, WebP ou HEIC (10 Mo max.), recadrée automatiquement en carré et nette sur écran retina."
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
              hint="JPG, PNG, WebP ou SVG (10 Mo max.). Un PNG à fond transparent évite le cadre blanc en mode sombre. Si votre logo est noir ou très foncé, il y devient presque invisible : gardez-le alors sur fond blanc."
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
            hint="Une image large (1200 px de large par exemple), en JPG, PNG ou WebP, 10 Mo max."
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
            {/* Même champ que dans « En plus » : la bannière se règle
                entièrement depuis l'aperçu */}
            <Field
              label="Texte de remplacement"
              htmlFor="sig-element-banner-alt"
              hint="Lu par les lecteurs d'écran et affiché quand la messagerie bloque les images."
            >
              <CheckedInput
                id="sig-element-banner-alt"
                value={banner.alt}
                maxLength={120}
                placeholder={
                  bannerAltFallback(banner.url) || "Description de l'image"
                }
                onChange={(e) => update({ banner: { alt: e.target.value } })}
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
            <Field label="Lien" hint={ctaLinkHint(cta.url)}>
              <CheckedInput
                value={cta.url}
                placeholder="calendly.com/votre-nom"
                warning={ctaLinkProblem(cta)}
                onChange={(e) => update({ cta: { url: e.target.value } })}
              />
            </Field>
            <CtaColorFields
              cta={cta}
              primaryColor={st.primaryColor}
              update={update}
            />
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
            <DisclaimerField
              id="sig-field-disclaimer"
              value={disclaimer.text}
              onChange={(text) => update({ disclaimer: { text } })}
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
          <TraitMargins element={element} st={st} setStyle={setStyle} />
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

  // Les traits ont leurs marges dans leur mise en forme
  const withSpaces = !HORIZONTAL_TRAITS.has(element);
  return (
    <div className="space-y-8">
      {body}
      {body && element !== "divider" && (
        <Section
          title="Disposition"
          collapsible
          open={layoutOpen}
          onToggle={() => {
            layoutOpenPref = !layoutOpen;
            setLayoutOpen(!layoutOpen);
          }}
          summary={layoutSummary(element, sig, withSpaces)}
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
            withSpaces={withSpaces}
          />
        </Section>
      )}
    </div>
  );
}
