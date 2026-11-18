/**
 * Variables de personnalisation des campagnes e-mail : {{prenom}},
 * {{entreprise}}… et repli {{prenom|Bonjour}} (valeur après la barre si le
 * contact n'en a pas). Utilisables dans l'objet, le texte d'aperçu, les
 * textes riches et le texte des boutons ; jamais dans les liens.
 *
 * L'API les remplace à l'envoi et refuse une variable inconnue (vérification
 * avant envoi) : ici on aide seulement à les écrire et à les repérer.
 */

/** Variables connues tant que l'API ne les a pas renvoyées (réglages). */
export const DEFAULT_VARIABLES = [
  { key: "prenom", label: "Prénom", example: "Marie" },
  { key: "nom", label: "Nom", example: "Durand" },
  { key: "nom_complet", label: "Nom complet", example: "Marie Durand" },
  { key: "entreprise", label: "Entreprise", example: "Atelier Durand" },
  { key: "email", label: "Adresse e-mail", example: "marie.durand@exemple.fr" },
  { key: "ville", label: "Ville", example: "Lyon" },
];

// {{ clé }} ou {{ clé | repli }}, comme l'API (personalize.js) : ni
// accolade dans la clé ni dans le repli ; la clé est lue sans espaces autour
const VARIABLE_PATTERN = /\{\{([^{}|]*)(?:\|([^{}]*))?\}\}/g;

/** Variables écrites dans un texte, dans l'ordre : { raw, key, fallback, index }. */
export function parseVariables(text) {
  const found = [];
  const source = String(text ?? "");
  VARIABLE_PATTERN.lastIndex = 0;
  let match = VARIABLE_PATTERN.exec(source);
  while (match) {
    found.push({
      raw: match[0],
      key: match[1].trim().toLowerCase(),
      fallback: match[2] === undefined ? null : match[2].trim(),
      index: match.index,
    });
    match = VARIABLE_PATTERN.exec(source);
  }
  return found;
}

const knownKeySet = (variables) =>
  new Set((variables || DEFAULT_VARIABLES).map((variable) => variable.key));

/** Variables inconnues d'un texte (sans doublon), ex. ["prenon"]. */
export function unknownVariables(text, variables = DEFAULT_VARIABLES) {
  const known = knownKeySet(variables);
  const unknown = [];
  for (const { key } of parseVariables(text)) {
    if (!known.has(key) && !unknown.includes(key)) unknown.push(key);
  }
  return unknown;
}

/** Variables employées sans repli, ex. ["prenom"]. */
export function variablesWithoutFallback(text) {
  const keys = [];
  for (const { key, fallback } of parseVariables(text)) {
    if (!fallback && !keys.includes(key)) keys.push(key);
  }
  return keys;
}

/** Jeton à insérer : {{prenom}} ou {{prenom|Bonjour}}. */
export function variableToken(key, fallback) {
  const clean = String(fallback ?? "")
    .replace(/[{}|]/g, "")
    .trim();
  return clean ? `{{${key}|${clean}}}` : `{{${key}}}`;
}

/**
 * Texte avec `insertion` à la place de la sélection [start, end] d'un champ
 * (ou à la fin si la position est inconnue). Rend le texte et la nouvelle
 * position du curseur, juste après l'insertion. Une espace est ajoutée
 * avant si le texte précédent est collé à un mot.
 */
export function insertAtCursor(text, insertion, start, end) {
  const source = String(text ?? "");
  const from = Number.isInteger(start)
    ? Math.max(0, Math.min(start, source.length))
    : source.length;
  const to = Number.isInteger(end)
    ? Math.max(from, Math.min(end, source.length))
    : from;
  const before = source.slice(0, from);
  const needsSpace = before.length > 0 && /[^\s([«"'’]$/.test(before);
  const piece = `${needsSpace ? " " : ""}${insertion}`;
  return {
    text: `${before}${piece}${source.slice(to)}`,
    caret: from + piece.length,
  };
}

/**
 * Texte avec les variables remplacées par des valeurs (exemples ou contact) :
 * valeur du contact, sinon repli, sinon rien. Les variables inconnues
 * restent telles quelles, pour être vues.
 */
export function fillVariables(
  text,
  values = {},
  variables = DEFAULT_VARIABLES,
) {
  const known = knownKeySet(variables);
  return String(text ?? "").replace(VARIABLE_PATTERN, (raw, key, fallback) => {
    const name = key.trim().toLowerCase();
    if (!known.has(name)) return raw;
    const value = values[name];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
    return fallback === undefined ? "" : fallback.trim();
  });
}

/** Valeurs d'exemple des variables : { prenom: "Camille", … }. */
export const exampleValues = (variables = DEFAULT_VARIABLES) =>
  Object.fromEntries(
    (variables || DEFAULT_VARIABLES).map((variable) => [
      variable.key,
      variable.example,
    ]),
  );

/** Textes personnalisables d'un design (HTML des blocs, textes des boutons). */
export function designTexts(design) {
  const texts = [];
  for (const block of design?.blocks || []) {
    if (block.html) texts.push(block.html);
    if (block.label) texts.push(block.label);
    if (block.buttonLabel) texts.push(block.buttonLabel);
  }
  return texts;
}

/** Variables inconnues de tout le contenu (sans doublon). */
export function unknownDesignVariables(design, variables = DEFAULT_VARIABLES) {
  const unknown = [];
  for (const text of designTexts(design)) {
    for (const key of unknownVariables(text, variables)) {
      if (!unknown.includes(key)) unknown.push(key);
    }
  }
  return unknown;
}
