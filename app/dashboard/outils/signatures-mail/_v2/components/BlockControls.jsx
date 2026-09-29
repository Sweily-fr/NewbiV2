"use client";

import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { ELEMENT_ITEMS, slotOf } from "../slots";
import {
  Choice,
  LengthRow,
  OffsetRow,
  ResetLink,
  Row,
  Section,
} from "./controls";

/** Blocs dont la largeur se règle ici (les images ont leur propre taille). */
const WIDTH = {
  name: { label: "Largeur", hint: "Le texte revient à la ligne à cette largeur.", min: 40, initial: 280 },
  jobTitle: { label: "Largeur", hint: "Le texte revient à la ligne à cette largeur.", min: 40, initial: 240 },
  company: { label: "Largeur", hint: "Le texte revient à la ligne à cette largeur.", min: 40, initial: 240 },
  tagline: { label: "Largeur", hint: "Le texte revient à la ligne à cette largeur.", min: 40, initial: 280 },
  contact: { label: "Largeur", hint: "Une adresse longue revient à la ligne à cette largeur.", min: 80, initial: 280 },
  disclaimer: { label: "Largeur", hint: "La mention revient à la ligne à cette largeur.", min: 80, initial: 480 },
  cta: { label: "Largeur du bouton", hint: "Le texte reste centré dans le bouton.", min: 80, initial: 220 },
  banner: { label: "Largeur du bandeau", hint: "La hauteur suit, sans déformer l'image.", min: 120, initial: 480 },
};

const COLUMNS = {
  visual: { label: "Largeur de la colonne photo", min: 40, max: 600, initial: 140 },
  text: { label: "Largeur de la colonne de texte", min: 80, max: 640, initial: 320 },
  side: { label: "Largeur de la colonne de droite", min: 40, max: 400, initial: 140 },
};

/** Réglages par bloc sans champ vide. */
function cleanBlock(block) {
  return Object.fromEntries(
    Object.entries(block || {}).filter(
      ([, v]) => v !== 0 && v !== null && v !== undefined && v !== "",
    ),
  );
}

/**
 * Taille et espacement d'un bloc : largeur, espace au-dessus et en
 * dessous, alignement, largeur de sa colonne. Rendus en tableaux (largeur
 * en attribut, espaces en marges intérieures de cellule) : Gmail, Outlook
 * et Apple Mail les affichent tels quels.
 */
export default function BlockControls({ element, st, setStyle }) {
  const blocks = st.blocks || {};
  const block = blocks[element] || {};
  const width = WIDTH[element];
  const slot = slotOf(st.slots, (ELEMENT_ITEMS[element] || [element])[0]);
  const column = COLUMNS[slot];
  // Photo du bandeau : sa place se règle avec le bandeau (Disposition)
  if (element === "photo" && slot === "header") return null;

  const set = (patch) => {
    const next = cleanBlock({ ...block, ...patch });
    const all = { ...blocks };
    if (Object.keys(next).length > 0) all[element] = next;
    else delete all[element];
    setStyle({ blocks: all });
  };

  return (
    <Section
      title="Taille et espacement"
      description="Astuce : sélectionnez le bloc dans l'aperçu et tirez son bord pour l'élargir."
    >
      {width && (
        <LengthRow
          label={width.label}
          hint={width.hint}
          autoLabel="Automatique"
          value={block.width || 0}
          onChange={(v) => set({ width: v })}
          min={width.min}
          max={640}
          step={4}
          initial={width.initial}
        />
      )}
      <div className="grid grid-cols-2 gap-4">
        <OffsetRow
          label="Espace au-dessus"
          value={block.spaceBefore || 0}
          onChange={(v) => set({ spaceBefore: v })}
        />
        <OffsetRow
          label="Espace en dessous"
          value={block.spaceAfter || 0}
          onChange={(v) => set({ spaceAfter: v })}
        />
      </div>
      <Row
        label="Alignement"
        action={
          block.align ? (
            <ResetLink onClick={() => set({ align: "" })}>
              Automatique
            </ResetLink>
          ) : null
        }
      >
        <Choice
          label="Alignement du bloc"
          value={block.align || ""}
          onChange={(v) => set({ align: v })}
          options={[
            { value: "left", label: "Gauche", icon: <AlignLeft size={14} /> },
            { value: "center", label: "Centre", icon: <AlignCenter size={14} /> },
            { value: "right", label: "Droite", icon: <AlignRight size={14} /> },
          ]}
        />
      </Row>
      {column && (
        <LengthRow
          label={column.label}
          autoLabel="Ajustée au contenu"
          value={st.columns?.[slot] || 0}
          onChange={(v) =>
            setStyle({ columns: { ...(st.columns || {}), [slot]: v } })
          }
          min={column.min}
          max={column.max}
          step={10}
          initial={column.initial}
        />
      )}
      {Object.keys(block).length > 0 && (
        <ResetLink
          onClick={() => {
            const all = { ...blocks };
            delete all[element];
            setStyle({ blocks: all });
          }}
        >
          Revenir aux réglages du modèle pour ce bloc
        </ResetLink>
      )}
    </Section>
  );
}
