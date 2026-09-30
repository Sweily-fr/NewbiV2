"use client";

import { Bold, CaseUpper, Italic } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ColorRow, MultiChoice, ResetLink, Row, Section, SliderRow } from "./controls";

const DEFAULT_FONT = "__signature";

/**
 * Mise en forme d'un élément de texte. Les valeurs affichées sont celles
 * réellement appliquées (renvoyées par le rendu de l'API) ; seul ce que
 * l'utilisateur change est enregistré, le reste suit le modèle.
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
