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

/**
 * La signature s'écarte-t-elle de son modèle : éléments déplacés ou traits
 * sur mesure ? (Changer de modèle remplacerait ces réglages.)
 */
export function layoutCustomized(sig, template) {
  const defaults = templateLayout(template?.defaults, sig);
  if (!defaults?.slots) return false;
  return (
    layoutDiffers(sig.style, defaults) ||
    LINE_KEYS.some((k) => (sig.style?.[k] || 0) > 0)
  );
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
