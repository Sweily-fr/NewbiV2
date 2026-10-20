/**
 * Transferts : routes publiques (sans connexion) de l'API. Le point 1 est un
 * défaut prouvé par des tests dédiés (rouges jusqu'à correction) ; le point 2
 * est un contrôle qui doit passer :
 *
 *  1. Injection d'opérateurs NoSQL dans les routes REST de téléchargement
 *     (/file-transfer/download-file, /download-all) : les paramètres de
 *     requête bruts entrent dans FileTransfer.findOne({ shareLink, accessKey })
 *     (fileTransferController.js). `shareLink[$ne]=x&accessKey[$ne]=y` atteint
 *     le transfert d'un autre utilisateur sans connaître son lien ni sa clé.
 *  2. Jeton de retour de paiement : un jeton inconnu, expiré ou déjà
 *     consommé ne doit rien révéler (tests qui passent). La chaîne complète
 *     (obtenir un jeton valide sans payer ni connaître la clé d'accès) passe par
 *     Stripe : elle n'est pas testable en CI. Qu'un jeton valide ramène au
 *     transfert est le comportement voulu pour la personne qui vient de payer.
 *
 * validatePayment (3e route) n'est pas éprouvée : elle appelle Stripe avant
 * la recherche, injoignable en CI.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { API_URL } from "../config.mjs";
import { appelApi } from "../securite.mjs";
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

test.describe("Transferts : un jeton de retour de paiement non valide ne révèle rien", () => {
  // Le refus de l'API arrive en 400 (attendu) ; la session absente donne un 401 sur /api/auth/token.
  test.use({ erreursConsoleAutorisees: /401.*\/api\/auth\/token|status of 400/ });
  const CONSOMMER = `query($t: String!){ consumePaymentReturnToken(token: $t){ success message shareLink accessKey } }`;

  for (const [cas, jeton] of [
    ["inconnu", "e2eJetonRetourPaiementInconnu000"],
    ["expiré", TRANSFERTS.paiement.paymentReturnToken],
    ["déjà consommé", TRANSFERTS.paiementConsomme.paymentReturnToken],
  ]) {
    test(`Jeton ${cas} : ni lien ni clé d'accès`, async ({ page }) => {
      await ouvrir(page, "/auth/login");
      const reponse = await appelApi(page, CONSOMMER, { t: jeton });
      const resultat = reponse.data?.consumePaymentReturnToken;
      expect(resultat?.success, `Un jeton ${cas} a été accepté`).not.toBe(true);
      expect(resultat?.shareLink ?? null, `Un jeton ${cas} a révélé le lien du transfert`).toBeNull();
      expect(resultat?.accessKey ?? null, `Un jeton ${cas} a révélé la clé d'accès du transfert`).toBeNull();
    });
  }
});
