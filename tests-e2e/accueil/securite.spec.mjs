/**
 * Accueil : droits vérifiés à l'API. Chaque lecture de l'accueil (cadre du
 * mois, solde, flux, compteurs « À traiter », dernières factures et
 * transactions, notifications) appelée directement :
 *   - Membre (lecture seule) et Éditeur : permis (l'accueil complet leur est ouvert) ;
 *   - intrus (autre entreprise) : refus en visant « Pilotage », et rien de
 *     « Pilotage » en visant depuis son espace avec l'identifiant de « Pilotage » ;
 *   - visiteur sans session : rien.
 * Les notifications sont personnelles : un autre membre ne lit ni ne
 * modifie celles du propriétaire. Un texte piégé (nom de client, titre de
 * notification) s'affiche comme du texte.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { appelApi, verifierRefus, id } from "../securite.mjs";
import { connecte, SESSION_TOKEN_INTRUS, SESSION_TOKEN_PILOTAGE, SESSION_TOKEN_PILOTAGE_EDITEUR, SESSION_TOKEN_PILOTAGE_MEMBRE } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { CONTACTS_PILOTAGE, FACTURES_PILOTAGE, NOTIFICATIONS_PILOTAGE, TRANSACTIONS_PILOTAGE, COMPTE_BANCAIRE_PILOTAGE } from "../donnees/lot-pilotage.mjs";
import { ouvrirAccueil, carte } from "./outils-accueil.mjs";

const ORG = id(COMPTES.pilotage.organisation);
const ORG_INTRUS = id(COMPTES.intrus.organisation);

/**
 * Lectures de l'accueil. `personnel` : la réponse ne dépend que de
 * l'utilisateur connecté (notifications) ; on vérifie alors qu'elle ne
 * contient rien de « Pilotage », sans exiger un refus.
 */
const LECTURES = [
  { nom: "Cadre du mois", champ: "dashboardBillingMonth", requete: `query($w: ID!) { dashboardBillingMonth(workspaceId: $w) { month sales { total pending overdue } purchases { total pending overdue } } }` },
  { nom: "Solde et flux", champ: "dashboardSummary", requete: `query($w: ID!) { dashboardSummary(workspaceId: $w) { totalIncome totalExpenses bankBalance transactionCount } }` },
  { nom: "Courbe de trésorerie", champ: "dashboardTreasuryChart", requete: `query($w: ID!) { dashboardTreasuryChart(workspaceId: $w, period: { preset: "cumul-year" }) { totalIncome totalExpenses endBalance } }` },
  { nom: "Entrées par catégorie", champ: "dashboardCategoryAggregation", requete: `query($w: ID!) { dashboardCategoryAggregation(workspaceId: $w, type: "income", period: { preset: "cumul-year" }) { categories { name amount } } }` },
  { nom: "Statistiques des achats", champ: "purchaseInvoiceStats", requete: `query($w: ID!) { purchaseInvoiceStats(workspaceId: $w) { totalToPayCount totalUnpaid } }` },
  { nom: "Devis en attente", champ: "quoteBalances", requete: `query($w: ID!) { quoteBalances(workspaceId: $w) { pendingCount pendingAmount } }` },
  { nom: "Rapprochements à faire", champ: "reconciliationSuggestions", requete: `query($w: ID!) { reconciliationSuggestions(workspaceId: $w) { unmatchedCount } }` },
  { nom: "Comptes bancaires", champ: "bankingAccounts", requete: `query($w: ID!) { bankingAccounts(workspaceId: $w) { id name balance { current } } }` },
  { nom: "Dernières transactions", champ: "transactions", requete: `query($w: ID!) { transactions(workspaceId: $w, limit: 5) { id amount description } }` },
  { nom: "Dernières factures", champ: "invoices", requete: `query($w: ID!) { invoices(workspaceId: $w, page: 1, limit: 5) { invoices { id number client { name } } } }` },
  { nom: "Notifications", champ: "getNotifications", personnel: true, requete: `query($w: ID!) { getNotifications(workspaceId: $w) { notifications { id title } unreadCount } }` },
  { nom: "Notifications non lues", champ: "getUnreadNotificationsCount", personnel: true, requete: `query($w: ID!) { getUnreadNotificationsCount(workspaceId: $w) }` },
];

/** Une réponse ne contient rien de « Pilotage » (identifiants, noms, montants caractéristiques). */
function sansFuite(reponse, contexte) {
  const texte = JSON.stringify(reponse.data ?? {});
  for (const [quoi, valeur] of [
    ["une facture", id(FACTURES_PILOTAGE.aEncaisser)],
    ["un client", CONTACTS_PILOTAGE.pilote.name],
    ["le compte bancaire", id(COMPTE_BANCAIRE_PILOTAGE)],
    ["le nom du compte", COMPTE_BANCAIRE_PILOTAGE.name],
    ["une transaction", id(TRANSACTIONS_PILOTAGE.aRapprocher)],
    ["une notification", id(NOTIFICATIONS_PILOTAGE.nonLue)],
    ["le solde", "12550"],
  ]) {
    expect(texte, `${contexte} : ${quoi} de « Pilotage » renvoyé (${valeur})`).not.toContain(valeur);
  }
}

for (const [role, token] of [
  ["Membre (lecture seule)", SESSION_TOKEN_PILOTAGE_MEMBRE],
  ["Éditeur", SESSION_TOKEN_PILOTAGE_EDITEUR],
]) {
  test.describe(`Accueil : le rôle « ${role} » lit tout l'accueil`, () => {
    test.use({ storageState: connecte(token) });
    test("Chaque lecture de l'accueil répond", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      for (const l of LECTURES) {
        const reponse = await appelApi(page, l.requete, { w: ORG }, { organisation: ORG });
        expect.soft(reponse.errors, `${l.nom} : refusé au rôle « ${role} »`).toEqual([]);
        expect.soft(reponse.data?.[l.champ], `${l.nom} : rien renvoyé`).not.toBeUndefined();
      }
    });
  });
}

test.describe("Accueil : une autre entreprise n'atteint rien", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });
  test.beforeEach(async ({ page }) => {
    await ouvrir(page, "/dashboard");
  });

  for (const l of LECTURES) {
    test(`« ${l.nom} » de « Pilotage » : refusé`, async ({ page }) => {
      await etape(page, "En visant leur organisation", async () => {
        const reponse = await appelApi(page, l.requete, { w: ORG }, { organisation: ORG });
        sansFuite(reponse, `${l.nom} (organisation des autres)`);
        if (!l.personnel) verifierRefus(reponse, l.champ, `${l.nom} (organisation des autres)`);
      });
      await etape(page, "Depuis sa propre organisation, avec l'identifiant de « Pilotage »", async () => {
        const reponse = await appelApi(page, l.requete, { w: ORG }, { organisation: ORG_INTRUS });
        sansFuite(reponse, `${l.nom} (depuis son organisation)`);
      });
    });
  }
});

test.describe("Accueil : sans session, rien", () => {
  test.use({ storageState: { cookies: [], origins: [] }, erreursConsoleAutorisees: /401.*\/api\/auth\/token/ });

  test("Lectures refusées", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    for (const l of LECTURES) {
      const reponse = await appelApi(page, l.requete, { w: ORG }, { organisation: ORG });
      expect.soft(reponse.data?.[l.champ] ?? null, `${l.nom} : renvoyé sans session`).toBeNull();
    }
  });

  test("L'accueil renvoie vers la connexion", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe("Accueil : les notifications sont personnelles", () => {
  const MARQUER = `mutation($id: ID!) { markNotificationAsRead(id: $id) { success } }`;
  const TOUT_MARQUER = `mutation($w: ID!) { markAllNotificationsAsRead(workspaceId: $w) { success } }`;
  const SUPPRIMER = `mutation($id: ID!) { deleteNotification(id: $id) { success } }`;
  const etat = async () =>
    JSON.stringify(
      await (await base())
        .collection("notifications")
        .find({ userId: COMPTES.pilotage.utilisateur._id })
        .sort({ _id: 1 })
        .project({ read: 1 })
        .toArray(),
    );

  for (const [qui, token, organisation] of [
    ["Éditeur de « Pilotage »", SESSION_TOKEN_PILOTAGE_EDITEUR, ORG],
    ["Membre de « Pilotage »", SESSION_TOKEN_PILOTAGE_MEMBRE, ORG],
    ["intrus", SESSION_TOKEN_INTRUS, ORG_INTRUS],
  ]) {
    test.describe(() => {
      test.use({ storageState: connecte(token) });
      test(`${qui} : ne lit, ne marque ni ne supprime les notifications du propriétaire`, async ({ page }) => {
        await ouvrir(page, "/dashboard");
        const avant = await etat();
        const liste = await appelApi(page, `query($w: ID!) { getNotifications(workspaceId: $w) { notifications { id title } } }`, { w: ORG }, { organisation });
        expect(JSON.stringify(liste.data ?? {}), "Notification du propriétaire renvoyée à un autre").not.toContain(id(NOTIFICATIONS_PILOTAGE.nonLue));
        await appelApi(page, MARQUER, { id: id(NOTIFICATIONS_PILOTAGE.nonLue) }, { organisation });
        await appelApi(page, TOUT_MARQUER, { w: ORG }, { organisation });
        await appelApi(page, SUPPRIMER, { id: id(NOTIFICATIONS_PILOTAGE.piegee) }, { organisation });
        expect(await etat(), "Les notifications du propriétaire ont changé").toBe(avant);
      });
    });
  }
});

test.describe("Accueil : un texte piégé ne s'exécute jamais", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

  test("Nom de client piégé dans les dernières factures : affiché comme du texte", async ({ page }) => {
    await ouvrirAccueil(page);
    const zone = carte(page, "Factures de vente (HT)");
    await expect(zone.getByText(/Piège <img/).first(), "Le nom piégé doit s'afficher tel quel").toBeVisible();
    await page.waitForTimeout(1_000);
    expect(await page.evaluate(() => window.__piege ?? null), "Le code du nom de client s'est exécuté").toBeNull();
    expect(await zone.locator('img[src="x-piege"]').count(), "Le nom piégé a été inséré comme du HTML").toBe(0);
  });
});
