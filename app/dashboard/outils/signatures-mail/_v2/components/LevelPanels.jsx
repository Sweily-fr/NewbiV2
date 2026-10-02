"use client";

import { useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  BLOCK_OF,
  ELEMENT_ITEMS,
  ITEM_LABEL,
  SLOTS,
  canShiftRow,
  elementSlot,
  isDetached,
  partHasWidth,
  pieceOf,
  slotLabel,
  SLOT_LABEL,
  moveElement,
  moveItem,
  selectionChain,
  shiftRow,
  shownItems,
  slotOf,
  slotRows,
} from "../slots";
import { emailProblem, linkProblem } from "../links";
import { Choice, Hint, LengthRow, Row, Section, SpaceRow } from "./controls";
import { TextField } from "./ContentPanel";
import TextStyleControls from "./TextStyleControls";
import {
  ColumnWidthRow,
  DividerControls,
  FooterStripControl,
  OutsideControls,
  Pick,
  PictoPick,
  SignatureWidthRow,
  TextAlignControl,
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
  name: "Prénom et nom",
  accent: "Trait sous le nom",
  jobTitle: "Poste",
  company: "Entreprise",
  tagline: "Accroche",
  contact: "Coordonnées",
  social: "Réseaux sociaux",
  photo: "Photo",
  logo: "Logo",
  banner: "Bannière",
  cta: "Bouton d'action",
  disclaimer: "Mention",
  rule1: "Trait",
  rule2: "Trait",
  rule3: "Trait",
  divider: "Séparateur vertical",
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

/** « ⌘ + clic » sur un Mac, « Ctrl + clic » ailleurs (côté navigateur). */
export function modClick() {
  const mac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
  return mac ? "⌘ + clic" : "Ctrl + clic";
}

/** Libellé d'une sélection, pour le titre et le fil d'Ariane. */
export function selectionLabel(sel, st) {
  if (!sel) return "";
  if (sel.level === "signature") return "Toute la signature";
  if (sel.level === "slot") return slotLabel(sel.key, st);
  if (sel.level === "element") return ELEMENT_TITLE[sel.key] || "";
  return PARTS[sel.key]?.title || ITEM_LABEL[sel.key] || "";
}

/**
 * Niveaux qui contiennent la sélection, du plus large au plus proche (la
 * colonne d'un élément réparti : celle de son morceau principal).
 */
export function ancestorsOf(sel, sig) {
  if (!sel || sel.level === "signature") return [];
  if (sel.level === "slot") return [{ level: "signature" }];
  const item =
    sel.level === "item" ? sel.key : (ELEMENT_ITEMS[sel.key] || [sel.key])[0];
  const chain = selectionChain(item, sig?.style, shownItems(sig));
  const at = chain.findIndex((c) => c.level === sel.level);
  return chain.slice(at + 1).reverse();
}

/** Onglet resté ouvert sous la sélection, que le lien de retour rouvre. */
const TAB_LABEL = { template: "Modèle", content: "Contenu", style: "Style" };

/**
 * En-tête d'un panneau : retour à l'onglet ouvert (`tab`), niveaux
 * au-dessus, titre.
 */
export function LevelHeader({
  selected,
  ancestors,
  onSelect,
  onClose,
  st,
  tab,
}) {
  // Niveau qu'un ⌘ + clic dans la sélection atteint : le plus proche
  const parent = ancestors[ancestors.length - 1];
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <ArrowLeft size={14} />
        {TAB_LABEL[tab]
          ? `Retour à l'onglet ${TAB_LABEL[tab]}`
          : "Retour aux onglets"}
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
                {selectionLabel(a, st)}
              </button>
              <ChevronRight size={12} aria-hidden="true" />
            </span>
          ))}
        </nav>
      )}
      <h2 className="text-xl font-medium">{selectionLabel(selected, st)}</h2>
      {parent && (
        <Hint>
          {`${modClick()} dans l'aperçu : remonter à « ${selectionLabel(parent, st)} ».`}
        </Hint>
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
      hint="Ou cliquez dessus dans l'aperçu."
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
function placeOptions(st, current) {
  const L = layoutState(st);
  // Tout en bas (sous le cadre) : avec un cadre, ou s'il y est déjà
  return SLOTS.filter(
    (s) => s !== "outside" || L.framed || current === "outside",
  ).map((s) => ({ value: s, label: slotLabel(s, st) }));
}

/**
 * Emplacement d'une partie (`item`) ou d'un élément entier (`element`) :
 * le choisir l'y emmène, comme un glisser-déposer dans l'aperçu.
 */
export function PlaceRow({ item, element, sig, setStyle }) {
  const st = sig.style;
  const current = item
    ? slotOf(st.slots, item)
    : elementSlot(st, shownItems(sig), element);
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
      options={placeOptions(st, current)}
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
        resetLabel={`Reprendre le style ${whole}`}
      />
      <Section title="Disposition">
        <PlaceRow item={item} sig={sig} setStyle={setStyle} />
        <PartLayout item={item} sig={sig} setStyle={setStyle} whole={whole} />
      </Section>
    </>
  );
}

/**
 * Largeur d'une partie (ligne de coordonnées, prénom ou nom seul sur sa
 * ligne) ; pour une partie placée à part de son élément, espaces et
 * alignement de son morceau (réglés sur sa première partie).
 */
function PartLayout({ item, sig, setStyle, whole }) {
  const blocks = sig.style.blocks || {};
  const set = (key, patch) => {
    const next = Object.fromEntries(
      Object.entries({ ...(blocks[key] || {}), ...patch }).filter(
        ([, v]) => v !== 0 && v !== null && v !== undefined && v !== "",
      ),
    );
    const all = { ...blocks };
    if (Object.keys(next).length > 0) all[key] = next;
    else delete all[key];
    setStyle({ blocks: all });
  };
  const detached = isDetached(sig, item);
  const piece = pieceOf(sig, item) || [item];
  const head = piece[0];
  const lead = blocks[head] || {};
  // Aligner n'a d'effet qu'à côté d'autres éléments de sa colonne, ou dans
  // une colonne de largeur choisie
  const shown = shownItems(sig);
  const slot = slotOf(sig.style.slots, item);
  const canAlign =
    Boolean(lead.align) ||
    (sig.style.columns?.[slot] || 0) > 0 ||
    (sig.style.slots?.[slot] || []).some(
      (k) => shown.has(k) && !piece.includes(k),
    );
  return (
    <>
      {partHasWidth(sig, item) && (
        <LengthRow
          label="Largeur"
          hint="Le texte revient à la ligne à cette largeur. Vous pouvez aussi tirer le bord du cadre dans l'aperçu."
          autoLabel="Automatique"
          value={blocks[item]?.width || 0}
          onChange={(v) => set(item, { width: v })}
          min={40}
          max={640}
          step={4}
          initial={200}
        />
      )}
      {detached && (
        <>
          <Hint>
            Partie placée à part du reste {whole}
            {piece.length > 1
              ? ` : espaces et alignement communs à ${piece
                  .map((k) => PARTS[k]?.title || ITEM_LABEL[k])
                  .join(", ")}.`
              : "."}
          </Hint>
          <div className="grid grid-cols-2 gap-4">
            <SpaceRow
              label="Espace au-dessus"
              value={lead.spaceBefore || 0}
              onChange={(v) => set(head, { spaceBefore: v })}
            />
            <SpaceRow
              label="Espace en dessous"
              value={lead.spaceAfter || 0}
              onChange={(v) => set(head, { spaceAfter: v })}
            />
          </div>
          {canAlign && (
          <Row label="Alignement">
            <Choice
              label="Alignement"
              value={lead.align || ""}
              onChange={(v) => set(head, { align: v })}
              options={[
                { value: "", label: "Auto" },
                { value: "left", label: "Gauche", icon: <AlignLeft size={14} /> },
                { value: "center", label: "Centre", icon: <AlignCenter size={14} /> },
                { value: "right", label: "Droite", icon: <AlignRight size={14} /> },
              ]}
            />
          </Row>
          )}
        </>
      )}
    </>
  );
}

const FILL_OPTIONS = [
  { value: "none", label: "Aucun", picto: <FillPicto fill="none" /> },
  { value: "tint", label: "Teinté", picto: <FillPicto fill="tint" /> },
  { value: "solid", label: "Couleur", picto: <FillPicto fill="solid" /> },
];

const partTitle = (k) => PARTS[k]?.title || ITEM_LABEL[k] || k;

/**
 * Titre d'une ligne du panneau d'une colonne (voir slotRows) et, en gris,
 * ses parties : « Coordonnées · Téléphone, E-mail ». Un morceau placé à
 * part de son élément se nomme par ses parties.
 */
function rowLabel(row) {
  const multi = (ELEMENT_ITEMS[row.element] || []).length > 1;
  if (!multi) {
    return {
      title:
        ELEMENT_TITLE[row.element] || ITEM_LABEL[row.items[0]] || row.items[0],
      detail: null,
    };
  }
  const parts = row.items.map(partTitle).join(", ");
  if (!row.main) return { title: parts, detail: null };
  // Prénom et nom réunis : le titre suffit
  const whole = row.element === "name" && row.items.length === 2;
  return { title: ELEMENT_TITLE[row.element], detail: whole ? null : parts };
}

/** Flèches « Monter » et « Descendre », nommées d'après ce qu'elles déplacent. */
function MoveButtons({ name, canUp, canDown, onUp, onDown }) {
  const arrow =
    "rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 cursor-pointer disabled:cursor-default";
  return (
    <>
      <button
        type="button"
        aria-label={`Monter ${name}`}
        title={`Monter ${name}`}
        disabled={!canUp}
        onClick={onUp}
        className={arrow}
      >
        <ArrowUp size={14} />
      </button>
      <button
        type="button"
        aria-label={`Descendre ${name}`}
        title={`Descendre ${name}`}
        disabled={!canDown}
        onClick={onDown}
        className={arrow}
      >
        <ArrowDown size={14} />
      </button>
    </>
  );
}

/**
 * Une colonne (emplacement) : ses éléments dans l'ordre, sa largeur, son
 * fond et son alignement.
 */
export function SlotPanel({ slot, sig, update, lines, onSelect }) {
  const st = sig.style;
  const setStyle = (patch) => update({ style: patch });
  const shown = shownItems(sig);
  const L = layoutState(st, shown);
  // Un élément par ligne (prénom et nom, coordonnées : d'un bloc), ses
  // parties dépliées à la demande pour en changer l'ordre
  const rows = slotRows(st, shown, slot);
  const [open, setOpen] = useState(() => new Set());
  // Repère stable d'une ligne : son élément (ses parties peuvent changer
  // d'ordre sans la replier), sa première partie pour un morceau à part
  const seen = new Set();
  const ids = rows.map((row) => {
    if (row.main && !seen.has(row.element)) {
      seen.add(row.element);
      return row.element;
    }
    return `${row.element}-${row.items[0]}`;
  });
  const toggle = (id) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const shift = (index, dir, part) =>
    setStyle({ slots: shiftRow(st, shown, slot, index, dir, part) });
  // Un élément s'ouvre entier ; un morceau à part, sur sa première partie
  const openRow = (row) =>
    onSelect(
      !row.main
        ? { level: "item", key: row.items[0] }
        : BLOCK_OF[row.items[0]]
          ? { level: "element", key: row.element }
          : selectionChain(row.items[0], st, shown)[0],
      row.items[0],
    );

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
        <DividerControls
          st={st}
          setStyle={setStyle}
          lines={lines}
          shown={shown}
        />
      </>
    );
  } else if (slot === "header") {
    settings = (
      <>
      <SignatureWidthRow st={st} setStyle={setStyle} />
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
      </>
    );
  } else if (slot === "text" && !L.hasVisual) {
    settings = <TextAlignControl st={st} setStyle={setStyle} shown={shown} />;
  } else if (slot === "footer" || slot === "outside") {
    settings = (
      <>
        {slot === "footer" && <SignatureWidthRow st={st} setStyle={setStyle} />}
        <FooterStripControl st={st} setStyle={setStyle} shown={shown} />
        <OutsideControls st={st} setStyle={setStyle} shown={shown} />
      </>
    );
  }

  return (
    <>
      <Section title="Contenu">
        {rows.length === 0 ? (
          <Hint>
            Aucun élément ici : tirez-en un par sa poignée ⠿ dans l&apos;aperçu.
          </Hint>
        ) : (
          <ul className="divide-y rounded-lg border">
            {rows.map((row, i) => {
              const { title, detail } = rowLabel(row);
              const id = ids[i];
              const nested = row.items.length > 1;
              const expanded = nested && open.has(id);
              const what = row.element === "contact" ? "lignes" : "parties";
              return (
                <li key={id}>
                  <div className="flex items-center gap-1 px-2 py-1">
                    <button
                      type="button"
                      onClick={() => openRow(row)}
                      className="flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-1 text-left text-sm hover:bg-accent cursor-pointer"
                    >
                      <span className="truncate">
                        {title}
                        {detail && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {detail}
                          </span>
                        )}
                      </span>
                      <ChevronRight
                        size={12}
                        className="ml-auto shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </button>
                    {nested && (
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-label={`Ordre des ${what} : ${title}`}
                        title={`Ordre des ${what}`}
                        onClick={() => toggle(id)}
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                      >
                        <ChevronDown
                          size={14}
                          className={cn(
                            "transition-transform duration-200",
                            expanded && "rotate-180",
                          )}
                        />
                      </button>
                    )}
                    <MoveButtons
                      name={title}
                      canUp={canShiftRow(rows, i, -1)}
                      canDown={canShiftRow(rows, i, 1)}
                      onUp={() => shift(i, -1)}
                      onDown={() => shift(i, 1)}
                    />
                  </div>
                  {/* Parties de l'élément : leur ordre ; au bord, une
                      partie sort seule au-dessus ou en dessous de la ligne
                      voisine */}
                  {expanded && (
                    <ul className="border-t bg-muted/40 py-1">
                      {row.items.map((k) => (
                        <li
                          key={k}
                          className="flex items-center gap-1 py-0.5 pl-6 pr-2"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              onSelect({ level: "item", key: k }, k)
                            }
                            className="flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-1 text-left text-sm hover:bg-accent cursor-pointer"
                          >
                            <span className="truncate">{partTitle(k)}</span>
                            <ChevronRight
                              size={12}
                              className="ml-auto shrink-0 text-muted-foreground"
                              aria-hidden="true"
                            />
                          </button>
                          <MoveButtons
                            name={partTitle(k)}
                            canUp={canShiftRow(rows, i, -1, k)}
                            canDown={canShiftRow(rows, i, 1, k)}
                            onUp={() => shift(i, -1, k)}
                            onDown={() => shift(i, 1, k)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
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
