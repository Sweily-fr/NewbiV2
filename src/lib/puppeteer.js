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
 * Authentifie les requêtes de la page Puppeteer vers le site lui-même avec
 * le secret interne (routes `/api/*\/data/[id]` lues par les pages
 * `/pdf-generator/*`), et UNIQUEMENT celles-là.
 *
 * `page.setExtraHTTPHeaders` posait l'en-tête sur TOUTES les requêtes de la
 * page, y compris vers d'autres domaines : script Google Tag Manager, logo
 * ou image d'article hébergés ailleurs (URL libre dans l'aperçu). Le secret
 * partait donc chez des tiers. Ici, chaque requête est interceptée : même
 * origine que `baseUrl`, l'en-tête est ajouté ; autre origine, il est retiré.
 *
 * @param {import("puppeteer-core").Page} page
 * @param {string} baseUrl - URL du site chargée par Puppeteer
 */
export async function setInternalSecretForSameOrigin(page, baseUrl) {
  const secret = process.env.INTERNAL_API_SECRET;
  const origin = new URL(baseUrl).origin;

  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const headers = { ...request.headers() };
    delete headers["x-internal-secret"];

    let sameOrigin = false;
    try {
      sameOrigin = new URL(request.url()).origin === origin;
    } catch {
      sameOrigin = false;
    }
    if (secret && sameOrigin) {
      headers["x-internal-secret"] = secret;
    }

    request.continue({ headers }).catch(() => {});
  });
}
