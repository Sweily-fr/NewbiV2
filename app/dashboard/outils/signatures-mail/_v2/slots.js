/**
 * Emplacements des éléments d'une signature (style.slots, calculés par
 * l'API) : helpers partagés par l'onglet Style, les panneaux d'élément et
 * le glisser-déposer de l'aperçu. Chaque helper renvoie un patch de style
 * complet (emplacements recopiés), prêt pour update({ style: patch }).
 */

export const SLOTS = ["header", "visual", "text", "side", "footer", "outside"];
export const IDENTITY_ITEMS = ["firstName", "lastName", "title", "company", "tagline"];

/** Libellés pour les lignes de dépôt : « Au-dessus du nom », « Sous le nom ». */
export const ITEM_OF = {
  photo: "de la photo",
  name: "du nom",
  firstName: "du prénom",
  lastName: "du nom",
  title: "du poste",
  company: "de la société",
  tagline: "de l'accroche",
  accent: "du trait",
  phone: "du téléphone",
  mobile: "du mobile",
  email: "de l'e-mail",
  website: "du site",
  address: "de l'adresse",
  social: "des réseaux",
  logo: "du logo",
  cta: "du bouton",
  banner: "du bandeau",
  disclaimer: "de la mention",
};
export const ITEM_THE = {
  photo: "la photo",
  name: "le nom",
  firstName: "le prénom",
  lastName: "le nom",
  title: "le poste",
  company: "la société",
  tagline: "l'accroche",
  accent: "le trait",
  phone: "le téléphone",
  mobile: "le mobile",
  email: "l'e-mail",
  website: "le site",
  address: "l'adresse",
  social: "les réseaux",
  logo: "le logo",
  cta: "le bouton",
  banner: "le bandeau",
  disclaimer: "la mention",
};
export const ITEM_LABEL = {
  photo: "Photo",
  name: "Nom",
  firstName: "Prénom",
  lastName: "Nom",
  title: "Poste",
  company: "Société",
  tagline: "Accroche",
  accent: "Trait",
  phone: "Téléphone",
  mobile: "Mobile",
  email: "E-mail",
  website: "Site",
  address: "Adresse",
  social: "Réseaux",
  logo: "Logo",
  cta: "Bouton",
  banner: "Bandeau",
  disclaimer: "Mention",
  contact: "Coordonnées",
};

/** Copie propre des emplacements (sans champ GraphQL technique). */
export function cleanSlots(slots) {
  return Object.fromEntries(SLOTS.map((s) => [s, [...(slots?.[s] || [])]]));
}

export function slotOf(slots, item) {
  return SLOTS.find((s) => (slots?.[s] || []).includes(item)) || null;
}

/**
 * Déplace un élément : dans `slot`, avant `before` ou après `after` (un
 * autre élément), sinon à la fin (ou au début avec `first`).
 */
export function moveItem(slots, item, slot, { before, after, first } = {}) {
  const next = cleanSlots(slots);
  for (const s of SLOTS) next[s] = next[s].filter((k) => k !== item);
  const list = next[slot];
  let at = first ? 0 : list.length;
  if (before && list.includes(before)) at = list.indexOf(before);
  else if (after && list.includes(after)) at = list.indexOf(after) + 1;
  list.splice(at, 0, item);
  return next;
}

/**
 * Déplace plusieurs éléments ensemble (un élément entier : prénom et nom,
 * lignes de coordonnées), dans leur ordre : le premier à la place donnée,
 * les autres à sa suite.
 */
export function moveItems(slots, items, slot, at = {}) {
  let next = moveItem(slots, items[0], slot, at);
  for (let i = 1; i < items.length; i += 1) {
    next = moveItem(next, items[i], slot, { after: items[i - 1] });
  }
  return next;
}

/**
 * Disposition d'un modèle adaptée au contenu de la signature. Les modèles
 * sont pensés avec une photo : sans elle, la colonne photo ne garde que ce
 * qui peut l'occuper (le nom sur une colonne de couleur, ou le logo) ; les
 * réseaux et le logo reviennent sous le texte au lieu de flotter seuls
 * dans une colonne vide. Même règle que l'API pour les anciens réglages.
 */
export function templateLayout(defaults, sig) {
  const slots = defaults?.slots;
  if (!slots || sig?.images?.photo?.url) return defaults;
  const visual = slots.visual || [];
  if (visual.some((k) => IDENTITY_ITEMS.includes(k))) return defaults;
  if (sig?.images?.logo?.url && visual.includes("logo")) return defaults;
  let next = cleanSlots(slots);
  if (visual.includes("social")) {
    next = moveItem(next, "social", "text", { before: "logo" });
  }
  if (visual.includes("logo")) next = moveItem(next, "logo", "text");
  return { ...defaults, slots: next };
}

/** Réglages de placement repris d'un modèle. */
export const LAYOUT_KEYS = [
  "slots",
  "visualSide",
  "visualFill",
  "headerPhoto",
  "headerFill",
];

/** Traits et bordures sur mesure (0 = dimensions du modèle). */
export const LINE_KEYS = [
  "accentLength",
  "accentThickness",
  "dividerThickness",
  "dividerLength",
  "frameThickness",
  "frameWidth",
  "frameBarLength",
];

const layoutValue = (v) =>
  v && typeof v === "object" && !Array.isArray(v) ? cleanSlots(v) : v;

/** Vrai si la disposition diffère de `defaults` (celle d'un modèle). */
export function layoutDiffers(st, defaults) {
  return LAYOUT_KEYS.some(
    (k) =>
      JSON.stringify(layoutValue(st?.[k])) !==
      JSON.stringify(layoutValue(defaults?.[k])),
  );
}

/** Blocs réglés un à un, ou colonnes de largeur choisie ? */
export function hasBlockSettings(st) {
  return (
    Object.keys(st?.blocks || {}).length > 0 ||
    Object.values(st?.columns || {}).some((w) => w > 0)
  );
}

/**
 * La signature s'écarte-t-elle de son modèle : éléments déplacés, traits,
 * blocs ou colonnes sur mesure ? (Changer de modèle remplacerait ces
 * réglages.)
 */
export function layoutCustomized(sig, template) {
  const defaults = templateLayout(template?.defaults, sig);
  if (!defaults?.slots) return false;
  return (
    layoutDiffers(sig.style, defaults) ||
    LINE_KEYS.some((k) => (sig.style?.[k] || 0) > 0) ||
    hasBlockSettings(sig.style)
  );
}

/**
 * Éléments de l'aperçu (data-sig-block) qui composent chaque bloc réglable,
 * c'est-à-dire chaque panneau d'élément.
 */
export const ELEMENT_ITEMS = {
  name: ["firstName", "lastName"],
  jobTitle: ["title"],
  company: ["company"],
  tagline: ["tagline"],
  contact: ["phone", "mobile", "email", "website", "address"],
  social: ["social"],
  photo: ["photo"],
  logo: ["logo"],
  accent: ["accent"],
  cta: ["cta"],
  banner: ["banner"],
  disclaimer: ["disclaimer"],
};

/** Bloc réglable (panneau d'élément) auquel appartient chaque élément. */
export const BLOCK_OF = Object.fromEntries(
  Object.entries(ELEMENT_ITEMS).flatMap(([block, items]) =>
    items.map((item) => [item, block]),
  ),
);

/**
 * Sélection dans l'aperçu, du plus précis au plus large : une partie
 * (prénom, nom, une ligne de coordonnées), son élément (le nom, les
 * coordonnées…), sa colonne (emplacement), toute la signature. Un clic
 * prend le plus précis, chaque ⌘ + clic remonte d'un niveau.
 */
export const PART_ITEMS = [
  "firstName",
  "lastName",
  "phone",
  "mobile",
  "email",
  "website",
  "address",
];

/** Colonnes de largeur réglable : bornes (celles de l'API) et valeur proposée. */
export const COLUMN_WIDTH = {
  visual: { min: 40, max: 600, initial: 140 },
  text: { min: 80, max: 640, initial: 320 },
  side: { min: 40, max: 400, initial: 140 },
};

export const SLOT_LABEL = {
  header: "En-tête",
  visual: "Colonne photo",
  text: "Colonne principale",
  side: "Colonne de droite",
  footer: "Bas de la signature",
  outside: "Sous le cadre",
};

/**
 * Colonne d'un élément : celle de son morceau principal (celui que ses
 * réglages et le cadre de l'aperçu concernent). `shown` : parties affichées.
 */
export function elementSlot(st, shown, element) {
  const items = mainPiece(st, shown, element) || ELEMENT_ITEMS[element] || [];
  return items.map((k) => slotOf(st?.slots, k)).find(Boolean) || null;
}

/** Niveaux d'une partie de l'aperçu, du plus précis au plus large. */
export function selectionChain(item, st, shown = null) {
  const element = BLOCK_OF[item];
  if (!element) return [{ level: "signature" }];
  const chain = [];
  if (PART_ITEMS.includes(item)) chain.push({ level: "item", key: item });
  chain.push({ level: "element", key: element });
  const slot = elementSlot(st, shown, element);
  if (slot) chain.push({ level: "slot", key: slot });
  chain.push({ level: "signature" });
  return chain;
}

export const sameSelection = (a, b) =>
  Boolean(a && b && a.level === b.level && (a.key || null) === (b.key || null));

/**
 * Niveau au-dessus d'une sélection. Un élément réparti sur deux colonnes
 * remonte à celle de son morceau principal.
 */
export function parentSelection(current, st, shown = null) {
  if (!current) return { level: "signature" };
  if (current.level === "item") {
    return { level: "element", key: BLOCK_OF[current.key] };
  }
  if (current.level === "element") {
    const slot = elementSlot(st, shown, current.key);
    return slot ? { level: "slot", key: slot } : { level: "signature" };
  }
  return { level: "signature" };
}

/**
 * ⌘ + clic sur `item` : le niveau au-dessus de la sélection si elle
 * contient la partie cliquée, sinon le parent de la partie cliquée. Hors
 * de tout élément : le niveau au-dessus de la sélection.
 */
export function selectUp(current, item, st, shown = null) {
  if (!item || !BLOCK_OF[item]) return parentSelection(current, st, shown);
  const chain = selectionChain(item, st, shown);
  const at = chain.findIndex((c) => sameSelection(c, current));
  if (at >= 0) return chain[Math.min(at + 1, chain.length - 1)];
  return chain[Math.min(1, chain.length - 1)];
}

/** Emmène un élément entier (toutes ses parties placées) dans `slot`. */
export function moveElement(slots, element, slot) {
  const items = (ELEMENT_ITEMS[element] || [element]).filter((k) =>
    slotOf(slots, k),
  );
  return items.length > 0 ? moveItems(slots, items, slot) : cleanSlots(slots);
}

/**
 * Échange une partie avec sa voisine affichée (`dir` -1 : avant, 1 :
 * après) dans son emplacement. `shown` : parties affichées.
 */
export function shiftItem(slots, slot, item, dir, shown) {
  const next = cleanSlots(slots);
  const list = next[slot];
  const visible = list.filter((k) => !shown || shown.has(k));
  const other = visible[visible.indexOf(item) + dir];
  if (!visible.includes(item) || !other) return next;
  const a = list.indexOf(item);
  const b = list.indexOf(other);
  list[a] = other;
  list[b] = item;
  return next;
}

/**
 * Morceaux d'un élément fait de plusieurs parties (nom, coordonnées) :
 * suites de parties affichées qui se touchent dans un emplacement.
 */
export function piecesOf(st, shown, element) {
  const parts = ELEMENT_ITEMS[element] || [element];
  const pieces = [];
  for (const slot of SLOTS) {
    let run = [];
    const list = (st?.slots?.[slot] || []).filter((k) => !shown || shown.has(k));
    for (const k of [...list, null]) {
      if (k && parts.includes(k)) {
        run.push(k);
        continue;
      }
      if (run.length > 0) pieces.push(run);
      run = [];
    }
  }
  return pieces;
}

/**
 * Morceau principal d'un élément : celui qui réunit le plus de parties (à
 * égalité, le premier). Ses réglages de bloc (largeur, espaces,
 * alignement) ne valent que pour lui, les autres morceaux restent
 * automatiques : même règle que le rendu de l'API.
 */
export function mainPiece(st, shown, element) {
  let best = null;
  for (const piece of piecesOf(st, shown, element)) {
    if (!best || piece.length > best.length) best = piece;
  }
  return best;
}

/** Partie placée hors du morceau principal de son élément ? */
export function isDetached(sig, item) {
  const element = BLOCK_OF[item];
  if (!element) return false;
  const main = mainPiece(sig?.style, shownItems(sig), element);
  return Boolean(main && !main.includes(item));
}

/** Emplacement de chaque bloc : celui de son morceau principal. */
function blockSlots(st, shown) {
  return Object.fromEntries(
    Object.keys(ELEMENT_ITEMS).map((key) => {
      const items = mainPiece(st, shown, key) || ELEMENT_ITEMS[key];
      return [key, items.map((k) => slotOf(st?.slots, k)).find(Boolean) || null];
    }),
  );
}

/**
 * Un élément dont le morceau principal change d'emplacement repart d'une
 * largeur et d'un alignement automatiques : ceux réglés pour son ancienne
 * place n'y ont plus de sens. Les espaces sont gardés. Une partie emmenée
 * seule ailleurs (une ligne de coordonnées) ne change rien : elle est
 * automatique. `patch` : modification du style, renvoyée complétée.
 */
export function resetMovedBlocks(prevSig, patch) {
  const prevStyle = prevSig?.style;
  if (!patch?.slots || !prevStyle?.slots) return patch;
  const blocks = patch.blocks ?? prevStyle.blocks;
  if (!blocks || Object.keys(blocks).length === 0) return patch;
  const shown = shownItems(prevSig);
  const before = blockSlots(prevStyle, shown);
  const after = blockSlots({ ...prevStyle, slots: patch.slots }, shown);
  const moved = Object.keys(before).filter(
    (key) => before[key] && after[key] && before[key] !== after[key],
  );
  if (!moved.some((key) => blocks[key])) return patch;
  const next = { ...blocks };
  for (const key of moved) {
    if (!next[key]) continue;
    // eslint-disable-next-line no-unused-vars
    const { width, align, ...rest } = next[key];
    if (Object.keys(rest).length > 0) next[key] = rest;
    else delete next[key];
  }
  return { ...patch, blocks: next };
}

/**
 * Éléments réellement affichés, selon le contenu de la signature (mêmes
 * règles que le rendu de l'API).
 */
export function shownItems(sig) {
  const { identity = {}, contact = {}, images = {}, style: st = {} } = sig || {};
  const shown = new Set();
  if (identity.firstName) shown.add("firstName");
  if (identity.lastName) shown.add("lastName");
  if (identity.jobTitle || identity.department) shown.add("title");
  if (identity.company) shown.add("company");
  if (identity.tagline) shown.add("tagline");
  for (const k of ["phone", "mobile", "email", "website", "address"]) {
    if (contact[k]) shown.add(k);
  }
  if ((sig?.social || []).some((s) => s.url?.trim())) shown.add("social");
  if (images.photo?.url) shown.add("photo");
  if (images.logo?.url) shown.add("logo");
  if (st.accent && st.accent !== "none") shown.add("accent");
  if (sig?.cta?.enabled && sig.cta.label && sig.cta.url) shown.add("cta");
  if (sig?.banner?.enabled && images.banner?.url) shown.add("banner");
  if (sig?.disclaimer?.enabled && sig.disclaimer.text) shown.add("disclaimer");
  return shown;
}

// ── Photo ──────────────────────────────────────────────────────────────

/** Place de la photo : left, right, top (au-dessus du texte), header, autre. */
export function photoPlacement(st) {
  const slot = slotOf(st.slots, "photo");
  if (slot === "visual") return st.visualSide === "right" ? "right" : "left";
  if (slot === "text" && st.slots.text[0] === "photo") return "top";
  if (slot === "header") return "header";
  return slot || "left";
}

export function setPhotoPlacement(st, placement) {
  if (placement === "left" || placement === "right") {
    const slots =
      slotOf(st.slots, "photo") === "visual"
        ? cleanSlots(st.slots)
        : moveItem(st.slots, "photo", "visual", { first: true });
    return { slots, visualSide: placement };
  }
  if (placement === "top") {
    return { slots: moveItem(st.slots, "photo", "text", { first: true }) };
  }
  return { slots: moveItem(st.slots, "photo", placement, { first: true }) };
}

// ── Bloc de couleur (identité sur un fond de la couleur principale) ─────

export function identityZone(st) {
  if ((st.slots?.header || []).some((k) => IDENTITY_ITEMS.includes(k))) {
    return "band-top";
  }
  if (
    st.visualFill === "solid" &&
    (st.slots?.visual || []).some((k) => k === "firstName" || k === "lastName")
  ) {
    return "band-left";
  }
  return "plain";
}

/** Rassemble photo + identité dans le bandeau, la colonne pleine, ou le texte. */
export function setIdentityZone(st, zone) {
  let slots = cleanSlots(st.slots);
  // Le trait sous le nom accompagne l'identité
  const identity = [...IDENTITY_ITEMS, "accent"].filter((k) => slotOf(slots, k));
  const moveAll = (items, slot) => {
    for (const k of items) slots = moveItem(slots, k, slot);
  };
  if (zone === "band-top") {
    slots = moveItem(slots, "photo", "header");
    moveAll(identity, "header");
    return { slots, visualFill: st.visualFill === "solid" ? "none" : st.visualFill };
  }
  if (zone === "band-left") {
    slots = moveItem(slots, "photo", "visual", { first: true });
    moveAll(identity, "visual");
    return { slots, visualFill: "solid" };
  }
  // Aucun bloc : photo en colonne, identité en tête de la colonne de texte
  if (slotOf(slots, "photo") === "header") {
    slots = moveItem(slots, "photo", "visual", { first: true });
  }
  [...identity].reverse().forEach((k) => {
    slots = moveItem(slots, k, "text", { first: true });
  });
  return {
    slots,
    visualFill: st.visualFill === "solid" ? "none" : st.visualFill,
  };
}

// ── Réseaux, logo, pied ─────────────────────────────────────────────────

/** Emplacement d'un élément, pour les réglages « Position de … ». */
export function itemPlacement(st, item) {
  return slotOf(st.slots, item) || "text";
}

export function setItemPlacement(st, item, slot) {
  return { slots: moveItem(st.slots, item, slot) };
}

export function isOutside(st, item) {
  return (st.slots?.outside || []).includes(item);
}

/** Dans le cadre (bas du cadre) ou en dessous. */
export function setOutside(st, item, outside) {
  return {
    slots: moveItem(st.slots, item, outside ? "outside" : "footer"),
  };
}
