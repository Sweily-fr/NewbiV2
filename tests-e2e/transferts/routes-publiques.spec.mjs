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
 *     consommé ne révèle rien ; un jeton valide ramène au transfert une seule
 *     fois (comportement voulu pour la personne qui vient de payer). Une
 *     session de paiement, qui crée ce jeton, exige la clé d'accès.
 *  3. Routes REST /api/files et /api/transfers : refus avant tout accès au
 *     stockage (absent en CI), identifiant mal formé en 404.
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

test.describe("Transferts : jeton de retour de paiement", () => {
  // Pas de session : 401 sur /api/auth/token, attendu.
  // consumePaymentReturnToken est une mutation : appelée en query, la
  // validation GraphQL répondait 400 et le resolver ne s'exécutait jamais.
  const CONSOMMER = `mutation($t: String!){ consumePaymentReturnToken(token: $t){ success message shareLink accessKey paymentStatus } }`;

  for (const [cas, jeton, message] of [
    ["inconnu", "e2eJetonRetourPaiementInconnu000", "Invalid or already used token"],
    ["expiré", TRANSFERTS.paiement.paymentReturnToken, "Token expired"],
    ["déjà consommé", TRANSFERTS.paiementConsomme.paymentReturnToken, "Invalid or already used token"],
  ]) {
    test(`Jeton ${cas} : refusé, ni lien ni clé d'accès`, async ({ page }) => {
      await ouvrir(page, "/auth/login");
      const reponse = await appelApi(page, CONSOMMER, { t: jeton });
      expect(reponse.errors, "La mutation doit s'exécuter sans erreur GraphQL").toEqual([]);
      const resultat = reponse.data?.consumePaymentReturnToken;
      expect(resultat?.success, `Un jeton ${cas} a été accepté`).toBe(false);
      expect(resultat?.message).toBe(message);
      expect(resultat?.shareLink ?? null, `Un jeton ${cas} a révélé le lien du transfert`).toBeNull();
      expect(resultat?.accessKey ?? null, `Un jeton ${cas} a révélé la clé d'accès du transfert`).toBeNull();
    });
  }

  test("Jeton valide : le transfert est rendu une seule fois", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    const t = TRANSFERTS.paiementValide;
    const premier = await appelApi(page, CONSOMMER, { t: t.paymentReturnToken });
    expect(premier.data?.consumePaymentReturnToken).toMatchObject({
      success: true,
      shareLink: t.shareLink,
      accessKey: t.accessKey,
      paymentStatus: "pending",
    });
    const second = await appelApi(page, CONSOMMER, { t: t.paymentReturnToken });
    expect(second.data?.consumePaymentReturnToken?.success, "Le jeton a servi deux fois").toBe(false);
    expect(second.data?.consumePaymentReturnToken?.accessKey ?? null).toBeNull();
    const doc = JSON.parse(await photo("filetransfers", { _id: t._id }))[0];
    expect(doc?.paymentReturnTokenConsumed, "Le jeton n'est pas marqué consommé en base").toBe(true);
  });
});

test.describe("Transferts : session de paiement réservée à qui a la clé d'accès", () => {
  const SESSION = `mutation($id: ID!,$k: String){ createPaymentSessionForFileTransfer(transferId:$id, accessKey:$k){ success message sessionUrl } }`;

  for (const [cas, cle] of [
    ["sans clé", null],
    ["avec une mauvaise clé", "e2eclefausse00000000000000000000"],
  ]) {
    test(`${cas} : refusée, aucun jeton de retour créé`, async ({ page }) => {
      await ouvrir(page, "/auth/login");
      const t = TRANSFERTS.paiementStripe;
      const avant = JSON.parse(await photo("filetransfers", { _id: t._id }))[0];
      const reponse = await appelApi(page, SESSION, { id: id(t), k: cle });
      const resultat = reponse.data?.createPaymentSessionForFileTransfer;
      expect(resultat?.success, `Une session de paiement a été créée ${cas}`).toBe(false);
      expect(resultat?.sessionUrl ?? null).toBeNull();
      const apres = JSON.parse(await photo("filetransfers", { _id: t._id }))[0];
      expect(apres?.paymentReturnToken ?? null, "Un jeton de retour a été remis sans la clé d'accès").toBe(avant?.paymentReturnToken ?? null);
    });
  }
});

test.describe("Transferts : routes REST publiques, refus avant le stockage", () => {
  const fichier = (t) => t.files[0].fileId;
  const cle = (t) => ({ link: t.shareLink, key: t.accessKey });
  const statut = async (page, chemin, params) =>
    (await page.request.get(`${API_URL}${chemin}`, { params })).status();

  test.beforeEach(async ({ page }) => ouvrir(page, "/auth/login"));

  for (const route of ["download", "preview"]) {
    test(`/api/files/${route} : sans clé 403, mauvaise clé 403`, async ({ page }) => {
      const t = TRANSFERTS.actif;
      expect(await statut(page, `/api/files/${route}/${id(t)}/${fichier(t)}`, {})).toBe(403);
      expect(await statut(page, `/api/files/${route}/${id(t)}/${fichier(t)}`, { link: t.shareLink, key: "e2ecleinvalide" })).toBe(403);
    });
    test(`/api/files/${route} : protégé par mot de passe sans jeton 401`, async ({ page }) => {
      const t = TRANSFERTS.motDePasse;
      expect(await statut(page, `/api/files/${route}/${id(t)}/${fichier(t)}`, cle(t))).toBe(401);
    });
    test(`/api/files/${route} : payant non réglé 402`, async ({ page }) => {
      const t = TRANSFERTS.paiementConsomme;
      expect(await statut(page, `/api/files/${route}/${id(t)}/${fichier(t)}`, cle(t))).toBe(402);
    });
    test(`/api/files/${route} : expiré ou supprimé 410`, async ({ page }) => {
      for (const t of [TRANSFERTS.expire, TRANSFERTS.supprimeStatut]) {
        expect(await statut(page, `/api/files/${route}/${id(t)}/${fichier(t)}`, cle(t)), t.title).toBe(410);
      }
    });
  }

  test("/api/files/download : filigrane, téléchargement bloqué 403", async ({ page }) => {
    const t = TRANSFERTS.filigrane;
    const reponse = await page.request.get(`${API_URL}/api/files/download/${id(t)}/${fichier(t)}`, { params: cle(t) });
    expect(reponse.status()).toBe(403);
    expect((await reponse.json()).error).toMatch(/filigrane/);
  });

  test("Identifiant mal formé : 404, jamais 500", async ({ page }) => {
    for (const [methode, chemin] of [
      ["get", "/api/files/download/abc/def"],
      ["get", "/api/files/preview/abc/def"],
      ["post", "/api/transfers/abc/authorize"],
      ["post", "/api/transfers/download-event/abc/complete"],
    ]) {
      const reponse = await page.request[methode](`${API_URL}${chemin}`, methode === "post" ? { data: {} } : {});
      expect(reponse.status(), `${methode.toUpperCase()} ${chemin}`).toBe(404);
    }
  });
});
