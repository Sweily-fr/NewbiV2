"use client";

import { Bold, CaseUpper, Italic } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  ColorRow,
  FOCUS_RING,
  MultiChoice,
  ResetLink,
  Row,
  Section,
  SliderRow,
} from "./controls";
import { fontSizePatch } from "../slots";

const DEFAULT_FONT = "__signature";

/**
 * Mise en forme d'un élément de texte. Les valeurs affichées sont celles
 * réellement appliquées (renvoyées par le rendu de l'API) ; seul ce que
 * l'utilisateur change est enregistré, le reste suit le modèle (ou, pour
 * une partie, son élément : `resetLabel` le dit).
 */
export default function TextStyleControls({
  elementKey,
  sig,
  update,
  resolved,
  catalog,
  withColor = true,
  intro = null,
  footer = null,
  resetLabel = "Revenir au style du modèle",
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
          <SelectTrigger className={`w-full ${FOCUS_RING}`}>
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
        // Comme le coin du cadre : les parties réglées à part suivent
        onChange={(v) =>
          update({
            style: fontSizePatch(st, elementKey, v, value("fontSize", st.fontSize)),
          })
        }
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
          // Seul le style touché est enregistré : les autres suivent encore
          // le modèle (ou l'élément, pour une partie)
          onChange={(v) => {
            const patch = {};
            for (const k of ["bold", "italic", "uppercase"]) {
              if (v.includes(k) !== Boolean(value(k, false))) {
                patch[k] = v.includes(k);
              }
            }
            if (Object.keys(patch).length > 0) set(patch);
          }}
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
        <ResetLink onClick={reset}>{resetLabel}</ResetLink>
      )}
      {footer}
    </Section>
  );
}
