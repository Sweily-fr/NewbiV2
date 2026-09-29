"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Check,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import {
  Choice,
  ChoiceCard,
  FIELD_LABEL,
  Hint,
  LengthRow,
  MultiChoice,
  Row,
  SliderRow,
  SwitchRow,
} from "./controls";
import {
  identityZone,
  isOutside,
  itemPlacement,
  moveItem,
  photoPlacement,
  setIdentityZone,
  setItemPlacement,
  setOutside,
  setPhotoPlacement,
} from "../slots";
import { distribute, socialAlign, socialRowOptions } from "../socialRows";
import {
  ContactPicto,
  FillPicto,
  IdentityPicto,
  NamePicto,
  PhotoPicto,
  PlacementPicto,
  ZonePicto,
} from "./Pictos";

/**
 * Contrôles de mise en page, partagés par l'onglet Style et les panneaux
 * d'élément. Ils agissent sur les emplacements des éléments (style.slots),
 * comme le glisser-déposer de l'aperçu. Chaque contrôle ne s'affiche que
 * s'il a un effet avec les réglages en cours.
 */

/** État de la mise en page, lu dans les emplacements. */
export function layoutState(st) {
  const slots = st.slots || {};
  const zone = identityZone(st);
  const photo = photoPlacement(st);
  return {
    zone,
    photo,
    hasVisual: (slots.visual || []).length > 0,
    hasHeader: (slots.header || []).length > 0,
    photoSide: photo === "left" || photo === "right",
    plain: zone === "plain",
    boxed: st.frame === "outline" || st.frame === "soft",
    framed: st.frame !== "none",
  };
}

/** Choix court (≤ 3) en boutons, plus long en liste. */
export function Pick({ label, hint, value, onChange, options }) {
  if (options.length <= 3) {
    return (
      <Row label={label} hint={hint}>
        <Choice
          value={value}
          onChange={onChange}
          options={options}
          label={label}
        />
      </Row>
    );
  }
  return (
    <Row label={label} hint={hint}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Autre place" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Row>
  );
}

/**
 * Choix en vignettes : une signature en miniature par option, comme
 * « Position du client dans le PDF » des paramètres de facture.
 */
export function PictoPick({ label, hint, value, onChange, options, columns = 3 }) {
  return (
    <Row label={label} hint={hint}>
      <div
        role="radiogroup"
        aria-label={label}
        className={cn(
          "grid gap-2",
          columns === 4 ? "grid-cols-4" : columns === 2 ? "grid-cols-2" : "grid-cols-3",
        )}
      >
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <ChoiceCard
              key={o.value}
              selected={selected}
              onClick={() => onChange(o.value)}
              label={
                <span className="inline-flex items-center gap-1">
                  {selected && <Check size={12} aria-hidden="true" />}
                  {o.label}
                </span>
              }
            >
              {o.picto}
            </ChoiceCard>
          );
        })}
      </div>
    </Row>
  );
}

export function IdentityZoneControl({ st, setStyle }) {
  return (
    <PictoPick
      label="Bloc de couleur"
      hint="Le nom (et la photo) sur un fond de la couleur principale."
      value={identityZone(st)}
      onChange={(v) => setStyle(setIdentityZone(st, v))}
      options={[
        { value: "plain", label: "Aucun", picto: <ZonePicto zone="plain" /> },
        { value: "band-top", label: "En-tête", picto: <ZonePicto zone="band-top" /> },
        { value: "band-left", label: "À gauche", picto: <ZonePicto zone="band-left" /> },
      ]}
    />
  );
}

const PHOTO_OPTIONS = [
  { value: "left", label: "À gauche", picto: <PhotoPicto position="left" /> },
  { value: "top", label: "Au-dessus", picto: <PhotoPicto position="top" /> },
  { value: "right", label: "À droite", picto: <PhotoPicto position="right" /> },
];

/** Place de la photo, son alignement et sa colonne. */
export function PhotoLayoutControls({ st, setStyle }) {
  const L = layoutState(st);
  if (L.photo === "header") {
    return (
      <PictoPick
        label="Photo dans l'en-tête"
        value={st.headerPhoto}
        onChange={(v) => setStyle({ headerPhoto: v })}
        options={PHOTO_OPTIONS}
      />
    );
  }
  return (
    <>
      <PictoPick
        label="Position de la photo"
        value={["left", "top", "right"].includes(L.photo) ? L.photo : ""}
        onChange={(v) => setStyle(setPhotoPlacement(st, v))}
        options={PHOTO_OPTIONS}
      />
      {L.hasVisual && (
        <Row label="Alignement vertical de la photo">
          <Choice
            label="Alignement vertical de la photo"
            value={st.photoValign}
            onChange={(v) => setStyle({ photoValign: v })}
            options={[
              { value: "top", label: "Haut", icon: <AlignVerticalJustifyStart size={14} /> },
              { value: "middle", label: "Milieu", icon: <AlignVerticalJustifyCenter size={14} /> },
              { value: "bottom", label: "Bas", icon: <AlignVerticalJustifyEnd size={14} /> },
            ]}
          />
        </Row>
      )}
      {L.hasVisual && (
        <PictoPick
          label="Fond de la colonne photo"
          value={st.visualFill}
          onChange={(v) => setStyle({ visualFill: v })}
          options={[
            { value: "none", label: "Aucun", picto: <FillPicto fill="none" /> },
            { value: "tint", label: "Teinté", picto: <FillPicto fill="tint" /> },
            { value: "solid", label: "Couleur", picto: <FillPicto fill="solid" /> },
          ]}
        />
      )}
      {!L.hasVisual && (
        <Row label="Alignement du texte">
          <Choice
            label="Alignement du texte"
            value={st.align}
            onChange={(v) => setStyle({ align: v })}
            options={[
              { value: "left", label: "Gauche", icon: <AlignLeft size={14} /> },
              { value: "center", label: "Centré", icon: <AlignCenter size={14} /> },
            ]}
          />
        </Row>
      )}
    </>
  );
}

/**
 * Trait sous le nom : affiché ou non, puis sa longueur et son épaisseur.
 * `lines` : dimensions effectives renvoyées par le rendu (celles du modèle
 * tant que rien n'est réglé).
 */
export function AccentControls({ st, setStyle, lines }) {
  const on = st.accent === "short" || st.accent === "thin";
  return (
    <>
      <SwitchRow
        id="sig-accent"
        label="Trait sous le nom"
        description="Un trait de la couleur principale, sous le nom."
        checked={on}
        onCheckedChange={(v) => setStyle({ accent: v ? "short" : "none" })}
      />
      {on && (
        <div className="grid grid-cols-2 gap-4">
          <SliderRow
            label="Longueur"
            value={st.accentLength || lines?.accentLength || 40}
            min={8}
            max={240}
            step={2}
            onChange={(v) => setStyle({ accentLength: v })}
          />
          <SliderRow
            label="Épaisseur"
            value={st.accentThickness || lines?.accentThickness || 3}
            min={1}
            max={8}
            onChange={(v) => setStyle({ accentThickness: v })}
          />
        </div>
      )}
    </>
  );
}

/**
 * Séparateur vertical : entre la photo et le texte, ou à gauche du texte
 * sans photo. Couleur, épaisseur, longueur (toute la hauteur ou sur mesure).
 * Sans effet sur une colonne photo de couleur : masqué.
 */
export function DividerControls({ st, setStyle, lines }) {
  const L = layoutState(st);
  if (L.hasVisual && st.visualFill !== "none") return null;
  const on = st.divider !== "none";
  const thickness =
    st.dividerThickness ||
    lines?.dividerThickness ||
    (st.divider === "bar" ? 4 : 1);
  return (
    <>
      <SwitchRow
        id="sig-divider"
        label="Séparateur vertical"
        description={
          L.hasVisual
            ? "Un trait entre la photo et le texte."
            : "Un trait à gauche du texte."
        }
        checked={on}
        onCheckedChange={(v) => setStyle({ divider: v ? "accent" : "none" })}
      />
      {on && (
        <>
          <Row label="Couleur">
            <Choice
              label="Couleur du séparateur"
              value={st.divider === "line" ? "gray" : "primary"}
              onChange={(v) => {
                if ((v === "gray") === (st.divider === "line")) return;
                // L'épaisseur affichée est conservée en changeant de couleur
                setStyle({
                  divider: v === "gray" ? "line" : "accent",
                  dividerThickness: thickness,
                });
              }}
              options={[
                { value: "primary", label: "Couleur principale" },
                { value: "gray", label: "Gris des traits" },
              ]}
            />
          </Row>
          <SliderRow
            label="Épaisseur"
            value={thickness}
            min={1}
            max={8}
            onChange={(v) => setStyle({ dividerThickness: v })}
          />
          <LengthRow
            label="Longueur"
            autoLabel="Toute la hauteur"
            value={st.dividerLength}
            onChange={(v) => setStyle({ dividerLength: v })}
            min={16}
            max={400}
            initial={60}
          />
        </>
      )}
    </>
  );
}

/** Prénom et nom côte à côte : une ligne ou l'un sous l'autre. */
export function NameLayoutControl({ st, setStyle }) {
  if (st.identityStyle === "inline") return null;
  return (
    <PictoPick
      label="Prénom et nom"
      columns={2}
      value={st.nameLayout || "inline"}
      onChange={(v) => setStyle({ nameLayout: v })}
      options={[
        { value: "inline", label: "Sur une ligne", picto: <NamePicto /> },
        { value: "stacked", label: "L'un sous l'autre", picto: <NamePicto stacked /> },
      ]}
    />
  );
}

/**
 * Poste en petites capitales espacées ; suivi de l'entreprise, les deux
 * partagent alors une ligne.
 */
export function TitleStyleControl({ st, setStyle }) {
  if (st.identityStyle === "inline") return null;
  return (
    <Pick
      label="Style du poste"
      hint={
        st.titleStyle === "caps"
          ? "Suivi de l'entreprise, les deux partagent une ligne."
          : null
      }
      value={st.titleStyle}
      onChange={(v) => setStyle({ titleStyle: v })}
      options={[
        { value: "normal", label: "Normal" },
        { value: "caps", label: "En capitales" },
      ]}
    />
  );
}

export function IdentityControls({ st, setStyle, withTitle = true }) {
  return (
    <>
      <NameLayoutControl st={st} setStyle={setStyle} />
      <PictoPick
        label="Nom, poste et société"
        columns={2}
        value={st.identityStyle}
        onChange={(v) => setStyle({ identityStyle: v })}
        options={[
          { value: "stack", label: "Empilés", picto: <IdentityPicto /> },
          { value: "inline", label: "Sur une ligne", picto: <IdentityPicto inline /> },
        ]}
      />
      {withTitle && <TitleStyleControl st={st} setStyle={setStyle} />}
    </>
  );
}

export function ContactStyleControl({ st, setStyle, label = "Coordonnées" }) {
  return (
    <PictoPick
      label={label}
      columns={4}
      value={st.contactStyle}
      onChange={(v) =>
        setStyle({ contactStyle: v, showContactIcons: v === "icons" })
      }
      options={[
        { value: "icons", label: "Icônes", picto: <ContactPicto style="icons" /> },
        { value: "labels", label: "Initiales", picto: <ContactPicto style="labels" /> },
        { value: "plain", label: "Texte", picto: <ContactPicto style="plain" /> },
        { value: "inline", label: "En ligne", picto: <ContactPicto style="inline" /> },
      ]}
    />
  );
}

/** Emplacements proposés pour un élément (réseaux, logo). */
function placementOptions(st, item) {
  const L = layoutState(st);
  const opt = (value, label) => ({
    value,
    label,
    picto: <PlacementPicto slot={value} kind={item} />,
  });
  return [
    ...(L.hasHeader ? [opt("header", "En-tête")] : []),
    opt("visual", "Colonne photo"),
    opt("text", "Sous le texte"),
    opt("side", "À droite"),
    opt("footer", "En bas"),
    ...(L.framed ? [opt("outside", "Sous le cadre")] : []),
  ];
}

function PlacementControl({ item, label, st, setStyle }) {
  return (
    <PictoPick
      label={label}
      value={itemPlacement(st, item)}
      onChange={(v) => setStyle(setItemPlacement(st, item, v))}
      options={placementOptions(st, item)}
    />
  );
}

export function SocialPositionControl({ st, setStyle }) {
  return (
    <PlacementControl
      item="social"
      label="Position des réseaux"
      st={st}
      setStyle={setStyle}
    />
  );
}

export function LogoPositionControl({ st, setStyle }) {
  return (
    <PlacementControl
      item="logo"
      label="Position du logo"
      st={st}
      setStyle={setStyle}
    />
  );
}

const JUSTIFY = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

/**
 * Disposition des icônes de réseaux : une ligne, deux lignes (2 en haut,
 * 3 en bas…), 2 par ligne, en colonne. Une vignette par disposition,
 * dessinée pour le nombre de réseaux renseignés.
 */
export function SocialRowsControl({ st, setStyle, count }) {
  const options = socialRowOptions(count);
  if (options.length === 0) return null;
  const current = distribute(count, st.socialRows || []).join("+");
  const justify = JUSTIFY[socialAlign(st)];
  return (
    <div className="space-y-2">
      <p className={FIELD_LABEL}>Disposition des icônes</p>
      <div
        role="radiogroup"
        aria-label="Disposition des icônes"
        className="grid grid-cols-4 gap-2"
      >
        {options.map((o) => {
          const selected = o.key === current;
          return (
            <ChoiceCard
              key={o.key}
              selected={selected}
              onClick={() => setStyle({ socialRows: o.plan })}
              label={
                <span className="inline-flex items-center gap-1">
                  {selected && <Check size={12} aria-hidden="true" />}
                  {o.label}
                </span>
              }
            >
              <span
                aria-hidden
                className={cn(
                  "flex flex-col gap-[3px]",
                  selected ? "text-[#242529] dark:text-white" : "text-[#b4b5b8] dark:text-white/35",
                )}
              >
                {o.rows.map((n, i) => (
                  <span key={i} className={cn("flex gap-[3px]", justify)}>
                    {Array.from({ length: n }, (_, j) => (
                      <span
                        key={j}
                        className="h-[6px] w-[6px] rounded-[2px] bg-current"
                      />
                    ))}
                  </span>
                ))}
              </span>
            </ChoiceCard>
          );
        })}
      </div>
      <Hint>
        Les icônes suivent l&apos;ordre de la liste des réseaux : les flèches
        de la liste le changent.
      </Hint>
    </div>
  );
}

/**
 * Largeur des colonnes (photo, texte, droite) : ajustée au contenu ou sur
 * mesure. Seules les colonnes présentes sont proposées.
 */
export function ColumnWidthControls({ st, setStyle, shown }) {
  // Colonne affichée : au moins un de ses éléments a du contenu
  const has = (slot) =>
    (st.slots?.[slot] || []).some((k) => !shown || shown.has(k));
  const hasSide = has("side");
  const columns = [
    has("visual") && { key: "visual", label: "Colonne photo", min: 40, max: 600, initial: 140 },
    { key: "text", label: "Colonne de texte", min: 80, max: 640, initial: 320 },
    hasSide && { key: "side", label: "Colonne de droite", min: 40, max: 400, initial: 140 },
  ].filter(Boolean);
  return columns.map((c) => (
    <LengthRow
      key={c.key}
      label={c.label}
      autoLabel="Ajustée au contenu"
      value={st.columns?.[c.key] || 0}
      onChange={(v) => setStyle({ columns: { ...(st.columns || {}), [c.key]: v } })}
      min={c.min}
      max={c.max}
      step={10}
      initial={c.initial}
    />
  ));
}

const OUTSIDE_LABELS = {
  social: "Réseaux",
  logo: "Logo",
  cta: "Bouton",
  banner: "Bandeau",
  disclaimer: "Mention",
};

/** Éléments du bas qu'on peut sortir du cadre (ou y remettre). */
function outsideCandidates(st) {
  const bottom = [...(st.slots?.footer || []), ...(st.slots?.outside || [])];
  return Object.keys(OUTSIDE_LABELS).filter((k) => bottom.includes(k));
}

/** Toutes les cases « en dehors de l'encadré » (onglet Style). */
export function OutsideControls({ st, setStyle }) {
  const L = layoutState(st);
  const candidates = outsideCandidates(st);
  if (!L.framed || candidates.length === 0) return null;
  return (
    <Row
      label="En dehors de l'encadré"
      hint="Les éléments choisis s'affichent sous le cadre."
    >
      <MultiChoice
        label="En dehors de l'encadré"
        value={candidates.filter((k) => isOutside(st, k))}
        onChange={(v) => {
          let slots = st.slots;
          for (const k of candidates) {
            const out = v.includes(k);
            if (out !== isOutside(st, k)) {
              slots = moveItem(slots, k, out ? "outside" : "footer");
            }
          }
          setStyle({ slots });
        }}
        options={candidates.map((k) => ({
          value: k,
          label: OUTSIDE_LABELS[k],
        }))}
      />
    </Row>
  );
}

/** Dans / hors de l'encadré pour un seul élément (panneau d'élément). */
export function OutsideToggle({ item, st, setStyle }) {
  const L = layoutState(st);
  if (!L.framed || !outsideCandidates(st).includes(item)) return null;
  return (
    <Pick
      label="Place"
      value={isOutside(st, item) ? "out" : "in"}
      onChange={(v) => setStyle(setOutside(st, item, v === "out"))}
      options={[
        { value: "in", label: "Dans l'encadré" },
        { value: "out", label: "En dehors" },
      ]}
    />
  );
}

/** Bande teintée en bas du cadre, pour les réseaux et le logo en bas. */
export function FooterStripControl({ st, setStyle }) {
  const L = layoutState(st);
  const footer = st.slots?.footer || [];
  const hasBottom = footer.includes("social") || footer.includes("logo");
  if (!L.boxed || !hasBottom) return null;
  return (
    <SwitchRow
      id="sig-footer-strip"
      label="Bande de pied teintée"
      description="Réseaux et logo « en bas » sur une bande colorée dans le cadre."
      checked={Boolean(st.footerStrip)}
      onCheckedChange={(v) => setStyle({ footerStrip: v })}
    />
  );
}
