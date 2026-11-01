/**
 * E-mails envoyés : la page « E-mail envoyé » (/dashboard/emails-envoyes/<id>)
 * montre l'e-mail tel que le client l'a reçu, ouvert depuis le reçu d'envoi
 * ou l'historique d'un document.
 *   - propriétaire : enveloppe, parcours de l'envoi, pièces jointes, autres
 *     envois du même document ; le message personnalisé (HTML libre) est
 *     affiché dans un cadre isolé où aucun script ne s'exécute ;
 *   - « Voir » du type de document exigé, dans l'espace de l'envoi : un
 *     rôle sans les factures ne lit pas l'envoi d'une facture, une autre
 *     entreprise ne lit rien (« introuvable »), à l'écran comme à l'API ;
 *   - pièces jointes servies par le proxy du site avec les mêmes droits.
 * Le contenu d'un fichier joint (HTML téléchargé, jamais affiché) est
 * vérifié par les tests de l'API (stockage absent ici).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_INTRUS } from "../config.mjs";
import { appelApi, verifierRefus, id } from "../securite.mjs";
import { sansFuite } from "../securite-collaboration.mjs";
import { COMPTES_ENVOIS, MEMBRES_ENVOIS, ENVOIS, FACTURES_ENVOIS } from "../donnees/lot-emails-envoyes.mjs";

const ORG = id(COMPTES_ENVOIS.proprietaire.organisation);
const url = (envoi) => `/dashboard/emails-envoyes/${id(envoi)}`;
const INTROUVABLE = "Cet envoi est introuvable ou vous n'y avez pas accès.";

const LIRE_ENVOI = `query($id: ID!){ documentEmailLog(id:$id){ id subject to html attachments{ filename available } } }`;
const LIRE_ENVOIS = `query($w: ID!,$t: String!,$d: ID!){ documentEmailLogs(workspaceId:$w,documentType:$t,documentId:$d){ id subject } }`;

// Refus de la requête de la page : journalisé en console par le client GraphQL du site.
const CONSOLE_REFUS = /GraphQL Error\] Opération: DocumentEmailLog/;
// Message piégé : l'image vise une adresse du site qui n'existe pas, et
// Chrome signale le script bloqué par le cadre isolé (c'est l'effet voulu).
const CONSOLE_PIEGE = /x-email-piege|Blocked script execution in 'about:srcdoc'/;

/** Fichier joint servi par le proxy du site (session du navigateur). */
const fichierJoint = (page, envoi, index) =>
  page.request.get(`/api/document-preview/emailAttachment/${id(envoi)}?index=${index}`, { maxRedirects: 0 });

/* --- Propriétaire --------------------------------------------------------- */

test.describe("E-mails envoyés : page de l'envoi", () => {
  test.use({ storageState: connecte(COMPTES_ENVOIS.proprietaire.token), erreursConsoleAutorisees: CONSOLE_PIEGE });

  test("Affiche l'e-mail reçu : objet, destinataires, suivi et pièces jointes", async ({ page }) => {
    await ouvrir(page, url(ENVOIS.facture), { pret: page.getByRole("heading", { name: "E-mail envoyé", level: 1 }) });
    const infos = page.locator("aside");
    await etape(
      page,
      "Enveloppe et parcours de l'envoi",
      async () => {
        await expect(page.getByText(/Facture F-2026-0101 · le /)).toBeVisible();
        await expect(infos.getByText(ENVOIS.facture.subject)).toBeVisible();
        await expect(infos.getByText("zoe@obrien.test", { exact: true })).toBeVisible();
        await expect(infos.getByText("compta@obrien.test", { exact: true })).toBeVisible();
        await expect(infos.getByText("facturation@envois.test", { exact: true })).toBeVisible();
        await expect(infos.getByText("Remis", { exact: true })).toBeVisible();
        await expect(infos.getByText("Pas encore")).toBeVisible();
        await expect(infos.getByText("Envoyé depuis Newbi par envois@e2e.test")).toBeVisible();
      },
      { capture: "ecran" },
    );
    await etape(page, "Pièces jointes : le PDF du document et le fichier conservé s'ouvrent, l'ancien fichier non", async () => {
      await expect(infos.getByRole("link", { name: /F-2026-0101\.pdf/ })).toHaveAttribute(
        "href",
        `/api/document-preview/invoice/${id(FACTURES_ENVOIS.apercu)}`,
      );
      await expect(infos.getByRole("link", { name: /page\.html/ })).toHaveAttribute(
        "href",
        `/api/document-preview/emailAttachment/${id(ENVOIS.facture)}?index=1`,
      );
      await expect(infos.getByText("ancien-contrat.docx")).toBeVisible();
      await expect(infos.getByRole("link", { name: /ancien-contrat\.docx/ })).toHaveCount(0);
      await expect(infos.getByText(/n'ont pas été conservés : seul leur nom est affiché/)).toBeVisible();
    });
    await expect(page.getByRole("button", { name: "Ouvrir la facture" })).toBeVisible();
  });

  test("Le message personnalisé piégé s'affiche sans exécuter de script (cadre isolé)", async ({ page }) => {
    await ouvrir(page, url(ENVOIS.facture), { pret: page.getByRole("heading", { name: "E-mail envoyé", level: 1 }) });
    const cadre = page.locator('iframe[title="E-mail reçu par le client"]');
    await etape(
      page,
      "Le texte du message est lu dans le cadre",
      () => expect(page.frameLocator('iframe[title="E-mail reçu par le client"]').getByText(/Bonjour, voici votre facture F-2026-0101/)).toBeVisible(),
      { capture: "ecran" },
    );
    await expect(cadre, "Le cadre doit interdire les scripts (sandbox sans allow-scripts)").toHaveAttribute("sandbox", "allow-same-origin");
    await page.waitForTimeout(1_000);
    expect(await page.evaluate(() => window.__xssEmail ?? null), "Le script du message s'est exécuté sur la page").toBeNull();
  });

  test("Un document envoyé deux fois propose « Envoi 1 » et « Envoi 2 », avec l'état de chacun", async ({ page }) => {
    await ouvrir(page, url(ENVOIS.facture), { pret: page.getByRole("navigation", { name: "Envois de ce document" }) });
    const envois = page.getByRole("navigation", { name: "Envois de ce document" });
    await expect(envois.getByRole("button", { name: /^Envoi \d/ })).toHaveCount(2);
    await expect(envois.getByRole("button", { name: /^Envoi 1/ })).toHaveAttribute("aria-current", "true");
    await etape(
      page,
      "Afficher le second envoi (non remis)",
      async () => {
        await cliquer(page, envois.getByRole("button", { name: /^Envoi 2/ }));
        await expect(page.locator("aside").getByText(ENVOIS.factureRenvoi.subject)).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText("Non remis à direction@obrien.test : Adresse inexistante.", { exact: false })).toBeVisible();
      },
      { capture: "ecran" },
    );
    await expect(envois.getByRole("button", { name: /^Envoi 2/ })).toHaveAttribute("aria-current", "true");
  });

  test("Pièces jointes : un fichier non conservé ou une place inconnue renvoient 404", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const ancien = await fichierJoint(page, ENVOIS.facture, 2);
    expect(ancien.status(), "Fichier dont seul le nom a été gardé").toBe(404);
    const inconnu = await fichierJoint(page, ENVOIS.facture, 9);
    expect(inconnu.status(), "Place inconnue dans la liste des pièces jointes").toBe(404);
    const invalide = await page.request.get(`/api/document-preview/emailAttachment/${id(ENVOIS.facture)}?index=-1`);
    expect(invalide.status(), "Place invalide").toBe(400);
  });
});

/* --- Données des autres ---------------------------------------------------- */

test.describe("E-mails envoyés : l'envoi d'une autre entreprise reste introuvable", () => {
  test.use({ storageState: connecte(COMPTES_ENVOIS.proprietaire.token), erreursConsoleAutorisees: CONSOLE_REFUS });

  test("Ouvrir l'envoi d'une autre entreprise : introuvable, rien de son contenu affiché", async ({ page }) => {
    await ouvrir(page, url(ENVOIS.autreEspace), { pret: page.getByText(INTROUVABLE) });
    await expect(page.getByText(ENVOIS.autreEspace.subject)).toHaveCount(0);
    const reponse = await appelApi(page, LIRE_ENVOI, { id: id(ENVOIS.autreEspace) });
    sansFuite(reponse, [ENVOIS.autreEspace.subject, "F-AUTRE-0001"], "Envoi d'une autre entreprise");
    verifierRefus(reponse, "documentEmailLog", "Envoi d'une autre entreprise");
  });

  test("Identifiant inconnu ou mal formé : introuvable", async ({ page }) => {
    await ouvrir(page, "/dashboard/emails-envoyes/e2e6ba0000000000000000ff", { pret: page.getByText(INTROUVABLE) });
    await ouvrir(page, "/dashboard/emails-envoyes/pas-un-identifiant", { pret: page.getByText(INTROUVABLE) });
  });
});

test.describe("E-mails envoyés : une autre entreprise n'atteint rien", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS), erreursConsoleAutorisees: CONSOLE_REFUS });

  test("Page, envoi, historique et pièces jointes des autres : refusés", async ({ page }) => {
    await etape(page, "La page reste introuvable", async () => {
      await ouvrir(page, url(ENVOIS.facture), { pret: page.getByText(INTROUVABLE) });
      await expect(page.getByText(ENVOIS.facture.subject)).toHaveCount(0);
    });
    await etape(page, "L'API ne renvoie ni l'envoi ni l'historique", async () => {
      const envoi = await appelApi(page, LIRE_ENVOI, { id: id(ENVOIS.facture) });
      sansFuite(envoi, [ENVOIS.facture.subject, "zoe@obrien.test", "Bonjour, voici votre facture"], "Envoi des autres");
      verifierRefus(envoi, "documentEmailLog", "Envoi des autres");
      const historique = await appelApi(page, LIRE_ENVOIS, { w: ORG, t: "invoice", d: id(FACTURES_ENVOIS.apercu) }, { organisation: ORG });
      sansFuite(historique, [ENVOIS.facture.subject, "zoe@obrien.test"], "Historique des autres");
      verifierRefus(historique, "documentEmailLogs", "Historique des autres");
    });
    await etape(page, "Le fichier joint n'est pas servi", async () => {
      const fichier = await fichierJoint(page, ENVOIS.facture, 1);
      expect(fichier.status(), "Fichier joint d'un envoi des autres").toBe(403);
    });
  });
});

/* --- Rôles ------------------------------------------------------------------ */

test.describe("E-mails envoyés : le rôle « Membre » lit l'envoi d'une facture", () => {
  test.use({ storageState: connecte(MEMBRES_ENVOIS.membre.token), erreursConsoleAutorisees: CONSOLE_PIEGE });

  test("Page de l'envoi affichée au Membre (« Voir » des factures)", async ({ page }) => {
    await ouvrir(page, url(ENVOIS.facture), { pret: page.getByRole("heading", { name: "E-mail envoyé", level: 1 }) });
    await expect(page.locator("aside").getByText(ENVOIS.facture.subject)).toBeVisible();
  });
});

test.describe("E-mails envoyés : un rôle sans les factures ne lit pas l'envoi d'une facture", () => {
  test.use({ storageState: connecte(MEMBRES_ENVOIS.devisSeulement.token), erreursConsoleAutorisees: /GraphQL Error/ });

  test("Envoi d'une facture : introuvable à l'écran, refusé à l'API, fichier joint refusé", async ({ page }) => {
    await ouvrir(page, url(ENVOIS.facture), { pret: page.getByText(INTROUVABLE) });
    await expect(page.getByText(ENVOIS.facture.subject)).toHaveCount(0);
    const envoi = await appelApi(page, LIRE_ENVOI, { id: id(ENVOIS.facture) });
    sansFuite(envoi, [ENVOIS.facture.subject, "Bonjour, voici votre facture"], "Envoi d'une facture (rôle sans factures)");
    verifierRefus(envoi, "documentEmailLog", "Envoi d'une facture (rôle sans factures)");
    const historique = await appelApi(page, LIRE_ENVOIS, { w: ORG, t: "invoice", d: id(FACTURES_ENVOIS.apercu) }, { organisation: ORG });
    verifierRefus(historique, "documentEmailLogs", "Historique d'une facture (rôle sans factures)");
    const fichier = await fichierJoint(page, ENVOIS.facture, 1);
    expect(fichier.status(), "Fichier joint à l'envoi d'une facture (rôle sans factures)").toBe(403);
  });

  test("Envoi d'un devis : affiché (« Voir » des devis)", async ({ page }) => {
    await ouvrir(page, url(ENVOIS.devis), { pret: page.getByRole("heading", { name: "E-mail envoyé", level: 1 }) });
    await expect(page.locator("aside").getByText(ENVOIS.devis.subject)).toBeVisible();
    await expect(page.getByRole("button", { name: "Ouvrir le devis" })).toBeVisible();
  });
});

/* --- Sans session ----------------------------------------------------------- */

test.describe("E-mails envoyés : sans session, rien", () => {
  test.use({ storageState: { cookies: [], origins: [] }, erreursConsoleAutorisees: /401.*\/api\/auth\/token/ });

  test("Envoi et fichier joint refusés sans session", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    const envoi = await appelApi(page, LIRE_ENVOI, { id: id(ENVOIS.facture) });
    expect(envoi.data?.documentEmailLog ?? null, "Envoi renvoyé sans session").toBeNull();
    sansFuite(envoi, [ENVOIS.facture.subject], "Envoi sans session");
    const fichier = await fichierJoint(page, ENVOIS.facture, 1);
    expect(fichier.status(), "Fichier joint sans session").toBe(401);
  });
});
