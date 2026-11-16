/**
 * Contenu d'une campagne e-mail (`design`, JSON partagé avec newbi-api,
 * src/services/emailCampaigns/render.js) : style général et blocs dans
 * l'ordre. Fonctions pures, sans React ni Apollo : chaque opération rend un
 * nouveau design, l'ancien reste intact (historique Annuler / Rétablir).
 *
 * Toute propriété absente d'un bloc prend sa valeur par défaut, ici comme à
 * l'envoi : l'éditeur affiche donc exactement ce que l'API rendra.
 */

export const DESIGN_VERSION = 1;

/** Polices proposées (sûres dans toutes les messageries). */
export const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Georgia",
  "Times New Roman",
  "Verdana",
  "Trebuchet MS",
  "Tahoma",
  "Courier New",
];

/** Pile CSS de chaque police, avec ses replis. */
export const FONT_STACKS = {
  Arial: "Arial, Helvetica, sans-serif",
  Helvetica: "Helvetica, Arial, sans-serif",
  Georgia: "Georgia, 'Times New Roman', Times, serif",
  "Times New Roman": "'Times New Roman', Times, serif",
  Verdana: "Verdana, Geneva, sans-serif",
  "Trebuchet MS": "'Trebuchet MS', Helvetica, sans-serif",
  Tahoma: "Tahoma, Verdana, Geneva, sans-serif",
  "Courier New": "'Courier New', Courier, monospace",
};

export const fontStack = (family) => FONT_STACKS[family] || FONT_STACKS.Arial;

export const DEFAULT_STYLE = Object.freeze({
  backgroundColor: "#f4f4f5",
  contentBackgroundColor: "#ffffff",
  contentWidth: 600,
  contentRadius: 8,
  fontFamily: "Arial",
  textColor: "#1f2937",
  headingColor: "#111827",
  linkColor: "#5a50ff",
  primaryColor: "#5a50ff",
  footerTextColor: "#6b7280",
});

/** Bornes des réglages numériques (mêmes que l'API). */
export const LIMITS = Object.freeze({
  contentWidth: [480, 720],
  contentRadius: [0, 24],
  fontSize: [12, 22],
  lineHeight: [1.2, 2],
  buttonFontSize: [14, 20],
  buttonRadius: [0, 30],
  imageWidth: [10, 100],
  imageRadius: [0, 24],
  dividerThickness: [1, 6],
  dividerWidth: [10, 100],
  spacerHeight: [8, 120],
  padding: [0, 80],
});

export const HEADING_SIZES = { 1: 28, 2: 22, 3: 18 };

export const BLOCK_TYPES = [
  "heading",
  "text",
  "button",
  "image",
  "imageText",
  "divider",
  "spacer",
  "social",
];

export const BLOCK_LABELS = {
  heading: "Titre",
  text: "Texte",
  button: "Bouton",
  image: "Image",
  imageText: "Image et texte",
  divider: "Séparateur",
  spacer: "Espace",
  social: "Réseaux sociaux",
};

/** Blocs dont le texte riche se modifie directement dans la toile. */
export const RICH_TEXT_TYPES = ["heading", "text", "imageText"];

export const SOCIAL_NETWORKS = [
  "facebook",
  "instagram",
  "linkedin",
  "x",
  "tiktok",
  "youtube",
  "website",
];

export const SOCIAL_LABELS = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
  tiktok: "TikTok",
  youtube: "YouTube",
  website: "Site web",
};

export const ICON_STYLES = ["color", "dark", "light"];
export const ALIGNMENTS = ["left", "center", "right"];

const pad = (top, right, bottom, left) => ({ top, right, bottom, left });

/** Marges par défaut de chaque type de bloc (px). */
export const DEFAULT_PADDING = {
  heading: pad(24, 32, 8, 32),
  text: pad(8, 32, 8, 32),
  button: pad(16, 32, 16, 32),
  image: pad(16, 32, 16, 32),
  imageText: pad(16, 32, 16, 32),
  divider: pad(16, 32, 16, 32),
  social: pad(16, 32, 16, 32),
};

/**
 * Valeurs par défaut de chaque type (propriétés absentes du bloc). `color`
 * et `backgroundColor` à null : la couleur du style général s'applique
 * (titres, texte, couleur principale des boutons).
 */
export const BLOCK_DEFAULTS = {
  heading: {
    html: "",
    level: 1,
    align: "left",
    color: null,
  },
  text: {
    html: "",
    align: "left",
    fontSize: 16,
    lineHeight: 1.6,
    color: null,
  },
  button: {
    label: "",
    url: "",
    align: "center",
    backgroundColor: null,
    textColor: "#ffffff",
    borderRadius: 6,
    fontSize: 16,
    fullWidth: false,
  },
  image: {
    src: "",
    alt: "",
    href: "",
    width: 100,
    align: "center",
    borderRadius: 0,
  },
  imageText: {
    src: "",
    alt: "",
    href: "",
    imagePosition: "left",
    html: "",
    buttonLabel: "",
    buttonUrl: "",
  },
  divider: {
    color: "#e5e7eb",
    thickness: 1,
    width: 100,
  },
  spacer: {
    height: 24,
  },
  social: {
    items: [],
    align: "center",
    iconStyle: "color",
  },
};

/** Contenu d'un bloc ajouté depuis l'éditeur : un exemple à remplacer. */
const STARTER_CONTENT = {
  heading: { html: "<p>Votre titre ici</p>" },
  text: {
    html: "<p>Écrivez votre message ici. Présentez une nouveauté, partagez une actualité ou remerciez vos clients de leur confiance.</p>",
  },
  button: { label: "En savoir plus", url: "https://" },
  image: {},
  imageText: {
    html: "<p><strong>Un titre court</strong></p><p>Présentez un produit, un service ou un événement en quelques lignes.</p>",
  },
  divider: {},
  spacer: {},
  social: {
    items: [
      { network: "facebook", url: "" },
      { network: "instagram", url: "" },
      { network: "linkedin", url: "" },
    ],
  },
};

let idCounter = 0;

/** Identifiant unique d'un bloc (« b_… »). */
export function generateBlockId() {
  idCounter = (idCounter + 1) % 1679616;
  const random = Math.random().toString(36).slice(2, 8);
  return `b_${Date.now().toString(36)}${idCounter.toString(36)}${random}`;
}

export const isBlockType = (type) => BLOCK_TYPES.includes(type);

/** Nombre borné ; `fallback` si la valeur n'est pas un nombre. */
export function clampNumber(value, min, max, fallback) {
  const number = typeof value === "string" ? Number(value) : value;
  if (typeof number !== "number" || !Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

const deepClone = (value) =>
  value === undefined ? undefined : JSON.parse(JSON.stringify(value));

/** Marges complètes et bornées, à partir des marges partielles d'un bloc. */
export function resolvePadding(type, padding) {
  const base = DEFAULT_PADDING[type] || pad(0, 0, 0, 0);
  const [min, max] = LIMITS.padding;
  const source = padding && typeof padding === "object" ? padding : {};
  return {
    top: clampNumber(source.top, min, max, base.top),
    right: clampNumber(source.right, min, max, base.right),
    bottom: clampNumber(source.bottom, min, max, base.bottom),
    left: clampNumber(source.left, min, max, base.left),
  };
}

/** Style général complet (valeurs absentes ou hors bornes corrigées). */
export function resolveStyle(style) {
  const source = style && typeof style === "object" ? style : {};
  const merged = { ...DEFAULT_STYLE };
  for (const key of Object.keys(DEFAULT_STYLE)) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "")
      merged[key] = source[key];
  }
  merged.contentWidth = clampNumber(
    merged.contentWidth,
    ...LIMITS.contentWidth,
    DEFAULT_STYLE.contentWidth,
  );
  merged.contentRadius = clampNumber(
    merged.contentRadius,
    ...LIMITS.contentRadius,
    DEFAULT_STYLE.contentRadius,
  );
  if (!FONT_FAMILIES.includes(merged.fontFamily)) {
    merged.fontFamily = DEFAULT_STYLE.fontFamily;
  }
  return merged;
}

/**
 * Bloc complété de ses valeurs par défaut, bornes appliquées : ce que la
 * toile affiche (et ce que l'API envoie).
 */
export function blockWithDefaults(block) {
  if (!block || !isBlockType(block.type)) return null;
  const defaults = BLOCK_DEFAULTS[block.type];
  const resolved = { ...defaults };
  for (const [key, value] of Object.entries(block)) {
    if (value !== undefined) resolved[key] = value;
  }
  resolved.id = block.id;
  resolved.type = block.type;
  if (block.type !== "spacer") {
    resolved.padding = resolvePadding(block.type, block.padding);
  }
  if ("align" in defaults && !ALIGNMENTS.includes(resolved.align)) {
    resolved.align = defaults.align;
  }
  switch (block.type) {
    case "heading":
      resolved.level = [1, 2, 3].includes(Number(resolved.level))
        ? Number(resolved.level)
        : 1;
      break;
    case "text":
      resolved.fontSize = clampNumber(
        resolved.fontSize,
        ...LIMITS.fontSize,
        16,
      );
      resolved.lineHeight = clampNumber(
        resolved.lineHeight,
        ...LIMITS.lineHeight,
        1.6,
      );
      break;
    case "button":
      resolved.borderRadius = clampNumber(
        resolved.borderRadius,
        ...LIMITS.buttonRadius,
        6,
      );
      resolved.fontSize = clampNumber(
        resolved.fontSize,
        ...LIMITS.buttonFontSize,
        16,
      );
      resolved.fullWidth = Boolean(resolved.fullWidth);
      resolved.textColor = resolved.textColor || "#ffffff";
      break;
    case "image":
      resolved.width = clampNumber(resolved.width, ...LIMITS.imageWidth, 100);
      resolved.borderRadius = clampNumber(
        resolved.borderRadius,
        ...LIMITS.imageRadius,
        0,
      );
      break;
    case "imageText":
      resolved.imagePosition =
        resolved.imagePosition === "right" ? "right" : "left";
      break;
    case "divider":
      resolved.thickness = clampNumber(
        resolved.thickness,
        ...LIMITS.dividerThickness,
        1,
      );
      resolved.width = clampNumber(resolved.width, ...LIMITS.dividerWidth, 100);
      resolved.color = resolved.color || "#e5e7eb";
      break;
    case "spacer":
      resolved.height = clampNumber(
        resolved.height,
        ...LIMITS.spacerHeight,
        24,
      );
      break;
    case "social":
      resolved.items = Array.isArray(resolved.items)
        ? resolved.items.filter((item) =>
            SOCIAL_NETWORKS.includes(item?.network),
          )
        : [];
      if (!ICON_STYLES.includes(resolved.iconStyle))
        resolved.iconStyle = "color";
      break;
    default:
      break;
  }
  return resolved;
}

/** Nouveau bloc du type demandé, avec un contenu d'exemple. */
export function createBlock(type, overrides = {}) {
  if (!isBlockType(type)) throw new Error(`Type de bloc inconnu : ${type}`);
  const block = {
    id: generateBlockId(),
    type,
    ...deepClone(BLOCK_DEFAULTS[type]),
    ...deepClone(STARTER_CONTENT[type]),
    ...overrides,
  };
  if (type !== "spacer") {
    block.padding = { ...DEFAULT_PADDING[type], ...(overrides.padding || {}) };
  }
  return block;
}

/**
 * Design valide : version, style complet, blocs connus avec un identifiant
 * unique (un identifiant manquant ou en double est remplacé).
 */
export function normalizeDesign(design) {
  const source = design && typeof design === "object" ? design : {};
  const seen = new Set();
  const blocks = (Array.isArray(source.blocks) ? source.blocks : [])
    .filter((block) => block && isBlockType(block.type))
    .map((block) => {
      let id = typeof block.id === "string" && block.id ? block.id : null;
      if (!id || seen.has(id)) id = generateBlockId();
      seen.add(id);
      return id === block.id ? block : { ...block, id };
    });
  return {
    version: DESIGN_VERSION,
    style: { ...DEFAULT_STYLE, ...(source.style || {}) },
    blocks,
  };
}

export const emptyDesign = () => normalizeDesign({ blocks: [] });

export const findBlockIndex = (design, id) =>
  (design?.blocks || []).findIndex((block) => block.id === id);

export const findBlock = (design, id) =>
  (design?.blocks || []).find((block) => block.id === id) || null;

const withBlocks = (design, blocks) => ({ ...design, blocks });

/** Bloc inséré à la position `index` (bornée). */
export function insertBlock(design, block, index) {
  const blocks = [...(design.blocks || [])];
  const at = clampNumber(index, 0, blocks.length, blocks.length);
  blocks.splice(at, 0, block);
  return withBlocks(design, blocks);
}

/**
 * Ajoute un bloc du type demandé après `afterId` (le bloc sélectionné), à
 * la fin sinon. Rend le design et le bloc créé (à sélectionner).
 */
export function addBlock(design, type, afterId = null) {
  const block = createBlock(type);
  const after = afterId ? findBlockIndex(design, afterId) : -1;
  const index = after >= 0 ? after + 1 : (design.blocks || []).length;
  return { design: insertBlock(design, block, index), block };
}

/** Bloc déplacé de `from` à `to` (positions dans la liste). */
export function moveBlock(design, from, to) {
  const blocks = [...(design.blocks || [])];
  if (from < 0 || from >= blocks.length) return design;
  const target = clampNumber(to, 0, blocks.length - 1, from);
  if (target === from) return design;
  const [moved] = blocks.splice(from, 1);
  blocks.splice(target, 0, moved);
  return withBlocks(design, blocks);
}

/** Monte (-1) ou descend (+1) un bloc ; inchangé en bout de liste. */
export function moveBlockBy(design, id, delta) {
  const from = findBlockIndex(design, id);
  if (from < 0) return design;
  const to = from + delta;
  if (to < 0 || to >= design.blocks.length) return design;
  return moveBlock(design, from, to);
}

/** Copie du bloc juste après lui (nouvel identifiant). */
export function duplicateBlock(design, id) {
  const index = findBlockIndex(design, id);
  if (index < 0) return { design, block: null };
  const copy = { ...deepClone(design.blocks[index]), id: generateBlockId() };
  return { design: insertBlock(design, copy, index + 1), block: copy };
}

export function removeBlock(design, id) {
  const blocks = (design.blocks || []).filter((block) => block.id !== id);
  return blocks.length === (design.blocks || []).length
    ? design
    : withBlocks(design, blocks);
}

/**
 * Propriétés modifiées d'un bloc. `padding` est fusionné (un seul côté
 * change) ; une valeur `undefined` retire la propriété (retour au défaut).
 */
export function updateBlock(design, id, patch) {
  let changed = false;
  const blocks = (design.blocks || []).map((block) => {
    if (block.id !== id) return block;
    const next = { ...block };
    for (const [key, value] of Object.entries(patch || {})) {
      if (key === "id" || key === "type") continue;
      if (value === undefined) {
        if (key in next) {
          delete next[key];
          changed = true;
        }
        continue;
      }
      if (key === "padding" && value && typeof value === "object") {
        const merged = {
          ...resolvePadding(block.type, block.padding),
          ...value,
        };
        if (JSON.stringify(merged) !== JSON.stringify(block.padding)) {
          next.padding = merged;
          changed = true;
        }
        continue;
      }
      if (next[key] !== value) {
        next[key] = value;
        changed = true;
      }
    }
    return next;
  });
  return changed ? withBlocks(design, blocks) : design;
}

/** Style général modifié (fond, couleurs, police, cadre). */
export function updateStyle(design, patch) {
  const style = { ...(design.style || {}) };
  let changed = false;
  for (const [key, value] of Object.entries(patch || {})) {
    if (!(key in DEFAULT_STYLE)) continue;
    if (style[key] !== value) {
      style[key] = value;
      changed = true;
    }
  }
  return changed ? { ...design, style } : design;
}

/** Palettes proposées dans l'onglet Style (fond, cadre, textes, accent). */
export const STYLE_PRESETS = [
  {
    key: "newbi",
    label: "Violet",
    style: {
      backgroundColor: "#f4f4f5",
      contentBackgroundColor: "#ffffff",
      textColor: "#1f2937",
      headingColor: "#111827",
      linkColor: "#5a50ff",
      primaryColor: "#5a50ff",
      footerTextColor: "#6b7280",
    },
  },
  {
    key: "ocean",
    label: "Océan",
    style: {
      backgroundColor: "#eef4fb",
      contentBackgroundColor: "#ffffff",
      textColor: "#1e293b",
      headingColor: "#0f2b46",
      linkColor: "#1d6fd8",
      primaryColor: "#1d6fd8",
      footerTextColor: "#64748b",
    },
  },
  {
    key: "foret",
    label: "Forêt",
    style: {
      backgroundColor: "#f1f5f0",
      contentBackgroundColor: "#ffffff",
      textColor: "#1f2a1f",
      headingColor: "#16351f",
      linkColor: "#2f7d4a",
      primaryColor: "#2f7d4a",
      footerTextColor: "#65705f",
    },
  },
  {
    key: "terracotta",
    label: "Terracotta",
    style: {
      backgroundColor: "#faf3ee",
      contentBackgroundColor: "#ffffff",
      textColor: "#3b2a22",
      headingColor: "#2b1a12",
      linkColor: "#c2532b",
      primaryColor: "#c2532b",
      footerTextColor: "#8a7468",
    },
  },
  {
    key: "sobre",
    label: "Sobre",
    style: {
      backgroundColor: "#f5f5f5",
      contentBackgroundColor: "#ffffff",
      textColor: "#262626",
      headingColor: "#0a0a0a",
      linkColor: "#0a0a0a",
      primaryColor: "#171717",
      footerTextColor: "#737373",
    },
  },
];

/** Texte visible d'un HTML riche (sans balises ni entités courantes). */
export function htmlToText(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

/** Vrai si le texte riche n'a aucun caractère visible. */
export const isBlankHtml = (html) => htmlToText(html).length === 0;

/** Résumé du contenu, pour la carte « Contenu » de la campagne. */
export function designSummary(design) {
  const blocks = design?.blocks || [];
  const count = (type) => blocks.filter((block) => block.type === type).length;
  const buttons =
    count("button") +
    blocks.filter((block) => block.type === "imageText" && block.buttonLabel)
      .length;
  const images = blocks.filter(
    (block) =>
      (block.type === "image" || block.type === "imageText") && block.src,
  ).length;
  return { blocks: blocks.length, buttons, images };
}
