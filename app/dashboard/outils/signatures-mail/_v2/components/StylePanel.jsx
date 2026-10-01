"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ChevronRight, MousePointerClick, RotateCcw } from "lucide-react";
import {
  layoutCustomized,
  layoutReset,
  logoFit,
  shownItems,
  slotOf,
} from "../slots";
import {
  Choice,
  ColorRow,
  Group,
  LengthRow,
  Nested,
  ResetLink,
  Row,
  Section,
  SliderRow,
} from "./controls";
import {
  AccentControls,
  ColumnWidthControls,
  ContactStyleControl,
  DividerControls,
  FooterStripControl,
  IdentityControls,
  IdentityZoneControl,
  LogoPositionControl,
  OutsideControls,
  PhotoLayoutControls,
  TextAlignControl,
  SignatureWidthRow,
  SocialPositionControl,
  SocialRowsControl,
  layoutState,
} from "./LayoutControls";

export { Choice, ColorRow, ResetLink, Row, SliderRow };

/** Couleur mêlée de blanc (`amount` = part de la couleur), comme le rendu. */
function tintOf(color, amount) {
  const c = /^#[0-9a-f]{6}$/i.test(color || "") ? color.slice(1) : "000000";
  const mix = (i) =>
    Math.round(parseInt(c.slice(i, i + 2), 16) * amount + 255 * (1 - amount))
      .toString(16)
      .padStart(2, "0");
  return `#${mix(0)}${mix(2)}${mix(4)}`;
}

/** Contour de la photo : épaisseur (0 = aucun) et couleur. */
export function PhotoBorderControls({ st, setStyle }) {
  // Sur un fond de la couleur principale (en-tête, colonne pleine), le
  // contour est blanc par défaut
  const photoSlot = slotOf(st.slots, "photo");
  const onFill =
    (photoSlot === "header" && st.headerFill !== "tint") ||
    (photoSlot === "visual" && st.visualFill === "solid");
  const defaultColor = onFill ? "#ffffff" : st.primaryColor;
  return (
    <>
      <SliderRow
        label="Contour"
        value={st.photoBorder}
        min={0}
        max={6}
        onChange={(v) => setStyle({ photoBorder: v })}
      />
      {st.photoBorder > 0 && (
        <Nested>
          <ColorRow
            label="Couleur du contour"
            value={st.photoBorderColor || defaultColor}
            onChange={(v) => setStyle({ photoBorderColor: v })}
          />
        </Nested>
      )}
    </>
  );
}

/**
 * Remet chaque élément à sa place dans le modèle, après des déplacements.
 * N'apparaît que si la disposition s'en écarte.
 */
function ResetLayout({ sig, template, setStyle }) {
  // Sans photo, la disposition de référence est celle adaptée au contenu
  if (!template || !layoutCustomized(sig, template)) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-[#F5F5F5] px-3 py-2.5 dark:bg-neutral-900">
      <p className="text-xs text-muted-foreground">Disposition personnalisée</p>
      <button
        type="button"
        // Places, traits et bordures, blocs, colonnes, nom, réseaux et logo
        // du modèle ; couleurs et typographie inchangées
        onClick={() => setStyle(layoutReset(sig, template))}
        className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-[#5b4fff] hover:underline cursor-pointer"
      >
        <RotateCcw size={12} />
        Revenir au modèle {template.name}
      </button>
    </div>
  );
}


/**
 * Panneau « Style » : tout ce qui n'est pas du contenu.
 * Les valeurs possibles viennent du catalogue de l'API, la police est
 * limitée aux polices lisibles dans tous les clients mail.
 */
const OPEN_KEY = "sig-style-sections";
const OPEN_DEFAULT = { texte: true };

/** Sections ouvertes, mémorisées d'une visite à l'autre. */
function useOpenSections() {
  const [open, setOpen] = useState(() => {
    try {
      return {
        ...OPEN_DEFAULT,
        ...JSON.parse(localStorage.getItem(OPEN_KEY) || "{}"),
      };
    } catch {
      return OPEN_DEFAULT;
    }
  });
  const section = (key) => ({
    collapsible: true,
    open: Boolean(open[key]),
    onToggle: () =>
      setOpen((current) => {
        const next = { ...current, [key]: !current[key] };
        try {
          localStorage.setItem(OPEN_KEY, JSON.stringify(next));
        } catch {
          // Stockage indisponible : l'état reste en mémoire
        }
        return next;
      }),
  });
  return section;
}

const FRAME_LABELS = {
  none: "Aucun encadré",
  outline: "Contour",
  soft: "Fond teinté",
  "accent-left": "Barre à gauche",
  "accent-top": "Barre en haut",
};
const PHOTO_LABELS = {
  left: "Photo à gauche",
  top: "Photo au-dessus",
  right: "Photo à droite",
  header: "Photo dans l'en-tête",
};
const CONTACT_LABELS = {
  icons: "coordonnées avec icônes",
  labels: "coordonnées avec initiales",
  plain: "coordonnées en texte seul",
  inline: "coordonnées sur une ligne",
};
const SHAPE_LABELS = { circle: "Ronde", rounded: "Arrondie", square: "Carrée" };
const ICON_LABELS = {
  circle: "Rondes",
  rounded: "Arrondies",
  square: "Carrées",
  plain: "Simples",
};
const ICON_COLOR_LABELS = {
  brand: "couleurs de marque",
  primary: "couleur principale",
  custom: "couleur personnalisée",
};
const capitalize = (text) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

export default function StylePanel({
  sig,
  update,
  catalog,
  template,
  lines,
  onGoTo,
  onSelect,
}) {
  const st = sig.style;
  const setStyle = (patch) => update({ style: patch });
  // Éléments affichés : les réglages d'éléments absents sont masqués
  const shown = shownItems(sig);
  const L = layoutState(st, shown);
  const bars = st.frame === "accent-left" || st.frame === "accent-top";
  const section = useOpenSections();
  const hasPhoto = Boolean(sig.images?.photo?.url);
  const hasLogo = Boolean(sig.images?.logo?.url);
  const hasNetworks = sig.social.some((s) => s.url?.trim());
  const accentOn = st.accent === "short" || st.accent === "thin";
  const font = (catalog?.fonts || []).find((f) => f.id === st.fontFamily);
  // Plafonds du modèle : les curseurs s'arrêtent à ce qui s'affiche
  const photoMax = lines?.photoMax || 160;
  const iconMax = lines?.iconMax || 40;

  const summaries = {
    texte: `${font?.label || "Arial"} · ${st.fontSize} px`,
    disposition: capitalize(
      [hasPhoto ? PHOTO_LABELS[L.photo] : null, CONTACT_LABELS[st.contactStyle]]
        .filter(Boolean)
        .join(" · "),
    ),
    traits:
      [accentOn && "Trait sous le nom", st.divider !== "none" && "Séparateur vertical"]
        .filter(Boolean)
        .join(" · ") || "Aucun trait",
    encadre: FRAME_LABELS[st.frame],
    photo: hasPhoto
      ? `${SHAPE_LABELS[st.photoShape]} · ${Math.min(st.photoSize, photoMax)} px`
      : "Aucune photo",
    logo: hasLogo
      ? `${logoFit(sig).shown(st.logoWidth)} px de large`
      : "Aucun logo",
    icones: hasNetworks
      ? `${ICON_LABELS[st.iconStyle]} · ${ICON_COLOR_LABELS[st.iconColorMode]} · ${Math.min(st.iconSize, iconMax)} px`
      : "Aucun réseau",
    elements:
      [hasPhoto && "Photo", hasLogo && "Logo", hasNetworks && "Réseaux"]
        .filter(Boolean)
        .join(" · ") || "Rien d'ajouté pour l'instant",
  };

  return (
    <div className="divide-y divide-[#EEEFF1] dark:divide-[#232323]">
      {/* Ces réglages valent pour toute la signature ; un élément se règle
          seul depuis l'aperçu */}
      <p className="flex items-start gap-2 pb-5 text-sm text-muted-foreground">
        <MousePointerClick size={16} className="mt-0.5 shrink-0" />
        Réglages de toute la signature. Pour un seul élément, cliquez-le dans
        l&apos;aperçu.
      </p>
      <Section title="Texte" {...section("texte")} summary={summaries.texte}>
        <Row
          label="Police"
          hint="Seules ces polices s'affichent partout : Gmail, Outlook, Apple Mail."
        >
          <Select
            value={st.fontFamily}
            onValueChange={(v) => setStyle({ fontFamily: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
          value={st.fontSize}
          min={11}
          max={18}
          onChange={(v) => setStyle({ fontSize: v })}
        />
        <ColorRow
          label="Couleur principale"
          value={st.primaryColor}
          onChange={(v) => setStyle({ primaryColor: v })}
          hint="Accents, icônes et bouton. Une couleur de ton moyen reste lisible en mode sombre."
        />
        <div className="grid grid-cols-2 gap-4">
          <ColorRow
            label="Texte"
            value={st.textColor}
            onChange={(v) => setStyle({ textColor: v })}
          />
          <ColorRow
            label="Texte secondaire"
            value={st.mutedColor}
            onChange={(v) => setStyle({ mutedColor: v })}
          />
        </div>
      </Section>

      <Section
        title="Disposition"
        {...section("disposition")}
        summary={summaries.disposition}
      >
        <ResetLayout sig={sig} template={template} setStyle={setStyle} />
        {/* Seuls les réglages d'éléments présents sont proposés */}
        <Group title={hasPhoto ? "Photo et couleur" : "Couleur"}>
          <IdentityZoneControl st={st} setStyle={setStyle} />
          {hasPhoto ? (
            <PhotoLayoutControls st={st} setStyle={setStyle} shown={shown} />
          ) : (
            <TextAlignControl st={st} setStyle={setStyle} shown={shown} />
          )}
        </Group>
        <Group title="Textes">
          <IdentityControls st={st} setStyle={setStyle} />
          <ContactStyleControl st={st} setStyle={setStyle} />
        </Group>
        {(hasNetworks || hasLogo) && (
          <Group
            title={
              hasNetworks && hasLogo
                ? "Réseaux et logo"
                : hasNetworks
                  ? "Réseaux"
                  : "Logo"
            }
          >
            {hasNetworks && (
              <>
                <SocialPositionControl st={st} setStyle={setStyle} />
                <SocialRowsControl
                  st={st}
                  setStyle={setStyle}
                  count={sig.social.filter((s) => s.url?.trim()).length}
                />
              </>
            )}
            {hasLogo && <LogoPositionControl st={st} setStyle={setStyle} />}
          </Group>
        )}
        <Group title="Largeurs et espacement">
          <SignatureWidthRow st={st} setStyle={setStyle} />
          <ColumnWidthControls
            st={st}
            setStyle={setStyle}
            shown={shown}
          />
          <Row
            label="Espace entre les éléments"
            hint="Pour un seul élément, cliquez-le dans l'aperçu."
          >
            <Choice
              value={st.spacing}
              onChange={(v) => setStyle({ spacing: v })}
              options={[
                { value: "compact", label: "Serré" },
                { value: "normal", label: "Normal" },
                { value: "airy", label: "Aéré" },
              ]}
            />
          </Row>
        </Group>
      </Section>

      <Section
        title="Traits"
        description="Affichez ou non chaque trait, puis réglez sa longueur et son épaisseur."
        {...section("traits")}
        summary={summaries.traits}
      >
        <AccentControls st={st} setStyle={setStyle} lines={lines} />
        <DividerControls
          st={st}
          setStyle={setStyle}
          lines={lines}
          shown={shown}
        />
        <ColorRow
          label="Couleur des traits"
          hint="Celle du séparateur « Couleur des traits » et du contour de l'encadré."
          value={st.separatorColor}
          onChange={(v) => setStyle({ separatorColor: v })}
        />
      </Section>

      <Section
        title="Encadré"
        {...section("encadre")}
        summary={summaries.encadre}
      >
        <Row label="Style">
          <Select
            value={st.frame}
            onValueChange={(v) => setStyle({ frame: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              <SelectItem value="outline">Contour</SelectItem>
              <SelectItem value="soft">Fond teinté</SelectItem>
              <SelectItem value="accent-left">Barre à gauche</SelectItem>
              <SelectItem value="accent-top">Barre en haut</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        {/* Réglages de l'encadré choisi, dépliés sous le choix */}
        {st.frame !== "none" && (
          <Nested>
          <ColorRow
            label="Couleur de l'encadré"
            hint={
              st.frameColor
                ? undefined
                : "Automatique : elle suit la couleur principale (ou les traits pour le contour)."
            }
            action={
              st.frameColor ? (
                <ResetLink onClick={() => setStyle({ frameColor: "" })}>
                  Automatique
                </ResetLink>
              ) : null
            }
            // Automatique : ce que le rendu utilise (fond teinté = couleur
            // principale très éclaircie)
            value={
              st.frameColor ||
              (st.frame === "outline"
                ? st.separatorColor
                : st.frame === "soft"
                  ? tintOf(st.primaryColor, 0.07)
                  : st.primaryColor)
            }
            onChange={(v) => setStyle({ frameColor: v })}
          />
        {(st.frame === "outline" || bars) && (
          <SliderRow
            label={bars ? "Épaisseur de la barre" : "Épaisseur du contour"}
            value={st.frameThickness || lines?.frameThickness || (bars ? 4 : 1)}
            min={1}
            max={8}
            onChange={(v) => setStyle({ frameThickness: v })}
          />
        )}
        {bars && (
          <LengthRow
            label="Longueur de la barre"
            autoLabel="Toute la longueur"
            value={st.frameBarLength}
            onChange={(v) => setStyle({ frameBarLength: v })}
            min={16}
            max={720}
            step={4}
            initial={st.frame === "accent-top" ? 80 : 48}
          />
        )}
        <FooterStripControl st={st} setStyle={setStyle} shown={shown} />
        <OutsideControls st={st} setStyle={setStyle} shown={shown} />
          </Nested>
        )}
        {(L.boxed || L.hasHeader || st.visualFill !== "none") && (
          <SliderRow
            label="Arrondi"
            value={st.radius}
            min={0}
            max={24}
            step={2}
            onChange={(v) => setStyle({ radius: v })}
          />
        )}
      </Section>

      {/* Photo, logo et réseaux se règlent dans leur propre panneau (comme
          en les cliquant dans l'aperçu) : un seul endroit par réglage */}
      <Section
        title="Photo, logo et réseaux"
        {...section("elements")}
        summary={summaries.elements}
      >
        <p className="text-sm text-muted-foreground">
          Forme, taille et couleurs se règlent dans le panneau de chacun, ou
          en le cliquant dans l&apos;aperçu.
        </p>
        <ul className="divide-y rounded-lg border">
          {[
            {
              key: "photo",
              label: "Photo",
              has: hasPhoto,
              detail: summaries.photo,
              add: "Ajouter une photo",
            },
            {
              key: "logo",
              label: "Logo",
              has: hasLogo,
              detail: summaries.logo,
              add: "Ajouter un logo",
            },
            {
              key: "social",
              label: "Réseaux sociaux",
              has: hasNetworks,
              detail: summaries.icones,
              add: "Ajouter un réseau",
            },
          ].map((row) => (
            <li key={row.key}>
              <button
                type="button"
                onClick={() =>
                  row.has
                    ? onSelect?.({ level: "element", key: row.key })
                    : onGoTo?.(row.key)
                }
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-accent cursor-pointer"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{row.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {row.has ? row.detail : row.add}
                  </span>
                </span>
                <ChevronRight
                  size={14}
                  className="shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
