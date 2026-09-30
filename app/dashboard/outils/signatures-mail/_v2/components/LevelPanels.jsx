"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronRight,
} from "lucide-react";
import {
  BLOCK_OF,
  ELEMENT_ITEMS,
  ITEM_LABEL,
  SLOTS,
  SLOT_LABEL,
  moveElement,
  moveItem,
  selectionChain,
  shiftItem,
  shownItems,
  slotOf,
} from "../slots";
import { emailProblem, linkProblem } from "../links";
import { Choice, Hint, Row, Section } from "./controls";
import { TextField } from "./ContentPanel";
import TextStyleControls from "./TextStyleControls";
import {
  ColumnWidthRow,
  DividerControls,
  FooterStripControl,
  OutsideControls,
  Pick,
  PictoPick,
  layoutState,
} from "./LayoutControls";
import { FillPicto } from "./Pictos";

/**
 * Panneaux des niveaux de sélection de l'aperçu autres que l'élément : une
 * partie seule (prénom, nom, une ligne de coordonnées), une colonne, toute
 * la signature. Un fil d'Ariane relie chaque niveau à ceux qui le
 * contiennent.
 */

/** Titre de chaque élément (panneau d'élément). */
export const ELEMENT_TITLE = {
  name: "Nom",
  accent: "Trait sous le nom",
  jobTitle: "Poste",
  company: "Entreprise",
  tagline: "Accroche",
  contact: "Coordonnées",
  social: "Réseaux sociaux",
  photo: "Photo",
  logo: "Logo",
  banner: "Bandeau",
  cta: "Bouton d'action",
  disclaimer: "Mention",
};

/** Parties réglables seules, et le champ de contenu de chacune. */
const PARTS = {
  firstName: { title: "Prénom", group: "identity", maxLength: 80 },
  lastName: { title: "Nom de famille", group: "identity", maxLength: 80 },
  phone: { title: "Téléphone", group: "contact", type: "tel", maxLength: 40 },
  mobile: { title: "Mobile", group: "contact", type: "tel", maxLength: 40 },
  email: {
    title: "E-mail",
    group: "contact",
    type: "email",
    maxLength: 200,
    problem: emailProblem,
  },
  website: {
    title: "Site web",
    group: "contact",
    maxLength: 300,
    problem: linkProblem,
  },
  address: { title: "Adresse", group: "contact", maxLength: 300 },
};

/** Libellé d'une sélection, pour le titre et le fil d'Ariane. */
export function selectionLabel(sel) {
  if (!sel) return "";
  if (sel.level === "signature") return "Toute la signature";
  if (sel.level === "slot") return SLOT_LABEL[sel.key] || "";
  if (sel.level === "element") return ELEMENT_TITLE[sel.key] || "";
  return PARTS[sel.key]?.title || ITEM_LABEL[sel.key] || "";
}

/**
 * Niveaux qui contiennent la sélection, du plus large au plus proche.
 * `anchor` : dernière partie cliquée (la colonne d'un élément réparti).
 */
export function ancestorsOf(sel, st, anchor) {
  if (!sel || sel.level === "signature") return [];
  if (sel.level === "slot") return [{ level: "signature" }];
  const items =
    sel.level === "item" ? [sel.key] : ELEMENT_ITEMS[sel.key] || [sel.key];
  const from =
    anchor && items.includes(anchor)
      ? anchor
      : items.find((k) => slotOf(st?.slots, k)) || items[0];
  const chain = selectionChain(from, st);
  const at = chain.findIndex((c) => c.level === sel.level);
  return chain.slice(at + 1).reverse();
}

/** En-tête d'un panneau : retour aux onglets, niveaux au-dessus, titre. */
export function LevelHeader({ selected, ancestors, onSelect, onClose }) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <ArrowLeft size={14} />
        Tous les réglages
      </button>
      {ancestors.length > 0 && (
        <nav
          aria-label="Niveaux au-dessus"
          className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
        >
          {ancestors.map((a) => (
            <span
              key={`${a.level}-${a.key || ""}`}
              className="inline-flex items-center gap-1"
            >
              <button
                type="button"
                onClick={() => onSelect(a)}
                className="rounded px-1 py-0.5 -mx-1 hover:bg-accent hover:text-foreground cursor-pointer"
              >
                {selectionLabel(a)}
              </button>
              <ChevronRight size={12} aria-hidden="true" />
            </span>
          ))}
        </nav>
      )}
      <h2 className="text-xl font-medium">{selectionLabel(selected)}</h2>
      {selected.level !== "signature" && (
        <Hint>⌘ + clic (Ctrl + clic) dans l&apos;aperçu : le niveau au-dessus.</Hint>
      )}
    </div>
  );
}

/** Parties d'un élément (prénom et nom, lignes de coordonnées) à régler seules. */
export function PartLinks({ element, sig, onSelect }) {
  const shown = shownItems(sig);
  const parts = (ELEMENT_ITEMS[element] || []).filter(
    (k) => PARTS[k] && shown.has(k),
  );
  if (parts.length < 2) return null;
  return (
    <Row
      label={element === "contact" ? "Une ligne seule" : "Une partie seule"}
      hint="Ou cliquez-la dans l'aperçu."
    >
      <div className="flex flex-wrap gap-1.5">
        {parts.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onSelect({ level: "item", key: k }, k)}
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent cursor-pointer"
          >
            {PARTS[k].title}
            <ChevronRight size={12} aria-hidden="true" />
          </button>
        ))}
      </div>
    </Row>
  );
}

/** Emplacements proposés pour déplacer une partie ou un élément. */
function placeOptions(st) {
  const L = layoutState(st);
  return SLOTS.filter((s) => s !== "outside" || L.framed).map((s) => ({
    value: s,
    label: SLOT_LABEL[s],
  }));
}

/**
 * Emplacement d'une partie (`item`) ou d'un élément entier (`element`) :
 * le choisir l'y emmène, comme un glisser-déposer dans l'aperçu.
 */
export function PlaceRow({ item, element, st, setStyle }) {
  const items = item ? [item] : ELEMENT_ITEMS[element] || [element];
  const current = items.map((k) => slotOf(st.slots, k)).find(Boolean);
  if (!current) return null;
  return (
    <Pick
      label="Emplacement"
      hint="Ou tirez sa poignée ⠿ dans l'aperçu."
      value={current}
      onChange={(v) =>
        setStyle({
          slots: item
            ? moveItem(st.slots, item, v)
            : moveElement(st.slots, element, v),
        })
      }
      options={placeOptions(st)}
    />
  );
}

/**
 * Une partie seule : son contenu, sa mise en forme (par-dessus celle de
 * l'élément) et sa place.
 */
export function ItemPanel({ item, sig, update, resolved, catalog }) {
  const part = PARTS[item];
  if (!part) return null;
  const setStyle = (patch) => update({ style: patch });
  const value = sig[part.group]?.[item];
  const whole = part.group === "identity" ? "du nom" : "des coordonnées";
  return (
    <>
      <Section title="Contenu">
        <TextField
          id={`sig-field-${item}`}
          label={part.title}
          type={part.type}
          value={value}
          onChange={(v) => update({ [part.group]: { [item]: v } })}
          maxLength={part.maxLength}
          warning={part.problem ? part.problem(value) : undefined}
        />
      </Section>
      <TextStyleControls
        elementKey={item}
        sig={sig}
        update={update}
        resolved={resolved}
        catalog={catalog}
        intro={
          <Hint>
            Par-dessus le style {whole} : seul ce que vous changez ici
            s&apos;applique à cette partie.
          </Hint>
        }
      />
      <Section title="Disposition">
        <PlaceRow item={item} st={sig.style} setStyle={setStyle} />
      </Section>
    </>
  );
}

const FILL_OPTIONS = [
  { value: "none", label: "Aucun", picto: <FillPicto fill="none" /> },
  { value: "tint", label: "Teinté", picto: <FillPicto fill="tint" /> },
  { value: "solid", label: "Couleur", picto: <FillPicto fill="solid" /> },
];

/**
 * Une colonne (emplacement) : ses éléments dans l'ordre, sa largeur, son
 * fond et son alignement.
 */
export function SlotPanel({ slot, sig, update, lines, onSelect }) {
  const st = sig.style;
  const setStyle = (patch) => update({ style: patch });
  const L = layoutState(st);
  const shown = shownItems(sig);
  const items = (st.slots?.[slot] || []).filter((k) => shown.has(k));

  let settings = null;
  if (slot === "visual") {
    settings = (
      <>
        <Row label="Côté">
          <Choice
            label="Côté"
            value={st.visualSide}
            onChange={(v) => setStyle({ visualSide: v })}
            options={[
              { value: "left", label: "À gauche" },
              { value: "right", label: "À droite" },
            ]}
          />
        </Row>
        <PictoPick
          label="Fond"
          value={st.visualFill}
          onChange={(v) => setStyle({ visualFill: v })}
          options={FILL_OPTIONS}
        />
        <Row label="Alignement vertical">
          <Choice
            label="Alignement vertical"
            value={st.photoValign}
            onChange={(v) => setStyle({ photoValign: v })}
            options={[
              { value: "top", label: "Haut", icon: <AlignVerticalJustifyStart size={14} /> },
              { value: "middle", label: "Milieu", icon: <AlignVerticalJustifyCenter size={14} /> },
              { value: "bottom", label: "Bas", icon: <AlignVerticalJustifyEnd size={14} /> },
            ]}
          />
        </Row>
        <DividerControls st={st} setStyle={setStyle} lines={lines} />
      </>
    );
  } else if (slot === "header") {
    settings = (
      <Row label="Fond">
        <Choice
          label="Fond"
          value={st.headerFill}
          onChange={(v) => setStyle({ headerFill: v })}
          options={[
            { value: "solid", label: "Couleur" },
            { value: "tint", label: "Teinté" },
          ]}
        />
      </Row>
    );
  } else if (slot === "text" && !L.hasVisual) {
    settings = (
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
    );
  } else if (slot === "footer" || slot === "outside") {
    settings = (
      <>
        <FooterStripControl st={st} setStyle={setStyle} />
        <OutsideControls st={st} setStyle={setStyle} />
      </>
    );
  }

  return (
    <>
      <Section title="Contenu">
        {items.length === 0 ? (
          <Hint>
            Aucun élément ici : tirez-en un par sa poignée ⠿ dans l&apos;aperçu.
          </Hint>
        ) : (
          <ul className="divide-y rounded-lg border">
            {items.map((k, i) => (
              <li key={k} className="flex items-center gap-1 px-2 py-1">
                <button
                  type="button"
                  onClick={() => onSelect(selectionChain(k, st)[0], k)}
                  className="flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-1 text-left text-sm hover:bg-accent cursor-pointer"
                >
                  <span className="truncate">
                    {PARTS[k]?.title || ELEMENT_TITLE[BLOCK_OF[k]] || ITEM_LABEL[k]}
                  </span>
                  <ChevronRight
                    size={12}
                    className="ml-auto shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  aria-label="Monter"
                  title="Monter"
                  disabled={i === 0}
                  onClick={() =>
                    setStyle({ slots: shiftItem(st.slots, slot, k, -1, shown) })
                  }
                  className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 cursor-pointer disabled:cursor-default"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Descendre"
                  title="Descendre"
                  disabled={i === items.length - 1}
                  onClick={() =>
                    setStyle({ slots: shiftItem(st.slots, slot, k, 1, shown) })
                  }
                  className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 cursor-pointer disabled:cursor-default"
                >
                  <ArrowDown size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Disposition">
        <ColumnWidthRow slot={slot} st={st} setStyle={setStyle} label="Largeur" />
        {settings}
      </Section>
    </>
  );
}
