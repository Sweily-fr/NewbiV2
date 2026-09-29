"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { RotateCcw } from "lucide-react";
import ColorField from "./ColorField";
import { cleanSlots, slotOf } from "../slots";
import { Choice, ColorRow, Row, SliderRow } from "./controls";
import {
  ContactStyleControl,
  DividerControl,
  FooterStripControl,
  IdentityControls,
  IdentityZoneControl,
  LogoPositionControl,
  OutsideControls,
  PhotoLayoutControls,
  SocialPositionControl,
  layoutState,
} from "./LayoutControls";

export { Choice, ColorRow, Row, SliderRow };

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
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
function ResetLayout({ st, template, setStyle }) {
  const defaults = template?.defaults;
  if (!defaults?.slots) return null;
  const same = LAYOUT_KEYS.every(
    (k) => JSON.stringify(cleanValue(st[k])) === JSON.stringify(cleanValue(defaults[k])),
  );
  if (same) return null;
  return (
    <button
      type="button"
      onClick={() =>
        setStyle(Object.fromEntries(LAYOUT_KEYS.map((k) => [k, cleanValue(defaults[k])])))
      }
      className="flex items-center gap-1.5 text-xs text-[#5a50ff] hover:underline cursor-pointer"
    >
      <RotateCcw size={12} />
      Revenir à la disposition du modèle {template.name}
    </button>
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
export default function StylePanel({ sig, update, catalog, template }) {
  const st = sig.style;
  const setStyle = (patch) => update({ style: patch });

  return (
    <div className="space-y-6">
      <Section title="Texte">
        <Row
          label="Police"
          hint="Seules ces polices s'affichent partout : Gmail, Outlook, Apple Mail."
        >
          <Select
            value={st.fontFamily}
            onValueChange={(v) => setStyle({ fontFamily: v })}
          >
            <SelectTrigger size="sm" className="h-8 w-44 text-xs">
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
      </Section>

      <Section title="Disposition">
        <ResetLayout st={st} template={template} setStyle={setStyle} />
        <IdentityZoneControl st={st} setStyle={setStyle} />
        <PhotoLayoutControls st={st} setStyle={setStyle} />
        <DividerControl st={st} setStyle={setStyle} />
        <IdentityControls st={st} setStyle={setStyle} />
        <ContactStyleControl st={st} setStyle={setStyle} />
        <SocialPositionControl st={st} setStyle={setStyle} />
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
        <ColorRow
          label="Traits de séparation"
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
            <SelectTrigger size="sm" className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              <SelectItem value="outline">Contour fin</SelectItem>
              <SelectItem value="soft">Fond teinté</SelectItem>
              <SelectItem value="accent-left">Barre à gauche</SelectItem>
              <SelectItem value="accent-top">Barre en haut</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        {st.frame !== "none" && (
          <Row
            label="Couleur de l'encadré"
            hint="Sans choix, elle suit la couleur principale (ou les traits pour le contour)."
          >
            <div className="flex items-center gap-2">
              {st.frameColor && (
                <button
                  type="button"
                  onClick={() => setStyle({ frameColor: "" })}
                  className="text-[11px] text-muted-foreground underline cursor-pointer"
                >
                  Auto
                </button>
              )}
              <ColorField
                value={
                  st.frameColor ||
                  (st.frame === "outline" ? st.separatorColor : st.primaryColor)
                }
                onChange={(v) => setStyle({ frameColor: v })}
              />
            </div>
          </Row>
        )}
        <FooterStripControl st={st} setStyle={setStyle} />
        <OutsideControls st={st} setStyle={setStyle} />
        {(layoutState(st).boxed ||
          layoutState(st).hasHeader ||
          st.visualFill !== "none") && (
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
