#!/usr/bin/env node
/**
 * Génère APPLE_CLIENT_SECRET pour « Sign in with Apple ».
 *
 * Apple n'accepte pas une chaîne fixe comme client secret : il attend un JWT
 * signé en ES256 avec la clé privée (.p8) téléchargée sur le portail
 * développeur. Ce JWT expire au maximum au bout de 6 mois — passé ce délai,
 * la connexion Apple tombe, côté web ET côté app mobile (Better Auth refuse
 * d'initialiser le provider sans secret valide).
 *
 * À RELANCER TOUS LES 6 MOIS. Noter l'échéance affichée en fin d'exécution.
 *
 * Usage :
 *   node scripts/generate-apple-client-secret.js \
 *     --p8 ~/chemin/AuthKey_XXXXXXXXXX.p8 \
 *     --key-id Q8M4SM3Q52 \
 *     --team-id 4F5LLQW333 \
 *     --client-id fr.newbi.web
 *
 * Le secret est écrit dans un fichier temporaire en 0600 plutôt qu'affiché :
 * un secret imprimé au terminal finit dans l'historique du shell et dans les
 * logs de la session. Le script n'affiche que le chemin et l'échéance.
 *
 * Le .p8 ne doit JAMAIS être commité. Le garder hors du dépôt.
 */
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, "");
    if (!key) continue;
    args[key] = argv[i + 1];
  }
  return args;
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

const args = parseArgs(process.argv);
const p8Path = args.p8;
const keyId = args["key-id"];
const teamId = args["team-id"];
const clientId = args["client-id"];

const missing = [
  ["--p8", p8Path],
  ["--key-id", keyId],
  ["--team-id", teamId],
  ["--client-id", clientId],
].filter(([, v]) => !v);

if (missing.length) {
  console.error(
    `Arguments manquants : ${missing.map(([k]) => k).join(", ")}\n\n` +
      `Exemple :\n  node scripts/generate-apple-client-secret.js \\\n` +
      `    --p8 ~/Downloads/AuthKey_Q8M4SM3Q52.p8 \\\n` +
      `    --key-id Q8M4SM3Q52 \\\n` +
      `    --team-id 4F5LLQW333 \\\n` +
      `    --client-id fr.newbi.web`,
  );
  process.exit(1);
}

// `~` n'est pas développé quand le chemin vient d'un argument quoté.
const resolvedP8 = p8Path.startsWith("~")
  ? path.join(os.homedir(), p8Path.slice(1))
  : path.resolve(p8Path);

if (!fs.existsSync(resolvedP8)) {
  console.error(`Fichier introuvable : ${resolvedP8}`);
  process.exit(1);
}

const privateKey = fs.readFileSync(resolvedP8, "utf8");

if (!privateKey.includes("BEGIN PRIVATE KEY")) {
  console.error(
    `Ce fichier ne ressemble pas à une clé .p8 Apple (en-tête PEM absent) :\n  ${resolvedP8}`,
  );
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);
// 15777000 s = 6 mois, le maximum accepté par Apple. On retire une journée
// pour éviter tout litige d'arrondi côté serveur Apple.
const exp = now + 15777000 - 86400;

const header = { alg: "ES256", kid: keyId, typ: "JWT" };
const payload = {
  iss: teamId,
  iat: now,
  exp,
  aud: "https://appleid.apple.com",
  sub: clientId,
};

const signingInput = `${base64url(JSON.stringify(header))}.${base64url(
  JSON.stringify(payload),
)}`;

// JWT ES256 exige une signature brute R||S (64 octets). Par défaut Node
// produit du DER : `dsaEncoding: "ieee-p1363"` donne le format attendu.
// Sans ça, Apple rejette le secret avec « invalid_client ».
let signature;
try {
  signature = crypto.sign("SHA256", Buffer.from(signingInput), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  });
} catch (error) {
  console.error(`Signature impossible : ${error.message}`);
  process.exit(1);
}

const token = `${signingInput}.${base64url(signature)}`;

const outPath = path.join(os.tmpdir(), `apple-client-secret-${keyId}.txt`);
fs.writeFileSync(outPath, token, { mode: 0o600 });

const expDate = new Date(exp * 1000);
console.log("APPLE_CLIENT_SECRET généré.\n");
console.log(`  fichier    : ${outPath}`);
console.log(`  client_id  : ${clientId}   (= APPLE_CLIENT_ID)`);
console.log(`  expire le  : ${expDate.toISOString().slice(0, 10)}`);
console.log(`  longueur   : ${token.length} caractères\n`);
console.log("Étapes suivantes :");
console.log(`  1. cat "${outPath}" et copier la valeur`);
console.log("  2. Vercel → Settings → Environment Variables :");
console.log(`       APPLE_CLIENT_ID     = ${clientId}`);
console.log("       APPLE_CLIENT_SECRET = (la valeur copiée)");
console.log("       NEXT_PUBLIC_APPLE_AUTH_ENABLED = true");
console.log("  3. redéployer, puis supprimer le fichier temporaire :");
console.log(`       rm "${outPath}"`);
console.log(
  `\n⚠️  Reprogrammer une régénération avant le ${expDate.toISOString().slice(0, 10)},`,
);
console.log("    sinon la connexion Apple cassera sur le web ET sur mobile.");
