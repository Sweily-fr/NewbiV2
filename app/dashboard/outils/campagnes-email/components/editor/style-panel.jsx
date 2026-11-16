"use client";

import { Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import {
  FONT_FAMILIES,
  LIMITS,
  STYLE_PRESETS,
  fontStack,
} from "@/src/utils/email-campaign-design";
import { FOCUS_RING } from "../shared";
import { ColorRow, PanelSection, Row, SliderRow } from "./controls";

const PRESET_KEYS = [
  "backgroundColor",
  "contentBackgroundColor",
  "textColor",
  "headingColor",
  "linkColor",
  "primaryColor",
  "footerTextColor",
];

const matchesPreset = (style, preset) =>
  PRESET_KEYS.every(
    (key) =>
      String(style[key] || "").toLowerCase() ===
      String(preset.style[key]).toLowerCase(),
  );

/** Palette : fond, cadre et accent en miniature. */
function PresetSwatch({ preset, selected, onClick }) {
  const { style } = preset;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      title={preset.label}
      className={cn(
        "group flex cursor-pointer flex-col items-center gap-1.5 rounded-lg",
        FOCUS_RING,
      )}
    >
      <span
        className={cn(
          "relative flex h-11 w-full items-center justify-center rounded-lg border transition-shadow",
          selected
            ? "border-[#5a50ff] shadow-[0_0_0_2px_rgba(90,80,255,0.25)]"
            : "border-black/10 group-hover:border-black/25 dark:border-white/15",
        )}
        style={{ backgroundColor: style.backgroundColor }}
      >
        <span
          className="flex h-7 w-8 flex-col justify-center gap-1 rounded-[4px] px-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
          style={{ backgroundColor: style.contentBackgroundColor }}
        >
          <span
            className="h-[3px] w-4 rounded-full"
            style={{ backgroundColor: style.headingColor }}
          />
          <span
            className="h-[5px] w-3 rounded-[2px]"
            style={{ backgroundColor: style.primaryColor }}
          />
        </span>
        {selected && (
          <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-[#5a50ff] text-white">
            <Check className="size-2.5" strokeWidth={3} aria-hidden />
          </span>
        )}
      </span>
      <span className="text-[11px] text-muted-foreground group-hover:text-foreground">
        {preset.label}
      </span>
    </button>
  );
}

/**
 * Onglet « Style » : palettes prêtes, couleurs (fond, cadre, textes,
 * titres, liens, boutons, pied de page), police et dimensions du cadre.
 */
export function StylePanel({ style, onChange }) {
  const set = (patch, key) => onChange(patch, key);
  return (
    <div className="flex flex-col">
      <PanelSection title="Palettes">
        <div
          role="radiogroup"
          aria-label="Palettes de couleurs"
          className="grid grid-cols-5 gap-2"
        >
          {STYLE_PRESETS.map((preset) => (
            <PresetSwatch
              key={preset.key}
              preset={preset}
              selected={matchesPreset(style, preset)}
              onClick={() => set(preset.style)}
            />
          ))}
        </div>
      </PanelSection>
      <PanelSection title="Couleurs">
        <ColorRow
          label="Fond de la page"
          value={style.backgroundColor}
          onChange={(backgroundColor) =>
            set({ backgroundColor }, "backgroundColor")
          }
        />
        <ColorRow
          label="Fond du cadre"
          value={style.contentBackgroundColor}
          onChange={(contentBackgroundColor) =>
            set({ contentBackgroundColor }, "contentBackgroundColor")
          }
        />
        <div className="grid grid-cols-2 gap-3">
          <ColorRow
            label="Texte"
            value={style.textColor}
            onChange={(textColor) => set({ textColor }, "textColor")}
          />
          <ColorRow
            label="Titres"
            value={style.headingColor}
            onChange={(headingColor) => set({ headingColor }, "headingColor")}
          />
          <ColorRow
            label="Liens"
            value={style.linkColor}
            onChange={(linkColor) => set({ linkColor }, "linkColor")}
          />
          <ColorRow
            label="Boutons"
            value={style.primaryColor}
            onChange={(primaryColor) => set({ primaryColor }, "primaryColor")}
          />
        </div>
        <ColorRow
          label="Pied de page"
          value={style.footerTextColor}
          onChange={(footerTextColor) =>
            set({ footerTextColor }, "footerTextColor")
          }
          hint="Couleur du texte ajouté automatiquement en bas de l'e-mail."
        />
      </PanelSection>
      <PanelSection title="Police">
        <Row label="Police du texte">
          <Select
            value={style.fontFamily}
            onValueChange={(fontFamily) => set({ fontFamily })}
          >
            <SelectTrigger aria-label="Police du texte">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((family) => (
                <SelectItem key={family} value={family}>
                  <span style={{ fontFamily: fontStack(family) }}>
                    {family}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <p className="text-xs leading-5 text-muted-foreground">
          Polices présentes sur tous les ordinateurs et téléphones :
          l&apos;e-mail s&apos;affiche partout comme ici.
        </p>
      </PanelSection>
      <PanelSection title="Cadre">
        <SliderRow
          label="Largeur"
          value={style.contentWidth}
          min={LIMITS.contentWidth[0]}
          max={LIMITS.contentWidth[1]}
          step={10}
          onChange={(contentWidth) => set({ contentWidth }, "contentWidth")}
          hint="600 px conviennent à la plupart des messageries."
        />
        <SliderRow
          label="Arrondi des coins"
          value={style.contentRadius}
          min={LIMITS.contentRadius[0]}
          max={LIMITS.contentRadius[1]}
          onChange={(contentRadius) => set({ contentRadius }, "contentRadius")}
        />
      </PanelSection>
    </div>
  );
}
