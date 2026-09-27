/**
 * Attente des données injectées sur `window.__PREVIEW_DATA` par l'appelant des
 * pages /pdf-generator/{quote,invoice}/preview.
 *
 * Deux appelants, deux garanties différentes :
 *  - Puppeteer (routes API) injecte par `evaluateOnNewDocument` : la donnée est
 *    là dès le premier tick, la première vérification suffit ;
 *  - la WebView de l'app mobile injecte par `injectedJavaScriptBeforeContentLoaded`.
 *    Sur iOS c'est un WKUserScript `atDocumentStart`, exécuté avant les scripts
 *    de la page. Sur Android, react-native-webview le lance depuis
 *    `onPageStarted` (RNCWebViewClient.java), donc en course avec le bundle :
 *    la page pouvait démarrer avant l'injection, ne rien trouver et basculer en
 *    erreur alors que la donnée arrivait juste après. L'aperçu restait vide.
 *
 * On attend donc la donnée au lieu de conclure au premier tick. L'app mobile la
 * repose aussi après chargement (`injectedJavaScript`), ce qui ferme la course
 * des deux côtés.
 */

const DEFAULT_TIMEOUT_MS = 8000;
const POLL_INTERVAL_MS = 50;

/**
 * @param {Object} [options]
 * @param {number} [options.timeoutMs] - délai au-delà duquel on renonce
 * @returns {Promise<Object|null>} les données, ou null si elles n'arrivent pas
 */
export function waitForPreviewData({ timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.__PREVIEW_DATA) return Promise.resolve(window.__PREVIEW_DATA);

  return new Promise((resolve) => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (window.__PREVIEW_DATA) {
        clearInterval(timer);
        resolve(window.__PREVIEW_DATA);
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        clearInterval(timer);
        resolve(null);
      }
    }, POLL_INTERVAL_MS);
  });
}
