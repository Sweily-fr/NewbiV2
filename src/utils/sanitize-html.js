import DOMPurify from "dompurify";

/**
 * Texte riche saisi par les utilisateurs (description d'une tâche Kanban,
 * notes et activité d'un contact) : on garde la mise en forme des éditeurs
 * du site (gras, italique, souligné, listes, citation, code, liens,
 * mentions) et on retire tout le reste, en particulier ce qui exécute du code
 * (scripts, attributs on*, liens javascript:) et ce qui peut recouvrir la
 * page (style, class). Même liste que l'API (newbi-api/src/utils/richText.js),
 * qui nettoie aussi à l'enregistrement.
 */
const RICH_TEXT_CONFIG = {
  ALLOWED_TAGS: [
    "a",
    "b",
    "blockquote",
    "br",
    "code",
    "del",
    "div",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "li",
    "mark",
    "ol",
    "p",
    "pre",
    "s",
    "span",
    "strike",
    "strong",
    "sub",
    "sup",
    "u",
    "ul",
  ],
  ALLOWED_ATTR: [
    "href",
    "target",
    "rel",
    "contenteditable",
    "data-mention-id",
    "data-mention-name",
  ],
  ALLOW_DATA_ATTR: false,
};

const escapeHtml = (text) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * HTML sûr à insérer dans la page (dangerouslySetInnerHTML, innerHTML).
 * Hors navigateur (rendu serveur), DOMPurify n'a pas de DOM : on rend le
 * texte seul, échappé.
 */
export function sanitizeRichText(html) {
  if (!html) return "";
  const value = String(html);
  if (!DOMPurify.isSupported) {
    return escapeHtml(value.replace(/<[^>]*>/g, ""));
  }
  return DOMPurify.sanitize(value, RICH_TEXT_CONFIG);
}
