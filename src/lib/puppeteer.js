import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { existsSync } from "fs";

const MAC_BROWSERS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
];

const WIN_BROWSERS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const LINUX_BROWSERS = [
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/brave-browser",
  "/usr/bin/microsoft-edge",
];

function findLocalBrowser() {
  const envPath =
    process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
  if (envPath && existsSync(envPath)) return envPath;

  const candidates =
    process.platform === "darwin"
      ? MAC_BROWSERS
      : process.platform === "win32"
        ? WIN_BROWSERS
        : LINUX_BROWSERS;

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }

  return null;
}

export async function launchBrowser() {
  const isVercel = process.env.VERCEL === "1";

  if (isVercel) {
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const executablePath = findLocalBrowser();
  if (!executablePath) {
    throw new Error(
      "Aucun navigateur Chromium trouvé. Installez Google Chrome, Brave, ou Edge, " +
        "ou définissez la variable CHROME_PATH.",
    );
  }

  return puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: true,
  });
}

/**
 * Hôtes et adresses jamais joignables depuis le Chromium du serveur, quelle
 * que soit la configuration : boucle locale, réseaux privés, lien local et
 * métadonnées cloud (169.254.169.254, metadata.google.internal…).
 * L'analyseur d'URL normalise déjà les formes numériques d'IPv4
 * (http://2130706433 → 127.0.0.1).
 *
 * @param {string} hostname - `URL#hostname`
 * @returns {boolean}
 */
export function isPrivateHost(hostname) {
  const host = String(hostname || "")
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "");
  if (!host) return true;
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "metadata" ||
    host === "metadata.google.internal" ||
    host.endsWith(".internal") ||
    host.endsWith(".local")
  ) {
    return true;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }

  if (host.includes(":")) {
    // IPv6 : boucle locale, non spécifiée, privée (fc00::/7), lien local
    // (fe80::/10) et IPv4 encapsulée (::ffff:a.b.c.d ou ::ffff:7f00:1)
    if (host === "::1" || host === "::") return true;
    if (/^f[cd]/.test(host) || /^fe[89a-f]/.test(host)) return true;
    if (host.startsWith("::ffff:")) return true;
    return false;
  }

  return false;
}

// Seules ressources acceptées hors du site : les images (et leur relecture
// par fetch dans l'ancien pipeline de capture, cf. modern-screenshot).
const EXTERNAL_RESOURCE_TYPES = new Set(["image", "fetch", "xhr"]);

/**
 * Origines publiques des images d'entreprise (logos, images produits) en
 * plus des domaines publics R2 (`*.r2.dev`) : `COMPANY_IMAGE_URL` (même
 * variable que l'API) et `PDF_ALLOWED_IMAGE_ORIGINS` (origines https
 * séparées par des virgules), pour un domaine personnalisé de bucket.
 */
function configuredImageHosts() {
  const values = [
    process.env.COMPANY_IMAGE_URL,
    ...(process.env.PDF_ALLOWED_IMAGE_ORIGINS || "").split(","),
  ];
  const hosts = new Set();
  for (const value of values) {
    if (!value || !value.trim()) continue;
    try {
      const url = new URL(value.trim());
      if (url.protocol === "https:" && !isPrivateHost(url.hostname)) {
        hosts.add(url.host.toLowerCase());
      }
    } catch {
      // Valeur invalide : ignorée
    }
  }
  return hosts;
}

/**
 * Décide du sort d'une requête de la page Puppeteer.
 *
 * - `"site"` : le site lui-même (pages /pdf-generator, routes de données,
 *   scripts, styles, polices), seul destinataire du secret interne ;
 * - `"external"` : image publique hébergée sur R2 (`https://*.r2.dev` ou
 *   domaine configuré), sans secret ;
 * - `"inline"` : `data:` ou `blob:`, rien ne sort du navigateur ;
 * - `null` : bloquée (tout autre domaine, tout schéma autre que https, toute
 *   adresse privée, locale ou de métadonnées).
 *
 * @param {string} rawUrl
 * @param {string} resourceType - `HTTPRequest#resourceType()`
 * @param {string} siteOrigin - origine de l'URL chargée par Puppeteer
 * @returns {"site"|"external"|"inline"|null}
 */
export function classifyPdfPageRequest(rawUrl, resourceType, siteOrigin) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol === "data:" || url.protocol === "blob:") return "inline";
  if (url.origin === siteOrigin) return "site";

  if (url.protocol !== "https:" || url.username || url.password) return null;
  if (isPrivateHost(url.hostname)) return null;
  if (!EXTERNAL_RESOURCE_TYPES.has(resourceType)) return null;

  const host = url.host.toLowerCase();
  if (url.hostname.toLowerCase().endsWith(".r2.dev") && !url.port) {
    return "external";
  }
  return configuredImageHosts().has(host) ? "external" : null;
}

/**
 * Protège la page Puppeteer qui rend un document : chaque requête est
 * interceptée.
 *
 * 1. Le secret interne n'est posé que sur les requêtes vers le site
 *    (`page.setExtraHTTPHeaders` l'envoyait aussi à GTM ou à l'hôte d'un
 *    logo choisi par l'utilisateur).
 * 2. Le document peut contenir des URL fournies par l'utilisateur (logo,
 *    image d'article, données d'aperçu envoyées par l'app mobile) : sans
 *    filtre, Chromium allait chercher n'importe quelle adresse depuis le
 *    serveur, réseau interne et métadonnées cloud compris. Seuls le site,
 *    les images publiques R2, `data:` et `blob:` passent ; le reste est
 *    abandonné (le rendu continue, l'image manque).
 *
 * @param {import("puppeteer-core").Page} page
 * @param {string} baseUrl - URL du site chargée par Puppeteer
 */
export async function securePdfPage(page, baseUrl) {
  const secret = process.env.INTERNAL_API_SECRET;
  const siteOrigin = new URL(baseUrl).origin;

  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const kind = classifyPdfPageRequest(
      request.url(),
      request.resourceType?.() || "other",
      siteOrigin,
    );

    if (!kind) {
      console.warn(
        `🚫 [PDF] Requête bloquée : ${String(request.url()).slice(0, 200)}`,
      );
      request.abort("blockedbyclient").catch(() => {});
      return;
    }

    const headers = { ...request.headers() };
    delete headers["x-internal-secret"];
    if (secret && kind === "site") {
      headers["x-internal-secret"] = secret;
    }

    request.continue({ headers }).catch(() => {});
  });
}
