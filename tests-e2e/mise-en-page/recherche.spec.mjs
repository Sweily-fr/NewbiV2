/**
 * Recherche globale (Ctrl+K, ou « Recherche » dans la barre latérale) :
 * résultats de l'espace actif seulement, numéro de facture écrit comme
 * ailleurs (préfixe, tiret, numéro) et retrouvable tel quel, texte piégé
 * affiché comme du texte, actions de création réservées aux rôles qui créent.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { connecte, sessionCookie, SESSION_TOKEN_INTRUS, SESSION_TOKEN_PILOTAGE, SESSION_TOKEN_PILOTAGE_MEMBRE } from "../config.mjs";
import { AVOIRS_PILOTAGE, BONS_COMMANDE_PILOTAGE, BONS_LIVRAISON_PILOTAGE, CONTACTS_PILOTAGE, DEVIS_PILOTAGE, FACTURES_PILOTAGE } from "../donnees/lot-pilotage.mjs";

const F = FACTURES_PILOTAGE.aEncaisser;
const REFERENCE = `${F.prefix}-${F.number}`;
const fenetreRecherche = (page) => page.getByRole("dialog").filter({ has: page.getByPlaceholder("Rechercher ou aller à...") });

async function ouvrirRecherche(page) {
  await ouvrir(page, "/dashboard");
  await page.keyboard.press("Control+k");
  await expect(page.getByPlaceholder("Rechercher ou aller à...")).toBeVisible();
}

/**
 * Saisit une recherche et attend la réponse de l'API à la requête nommée
 * (« GetClients », « GetInvoices »…). Renvoie la réponse (ou null si la
 * recherche n'a pas interrogé l'API) pour expliquer un résultat vide.
 */
async function rechercher(page, texte, operation = "GetClients") {
  const reponse = page
    .waitForResponse((r) => r.url().includes("/graphql") && (r.request().postData() || "").includes(operation), { timeout: 10_000 })
    .catch(() => null);
  await page.getByPlaceholder("Rechercher ou aller à...").fill(texte);
  const r = await reponse;
  await expect(fenetreRecherche(page).getByText("Recherche...")).toHaveCount(0, { timeout: 15_000 });
  await page.waitForTimeout(800);
  return r ? await r.json().catch(() => null) : null;
}

const groupe = (page, titre) => fenetreRecherche(page).locator("[cmdk-group]").filter({ has: page.locator("[cmdk-group-heading]", { hasText: titre }) });

test.describe("Recherche globale (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

  test("« Recherche » de la barre latérale ouvre la recherche", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await cliquer(page, page.locator("[data-slot=sidebar]").getByRole("link", { name: "Recherche" }));
    await expect(page.getByPlaceholder("Rechercher ou aller à...")).toBeVisible();
  });

  test("Un client trouvé par son nom, sans accents ni majuscules ; le choisir ouvre sa fiche", async ({ page }) => {
    await ouvrirRecherche(page);
    const reponse = await rechercher(page, "societe pilote");
    await etape(page, "Réponse de l'API", async () => {
      expect(reponse, "La recherche n'a pas interrogé l'API (aucune requête GetClients)").not.toBeNull();
      expect(JSON.stringify(reponse?.errors ?? []), "L'API a refusé la recherche").toBe("[]");
      expect(JSON.stringify(reponse?.data ?? {}), "L'API ne trouve pas « Société Pilote SAS » en cherchant « societe pilote »").toContain(CONTACTS_PILOTAGE.pilote.name);
    });
    const client = groupe(page, "Clients").getByRole("option", { name: new RegExp(CONTACTS_PILOTAGE.pilote.name) });
    await expect(client, "Trouvé par l'API mais pas affiché dans la recherche").toBeVisible();
    await client.click();
    await expect(page).toHaveURL(/\/dashboard\/clients\?id=/, { timeout: 30_000 });
  });

  test("Une facture trouvée par son numéro s'affiche avec son numéro complet (préfixe, tiret, numéro)", async ({ page }) => {
    await ouvrirRecherche(page);
    const reponse = await rechercher(page, F.number, "GetInvoices");
    expect(JSON.stringify(reponse?.data ?? {}), `L'API ne trouve pas la facture ${REFERENCE} en cherchant « ${F.number} »`).toContain(F.number);
    const factures = groupe(page, "Factures");
    await expect(factures).toBeVisible();
    await etape(page, "Numéro affiché", async () => expect(factures, `Attendu « ${REFERENCE} » (affiché collé : « ${F.prefix}${F.number} »)`).toContainText(REFERENCE), { capture: "ecran" });
  });

  test("Une facture retrouvée par son numéro complet, tel que la liste des factures l'affiche", async ({ page }) => {
    await ouvrirRecherche(page);
    await rechercher(page, REFERENCE, "GetInvoices");
    await etape(page, `Recherche de « ${REFERENCE} »`, async () => expect(groupe(page, "Factures"), `Aucun résultat pour « ${REFERENCE} »`).toBeVisible({ timeout: 5_000 }), { capture: "ecran" });
  });

  test("Nom de client piégé : affiché comme du texte dans les résultats, rien ne s'exécute", async ({ page }) => {
    await ouvrirRecherche(page);
    const reponse = await rechercher(page, "Piège");
    expect(JSON.stringify(reponse?.data ?? {}), "L'API ne trouve pas le client au nom piégé").toContain("Piège");
    await expect(fenetreRecherche(page).getByText(/Piège <img/).first()).toBeVisible();
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => window.__piege ?? null), "Le code du nom de client s'est exécuté").toBeNull();
  });

  test("Sans saisie : actions rapides de création proposées au propriétaire", async ({ page }) => {
    await ouvrirRecherche(page);
    await expect(groupe(page, "Actions rapides")).toContainText("Nouvelle facture");
  });
});

test.describe("Recherche globale (Membre, lecture seule)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE_MEMBRE) });

  test("Aucune action de création proposée", async ({ page }) => {
    await ouvrirRecherche(page);
    await expect(groupe(page, "Actions rapides")).toHaveCount(0);
    await expect(fenetreRecherche(page).getByRole("option", { name: /^Nouvelle facture$|^Nouveau devis$/ })).toHaveCount(0);
  });
});

test.describe("Recherche globale (autre entreprise)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });

  test("Ne trouve aucun client ni aucune facture de « Pilotage »", async ({ page }) => {
    await ouvrirRecherche(page);
    for (const texte of ["Pilote", F.number, "Piège"]) {
      await rechercher(page, texte);
      await expect.soft(fenetreRecherche(page), `« ${texte} » : résultat de « Pilotage »`).not.toContainText(CONTACTS_PILOTAGE.pilote.name);
      await expect.soft(fenetreRecherche(page), `« ${texte} »`).not.toContainText(`${F.prefix}`);
    }
  });
});

test.describe("Recherche globale : autres documents et saisies piégeuses (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

  for (const [type, doc, operation, groupeAttendu, url] of [
    ["Un devis", DEVIS_PILOTAGE.enAttente, "GetQuotes", "Devis", /\/dashboard\/outils\/devis\?id=/],
    ["Un bon de commande", BONS_COMMANDE_PILOTAGE.pilotage, "GetPurchaseOrders", "Bons de commande", /\/dashboard\/outils\/bons-commande\?id=/],
    ["Un bon de livraison", BONS_LIVRAISON_PILOTAGE.pilotage, "GetDeliveryNotes", "Bons de livraison", /\/dashboard\/outils\/bons-de-livraison\?id=/],
    ["Un avoir", AVOIRS_PILOTAGE.surPayee, "GetCreditNotes", "Avoirs", /\/dashboard\/outils\/factures\?avoir=/],
  ]) {
    test(`${type} retrouvé par son numéro ; le choisir l'ouvre`, async ({ page }) => {
      await ouvrirRecherche(page);
      const reponse = await rechercher(page, doc.number, operation);
      expect(JSON.stringify(reponse?.errors ?? []), "L'API a refusé la recherche").toBe("[]");
      const zone = groupe(page, groupeAttendu);
      await etape(page, `Groupe « ${groupeAttendu} »`, async () => expect(zone, `Aucun résultat « ${groupeAttendu} » pour « ${doc.number} »`).toBeVisible({ timeout: 5_000 }), { capture: "ecran" });
      await zone.getByRole("option").first().click();
      await expect(page).toHaveURL(url, { timeout: 30_000 });
    });
  }

  test("Saisies piégeuses ( * [ antislash, 300 caractères, espaces seuls : aucune erreur", async ({ page }) => {
    await ouvrirRecherche(page);
    for (const texte of ["(", "*", "[", "\\", "a(b", "x".repeat(300), "     "]) {
      const reponse = await rechercher(page, texte);
      expect.soft(JSON.stringify(reponse?.errors ?? []), `« ${texte.slice(0, 20)} » : refus de l'API`).toBe("[]");
      await expect.soft(page.locator("[data-sonner-toast][data-type=error]"), `« ${texte.slice(0, 20)} » : message d'erreur affiché`).toHaveCount(0);
    }
    await expect(page.getByPlaceholder("Rechercher ou aller à...")).toBeVisible();
  });
});

/**
 * « Récents » : un client ouvert depuis la recherche par le propriétaire de
 * « Pilotage » n'apparaît pas dans la recherche d'un autre compte qui se
 * connecte ensuite dans le même navigateur.
 */
test.describe("Recherche globale : récents propres à chaque espace", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

  test("Un autre compte dans le même navigateur ne voit pas les récents de « Pilotage »", async ({ page, context }) => {
    const nom = CONTACTS_PILOTAGE.pilote.name;
    await ouvrirRecherche(page);
    await rechercher(page, "societe pilote");
    await groupe(page, "Clients").getByRole("option", { name: new RegExp(nom) }).click();
    await expect(page).toHaveURL(/\/dashboard\/clients\?id=/, { timeout: 30_000 });
    await page.keyboard.press("Control+k");
    await etape(page, "Récents du propriétaire", async () => expect(groupe(page, "Récents"), "Le client ouvert n'apparaît pas dans les récents").toContainText(nom), { capture: "ecran" });
    await page.keyboard.press("Escape");

    await context.clearCookies();
    await context.addCookies([sessionCookie(SESSION_TOKEN_INTRUS)]);
    await ouvrirRecherche(page);
    await etape(page, "Récents de l'autre compte", async () => expect(fenetreRecherche(page), `« ${nom} » de « Pilotage » visible dans les récents d'un autre compte`).not.toContainText(nom), { capture: "ecran" });
  });
});
