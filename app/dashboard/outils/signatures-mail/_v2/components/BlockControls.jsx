"use client";

import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import {
  ELEMENT_ITEMS,
  ITEM_LABEL,
  mainPiece,
  mergedRow,
  piecesOf,
  shownItems,
  slotOf,
} from "../slots";
import { ELEMENT_TITLE } from "./LevelPanels";
import { Choice, Hint, LengthRow, ResetLink, Row, SpaceRow } from "./controls";

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
    label: "Largeur de la bannière",
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
  withSpaces = true,
}) {
  const st = sig.style;
  const blocks = st.blocks || {};
  const block = blocks[element] || {};
  const width = WIDTH[element];
  const shown = shownItems(sig);
  // Sur la ligne d'un autre (poste et entreprise en capitales, identité en
  // ligne) : la ligne se règle sur son premier élément
  const row = mergedRow(sig, element);
  if (row && row[0] !== element) {
    return (
      <Hint>
        Sur la même ligne que « {ELEMENT_TITLE[row[0]] || row[0]} » : largeur,
        espaces et alignement se règlent sur lui.
      </Hint>
    );
  }
  // Élément en plusieurs morceaux : ces réglages valent pour le principal
  const split = piecesOf(st, shown, element).length > 1;
  const items = (split && mainPiece(st, shown, element)) ||
    ELEMENT_ITEMS[element] || [element];
  // Photo du bandeau : sa place se règle avec le bandeau
  const slot = items.map((k) => slotOf(st.slots, k)).find(Boolean) || null;
  if (element === "photo" && slot === "header") return null;
  // Aligner n'a d'effet qu'à côté d'autres éléments de sa colonne, ou dans
  // une colonne de largeur choisie
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
      {split && (
        <Hint>
          Réglages du groupe principal ({items.map((k) => ITEM_LABEL[k]).join(", ")}),
          entouré dans l&apos;aperçu. Les parties placées ailleurs restent
          automatiques.
        </Hint>
      )}
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
      {withSpaces && (
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
      )}
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
