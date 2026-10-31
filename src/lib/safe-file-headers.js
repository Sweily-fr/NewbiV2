/**
 * En-têtes d'un fichier d'utilisateur servi par un proxy du site
 * (/api/document-preview, /api/shared-documents/preview-file).
 *
 * Ces fichiers sont servis sur l'origine de l'application : un document
 * HTML, SVG ou XML y serait interprété comme une page du site. Le type
 * renvoyé par l'API n'est donc repris que s'il fait partie de la liste
 * blanche (PDF et images matricielles, plus l'audio, la vidéo et le texte
 * brut pour l'aperçu des documents partagés) ; tout le reste est servi en
 * téléchargement (application/octet-stream). Toujours nosniff, et une CSP
 * sandbox hors PDF : rien ne s'y exécute, même ouvert dans un onglet. Le PDF
 * n'en a pas : la visionneuse intégrée de Chrome refuse un document
 * sandboxé, et un PDF ne s'exécute jamais sur l'origine qui le sert.
 */

export const INLINE_PREVIEW_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

export const SHARED_PREVIEW_EXTRA_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/aac",
  "text/plain",
]);

const SANDBOX_POLICY = [
  "sandbox",
  "default-src 'none'",
  "img-src 'self' data:",
  "media-src 'self'",
  "style-src 'unsafe-inline'",
  "frame-ancestors 'self'",
].join("; ");

/**
 * @param {Headers} upstream - en-têtes de la réponse de l'API
 * @param {Object} [options]
 * @param {Set<string>} [options.extraInlineTypes] - types en ligne en plus
 * @returns {Headers} en-têtes à renvoyer au navigateur (sans Cache-Control)
 */
export function safeFileHeaders(upstream, { extraInlineTypes } = {}) {
  const type = String(upstream.get("content-type") || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  const allowed =
    INLINE_PREVIEW_TYPES.has(type) || Boolean(extraInlineTypes?.has(type));

  const upstreamDisposition = upstream.get("content-disposition") || "";
  const asAttachment =
    !allowed || /^\s*attachment\b/i.test(upstreamDisposition);
  // Paramètres (nom du fichier) repris, type de disposition imposé
  const dispositionParams = upstreamDisposition
    .replace(/^\s*(inline|attachment)\s*;?\s*/i, "")
    .trim();

  const headers = new Headers();
  headers.set(
    "Content-Type",
    !allowed
      ? "application/octet-stream"
      : type === "text/plain"
        ? "text/plain; charset=utf-8"
        : type,
  );
  headers.set(
    "Content-Disposition",
    `${asAttachment ? "attachment" : "inline"}${dispositionParams ? `; ${dispositionParams}` : ""}`,
  );
  headers.set("X-Content-Type-Options", "nosniff");
  if (!allowed || type !== "application/pdf") {
    headers.set("Content-Security-Policy", SANDBOX_POLICY);
  }
  const length = upstream.get("content-length");
  if (length) headers.set("Content-Length", length);
  return headers;
}
