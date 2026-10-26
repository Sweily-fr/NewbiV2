/**
 * Serveur des tests de bout en bout de Newbi, lancé par Playwright :
 *   1. démarre une base Mongo en mémoire (replica set : la validation d'une
 *      facture passe par une transaction) et y écrit les données de test ;
 *   2. lance l'API (newbi-api) sur cette base, crons et services externes coupés ;
 *   3. construit puis lance le site sur le port de test.
 *
 * Jamais de vraie clé : toutes les variables sont données ici, et le
 * lancement refuse une copie qui contient un fichier .env (l'API et Next le
 * liraient pour toute variable non fournie).
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { MongoClient } from "mongodb";
import { chromium } from "@playwright/test";
import { API_DIR, API_URL, BASE_DE_DONNEES, BASE_URL, DOSSIERS, FICHIER_ETAT, PORT, PORT_API, SECRET, SECRET_INTERNE } from "./config.mjs";
import { semer } from "./donnees/index.mjs";

const RACINE_SITE = process.cwd();

function refuserFichiersEnv(dossier, nom) {
  const trouves = readdirSync(dossier).filter((f) => f.startsWith(".env") && f !== ".env.example");
  if (trouves.length) {
    throw new Error(
      `[e2e] ${nom} contient ${trouves.join(", ")} : ces fichiers portent de vraies clés et seraient lus pendant les tests. ` +
        "Lance les tests depuis une copie sans fichier .env (voir tests-e2e/README.md).",
    );
  }
}
if (!existsSync(path.join(API_DIR, "src/server.js"))) {
  throw new Error(`[e2e] newbi-api introuvable dans ${API_DIR} : renseigne NEWBI_API_DIR.`);
}
refuserFichiersEnv(RACINE_SITE, "Le site");
refuserFichiersEnv(API_DIR, "L'API");

// mongodb-memory-server vient des dépendances de l'API (déjà utilisé par ses tests).
const { MongoMemoryReplSet } = createRequire(path.join(API_DIR, "package.json"))("mongodb-memory-server");
const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
const uri = mongo.getUri(BASE_DE_DONNEES);
if (!/^mongodb:\/\/127\.0\.0\.1:\d+\//.test(uri)) throw new Error(`[e2e] Base de test inattendue : ${uri}`);

const client = new MongoClient(uri);
await client.connect();
console.log(`[e2e] base en mémoire prête (${await semer(client.db(BASE_DE_DONNEES))})`);
await client.close();
// Les tests relisent ce qui est enregistré (totaux, statut, numéro) dans cette base.
writeFileSync(FICHIER_ETAT, JSON.stringify({ uri, port: PORT }));

const VIDE = "";
// Adresse où rien n'écoute : un service mal coupé échoue tout de suite au lieu
// de joindre Internet.
const NULLE_PART = "http://127.0.0.1:9";
// Adresse publique des fichiers (images d'icônes, logos…) : en https comme
// en prod, sinon la politique de sécurité du site bloque l'image et le
// signale dans la console ; domaine réservé qui n'existe pas, et le
// navigateur des tests coupe de toute façon tout appel vers l'extérieur.
const PUBLIC_NULLE_PART = "https://fichiers.e2e.invalid";

const communs = {
  ...process.env,
  NODE_OPTIONS: "",
  MONGODB_URI: uri,
  BETTER_AUTH_SECRET: SECRET,
  INTERNAL_API_SECRET: SECRET_INTERNE,
  STRIPE_SECRET_KEY: "sk_test_e2e_factice",
  STRIPE_WEBHOOK_SECRET: "whsec_e2e_factice",
  RESEND_API_KEY: VIDE,
  ENABLE_APP_TRIAL: VIDE,
  GOOGLE_CLIENT_ID: VIDE,
  GOOGLE_CLIENT_SECRET: VIDE,
  // Stockage de fichiers (R2) : des identifiants factices et un point d'accès
  // où rien n'écoute. Sans eux, le client S3 irait chercher AWS par défaut,
  // et certains buckets ont un nom de prod par défaut.
  R2_API_URL: NULLE_PART,
  R2_ACCESS_KEY_ID: "e2e",
  R2_SECRET_ACCESS_KEY: "e2e",
  R2_PUBLIC_URL: PUBLIC_NULLE_PART,
  AWS_S3_API_URL: NULLE_PART,
  AWS_ACCESS_KEY_ID: "e2e",
  AWS_SECRET_ACCESS_KEY: "e2e",
  // PDF générés par le site (Puppeteer) : le Chromium installé pour Playwright.
  CHROME_PATH: process.env.CHROME_PATH || chromium.executablePath(),
  CLOUDFLARE_ACCOUNT_ID: VIDE,
  CLOUDFLARE_R2_ACCESS_KEY_ID: VIDE,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: VIDE,
  CLOUDFLARE_R2_BUCKET_NAME: "e2e-cloudflare",
  ...Object.fromEntries(
    [
      "USER_IMAGE", "PROFILE_IMAGE", "COMPANY_IMAGE", "IMPORTED_INVOICES", "RECEIPTS", "SHARED_DOCUMENTS",
      "ICONS", "KANBAN", "OCR", "SIGNATURE", "TRANSFER",
    ].flatMap((nom) => [[`${nom}_BUCKET`, `e2e-${nom.toLowerCase()}`], [`${nom}_URL`, PUBLIC_NULLE_PART]]),
  ),
  ...Object.fromEntries(
    ["INVOICES", "QUOTES", "CREDIT_NOTES", "PURCHASE_ORDERS", "DELIVERY_NOTES", "DOCUMENT_ANNEXES"].map((nom) => [
      `${nom}_BUCKET`,
      `e2e-${nom.toLowerCase()}`,
    ]),
  ),
  NEXT_TELEMETRY_DISABLED: "1",
};

const envApi = {
  ...communs,
  NODE_ENV: "test",
  PORT: String(PORT_API),
  FRONTEND_URL: BASE_URL,
  NEXTJS_URL: BASE_URL,
  PARTNER_FRONTEND_URL: BASE_URL,
  NEXT_PUBLIC_APP_URL: BASE_URL,
  BACKEND_URL: API_URL,
  API_URL,
  API_BASE_URL: API_URL,
  NEXT_PUBLIC_API_URL: `${API_URL}/`,
  LOG_LEVEL: process.env.E2E_LOG_API || "warn",
  // Instance 1 : aucun cron ni planificateur (server.js).
  NODE_APP_INSTANCE: "1",
  JWT_SECRET: "e2e-jwt-local-uniquement",
  DATA_ENCRYPTION_KEY: "e2e-chiffrement-local-uniquement",
  SMTP_ENCRYPTION_KEY: "e2e-smtp-local-uniquement",
  CALENDAR_ENCRYPTION_KEY: "e2e-agenda-local-uniquement",
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: "9",
  SMTP_USER: "e2e",
  SMTP_PASS: "e2e",
  FROM_EMAIL: "e2e@newbi.test",
  // Redis absent (port vide) : PubSub en mémoire, et surtout pas la file
  // de relances du Redis de dev.
  REDIS_URL: VIDE,
  REDIS_HOST: "127.0.0.1",
  REDIS_PORT: "6399",
  BANKING_PROVIDER: "mock",
  COMPANY_SEARCH_MODE: "mock",
  OCR_DISABLE_CLAUDE: "true",
  OCR_DISABLE_TESSERACT: "true",
  ANTHROPIC_API_KEY: VIDE,
  MISTRAL_API_KEY: VIDE,
  MINDEE_API_KEY: VIDE,
  GOOGLE_CLOUD_PROJECT_ID: VIDE,
  SUPERPDP_CLIENT_ID: VIDE,
  SUPERPDP_CLIENT_SECRET: VIDE,
  QONTO_STAGING_TOKEN: VIDE,
  TURNSTILE_SECRET_KEY: VIDE,
  EXCHANGE_RATE_API_URL: NULLE_PART,
  ABBY_API_BASE_URL: NULLE_PART,
  BRIDGE_BASE_URL: NULLE_PART,
  BRIDGE_WEBHOOK_URL: NULLE_PART,
  PAYPAL_BASE_URL: NULLE_PART,
  ESIGNATURE_API_URL: NULLE_PART,
  ESIGNATURE_WEBHOOK_URL: NULLE_PART,
  CALENDAR_WEBHOOK_URL: NULLE_PART,
  CLAUDE_KANBAN_WEBHOOK_URL: VIDE,
  // Toutes les requêtes des tests viennent de 127.0.0.1.
  RATE_LIMIT_MAX: "1000000",
  RATE_LIMIT_AUTH_MAX: "100000",
};

const envSite = {
  ...communs,
  MONGODB_DB_NAME: BASE_DE_DONNEES,
  BETTER_AUTH_URL: BASE_URL,
  NEXT_PUBLIC_BETTER_AUTH_URL: BASE_URL,
  NEXT_PUBLIC_APP_URL: BASE_URL,
  ADDITIONAL_TRUSTED_ORIGINS: BASE_URL,
  // Un seul navigateur enchaîne les pages : la limite de Better Auth (100
  // requêtes par 10 s) renverrait des 429 et des listes en erreur.
  AUTH_RATE_LIMIT_MAX: "100000",
  NEXT_PUBLIC_API_URL: `${API_URL}/`,
  NEXT_PUBLIC_WS_URL: `ws://localhost:${PORT_API}/graphql`,
  NEXT_PUBLIC_APP_ENV: "test",
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: VIDE,
  RESEND_API_KEY: "re_e2e_factice",
  RESEND_BASE_URL: NULLE_PART,
  STRIPE_FREELANCE_MONTHLY_PRICE_ID: "price_e2e_freelance_m",
  STRIPE_FREELANCE_YEARLY_PRICE_ID: "price_e2e_freelance_a",
  STRIPE_PME_MONTHLY_PRICE_ID: "price_e2e_pme_m",
  STRIPE_PME_YEARLY_PRICE_ID: "price_e2e_pme_a",
  STRIPE_ENTREPRISE_MONTHLY_PRICE_ID: "price_e2e_entreprise_m",
  STRIPE_ENTREPRISE_YEARLY_PRICE_ID: "price_e2e_entreprise_a",
  STRIPE_SEAT_PRICE_ID: "price_e2e_siege",
  NEXT_DIST_DIR: DOSSIERS.build,
};

const enfants = [];
function lancer(commande, args, options) {
  const enfant = spawn(commande, args, { stdio: "inherit", ...options });
  enfants.push(enfant);
  return enfant;
}

let arret = false;
async function arreter(code = 0) {
  if (arret) return;
  arret = true;
  for (const e of enfants) e.kill("SIGTERM");
  rmSync(FICHIER_ETAT, { force: true });
  await mongo.stop().catch(() => {});
  process.exit(code);
}
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => arreter(0));

// --- API ---------------------------------------------------------------------
const api = lancer(process.execPath, ["src/server.js"], { cwd: API_DIR, env: envApi });
api.on("exit", (code) => {
  if (!arret) {
    console.error(`[e2e] l'API s'est arrêtée (code ${code})`);
    arreter(1);
  }
});
for (let essai = 0; ; essai++) {
  try {
    await fetch(`${API_URL}/graphql`, { method: "GET" });
    break;
  } catch {
    if (essai > 120) throw new Error("[e2e] l'API ne répond pas après 60 s");
    await new Promise((r) => setTimeout(r, 500));
  }
}
console.log(`[e2e] API prête sur ${API_URL}`);

// --- Site --------------------------------------------------------------------
// Par défaut : build de production puis `next start` (rapide et proche de la
// prod). E2E_DEV=1 : `next dev`, à réserver à l'écriture des tests.
// E2E_REUTILISER_BUILD=1 : garde le build précédent (les variables NEXT_PUBLIC
// sont figées au build, donc même port obligatoire).
const nextBin = createRequire(path.join(RACINE_SITE, "package.json")).resolve("next/dist/bin/next");
const modeDev = process.env.E2E_DEV === "1";
const reutiliser = process.env.E2E_REUTILISER_BUILD === "1" && existsSync(path.join(DOSSIERS.build, "BUILD_ID"));
rmSync(path.join(DOSSIERS.build, "cache/fetch-cache"), { recursive: true, force: true });

if (!modeDev && !reutiliser) {
  const code = await new Promise((resolve) => {
    lancer(process.execPath, [nextBin, "build", "--no-lint"], {
      env: { ...envSite, NODE_OPTIONS: "--max-old-space-size=4096" },
    }).on("exit", resolve);
  });
  if (code !== 0) {
    console.error(`[e2e] le build du site a échoué (code ${code})`);
    await arreter(code ?? 1);
  }
}

const site = lancer(process.execPath, [nextBin, modeDev ? "dev" : "start", "-p", String(PORT)], { env: envSite });
site.on("exit", (code) => {
  if (!arret) {
    console.error(`[e2e] le site s'est arrêté (code ${code})`);
    arreter(1);
  }
});
