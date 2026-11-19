/**
 * Page d'erreur des aperçus de fichiers affichés en iframe (proxy
 * /api/document-preview).
 *
 * Quand le fichier ne pouvait pas être servi (fichier effacé du stockage,
 * session expirée, accès refusé), l'iframe affichait la réponse JSON brute,
 * par exemple {"error":"Aucun fichier disponible"} dans la visionneuse JSON du
 * navigateur (signalé le 19/11/2026 sur un justificatif de facture d'achat).
 * Une navigation d'iframe reçoit maintenant une page lisible ; les appels
 * fetch() (préchargement, téléchargement, aperçu canvas) gardent le JSON.
 */

const NAVIGATION_DESTS = new Set([
  "iframe",
  "frame",
  "document",
  "embed",
  "object",
]);

// Justificatifs déposés par l'utilisateur : il peut retirer le fichier et en
// déposer un nouveau
const UPLOADED_TYPES = new Set(["purchaseInvoice", "transaction"]);

/**
 * Vrai si la requête affiche la réponse elle-même (iframe, onglet) plutôt
 * que de la lire en JavaScript. Sans Sec-Fetch-Dest (navigateurs anciens),
 * une navigation demande du HTML ; fetch() envoie « *\/* ».
 * @param {Request} request
 */
export function wantsPreviewPage(request) {
  const dest = request.headers.get("sec-fetch-dest");
  if (dest) return NAVIGATION_DESTS.has(dest);
  return (request.headers.get("accept") || "").includes("text/html");
}

/**
 * Titre et explication selon le statut de la réponse.
 * @param {number} status
 * @param {string} [type] type de document du proxy
 * @returns {{title: string, detail: string}}
 */
export function previewErrorMessage(status, type) {
  if (status === 401) {
    return {
      title: "Votre session a expiré",
      detail: "Reconnectez-vous pour afficher ce fichier.",
    };
  }
  if (status === 403) {
    return {
      title: "Accès refusé",
      detail: "Vous n'avez pas accès à ce fichier.",
    };
  }
  if (status === 400) {
    return {
      title: "Lien d'aperçu invalide",
      detail: "Fermez l'aperçu puis rouvrez le fichier.",
    };
  }
  if (status === 404) {
    return {
      title: "Ce fichier n'est plus disponible",
      detail: UPLOADED_TYPES.has(type)
        ? "Il a été supprimé du stockage. Vous pouvez le retirer et déposer de nouveau le justificatif."
        : "Il a peut-être été supprimé.",
    };
  }
  return {
    title: "Le fichier n'a pas pu être chargé",
    detail: "Réessayez dans quelques instants.",
  };
}

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Icône « fichier barré » (lucide FileX), comme le reste de l'appli
const FILE_X_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m14.5 12.5-5 5"/><path d="m9.5 12.5 5 5"/></svg>';

/**
 * Page HTML autonome (aucune ressource externe), sur la page blanche A4 du
 * panneau d'aperçu.
 * @param {number} status
 * @param {string} [type]
 * @returns {string}
 */
export function previewErrorHtml(status, type) {
  const { title, detail } = previewErrorMessage(status, type);
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)}</title>
<style>
html,body{margin:0;height:100%;background:#fff}
body{display:flex;justify-content:center;align-items:flex-start;box-sizing:border-box;padding:120px 24px;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#71717a;text-align:center;-webkit-font-smoothing:antialiased}
main{max-width:360px}
svg{width:64px;height:64px;opacity:.5;margin-bottom:16px}
h1{margin:0 0 8px;font-size:15px;font-weight:600;color:#18181b}
p{margin:0;font-size:14px;line-height:1.5}
</style>
</head>
<body>
<main>
${FILE_X_ICON}
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(detail)}</p>
</main>
</body>
</html>`;
}

/**
 * Réponse d'erreur du proxy : page lisible pour une iframe, JSON sinon.
 * Le statut reste celui de l'erreur.
 * @param {Request} request
 * @param {{status: number, body: object, type?: string}} options
 */
export function previewErrorResponse(request, { status, body, type }) {
  if (!wantsPreviewPage(request)) {
    return Response.json(body, { status });
  }
  return new Response(previewErrorHtml(status, type), {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'",
    },
  });
}
