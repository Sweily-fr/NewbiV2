"use client";

import { useState } from "react";
import { ArrowLeft, Bold, CaseUpper, Italic, RotateCcw } from "lucide-react";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { PhotoBorderControls, ResetLink } from "./StylePanel";
import {
  CheckedInput,
  Choice,
  ColorRow,
  Hint,
  MultiChoice,
  Row,
  Section,
  SliderRow,
  SwitchRow,
} from "./controls";
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
  IdentityControls,
  IdentityZoneControl,
  LogoPositionControl,
  OutsideToggle,
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
};

const TITLES = {
  name: "Nom",
  accent: "Trait sous le nom",
  jobTitle: "Poste",
  company: "Entreprise",
  tagline: "Accroche",
  contact: "Coordonnées",
  social: "Réseaux sociaux",
  photo: "Photo",
  logo: "Logo",
  banner: "Bandeau",
  cta: "Bouton d'action",
  disclaimer: "Mention",
};

const DEFAULT_FONT = "__signature";

/**
 * Mise en forme d'un élément de texte. Les valeurs affichées sont celles
 * réellement appliquées (renvoyées par le rendu de l'API) ; seul ce que
 * l'utilisateur change est enregistré, le reste suit le modèle.
 */
function TextStyleControls({
  elementKey,
  sig,
  update,
  resolved,
  catalog,
  withColor = true,
  intro = null,
  footer = null,
}) {
  const st = sig.style;
  const all = st.elements || {};
  const own = Object.fromEntries(
    Object.entries(all[elementKey] || {}).filter(
      ([k, v]) => k !== "__typename" && v !== null,
    ),
  );
  const applied = resolved?.[elementKey] || {};
  const value = (k, fallback) => own[k] ?? applied[k] ?? fallback;

  const set = (patch) => {
    const next = { ...own, ...patch };
    const elements = { ...all, [elementKey]: next };
    update({ style: { elements } });
  };
  const reset = () => {
    const elements = { ...all };
    delete elements[elementKey];
    update({ style: { elements } });
  };

  const flags = ["bold", "italic", "uppercase"].filter((k) => value(k, false));

  return (
    <Section title="Mise en forme">
      {intro}
      <Row label="Police">
        <Select
          value={own.fontFamily || DEFAULT_FONT}
          onValueChange={(v) =>
            set({ fontFamily: v === DEFAULT_FONT ? null : v })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT_FONT}>Police de la signature</SelectItem>
            {(catalog?.fonts || []).map((f) => (
              <SelectItem key={f.id} value={f.id}>
                <span style={{ fontFamily: f.stack }}>{f.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>
      <SliderRow
        label="Taille"
        value={value("fontSize", st.fontSize)}
        min={9}
        max={36}
        onChange={(v) => set({ fontSize: v })}
      />
      {withColor && (
        <ColorRow
          label="Couleur"
          value={value("color", st.textColor)}
          onChange={(v) => set({ color: v })}
        />
      )}
      <Row label="Style">
        <MultiChoice
          label="Style du texte"
          value={flags}
          onChange={(v) =>
            set({
              bold: v.includes("bold"),
              italic: v.includes("italic"),
              uppercase: v.includes("uppercase"),
            })
          }
          options={[
            { value: "bold", ariaLabel: "Gras", icon: <Bold size={14} /> },
            {
              value: "italic",
              ariaLabel: "Italique",
              icon: <Italic size={14} />,
            },
            {
              value: "uppercase",
              ariaLabel: "Majuscules",
              icon: <CaseUpper size={14} />,
            },
          ]}
        />
      </Row>
      {Object.keys(own).length > 0 && (
        <ResetLink onClick={reset}>Revenir au style du modèle</ResetLink>
      )}
      {footer}
    </Section>
  );
}

/**
 * Panneau d'un élément cliqué dans l'aperçu : son contenu et tous ses
 * réglages au même endroit.
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
  onClose,
}) {
  const { identity, contact, images, style: st, cta, banner, disclaimer } = sig;
  const setStyle = (patch) => update({ style: patch });
  const textProps = { sig, update, resolved, catalog };
  // Plafonds du modèle : les curseurs s'arrêtent à ce qui s'affiche
  const photoMax = lines?.photoMax || 160;
  const iconMax = lines?.iconMax || 40;
  // Mise en forme du nom : les deux, le prénom seul ou le nom seul
  const [nameTarget, setNameTarget] = useState("name");

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
          {/* Le prénom et le nom se règlent ensemble ou chacun à part */}
          <TextStyleControls
            key={nameTarget}
            elementKey={nameTarget}
            {...textProps}
            intro={
              <Row label="Appliquer à">
                <Choice
                  value={nameTarget}
                  onChange={setNameTarget}
                  label="Appliquer à"
                  options={[
                    { value: "name", label: "Les deux" },
                    { value: "firstName", label: "Prénom" },
                    { value: "lastName", label: "Nom" },
                  ]}
                />
              </Row>
            }
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
              <ColorRow
                label="Couleur personnalisée"
                value={st.iconColor}
                onChange={(v) => setStyle({ iconColor: v })}
              />
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
          <OutsideToggle item="social" st={st} setStyle={setStyle} />
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
          <PhotoLayoutControls st={st} setStyle={setStyle} />
          <DividerControls st={st} setStyle={setStyle} lines={lines} />
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
            <SliderRow
              label="Largeur"
              value={st.logoWidth}
              min={40}
              max={200}
              step={4}
              onChange={(v) => setStyle({ logoWidth: v })}
            />
            <Hint>
              La hauteur est limitée à 48 px : un logo carré reste discret.
            </Hint>
          </Section>
        </>
      );
      layout = (
        <>
          <LogoPositionControl st={st} setStyle={setStyle} />
          <OutsideToggle item="logo" st={st} setStyle={setStyle} />
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
            label="Afficher le bandeau"
            checked={banner.enabled}
            onCheckedChange={(v) => update({ banner: { enabled: v } })}
          />
          <Field label="Lien au clic">
            <CheckedInput
              value={banner.url}
              placeholder="votre-site.fr/offre"
              warning={linkProblem(banner.url)}
              onChange={(e) => update({ banner: { url: e.target.value } })}
            />
          </Field>
        </Section>
      );
      layout = <OutsideToggle item="banner" st={st} setStyle={setStyle} />;
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
      layout = <OutsideToggle item="cta" st={st} setStyle={setStyle} />;
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
      layout = (
        <OutsideToggle item="disclaimer" st={st} setStyle={setStyle} />
      );
      break;
    default:
      body = null;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft size={14} />
          Tous les réglages
        </button>
        <h2 className="text-xl font-medium">{TITLES[element] || ""}</h2>
      </div>
      {body}
      {body && (
        <Section title="Disposition">
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
