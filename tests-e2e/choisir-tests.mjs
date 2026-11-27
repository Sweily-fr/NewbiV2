/**
 * Choix des tests de bout en bout d'une PR vers main (release ou hotfix) :
 * seulement les dossiers des fonctionnalités touchées, pour ne pas relancer
 * toute la plateforme (~30 min) à chaque mise en prod. La suite complète
 * tourne le matin et le soir (workflow « Tests E2E », planification).
 *
 *   node tests-e2e/choisir-tests.mjs <fichier modifié>…
 *   → une ligne JSON : { "fichiers": "rendez-vous socle.spec.mjs", "machines": 2, "tout": false }
 *
 * Règles, dans l'ordre :
 *   1. Un fichier du socle (dépendances, configuration Next, middleware,
 *      gabarit racine, client GraphQL, authentification, outils communs des
 *      tests) → toute la suite.
 *   2. Un fichier d'un dossier de tests (tests-e2e/<dossier>/…) ou de ses
 *      données (tests-e2e/donnees/lot-<dossier>.mjs) → ce dossier.
 *   3. Un fichier de l'application → les dossiers dont un chemin connu
 *      (CHEMINS) ou le nom (« factures », « kanban »…) apparaît dans son chemin.
 *   4. Le reste (composants partagés, textes, images…) → rien de plus.
 * Le socle de connexion (socle.spec.mjs) tourne toujours.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));

// Modifier l'un de ces fichiers peut casser n'importe quelle page
export const SOCLE = [
  /^package(-lock)?\.json$/,
  /^next\.config\.(js|mjs)$/,
  /^src\/middleware\.js$/,
  /^app\/layout\.jsx$/,
  /^app\/dashboard\/layout\.jsx$/,
  /^src\/lib\/apolloClient\.js$/,
  /^src\/lib\/auth(-client)?\.js$/,
  /^tests-e2e\/[^/]+\.mjs$/,
  /^tests-e2e\/donnees\/(base|index|comptes-collaboration)\.mjs$/,
  /^\.github\/workflows\/tests-e2e\.yml$/,
];

// Chemins de l'application dont le nom ne contient pas celui du dossier de tests
export const CHEMINS = {
  accueil: ["app/dashboard/page.jsx", "app/dashboard/components/"],
  analytiques: ["app/dashboard/analytics/", "app/dashboard/outils/analytiques/"],
  authentification: ["app/auth/", "app/accept-invitation/", "app/reactivate-account/"],
  avoirs: ["credit-note", "creditNote", "CreditNote"],
  "bons-livraison": ["bons-de-livraison", "deliveryNote", "DeliveryNote"],
  "bons-commande": ["purchaseOrder", "PurchaseOrder"],
  calendrier: ["app/dashboard/calendar/", "useEvents", "useCalendar", "calendarConnection"],
  catalogue: ["app/dashboard/catalogues/", "useProducts", "product"],
  clients: ["app/dashboard/clients/", "useClients"],
  devis: ["quote", "Quote"],
  "documents-partages": ["documentShare", "shared-documents", "app/public/documents/"],
  "emails-envoyes": ["app/dashboard/emails-envoyes/", "sentEmail"],
  espaces: ["create-workspace", "useWorkspace", "organization"],
  "factures-achat": ["purchase-invoice", "purchaseInvoice", "PurchaseInvoice"],
  factures: ["invoice", "Invoice"],
  gestionnaire: ["invitation-gestionnaire"],
  kanban: ["useKanban", "kanban"],
  "mise-en-page": ["src/components/pdf/", "UniversalPreviewPDF", "document-settings"],
  "pages-publiques": ["app/(main)/", "app/lp/", "app/produits/", "app/faq/", "app/contact/", "app/cgv/", "app/mentions-legales/", "app/politique-de-confidentialite/"],
  parametres: ["app/dashboard/account/", "settings"],
  prevision: ["forecast", "Forecast"],
  releves: ["bank-statement", "bankStatement", "releve"],
  "rendez-vous": ["app/rdv/", "useBooking", "booking", "appointment"],
  "reseaux-sociaux": ["social", "Social"],
  "securite-site": ["securite", "security"],
  signatures: ["signatures-mail", "emailSignature", "EmailSignature"],
  stockage: ["storage", "Storage", "quota"],
  transactions: ["banking", "bank-", "Bridge"],
  transferts: ["app/transfer/", "transferts-fichiers", "fileTransfer", "FileTransfer"],
};

export function dossiersDeTests() {
  return fs
    .readdirSync(ICI, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !["donnees", "resultats", "rapport-html"].some((x) => e.name.startsWith(x)))
    .map((e) => e.name)
    .filter((nom) => fs.readdirSync(path.join(ICI, nom)).some((f) => f.endsWith(".spec.mjs")));
}

export function choisir(fichiersModifies, dossiers = dossiersDeTests()) {
  const choisis = new Set();
  for (const brut of fichiersModifies) {
    const fichier = brut.trim();
    if (!fichier) continue;
    if (SOCLE.some((re) => re.test(fichier))) return { fichiers: "", machines: 16, tout: true };
    const test = fichier.match(/^tests-e2e\/([^/]+)\//);
    if (test && dossiers.includes(test[1])) {
      choisis.add(test[1]);
      continue;
    }
    const lot = fichier.match(/^tests-e2e\/donnees\/lot-([^/]+)\.mjs$/);
    if (lot) {
      const nom = dossiers.find((d) => d === lot[1] || lot[1].startsWith(d) || d.startsWith(lot[1]));
      if (nom) choisis.add(nom);
      continue;
    }
    if (fichier.startsWith("tests-e2e/")) continue;
    for (const dossier of dossiers) {
      const motifs = [dossier, ...(CHEMINS[dossier] || [])];
      if (motifs.some((m) => fichier.includes(m))) choisis.add(dossier);
    }
  }
  const liste = [...choisis].sort();
  // Une machine par dossier, de 1 à 8 ; le socle seul tient sur une machine
  const machines = Math.min(8, Math.max(1, liste.length));
  return { fichiers: [...liste, "socle.spec.mjs"].join(" "), machines, tout: false };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const fichiers = process.argv.slice(2).length
    ? process.argv.slice(2)
    : fs.readFileSync(0, "utf8").split("\n");
  process.stdout.write(`${JSON.stringify(choisir(fichiers))}\n`);
}
