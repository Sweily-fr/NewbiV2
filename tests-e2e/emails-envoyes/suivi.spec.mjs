/**
 * E-mails envoyés : suivi des e-mails de documents, adresses publiques de
 * l'API appelées par la boîte du client ou par Resend.
 *   - pixel d'ouverture (/tracking/open/<jeton>) : toujours une image, une
 *     ouverture comptée seulement pour un jeton connu, la première datée ;
 *   - lien « Voir la facture » (/tracking/click/<jeton>) : clic compté
 *     (et ouverture), redirection vers le PDF du document seulement ;
 *     jeton inconnu : retour au site Newbi, jamais une autre adresse ;
 *   - webhook de Resend (/webhook/resend) : un événement non signé ne doit
 *     rien changer (remise, rejet, ouverture).
 * Chaque test qui modifie a sa facture et son envoi (lot-emails-envoyes.mjs).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { API_URL, BASE_URL, connecte } from "../config.mjs";
import { base } from "../base.mjs";
import { photo } from "../securite-collaboration.mjs";
import { COMPTES_ENVOIS, ENVOIS, FACTURES_ENVOIS, SUIVI } from "../donnees/lot-emails-envoyes.mjs";

const SANS_SUIVRE = { maxRedirects: 0 };
const facture = async (doc) => (await base()).collection("invoices").findOne({ _id: doc._id });
const envoi = async (doc) => (await base()).collection("document_email_logs").findOne({ _id: doc._id });

/* --- Pixel et lien ---------------------------------------------------------- */

test.describe("E-mails envoyés : suivi d'ouverture et de clic", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Pixel d'un jeton inconnu : image transparente non mise en cache, rien n'est modifié", async ({ page }) => {
    const avant = await photo("invoices", { _id: FACTURES_ENVOIS.apercu._id });
    const reponse = await page.request.get(`${API_URL}/tracking/open/e2eJetonInconnu0000000000000000000`);
    expect(reponse.status()).toBe(200);
    expect(reponse.headers()["content-type"]).toBe("image/gif");
    expect(reponse.headers()["cache-control"]).toMatch(/no-store/);
    expect((await reponse.body()).length, "Une image d'un pixel").toBeLessThan(100);
    expect(await photo("invoices", { _id: FACTURES_ENVOIS.apercu._id }), "Un jeton inconnu a modifié une facture").toBe(avant);
    expect(await (await base()).collection("invoices").countDocuments({ "emailTracking.trackingToken": "e2eJetonInconnu0000000000000000000" })).toBe(0);
  });

  test("Pixel d'un envoi : chaque ouverture comptée, la première datée, l'envoi noté « Ouvert »", async ({ page }) => {
    await etape(page, "Première ouverture", async () => {
      const reponse = await page.request.get(`${API_URL}/tracking/open/${SUIVI.ouverture}`);
      expect(reponse.status()).toBe(200);
      const doc = await facture(FACTURES_ENVOIS.ouverture);
      expect(doc.emailTracking.emailOpenCount, "Ouvertures après le premier pixel").toBe(1);
      expect(doc.emailTracking.emailOpenedAt, "Date de première ouverture").toBeTruthy();
      expect((await envoi(ENVOIS.ouverture)).openedAt, "L'envoi doit être noté ouvert").toBeTruthy();
    });
    const premiere = (await facture(FACTURES_ENVOIS.ouverture)).emailTracking.emailOpenedAt.getTime();
    const ouvertLe = (await envoi(ENVOIS.ouverture)).openedAt.getTime();
    await etape(page, "Seconde ouverture : comptée, dates inchangées", async () => {
      await page.request.get(`${API_URL}/tracking/open/${SUIVI.ouverture}`);
      const doc = await facture(FACTURES_ENVOIS.ouverture);
      expect(doc.emailTracking.emailOpenCount).toBe(2);
      expect(doc.emailTracking.emailOpenedAt.getTime(), "La première ouverture ne doit pas être réécrite").toBe(premiere);
      expect((await envoi(ENVOIS.ouverture)).openedAt.getTime(), "L'ouverture de l'envoi ne doit pas être réécrite").toBe(ouvertLe);
    });
  });

  test("Lien « Voir la facture » : redirige vers le PDF du document, clic et ouverture comptés", async ({ page }) => {
    const reponse = await page.request.get(`${API_URL}/tracking/click/${SUIVI.clic}`, SANS_SUIVRE);
    expect(reponse.status(), "Redirection vers le PDF").toBe(302);
    expect(reponse.headers().location).toBe(FACTURES_ENVOIS.clic.cachedPdf.url);
    const doc = await facture(FACTURES_ENVOIS.clic);
    expect(doc.emailTracking.emailClickCount).toBe(1);
    expect(doc.emailTracking.emailClickedAt).toBeTruthy();
    expect(doc.emailTracking.emailOpenCount, "Un clic vaut une ouverture").toBe(1);
    expect(doc.emailTracking.emailOpenedAt).toBeTruthy();
  });

  test("Lien d'un jeton inconnu : retour au site Newbi, jamais une autre adresse", async ({ page }) => {
    for (const chemin of ["/tracking/click/e2eJetonInconnu0000000000000000000", "/tracking/sign/e2eJetonInconnu0000000000000000000/99"]) {
      const reponse = await page.request.get(`${API_URL}${chemin}`, SANS_SUIVRE);
      expect(reponse.status(), chemin).toBe(302);
      expect(reponse.headers().location, chemin).toBe(BASE_URL);
    }
  });
});

test.describe("E-mails envoyés : l'ouverture se lit sur la page de l'envoi", () => {
  test.use({ storageState: connecte(COMPTES_ENVOIS.proprietaire.token) });

  test("Après le pixel, l'étape « Ouvert » est datée", async ({ page }) => {
    await page.request.get(`${API_URL}/tracking/open/${SUIVI.ouvertureUi}`);
    await ouvrir(page, `/dashboard/emails-envoyes/${ENVOIS.ouvertureUi._id.toHexString()}`, {
      pret: page.getByRole("heading", { name: "E-mail envoyé", level: 1 }),
    });
    const suivi = page.locator("aside");
    await etape(
      page,
      "Étape « Ouvert » renseignée",
      async () => {
        await expect(suivi.getByText("Ouvert", { exact: true })).toBeVisible();
        await expect(suivi.getByText("Pas encore")).toHaveCount(0);
      },
      { capture: "ecran" },
    );
  });
});

/* --- Webhook de Resend --------------------------------------------------------- */

const webhook = (page, corps, entetes = {}) =>
  page.request.post(`${API_URL}/webhook/resend`, {
    data: typeof corps === "string" ? corps : JSON.stringify(corps),
    headers: { "content-type": "application/json", ...entetes },
  });

test.describe("E-mails envoyés : webhook de Resend", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Un corps illisible n'est jamais traité", async ({ page }) => {
    const reponse = await webhook(page, "{pas du json");
    expect([400, 401], `Statut reçu : ${reponse.status()}`).toContain(reponse.status());
  });

  /**
   * Défaut connu : sans RESEND_WEBHOOK_SECRET (cas de l'API de test, et de
   * la prod au dernier relevé), l'API traite les événements sans aucune
   * signature (newbi-api src/routes/resendWebhook.js) : n'importe qui peut
   * marquer un e-mail rejeté (alerte envoyée à l'émetteur) ou ouvert.
   * Corriger suppose de configurer le secret en prod avant de refuser.
   */
  test("Un événement non signé est refusé et ne change ni la remise ni l'ouverture (défaut connu)", async ({ page }) => {
    const avantRejet = await photo("invoices", { _id: FACTURES_ENVOIS.rejet._id });
    const avantJournal = await photo("document_email_logs", { _id: ENVOIS.rejet._id });
    const avantOuverture = await photo("invoices", { _id: FACTURES_ENVOIS.ouvertureWebhook._id });
    const rejet = await webhook(page, {
      type: "email.bounced",
      created_at: new Date().toISOString(),
      data: { email_id: SUIVI.resendRejet, to: ["zoe@obrien.test"], bounce: { message: "Mailbox does not exist" } },
    });
    const ouverture = await webhook(page, {
      type: "email.opened",
      created_at: new Date().toISOString(),
      data: { email_id: SUIVI.resendOuverture, to: ["zoe@obrien.test"] },
    });
    expect.soft(await photo("invoices", { _id: FACTURES_ENVOIS.rejet._id }), "Rejet non signé : la facture est passée « non remise »").toBe(avantRejet);
    expect.soft(await photo("document_email_logs", { _id: ENVOIS.rejet._id }), "Rejet non signé : l'envoi a changé").toBe(avantJournal);
    expect.soft(await photo("invoices", { _id: FACTURES_ENVOIS.ouvertureWebhook._id }), "Ouverture non signée : la facture est passée « ouverte »").toBe(avantOuverture);
    expect.soft(rejet.status(), "Rejet non signé accepté").toBe(401);
    expect.soft(ouverture.status(), "Ouverture non signée acceptée").toBe(401);
  });
});
