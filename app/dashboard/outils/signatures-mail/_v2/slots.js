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
const BLOCK_OF = Object.fromEntries(
  Object.entries(ELEMENT_ITEMS).flatMap(([block, items]) =>
    items.map((item) => [item, block]),
  ),
);

/**
 * Un élément qui change d'emplacement repart d'une largeur et d'un
 * alignement automatiques : ceux réglés pour son ancienne place n'y ont
 * plus de sens (une ligne de coordonnées emmenée dans la colonne photo y
 * imposerait sinon la largeur de tout le bloc). Les espaces sont gardés.
 * `patch` : modification du style, renvoyée complétée.
 */
export function resetMovedBlocks(prevStyle, patch) {
  if (!patch?.slots || !prevStyle?.slots) return patch;
  const blocks = patch.blocks ?? prevStyle.blocks;
  if (!blocks || Object.keys(blocks).length === 0) return patch;
  const moved = new Set(
    Object.keys(BLOCK_OF)
      .filter((item) => {
        const before = slotOf(prevStyle.slots, item);
        const after = slotOf(patch.slots, item);
        return before && after && before !== after;
      })
      .map((item) => BLOCK_OF[item]),
  );
  if (![...moved].some((key) => blocks[key])) return patch;
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
