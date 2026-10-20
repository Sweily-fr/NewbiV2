/**
 * Outils du lot « devis, bons de commande, bons de livraison » (dossiers
 * devis/, bons-commande/, bons-livraison/) : ouvrir une liste, y épingler un
 * document par sa référence (les listes ne montrent que 10 lignes par page),
 * ouvrir son panneau, et relire la base.
 */
import { expect } from "@playwright/test";
import { attendreCalme, cliquer, ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";

export const LISTE_DEVIS = "/dashboard/outils/devis";
export const LISTE_BC = "/dashboard/outils/bons-commande";
export const LISTE_BL = "/dashboard/outils/bons-de-livraison";

/** Type de document : chemins, titre de la liste, collection, libellé du panneau. */
export const TYPES = {
  devis: { liste: LISTE_DEVIS, titre: "Devis clients", collection: "quotes", panneau: "Devis", recherche: /^Recherchez par numéro, client ou montant/ },
  bc: { liste: LISTE_BC, titre: "Bons de commande", collection: "purchaseorders", panneau: "Bon de commande", recherche: /^Recherchez par numéro, client ou montant/ },
  bl: { liste: LISTE_BL, titre: "Bons de livraison", collection: "deliverynotes", panneau: "Bon de livraison", recherche: /^Recherchez par numéro, client, transporteur ou suivi/ },
};

/** Référence affichée : « D-102026-0001 » (« Brouillon » pour un bon de livraison non émis). */
export const reference = (doc) => `${doc.prefix}-${doc.number}`;
export const referenceBl = (doc) => (doc.status === "DRAFT" ? "Brouillon" : reference(doc));
/** Texte qui retrouve un seul document dans la recherche de sa liste. */
export const cleRecherche = (type, doc) => (type === "bl" && doc.status === "DRAFT" ? doc.carrier : reference(doc));

export const idDe = (doc) => doc._id.toHexString();

/** Ouvre une liste, prête quand son titre s'affiche. */
export async function ouvrirListe(page, type) {
  const t = TYPES[type];
  await ouvrir(page, t.liste, { pret: page.getByRole("heading", { name: t.titre, exact: true }) });
}

/** Tape dans la recherche de la liste et attend le filtrage. */
export async function rechercher(page, type, texte) {
  await page.getByPlaceholder(TYPES[type].recherche).fill(texte);
  await attendreCalme(page);
}

/** Ligne d'un document dans sa liste. */
export function ligneDe(page, type, doc) {
  if (type === "bl" && doc.status === "DRAFT") return page.getByRole("row").filter({ hasText: doc.carrier });
  return page.getByRole("row", { name: new RegExp(`${reference(doc).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`) });
}

/** Ouvre la liste avec un seul document affiché (recherché par sa référence). */
export async function epingler(page, type, doc) {
  await ouvrirListe(page, type);
  await rechercher(page, type, cleRecherche(type, doc));
  await expect(ligneDe(page, type, doc), `Ligne de ${cleRecherche(type, doc)}`).toHaveCount(1);
}

/** Panneau de détails d'un document (à droite de son aperçu). */
export const panneau = (page) => page.locator("div.fixed.inset-y-0.right-0.z-50.border-l").last();

/** Ouvre le panneau d'un document depuis sa ligne (clic sur le nom du client). */
export async function ouvrirPanneau(page, type, doc) {
  await epingler(page, type, doc);
  await cliquer(page, ligneDe(page, type, doc).getByText(doc.client.name).first());
  const titre = type === "bl" ? `${TYPES.bl.panneau} ${referenceBl(doc)}` : `${TYPES[type].panneau} ${reference(doc)}`;
  await expect(panneau(page).getByRole("heading", { name: titre })).toBeVisible();
  await attendreCalme(page);
  return panneau(page);
}

/** Ouvre le menu « ... » de la ligne d'un document et choisit une action. */
export async function actionDeLigne(page, type, doc, action) {
  await cliquer(page, ligneDe(page, type, doc).getByRole("button", { name: "Ouvrir le menu" }));
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}

/** Document tel qu'en base (null s'il a été supprimé). */
export async function enBase(type, doc) {
  return (await base()).collection(TYPES[type].collection).findOne({ _id: doc._id });
}

/** Valeur relue en base jusqu'à ce qu'elle change (les actions sont asynchrones). */
export function relu(type, doc, lire, message) {
  return expect.poll(async () => lire(await enBase(type, doc)), { message, timeout: 15_000 });
}

/** Documents d'une collection répondant à un filtre. */
export async function chercherEnBase(collection, filtre) {
  return (await base()).collection(collection).find(filtre).toArray();
}

/** Notifications (sonner) contenant ce texte. */
export const notification = (page, texte) => page.locator("[data-sonner-toast]").filter({ hasText: texte });

/** Lance une action qui télécharge un fichier ; renvoie { nom, chemin }. */
export async function telecharger(page, action, { timeout = 45_000 } = {}) {
  const [fichier] = await Promise.all([page.waitForEvent("download", { timeout }), action()]);
  return { nom: fichier.suggestedFilename(), chemin: await fichier.path() };
}

/** Texte d'un PDF (toutes les pages), lu avec pdfjs comme le fait l'aperçu du site. */
export async function textePdf(chemin) {
  const { readFileSync } = await import("node:fs");
  const path = await import("node:path");
  const racine = path.resolve("node_modules/pdfjs-dist");
  const pdfjs = await import(path.join(racine, "legacy/build/pdf.mjs"));
  const octets = new Uint8Array(readFileSync(chemin));
  const entete = Buffer.from(octets.subarray(0, 5)).toString();
  const document = await pdfjs.getDocument({
    data: octets.slice(),
    disableFontFace: true,
    isEvalSupported: false,
    standardFontDataUrl: `${path.join(racine, "standard_fonts")}/`,
  }).promise;
  const pages = [];
  for (let i = 1; i <= document.numPages; i++) {
    const contenu = await (await document.getPage(i)).getTextContent();
    pages.push(contenu.items.map((x) => x.str).join(" "));
  }
  return { pages: document.numPages, texte: pages.join("\n").replace(/\s+/g, " "), entete };
}

/**
 * Boutons déjà essayés sur une autre page (même composant, même effet) : ici,
 * seule leur présence (et leur état grisé) est vérifiée, par le test
 * « Chaque élément de la page est décrit et testé ». `garder` : clés encore
 * essayées sur cette page (ce qui lui est propre).
 */
export function dejaEssayes(boutons, ou, garder = []) {
  return Object.fromEntries(
    Object.entries(boutons).map(([cle, attendu]) => [cle, attendu.desactive || attendu.parcours || garder.includes(cle) ? attendu : { parcours: `essayé sur « ${ou} »` }]),
  );
}
