"use client";

import { ArrowLeft, Bold, CaseUpper, Italic, RotateCcw } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import { Textarea } from "@/src/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Choice,
  ColorRow,
  PhotoBorderControls,
  Row,
  SliderRow,
} from "./StylePanel";
import { Field, ImageField, SocialLinks, TextField } from "./ContentPanel";
import ColorField from "./ColorField";
import {
  ContactStyleControl,
  DividerControl,
  IdentityControls,
  IdentityZoneControl,
  LogoPositionControl,
  OutsideToggle,
  PhotoLayoutControls,
  SocialPositionControl,
} from "./LayoutControls";

/** Élément de la signature piloté par chaque champ cliquable de l'aperçu. */
export const FIELD_ELEMENT = {
  firstName: "name",
  // Repères d'éléments (data-sig-block) sans champ propre
  name: "name",
  title: "jobTitle",
  accent: "name",
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

function Group({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

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
    <Group title="Mise en forme">
      <Row label="Police">
        <Select
          value={own.fontFamily || DEFAULT_FONT}
          onValueChange={(v) =>
            set({ fontFamily: v === DEFAULT_FONT ? null : v })
          }
        >
          <SelectTrigger size="sm" className="h-8 w-44 text-xs">
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
        <ToggleGroup
          type="multiple"
          size="sm"
          value={flags}
          onValueChange={(v) =>
            set({
              bold: v.includes("bold"),
              italic: v.includes("italic"),
              uppercase: v.includes("uppercase"),
            })
          }
        >
          <ToggleGroupItem value="bold" aria-label="Gras" className="px-2.5">
            <Bold size={14} />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="italic"
            aria-label="Italique"
            className="px-2.5"
          >
            <Italic size={14} />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="uppercase"
            aria-label="Majuscules"
            className="px-2.5"
          >
            <CaseUpper size={14} />
          </ToggleGroupItem>
        </ToggleGroup>
      </Row>
      {Object.keys(own).length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={reset}
          className="h-7 px-2 text-xs text-muted-foreground cursor-pointer"
        >
          <RotateCcw size={12} />
          Revenir au style du modèle
        </Button>
      )}
    </Group>
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
  onClose,
}) {
  const { identity, contact, images, style: st, cta, banner, disclaimer } = sig;
  const setStyle = (patch) => update({ style: patch });
  const textProps = { sig, update, resolved, catalog };

  let body = null;
  switch (element) {
    case "name":
      body = (
        <>
          <Group title="Contenu">
            <div className="grid grid-cols-2 gap-3">
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
          </Group>
          <TextStyleControls elementKey="name" {...textProps} />
          <Group title="Disposition">
            <IdentityZoneControl st={st} setStyle={setStyle} />
            <IdentityControls st={st} setStyle={setStyle} />
          </Group>
        </>
      );
      break;
    case "jobTitle":
      body = (
        <>
          <Group title="Contenu">
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
          </Group>
          <TextStyleControls elementKey="jobTitle" {...textProps} />
        </>
      );
      break;
    case "company":
      body = (
        <>
          <Group title="Contenu">
            <TextField
              id="sig-field-company"
              label="Entreprise"
              value={identity.company}
              onChange={(v) => update({ identity: { company: v } })}
              maxLength={120}
            />
          </Group>
          <TextStyleControls elementKey="company" {...textProps} />
        </>
      );
      break;
    case "tagline":
      body = (
        <>
          <Group title="Contenu">
            <TextField
              id="sig-field-tagline"
              label="Accroche"
              value={identity.tagline}
              placeholder="Une phrase, en italique sous le nom"
              onChange={(v) => update({ identity: { tagline: v } })}
              maxLength={200}
            />
          </Group>
          <TextStyleControls elementKey="tagline" {...textProps} />
        </>
      );
      break;
    case "contact":
      body = (
        <>
          <Group title="Contenu">
            <TextField
              id="sig-field-email"
              label="E-mail"
              type="email"
              value={contact.email}
              onChange={(v) => update({ contact: { email: v } })}
              maxLength={200}
            />
            <div className="grid grid-cols-2 gap-3">
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
            />
            <TextField
              id="sig-field-address"
              label="Adresse"
              value={contact.address}
              onChange={(v) => update({ contact: { address: v } })}
              maxLength={300}
            />
          </Group>
          <TextStyleControls elementKey="contact" {...textProps} />
          <Group title="Disposition">
            <ContactStyleControl st={st} setStyle={setStyle} />
          </Group>
        </>
      );
      break;
    case "social":
      body = (
        <>
          <Group title="Contenu">
            <div id="sig-field-social" tabIndex={-1} className="outline-none" />
            <SocialLinks
              social={sig.social}
              networks={catalog?.networks || []}
              update={update}
            />
          </Group>
          <Group title="Mise en forme">
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
              value={st.iconSize}
              min={16}
              max={40}
              step={2}
              onChange={(v) => setStyle({ iconSize: v })}
            />
          </Group>
          <Group title="Disposition">
            <SocialPositionControl st={st} setStyle={setStyle} />
            <OutsideToggle item="social" st={st} setStyle={setStyle} />
          </Group>
        </>
      );
      break;
    case "photo":
      body = (
        <>
          <Group title="Contenu">
            <ImageField
              id={id}
              kind="PHOTO"
              fieldId="sig-field-photo"
              label="Photo"
              hint="Recadrée automatiquement en carré, nette sur écran retina."
              image={images.photo}
              onChanged={replace}
            />
          </Group>
          <Group title="Mise en forme">
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
              value={st.photoSize}
              min={40}
              max={160}
              step={4}
              onChange={(v) => setStyle({ photoSize: v })}
            />
            <PhotoBorderControls st={st} setStyle={setStyle} />
          </Group>
          <Group title="Disposition">
            <PhotoLayoutControls st={st} setStyle={setStyle} />
            <DividerControl st={st} setStyle={setStyle} />
          </Group>
        </>
      );
      break;
    case "logo":
      body = (
        <>
          <Group title="Contenu">
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
          </Group>
          <Group title="Mise en forme">
            <SliderRow
              label="Largeur"
              value={st.logoWidth}
              min={40}
              max={200}
              step={4}
              onChange={(v) => setStyle({ logoWidth: v })}
            />
            <p className="text-[11px] leading-snug text-muted-foreground">
              La hauteur est limitée à 48 px : un logo carré reste discret.
            </p>
          </Group>
          <Group title="Disposition">
            <LogoPositionControl st={st} setStyle={setStyle} />
            <OutsideToggle item="logo" st={st} setStyle={setStyle} />
          </Group>
        </>
      );
      break;
    case "banner":
      body = (
        <Group title="Contenu">
          <ImageField
            id={id}
            kind="BANNER"
            fieldId="sig-field-banner"
            label="Image"
            image={images.banner}
            onChanged={replace}
            aspect="wide"
          />
          <Row label="Afficher le bandeau">
            <Switch
              checked={banner.enabled}
              onCheckedChange={(v) => update({ banner: { enabled: v } })}
              className="scale-75 data-[state=checked]:bg-[#5a50ff]"
            />
          </Row>
          <Field label="Lien au clic">
            <Input
              value={banner.url}
              placeholder="votre-site.fr/offre"
              onChange={(e) => update({ banner: { url: e.target.value } })}
            />
          </Field>
          <OutsideToggle item="banner" st={st} setStyle={setStyle} />
        </Group>
      );
      break;
    case "cta":
      body = (
        <>
          <Group title="Contenu">
            <Field label="Texte du bouton">
              <Input
                id="sig-field-cta"
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
                <ColorField
                  value={cta.backgroundColor || st.primaryColor}
                  onChange={(v) => update({ cta: { backgroundColor: v } })}
                  align="start"
                  side="bottom"
                />
              </Field>
              <Field label="Texte">
                <ColorField
                  value={cta.textColor}
                  onChange={(v) => update({ cta: { textColor: v } })}
                  align="start"
                  side="bottom"
                />
              </Field>
            </div>
          </Group>
          <TextStyleControls
            elementKey="cta"
            withColor={false}
            {...textProps}
          />
          <OutsideToggle item="cta" st={st} setStyle={setStyle} />
        </>
      );
      break;
    case "disclaimer":
      body = (
        <>
          <Group title="Contenu">
            <Textarea
              id="sig-field-disclaimer"
              value={disclaimer.text}
              maxLength={1000}
              rows={3}
              onChange={(e) => update({ disclaimer: { text: e.target.value } })}
            />
          </Group>
          <TextStyleControls elementKey="disclaimer" {...textProps} />
          <OutsideToggle item="disclaimer" st={st} setStyle={setStyle} />
        </>
      );
      break;
    default:
      body = null;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 px-2 text-xs cursor-pointer"
        >
          <ArrowLeft size={14} />
          Tous les réglages
        </Button>
        <span className="text-sm font-medium">{TITLES[element] || ""}</span>
      </div>
      {body}
    </div>
  );
}
