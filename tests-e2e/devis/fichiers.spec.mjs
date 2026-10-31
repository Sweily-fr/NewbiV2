/**
 * Devis, bons de commande et de livraison : fichiers. Archive PDF d'un
 * document (servie à l'aperçu, au téléchargement et aux envois) et annexes
 * PDF (ajoutées au PDF du document), vérifiées à l'API.
 *
 *   - archive : refusée au Membre, à une autre entreprise, pour un brouillon,
 *     pour un fichier qui n'est pas un PDF, et jamais remplacée sur un devis
 *     accepté ou un bon de livraison livré ;
 *   - annexe : refusée au Membre ; fichier non PDF, de plus de 2 Mo, de plus
 *     de 20 pages ou protégé par un mot de passe refusé avec un message ;
 *     lecture d'une annexe réservée aux membres de son organisation.
 *
 * Le stockage des fichiers est coupé en test : chaque refus doit venir avant.
 */
import { randomUUID } from "node:crypto";
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { API_URL, connecte, SESSION_TOKEN_CONTROLE_VENTES, SESSION_TOKEN_INTRUS, SESSION_TOKEN_VENTES_LECTEUR } from "../config.mjs";
import { BC_VENTES as BC, BL_VENTES as BL, DEVIS_VENTES as D, DOCUMENTS_CONTROLE as C } from "../donnees/lot-devis-bc-bl.mjs";
import { id } from "../securite.mjs";
import { appelApiFichier } from "../achats-banque.mjs";
import { ORG, ORG_INTRUS, photo } from "./droits.mjs";
import { ORG_CONTROLE } from "./controle.mjs";

const messages = (reponse) => reponse.errors.map((e) => `${e.extensions?.code || ""} ${e.message}`).join(" | ");
const REFUS_DE_DROITS = /FORBIDDEN|permission|n'êtes pas membre|introuvable|non trouvé|NOT_FOUND/i;

/**
 * PDF minimal écrit à la main : `pages` pages, `chiffre` (protégé par un mot
 * de passe), `octets` de remplissage (taille du fichier).
 */
function pdfDe({ pages = 1, chiffre = false, octets = 0 } = {}) {
  const objets = [];
  const kids = Array.from({ length: pages }, (_, i) => `${3 + i} 0 R`).join(" ");
  objets.push(`1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj`);
  objets.push(`2 0 obj<</Type/Pages/Kids[${kids}]/Count ${pages}>>endobj`);
  for (let i = 0; i < pages; i++) objets.push(`${3 + i} 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj`);
  const chiffrement = 3 + pages;
  if (chiffre) {
    objets.push(`${chiffrement} 0 obj<</Filter/Standard/V 1/R 2/O(00000000000000000000000000000000)/U(00000000000000000000000000000000)/P -4>>endobj`);
  }
  const remplissage = octets > 0 ? `\n%${"x".repeat(octets)}\n` : "";
  const id = "<00112233445566778899aabbccddeeff>";
  const trailer = `trailer<</Root 1 0 R/Size ${chiffrement + 1}${chiffre ? `/Encrypt ${chiffrement} 0 R/ID[${id}${id}]` : ""}>>`;
  return `%PDF-1.4\n${objets.join("\n")}${remplissage}\n${trailer}\n%%EOF\n`;
}

const fichierPdf = (contenu = pdfDe(), nom = "document.pdf") => ({ cle: "file", nom, type: "application/pdf", contenu });

const ARCHIVES = {
  devis: {
    champ: "archiveQuotePdf",
    requete: `mutation($w: ID!, $id: ID!, $file: Upload!) { archiveQuotePdf(workspaceId: $w, quoteId: $id, file: $file) { id archivedPdfKey } }`,
    collection: "quotes",
  },
  bc: {
    champ: "archivePurchaseOrderPdf",
    requete: `mutation($w: ID!, $id: ID!, $file: Upload!) { archivePurchaseOrderPdf(workspaceId: $w, purchaseOrderId: $id, file: $file) { id archivedPdfKey } }`,
    collection: "purchaseorders",
  },
  bl: {
    champ: "archiveDeliveryNotePdf",
    requete: `mutation($w: ID!, $id: ID!, $file: Upload!) { archiveDeliveryNotePdf(workspaceId: $w, deliveryNoteId: $id, file: $file) { id archivedPdfKey } }`,
    collection: "deliverynotes",
  },
};

/** Envoie une archive PDF (multipart) et renvoie la réponse et le document avant/après. */
async function archiver(page, type, doc, { w, organisation = w, fichier = fichierPdf() }) {
  const a = ARCHIVES[type];
  const temoin = [a.collection, { _id: doc._id }];
  const avant = await photo(temoin);
  const reponse = await appelApiFichier(page, a.requete, { w, id: id(doc), file: null }, fichier, { organisation });
  return { reponse, valeur: reponse.data?.[a.champ] ?? null, avant, apres: await photo(temoin) };
}

test.describe("Devis, bons de commande et de livraison : archive PDF", () => {
  test.describe(() => {
    test.use({ storageState: connecte(SESSION_TOKEN_VENTES_LECTEUR) });
    for (const [type, doc] of [
      ["devis", D.enAttente],
      ["bc", BC.enAttente],
      ["bl", BL.aExpedier],
    ]) {
      test(`Membre : archiver le PDF (${ARCHIVES[type].champ}) est refusé, le document ne change pas`, async ({ page }) => {
        await ouvrir(page, "/dashboard");
        const { reponse, valeur, avant, apres } = await archiver(page, type, doc, { w: ORG });
        expect(valeur, "Archive remplacée par le Membre").toBeNull();
        expect(messages(reponse)).toMatch(REFUS_DE_DROITS);
        expect(apres).toBe(avant);
      });
    }
  });

  test.describe(() => {
    test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });
    test("Autre entreprise : archiver le PDF d'un devis des autres est refusé, avec leur organisation comme avec la sienne", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      for (const [contexte, options] of [
        ["En visant leur organisation", { w: ORG }],
        ["Depuis sa propre organisation, avec leurs identifiants", { w: ORG_INTRUS }],
        ["Depuis sa propre organisation, leur organisation en argument", { w: ORG, organisation: ORG_INTRUS }],
      ]) {
        await etape(page, contexte, async () => {
          const { reponse, valeur, avant, apres } = await archiver(page, "devis", D.enAttente, options);
          expect(valeur, `${contexte} : archive remplacée`).toBeNull();
          expect(messages(reponse)).toMatch(REFUS_DE_DROITS);
          expect(apres).toBe(avant);
        });
      }
    });
  });

  test.describe(() => {
    test.use({ storageState: connecte(SESSION_TOKEN_CONTROLE_VENTES) });

    test("Brouillon : l'archive est refusée avec un message", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const { reponse, valeur, avant, apres } = await archiver(page, "devis", C.devisBrouillonArchive, { w: ORG_CONTROLE });
      expect(valeur).toBeNull();
      expect(messages(reponse)).toMatch(/brouillon ne peut pas être archivé/);
      expect(apres).toBe(avant);
    });

    test("Page HTML envoyée comme un PDF : refusée avec un message, aucune archive", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const html = fichierPdf("<!doctype html><html><body><h1>Devis</h1><p>Autre IBAN</p></body></html>", "devis.pdf");
      const { reponse, valeur, apres, avant } = await archiver(page, "devis", C.devisArchiveHtml, { w: ORG_CONTROLE, fichier: html });
      expect(valeur, "Une page HTML a été archivée comme PDF").toBeNull();
      expect(messages(reponse), "Le refus doit dire que le fichier n'est pas un PDF").toMatch(/doit être un PDF/);
      expect(apres).toBe(avant);
    });

    for (const [titre, type, doc] of [
      ["Devis accepté déjà archivé", "devis", C.devisAccepteArchive],
      ["Bon de livraison livré déjà archivé", "bl", C.blLivreArchive],
    ]) {
      test(`${titre} : son archive n'est pas remplaçable`, async ({ page }) => {
        await ouvrir(page, "/dashboard");
        const { reponse, valeur, avant, apres } = await archiver(page, type, doc, { w: ORG_CONTROLE });
        expect(valeur, "L'archive d'un document verrouillé a été remplacée").toBeNull();
        expect(messages(reponse), "Le refus doit expliquer que l'archive est définitive").toMatch(/archive.*(définitive|ne peut plus être remplacée)/i);
        expect(apres).toBe(avant);
      });
    }
  });
});

const ANNEXE = `mutation($w: ID!, $t: AnnexDocumentType!, $file: Upload!) { uploadDocumentAnnex(workspaceId: $w, documentType: $t, file: $file) { success message annex { key } } }`;
const envoyerAnnexe = (page, w, type, fichier) => appelApiFichier(page, ANNEXE, { w, t: type, file: null }, fichier, { organisation: w });

test.describe("Devis et bons de commande : annexes PDF", () => {
  test.describe(() => {
    test.use({ storageState: connecte(SESSION_TOKEN_VENTES_LECTEUR) });
    for (const type of ["QUOTE", "PURCHASE_ORDER"]) {
      test(`Membre : envoyer une annexe (${type}) est refusé`, async ({ page }) => {
        await ouvrir(page, "/dashboard");
        const reponse = await envoyerAnnexe(page, ORG, type, fichierPdf(pdfDe(), "cgv.pdf"));
        expect(reponse.data?.uploadDocumentAnnex?.annex ?? null, "Annexe enregistrée par le Membre").toBeNull();
        expect(messages(reponse)).toMatch(REFUS_DE_DROITS);
      });
    }
  });

  test.describe(() => {
    test.use({ storageState: connecte(SESSION_TOKEN_CONTROLE_VENTES) });
    const CAS = [
      ["Fichier texte", { cle: "file", nom: "notes.txt", type: "text/plain", contenu: "Conditions générales en texte" }, /doit être un PDF/],
      ["PDF de 2,1 Mo", fichierPdf(pdfDe({ octets: 2.1 * 1024 * 1024 }), "lourd.pdf"), /trop volumineux/],
      ["PDF de 21 pages", fichierPdf(pdfDe({ pages: 21 }), "long.pdf"), /20 pages/],
      ["PDF protégé par un mot de passe", fichierPdf(pdfDe({ chiffre: true }), "protege.pdf"), /mot de passe/],
    ];
    for (const type of ["QUOTE", "PURCHASE_ORDER"]) {
      for (const [nom, fichier, motif] of CAS) {
        test(`Annexe (${type}) : ${nom} refusé avec un message`, async ({ page }) => {
          await ouvrir(page, "/dashboard");
          const reponse = await envoyerAnnexe(page, ORG_CONTROLE, type, fichier);
          expect(reponse.errors, "Erreur inattendue").toEqual([]);
          const resultat = reponse.data.uploadDocumentAnnex;
          expect(resultat.success, "Annexe acceptée").toBe(false);
          expect(resultat.annex).toBeNull();
          expect(resultat.message).toMatch(motif);
        });
      }
    }

  });

  test.describe(() => {
    // Refus attendus de la route des annexes (403, 401, 400), signalés par le navigateur.
    test.use({ storageState: connecte(SESSION_TOKEN_CONTROLE_VENTES), erreursConsoleAutorisees: /document-annexes/ });
    test("Lire une annexe : refusé hors de son organisation, sans session, ou avec un identifiant invalide", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const lire = (chemin, avecSession = true) =>
        page.evaluate(
          async ({ url, avecSession }) => {
            const jeton = avecSession ? await fetch("/api/auth/token").then((r) => (r.ok ? r.json() : {})).then((d) => d.token || null) : null;
            const res = await fetch(url, { headers: jeton ? { authorization: `Bearer ${jeton}` } : {} });
            return res.status;
          },
          { url: `${API_URL}/document-annexes/${chemin}`, avecSession },
        );
      await etape(page, "Annexe d'une autre organisation : 403", async () => {
        expect(await lire(`${ORG}/${randomUUID()}.pdf`)).toBe(403);
      });
      await etape(page, "Sans session : 401", async () => {
        expect(await lire(`${ORG_CONTROLE}/${randomUUID()}.pdf`, false)).toBe(401);
      });
      await etape(page, "Identifiant de fichier invalide : 400", async () => {
        expect(await lire(`${ORG_CONTROLE}/pas-un-identifiant.pdf`)).toBe(400);
      });
    });
  });
});
