"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { RotateCcw } from "lucide-react";
import { cleanSlots, slotOf, templateLayout } from "../slots";
import {
  Choice,
  ColorRow,
  LengthRow,
  Row,
  Section,
  SliderRow,
} from "./controls";
import {
  AccentControls,
  ContactStyleControl,
  DividerControls,
  FooterStripControl,
  IdentityControls,
  IdentityZoneControl,
  LogoPositionControl,
  OutsideControls,
  PhotoLayoutControls,
  SocialPositionControl,
  SocialRowsControl,
  layoutState,
} from "./LayoutControls";

export { Choice, ColorRow, Row, SliderRow };

/** Lien discret à droite d'un libellé, pour revenir à une valeur auto. */
export function ResetLink({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
    >
      <RotateCcw size={11} />
      {children}
    </button>
  );
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
        <ColorRow
          label="Couleur du contour"
          value={st.photoBorderColor || defaultColor}
          onChange={(v) => setStyle({ photoBorderColor: v })}
        />
      )}
    </>
  );
}

/** Réglages de placement repris du modèle par « Revenir à la disposition ». */
const LAYOUT_KEYS = ["slots", "visualSide", "visualFill", "headerPhoto", "headerFill"];

/**
 * Remet chaque élément à sa place dans le modèle, après des déplacements.
 * N'apparaît que si la disposition s'en écarte.
 */
function ResetLayout({ sig, template, setStyle }) {
  const st = sig.style;
  // Sans photo, la disposition de référence est celle adaptée au contenu
  const defaults = templateLayout(template?.defaults, sig);
  if (!defaults?.slots) return null;
  const same = LAYOUT_KEYS.every(
    (k) => JSON.stringify(cleanValue(st[k])) === JSON.stringify(cleanValue(defaults[k])),
  );
  if (same) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-[#F5F5F5] px-3 py-2.5 dark:bg-neutral-900">
      <p className="text-xs text-muted-foreground">Disposition personnalisée</p>
      <button
        type="button"
        onClick={() =>
          setStyle(Object.fromEntries(LAYOUT_KEYS.map((k) => [k, cleanValue(defaults[k])])))
        }
        className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-[#5b4fff] hover:underline cursor-pointer"
      >
        <RotateCcw size={12} />
        Revenir au modèle {template.name}
      </button>
    </div>
  );
}

/** Valeur sans champ GraphQL technique (emplacements). */
function cleanValue(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return cleanSlots(value);
  }
  return value;
}

/**
 * Panneau « Style » : tout ce qui n'est pas du contenu.
 * Les valeurs possibles viennent du catalogue de l'API, la police est
 * limitée aux polices lisibles dans tous les clients mail.
 */
export default function StylePanel({ sig, update, catalog, template, lines }) {
  const st = sig.style;
  const setStyle = (patch) => update({ style: patch });
  const L = layoutState(st);
  const bars = st.frame === "accent-left" || st.frame === "accent-top";

  return (
    <div className="space-y-8">
      <Section title="Texte">
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

      <Section title="Disposition">
        <ResetLayout sig={sig} template={template} setStyle={setStyle} />
        <IdentityZoneControl st={st} setStyle={setStyle} />
        <PhotoLayoutControls st={st} setStyle={setStyle} />
        <IdentityControls st={st} setStyle={setStyle} />
        <ContactStyleControl st={st} setStyle={setStyle} />
        <SocialPositionControl st={st} setStyle={setStyle} />
        <SocialRowsControl
          st={st}
          setStyle={setStyle}
          count={sig.social.filter((s) => s.url?.trim()).length}
        />
        <LogoPositionControl st={st} setStyle={setStyle} />
        <Row label="Espacement">
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
      </Section>

      <Section
        title="Traits"
        description="Affichez ou non chaque trait, puis réglez sa longueur et son épaisseur."
      >
        <AccentControls st={st} setStyle={setStyle} lines={lines} />
        <DividerControls st={st} setStyle={setStyle} lines={lines} />
        <ColorRow
          label="Gris des traits"
          hint="Utilisé par le séparateur gris et par le contour de l'encadré."
          value={st.separatorColor}
          onChange={(v) => setStyle({ separatorColor: v })}
        />
      </Section>

      <Section title="Encadré">
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
        {st.frame !== "none" && (
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
            value={
              st.frameColor ||
              (st.frame === "outline" ? st.separatorColor : st.primaryColor)
            }
            onChange={(v) => setStyle({ frameColor: v })}
          />
        )}
        {(st.frame === "outline" || bars) && (
          <SliderRow
            label={bars ? "Épaisseur de la barre" : "Épaisseur du contour"}
            value={st.frameThickness || lines?.frameThickness || (bars ? 4 : 1)}
            min={1}
            max={8}
            onChange={(v) => setStyle({ frameThickness: v })}
          />
        )}
        {L.boxed && (
          <LengthRow
            label="Largeur du cadre"
            autoLabel="Ajustée au contenu"
            hint="Sur un téléphone, le cadre ne dépasse jamais la largeur de l'écran."
            value={st.frameWidth}
            onChange={(v) => setStyle({ frameWidth: v })}
            min={240}
            max={720}
            step={10}
            initial={480}
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
        <FooterStripControl st={st} setStyle={setStyle} />
        <OutsideControls st={st} setStyle={setStyle} />
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

      <Section title="Photo">
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
      </Section>

      <Section title="Logo">
        <SliderRow
          label="Largeur"
          value={st.logoWidth}
          min={40}
          max={200}
          step={4}
          onChange={(v) => setStyle({ logoWidth: v })}
        />
      </Section>

      <Section title="Icônes">
        <Row label="Style des réseaux">
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
        <Row
          label="Couleur des icônes"
          hint="Les couleurs de marque et les tons moyens gardent le même rendu en mode clair et sombre."
        >
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
          label="Taille des réseaux"
          value={st.iconSize}
          min={16}
          max={40}
          step={2}
          onChange={(v) => setStyle({ iconSize: v })}
        />
      </Section>
    </div>
  );
}
