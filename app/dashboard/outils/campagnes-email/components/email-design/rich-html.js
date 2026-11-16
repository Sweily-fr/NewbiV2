import DOMPurify from "dompurify";

/**
 * Texte riche des blocs (titre, texte, image et texte) affiché dans la toile
 * et les vignettes : même liste blanche que l'API à l'envoi (newbi-api,
 * src/utils/richText.js), soit ce que produit Tiptap StarterKit. Un contenu
 * écrit autrement (import, API) ne peut ni exécuter de code ni recouvrir la
 * page.
 */
const CAMPAIGN_HTML_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "a",
    "ul",
    "ol",
    "li",
  ],
  ALLOWED_ATTR: ["href"],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:)/i,
};

const VARIABLE = /\{\{\s*[^{}|\s]+\s*(?:\|[^{}]*)?\}\}/g;

const escapeHtml = (text) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** HTML sûr à insérer (hors navigateur : texte seul, échappé). */
export function sanitizeCampaignHtml(html) {
  if (!html) return "";
  const value = String(html);
  if (!DOMPurify.isSupported) {
    return escapeHtml(value.replace(/<[^>]*>/g, ""));
  }
  return DOMPurify.sanitize(value, CAMPAIGN_HTML_CONFIG);
}

/**
 * HTML nettoyé dont les variables ({{prenom}}…) sont entourées d'une
 * pastille (span.ec-var) : on les repère d'un coup d'œil dans la toile.
 * Seuls les nœuds de texte sont touchés, jamais les attributs.
 */
export function highlightVariables(cleanHtml) {
  if (!cleanHtml || !cleanHtml.includes("{{")) return cleanHtml || "";
  if (typeof document === "undefined") return cleanHtml;
  const template = document.createElement("template");
  template.innerHTML = cleanHtml;
  const walker = document.createTreeWalker(
    template.content,
    NodeFilter.SHOW_TEXT,
  );
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const text = node.data;
    VARIABLE.lastIndex = 0;
    if (!VARIABLE.test(text)) continue;
    VARIABLE.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let last = 0;
    let match = VARIABLE.exec(text);
    while (match) {
      if (match.index > last) {
        fragment.appendChild(
          document.createTextNode(text.slice(last, match.index)),
        );
      }
      const span = document.createElement("span");
      span.className = "ec-var";
      span.textContent = match[0];
      fragment.appendChild(span);
      last = match.index + match[0].length;
      match = VARIABLE.exec(text);
    }
    if (last < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(last)));
    }
    node.parentNode.replaceChild(fragment, node);
  }
  return template.innerHTML;
}
