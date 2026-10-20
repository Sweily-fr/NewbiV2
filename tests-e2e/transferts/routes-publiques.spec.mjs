/**
 * Transferts : routes publiques (sans connexion) de l'API. Défauts connus à
 * prouver par des tests dédiés (restent rouges jusqu'à correction) :
 *
 *  1. Injection d'opérateurs NoSQL dans les routes REST de téléchargement
 *     (/file-transfer/download-file, /download-all) : les paramètres de
 *     requête bruts entrent dans FileTransfer.findOne({ shareLink, accessKey })
 *     (fileTransferController.js). `shareLink[$ne]=x&accessKey[$ne]=y` atteint
 *     le transfert d'un autre utilisateur sans connaître son lien ni sa clé.
 *  2. Jeton de retour de paiement : createPaymentSessionForFileTransfer
 *     accepte un transferId sans clé d'accès ni connexion et écrit un jeton ;
 *     consumePaymentReturnToken révèle alors le shareLink et l'accessKey du
 *     transfert. Un identifiant devinable mène ainsi aux identifiants d'accès.
 *
 * validatePayment (3e route) n'est pas éprouvée : elle appelle Stripe avant
 * la recherche, injoignable en CI.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { API_URL } from "../config.mjs";
import { appelApi, id } from "../securite.mjs";
import { photo } from "../securite-collaboration.mjs";
import { TRANSFERTS } from "../donnees/lot-collaboration.mjs";

// Sans session : /api/auth/token répond 401, c'est attendu.
test.use({ storageState: { cookies: [], origins: [] }, erreursConsoleAutorisees: /401.*\/api\/auth\/token/ });

const ABSENT = "e2eLienAbsentXxxxxxxxxxxxxxxxxxxx";
const FICHIER_ABSENT = "000000000000000000000000";
// Opérateur $ne via les paramètres encodés par Playwright : l'analyseur qs
// d'Express reconstruit { champ: { $ne: "..." } }.
const INJECTION_FICHIER = { "link[$ne]": ABSENT, "key[$ne]": ABSENT, fileId: FICHIER_ABSENT };
const INJECTION_TOUT = { "link[$ne]": ABSENT, "key[$ne]": ABSENT };

test.describe("Transferts : routes publiques de téléchargement (défauts connus)", () => {
  test("download-file : une injection NoSQL ne doit pas atteindre le transfert d'autrui", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    // Référence : un lien et une clé inconnus donnent « Transfert non trouvé ou expiré ».
    const temoin = await page.request.get(`${API_URL}/file-transfer/download-file?link=${ABSENT}&key=${ABSENT}&fileId=${FICHIER_ABSENT}`);
    expect((await temoin.text()).toLowerCase(), "Référence : un lien inconnu doit être « non trouvé »").toContain("transfert non trouvé");

    // Injection par paramètres de requête : $ne contourne la comparaison.
    const injection = await page.request.get(`${API_URL}/file-transfer/download-file`, { params: INJECTION_FICHIER });
    const corps = (await injection.text()).toLowerCase();
    await etape(page, "L'injection ne doit pas trouver de transfert", async () => {
      // Attendu : « Transfert non trouvé ». Faille : un transfert est atteint, la
      // réponse devient « Fichier non trouvé dans le transfert » (transfert trouvé).
      expect(
        corps,
        `L'injection NoSQL a atteint le transfert d'un autre utilisateur (réponse « ${corps.slice(0, 80)} » au lieu de « Transfert non trouvé »)`,
      ).toContain("transfert non trouvé");
    });
  });

  test("download-all : une injection NoSQL ne doit pas atteindre le transfert d'autrui", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    const temoin = await page.request.get(`${API_URL}/file-transfer/download-all?link=${ABSENT}&key=${ABSENT}`);
    expect((await temoin.text()).toLowerCase(), "Référence : un lien inconnu doit être « non trouvé »").toContain("transfert non trouvé");

    let corps = "";
    try {
      const injection = await page.request.get(`${API_URL}/file-transfer/download-all`, { params: INJECTION_TOUT, timeout: 12_000 });
      corps = (await injection.text().catch(() => "")).toLowerCase();
    } catch {
      // Le serveur a commencé à renvoyer l'archive (transfert trouvé, fichiers sur R2 injoignable).
      corps = "(le serveur a commencé à envoyer une archive)";
    }
    await etape(page, "L'injection ne doit pas trouver de transfert", async () => {
      expect(
        corps,
        `L'injection NoSQL a atteint le transfert d'un autre utilisateur (réponse « ${corps.slice(0, 80)} » au lieu de « Transfert non trouvé »)`,
      ).toContain("transfert non trouvé");
    });
  });
});

test.describe("Transferts : jeton de retour de paiement (défaut connu)", () => {
  test("Un transferId devinable, sans clé ni session, mène aux identifiants du transfert", async ({ page }) => {
    await ouvrir(page, "/auth/login");

    await etape(page, "Créer une session de paiement pour le transfert d'autrui, sans clé d'accès", async () => {
      // Sans accessKey ni session : la création écrit déjà un jeton de retour en base.
      await appelApi(
        page,
        `mutation($id: ID!){ createPaymentSessionForFileTransfer(transferId: $id){ success message } }`,
        { id: id(TRANSFERTS.paiement) },
        { delai: 25_000 },
      );
    });

    const doc = JSON.parse(await photo("filetransfers", { _id: TRANSFERTS.paiement._id }))[0];
    const jeton = doc.paymentReturnToken;
    expect(jeton, "Un jeton de retour a été écrit pour un transfert sans clé d'accès (il voyage ensuite dans l'URL de retour Stripe)").toBeTruthy();

    const reponse = await appelApi(
      page,
      `query($t: String!){ consumePaymentReturnToken(token: $t){ success shareLink accessKey } }`,
      { t: jeton },
    );
    const resultat = reponse.data?.consumePaymentReturnToken;
    await etape(page, "Consommer le jeton ne doit pas révéler les identifiants", async () => {
      expect(
        resultat?.accessKey ?? null,
        "Un transferId devinable (sans clé, sans session) a révélé la clé d'accès du transfert via le jeton de retour de paiement",
      ).toBeNull();
    });
  });
});
