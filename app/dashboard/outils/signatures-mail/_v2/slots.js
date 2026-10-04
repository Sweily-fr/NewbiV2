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
  name: "du prénom et du nom",
  firstName: "du prénom",
  lastName: "du nom",
  title: "du poste",
  company: "de l'entreprise",
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
  banner: "de la bannière",
  disclaimer: "de la mention",
  rule1: "du trait",
  rule2: "du trait",
  rule3: "du trait",
  divider: "du séparateur",
};
export const ITEM_THE = {
  photo: "la photo",
  name: "le prénom et le nom",
  firstName: "le prénom",
  lastName: "le nom",
  title: "le poste",
  company: "l'entreprise",
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
  banner: "la bannière",
  disclaimer: "la mention",
  rule1: "le trait",
  rule2: "le trait",
  rule3: "le trait",
  divider: "le séparateur",
};
export const ITEM_LABEL = {
  photo: "Photo",
  name: "Prénom et nom",
  firstName: "Prénom",
  lastName: "Nom",
  title: "Poste",
  company: "Entreprise",
  tagline: "Accroche",
  accent: "Trait",
  phone: "Téléphone",
  mobile: "Mobile",
  email: "E-mail",
  website: "Site web",
  address: "Adresse",
  social: "Réseaux",
  logo: "Logo",
  cta: "Bouton",
  banner: "Bannière",
  disclaimer: "Mention",
  rule1: "Trait",
  rule2: "Trait",
  rule3: "Trait",
  divider: "Séparateur",
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

/** Traits libres différents (posés, longueur, épaisseur, couleur) ? */
function rulesDiffer(a, b) {
  return RULE_ITEMS.some((k) => {
    const x = a?.[k];
    const y = b?.[k];
    if (!x || !y) return Boolean(x) !== Boolean(y);
    return (
      x.length !== y.length || x.thickness !== y.thickness || x.color !== y.color
    );
  });
}

/** Marges du séparateur vertical différentes ? */
const spaceDiffers = (a, b) =>
  (a?.left || 0) !== (b?.left || 0) || (a?.right || 0) !== (b?.right || 0);

/**
 * La signature s'écarte-t-elle de son modèle : éléments déplacés, traits,
 * blocs ou colonnes sur mesure ? (Changer de modèle remplacerait ces
 * réglages.)
 */
export function layoutCustomized(sig, template) {
  const defaults = templateLayout(template?.defaults, sig);
  if (!defaults?.slots) return false;
  const st = sig.style || {};
  return (
    layoutDiffers(st, defaults) ||
    LINE_KEYS.some((k) => (st[k] || 0) !== (defaults[k] || 0)) ||
    hasBlockSettings(st) ||
    st.footerPair === false ||
    (st.nameLayout || "inline") !== (defaults.nameLayout || "inline") ||
    JSON.stringify(st.socialRows || []) !==
      JSON.stringify(defaults.socialRows || []) ||
    rulesDiffer(st.rules, defaults.rules) ||
    spaceDiffers(st.dividerSpace, defaults.dividerSpace)
  );
}

/**
 * Disposition du modèle, pour « Revenir au modèle » : places, traits et
 * bordures, blocs et colonnes, nom, réseaux et logo ; jamais les couleurs
 * ni la typographie de l'utilisateur.
 */
export function layoutReset(sig, template) {
  const defaults = templateLayout(template?.defaults, sig) || {};
  const clean = (v) =>
    v && typeof v === "object" && !Array.isArray(v) ? cleanSlots(v) : v;
  return {
    ...Object.fromEntries(LAYOUT_KEYS.map((k) => [k, clean(defaults[k])])),
    ...Object.fromEntries(LINE_KEYS.map((k) => [k, defaults[k] || 0])),
    nameLayout: defaults.nameLayout || "inline",
    socialRows: [...(defaults.socialRows || [])],
    blocks: {},
    columns: {},
    footerPair: true,
    // Traits libres et marges du séparateur : ceux du modèle
    rules: { ...(defaults.rules || {}) },
    dividerSpace: { ...(defaults.dividerSpace || {}) },
  };
}

/**
 * Nom d'un emplacement : « Sous le cadre » n'a de sens qu'avec un cadre,
 * sans cadre c'est « Tout en bas ».
 */
export function slotLabel(slot, st) {
  if (slot === "outside" && (!st?.frame || st.frame === "none")) {
    return "Tout en bas";
  }
  return SLOT_LABEL[slot] || "";
}

/** Hauteur maximale du logo selon sa place (mêmes règles que le rendu). */
export function logoMaxHeight(st) {
  const slot = slotOf(st?.slots, "logo");
  const boxed = st?.frame === "outline" || st?.frame === "soft";
  if (slot === "visual") return 64;
  if (slot === "text" || slot === "side" || slot === "header") return 40;
  if (slot === "footer" && boxed && st?.footerStrip) return 32;
  return 48;
}

/**
 * Logo : largeur affichée pour un réglage (sa hauteur est plafonnée, un
 * logo carré reste discret) et réglage pour une largeur affichée. Mêmes
 * calculs que le rendu (LOGO_CAP_WIDTH 120) et que l'aperçu (logoFit).
 */
export function logoFit(sig) {
  const logo = sig?.images?.logo;
  const cap = logoMaxHeight(sig?.style);
  if (!logo?.width || !logo?.height) {
    return { cap, shown: (w) => w, setting: (d) => d };
  }
  const ratio = logo.width / logo.height;
  const shown = (w) =>
    Math.min(w, Math.round(Math.round(cap * Math.max(1, w / 120)) * ratio));
  const setting = (d) => {
    const k = cap * ratio;
    let w = k >= 120 || d <= Math.min(120, k) ? d : Math.ceil((d * 120) / k);
    while (shown(w) < d && w < 2000) w += 1;
    return w;
  };
  return { cap, shown, setting };
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
  rule1: ["rule1"],
  rule2: ["rule2"],
  rule3: ["rule3"],
  // Séparateur vertical : sélectionnable dans l'aperçu, pas déplaçable
  divider: ["divider"],
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
 * Taille des caractères d'un élément : ses parties réglées à part (prénom,
 * nom, lignes de coordonnées) suivent en proportion, les icônes des
 * coordonnées aussi. Même règle pour le coin du cadre dans l'aperçu et le
 * curseur « Taille » du panneau. `current` : taille affichée avant.
 */
export function fontSizePatch(style, element, value, current) {
  const all = style?.elements || {};
  const factor = current ? value / current : 1;
  const scaled = (n, min, max) =>
    Math.max(min, Math.min(max, Math.round(n * factor)));
  const elements = {
    ...all,
    [element]: { ...(all[element] || {}), fontSize: value },
  };
  const parts =
    element === "name" || element === "contact" ? ELEMENT_ITEMS[element] : [];
  for (const part of parts) {
    if (all[part]?.fontSize) {
      elements[part] = {
        ...all[part],
        fontSize: scaled(all[part].fontSize, 9, 36),
      };
    }
  }
  const patch = { elements };
  if (element === "contact" && style?.contactStyle === "icons") {
    patch.contactIconSize = scaled(style.contactIconSize || 16, 12, 32);
  }
  return patch;
}

/**
 * Morceaux d'un élément fait de plusieurs parties (nom, coordonnées) :
 * suites de parties affichées qui se touchent dans un emplacement.
 */
export function piecesOf(st, shown, element) {
  const parts = ELEMENT_ITEMS[element] || [element];
  const pieces = [];
  // Listes dont les lignes sont faites (comme le rendu) : l'en-tête sans sa
  // photo, le bas coupé en deux par une bande de pied teintée
  const stripOn =
    (st?.frame === "outline" || st?.frame === "soft") && Boolean(st?.footerStrip);
  const inStrip = (k) => k === "social" || k === "logo";
  const lists = SLOTS.flatMap((slot) => {
    const list = (st?.slots?.[slot] || []).filter((k) => !shown || shown.has(k));
    if (slot === "header") return [list.filter((k) => k !== "photo")];
    if (slot === "footer" && stripOn) {
      return [list.filter((k) => !inStrip(k)), list.filter(inStrip)];
    }
    return [list];
  });
  for (const list of lists) {
    let run = [];
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
  const shown = shownItems(sig);
  // Une partie vide n'est nulle part : elle n'est pas « à part »
  if (!shown.has(item)) return false;
  const main = mainPiece(sig?.style, shown, element);
  return Boolean(main && !main.includes(item));
}

/** Prénom, nom, poste, entreprise : réunis sur une ligne en « identité en ligne ». */
const INLINE_IDENTITY = ["firstName", "lastName", "title", "company"];

/**
 * Éléments réunis sur une même ligne que `element` (identité en ligne,
 * poste suivi de l'entreprise en capitales), dans l'ordre ; null s'il est
 * seul sur sa ligne. La ligne se règle sur son premier élément (largeur,
 * espaces, alignement), comme le rendu de l'API.
 */
export function mergedRow(sig, element) {
  const st = sig?.style || {};
  const shown = shownItems(sig);
  const items = ELEMENT_ITEMS[element] || [element];
  for (const slot of SLOTS) {
    const list = (st.slots?.[slot] || []).filter((k) => shown.has(k));
    let i = 0;
    while (i < list.length) {
      let group = [list[i]];
      if (st.identityStyle === "inline" && INLINE_IDENTITY.includes(list[i])) {
        group = [];
        while (i + group.length < list.length && INLINE_IDENTITY.includes(list[i + group.length])) {
          group.push(list[i + group.length]);
        }
      } else if (
        st.titleStyle === "caps" &&
        list[i] === "title" &&
        list[i + 1] === "company"
      ) {
        group = ["title", "company"];
      }
      const keys = [...new Set(group.map((k) => BLOCK_OF[k] || k))];
      if (keys.length > 1 && group.some((k) => items.includes(k))) return keys;
      i += group.length;
    }
  }
  return null;
}

/** Morceau d'un élément qui contient une partie. */
export function pieceOf(sig, item) {
  const element = BLOCK_OF[item];
  if (!element) return null;
  return (
    piecesOf(sig?.style, shownItems(sig), element).find((p) =>
      p.includes(item),
    ) || null
  );
}

/**
 * Une partie a-t-elle sa propre largeur ? Une ligne de coordonnées oui
 * (sauf coordonnées sur une ligne), le prénom ou le nom seulement s'il est
 * seul sur sa ligne (l'un sous l'autre, ou séparés).
 */
export function partHasWidth(sig, item) {
  const st = sig?.style || {};
  if (ELEMENT_ITEMS.contact.includes(item)) return st.contactStyle !== "inline";
  if (ELEMENT_ITEMS.name.includes(item)) {
    if (st.identityStyle === "inline") return false;
    return st.nameLayout === "stacked" || (pieceOf(sig, item) || []).length === 1;
  }
  return false;
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
 * Réglages de bloc perdus entre deux états (`before`, `after` : blocs du
 * style) : une largeur ou un alignement choisis qui n'existent plus après un
 * déplacement (resetMovedBlocks, dépôt « À gauche » ou « À droite » qui
 * retire un alignement), pour le dire à l'utilisateur.
 */
export function layoutLost(before, after) {
  const lost = { width: false, align: false };
  for (const [key, block] of Object.entries(before || {})) {
    const next = after?.[key] || {};
    if (block?.width && !next.width) lost.width = true;
    if (block?.align && !next.align) lost.align = true;
  }
  return lost;
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
  for (const k of RULE_ITEMS) if (st.rules?.[k]) shown.add(k);
  if (st.divider && st.divider !== "none") shown.add("divider");
  return shown;
}

/**
 * Traits libres (jusqu'à trois) : chacun se place où l'on veut, comme un
 * élément, avec sa longueur, son épaisseur et sa couleur.
 */
export const RULE_ITEMS = ["rule1", "rule2", "rule3"];
export const RULE_COLORS = [
  { value: "separator", label: "Des traits" },
  { value: "primary", label: "Principale" },
  { value: "text", label: "Du texte" },
];

/**
 * Ajoute un trait libre sous le dernier élément de `slot` (colonne
 * principale par défaut) : patch de style et clé du trait, ou null s'il y
 * en a déjà trois.
 */
export function addRule(sig, slot = "text") {
  const st = sig?.style || {};
  const key = RULE_ITEMS.find((k) => !st.rules?.[k]);
  if (!key) return null;
  const shown = shownItems(sig);
  const last = [...(st.slots?.[slot] || [])].reverse().find((k) => shown.has(k));
  return {
    key,
    patch: {
      rules: {
        ...(st.rules || {}),
        [key]: { length: 120, thickness: 1, color: "separator" },
      },
      slots: moveItem(st.slots, key, slot, last ? { after: last } : {}),
    },
  };
}

/** Retire un trait libre. */
export function removeRule(st, key) {
  const rules = { ...(st?.rules || {}) };
  delete rules[key];
  return { rules };
}

const CONTACT_KEYS = ["phone", "mobile", "email", "website", "address"];

/**
 * Touche Suppr sur une sélection de l'aperçu : ce qu'elle retire. Un texte
 * est vidé, le bouton, la bannière et la mention sont masqués (leurs
 * réglages restent), un trait est retiré. Renvoie { update } (patch
 * annulable par ⌘Z), { image: "photo" | "logo" } (image à retirer côté
 * serveur, hors historique : à confirmer), ou null (rien à retirer : une
 * colonne, toute la signature, un élément déjà vide).
 */
export function deleteFor(sig, selected) {
  if (!sig || !selected) return null;
  const { level, key } = selected;
  if (level !== "item" && level !== "element") return null;
  const shown = shownItems(sig);
  const items = ELEMENT_ITEMS[key] || [key];
  if (!items.some((k) => shown.has(k))) return null;
  const blank = (keys) => Object.fromEntries(keys.map((k) => [k, ""]));
  if (level === "item") {
    if (key === "firstName" || key === "lastName") {
      return { update: { identity: { [key]: "" } } };
    }
    if (CONTACT_KEYS.includes(key)) return { update: { contact: { [key]: "" } } };
    return null;
  }
  switch (key) {
    case "name":
      return { update: { identity: blank(["firstName", "lastName"]) } };
    case "jobTitle":
      return { update: { identity: blank(["jobTitle", "department"]) } };
    case "company":
    case "tagline":
      return { update: { identity: { [key]: "" } } };
    case "contact":
      return { update: { contact: blank(CONTACT_KEYS) } };
    case "social":
      return { update: { social: [] } };
    case "accent":
      return { update: { style: { accent: "none" } } };
    case "cta":
    case "banner":
    case "disclaimer":
      return { update: { [key]: { enabled: false } } };
    case "photo":
    case "logo":
      return { image: key };
    case "divider":
      return { update: { style: { divider: "none" } } };
    default:
      return RULE_ITEMS.includes(key)
        ? { update: { style: removeRule(sig.style, key) } }
        : null;
  }
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

/**
 * Côté du séparateur vertical où se trouve la photo : à droite seulement si
 * la colonne photo est affichée à droite. Sans elle, le trait borde le texte
 * à gauche, comme avec une photo à gauche. `shown` : éléments affichés
 * (tous si absent).
 */
function photoEdge(st, shown) {
  const visible = (st?.slots?.visual || []).some((k) => !shown || shown.has(k));
  return visible && st?.visualSide === "right" ? "right" : "left";
}

/**
 * Les marges du séparateur vertical sont posées à gauche et à droite du
 * trait : quand la photo passe de l'autre côté du texte, elles s'échangent,
 * pour que l'air prévu entre la photo et le trait (« dividerSpace » du
 * modèle Newbi) reste du côté de la photo. `patch` : nouveau placement
 * (slots, visualSide), renvoyé complété au besoin.
 */
export function withDividerSpace(st, patch, shown = null) {
  const ds = st?.dividerSpace || {};
  if ((ds.left || 0) === (ds.right || 0)) return patch;
  if (photoEdge(st, shown) === photoEdge({ ...st, ...patch }, shown)) {
    return patch;
  }
  const swapped = {};
  if (ds.right) swapped.left = ds.right;
  if (ds.left) swapped.right = ds.left;
  return { ...patch, dividerSpace: swapped };
}

export function setPhotoPlacement(st, placement, shown = null) {
  if (placement === "left" || placement === "right") {
    const slots =
      slotOf(st.slots, "photo") === "visual"
        ? cleanSlots(st.slots)
        : moveItem(st.slots, "photo", "visual", { first: true });
    return withDividerSpace(st, { slots, visualSide: placement }, shown);
  }
  if (placement === "top") {
    return withDividerSpace(
      st,
      { slots: moveItem(st.slots, "photo", "text", { first: true }) },
      shown,
    );
  }
  return withDividerSpace(
    st,
    { slots: moveItem(st.slots, "photo", placement, { first: true }) },
    shown,
  );
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
