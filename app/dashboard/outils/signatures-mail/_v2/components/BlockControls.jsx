"use client";

import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { ELEMENT_ITEMS, shownItems, slotOf } from "../slots";
import { Choice, LengthRow, ResetLink, Row, SpaceRow } from "./controls";

const WRAP_HINT =
  "Le texte revient à la ligne à cette largeur. Vous pouvez aussi tirer le bord du cadre dans l'aperçu.";

/** Blocs dont la largeur se règle ici (les images ont leur propre taille). */
const WIDTH = {
  name: { label: "Largeur", hint: WRAP_HINT, min: 40, initial: 280 },
  jobTitle: { label: "Largeur", hint: WRAP_HINT, min: 40, initial: 240 },
  company: { label: "Largeur", hint: WRAP_HINT, min: 40, initial: 240 },
  tagline: { label: "Largeur", hint: WRAP_HINT, min: 40, initial: 280 },
  contact: { label: "Largeur", hint: WRAP_HINT, min: 80, initial: 280 },
  disclaimer: { label: "Largeur", hint: WRAP_HINT, min: 80, initial: 480 },
  cta: {
    label: "Largeur du bouton",
    hint: "Le texte reste centré dans le bouton.",
    min: 80,
    initial: 220,
  },
  banner: {
    label: "Largeur du bandeau",
    hint: "La hauteur suit, sans déformer l'image.",
    min: 120,
    initial: 480,
  },
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
 * Largeur, espace au-dessus et en dessous, alignement d'un bloc : fin de la
 * section « Disposition » de son panneau. Rendus en tableaux (largeur en
 * attribut, espaces en marges intérieures de cellule, alignement en
 * attribut) : Gmail, Outlook et Apple Mail les affichent tels quels.
 */
export default function BlockControls({
  element,
  sig,
  setStyle,
  alignLabel = "Alignement",
}) {
  const st = sig.style;
  const blocks = st.blocks || {};
  const block = blocks[element] || {};
  const width = WIDTH[element];
  const items = ELEMENT_ITEMS[element] || [element];
  // Photo du bandeau : sa place se règle avec le bandeau
  const slot = slotOf(st.slots, items[0]);
  if (element === "photo" && slot === "header") return null;
  // Aligner n'a d'effet qu'à côté d'autres éléments de sa colonne, ou dans
  // une colonne de largeur choisie
  const shown = shownItems(sig);
  const mates = (st.slots?.[slot] || []).filter(
    (k) => shown.has(k) && !items.includes(k),
  );
  const canAlign =
    mates.length > 0 || st.columns?.[slot] > 0 || Boolean(block.align);

  const set = (patch) => {
    const next = cleanBlock({ ...block, ...patch });
    const all = { ...blocks };
    if (Object.keys(next).length > 0) all[element] = next;
    else delete all[element];
    setStyle({ blocks: all });
  };

  return (
    <>
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
        <SpaceRow
          label="Espace au-dessus"
          value={block.spaceBefore || 0}
          onChange={(v) => set({ spaceBefore: v })}
        />
        <SpaceRow
          label="Espace en dessous"
          value={block.spaceAfter || 0}
          onChange={(v) => set({ spaceAfter: v })}
        />
      </div>
      {canAlign && (
        <Row
          label={alignLabel}
          hint={block.align ? null : "Auto : l'alignement prévu par le modèle."}
        >
          <Choice
            label={alignLabel}
            value={block.align || ""}
            onChange={(v) => set({ align: v })}
            options={[
              { value: "", label: "Auto" },
              { value: "left", label: "Gauche", icon: <AlignLeft size={14} /> },
              { value: "center", label: "Centre", icon: <AlignCenter size={14} /> },
              { value: "right", label: "Droite", icon: <AlignRight size={14} /> },
            ]}
          />
        </Row>
      )}
      {Object.keys(block).length > 0 && (
        <ResetLink
          onClick={() => {
            const all = { ...blocks };
            delete all[element];
            setStyle({ blocks: all });
          }}
        >
          Revenir aux valeurs du modèle pour cet élément
        </ResetLink>
      )}
    </>
  );
}
