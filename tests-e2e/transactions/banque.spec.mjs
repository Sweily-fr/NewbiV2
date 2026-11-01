/**
 * Banques connectées : déconnexion (ce qui est gardé en base correspond au
 * message affiché), droits des routes bancaires de l'API appelées
 * directement avec un jeton (comme l'app mobile), nombre de banques de
 * l'offre tenu par l'API, reconnexion d'une banque dont l'accès a expiré
 * (SCA) et retour de Bridge. Bridge est injoignable en test : seules les
 * réponses données avant tout appel à Bridge sont vérifiées.
 */
import { test, expect, etape, fenetre } from "../outils.mjs";
import { ouvrir, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import {
  BASE_URL,
  connecte,
  SESSION_TOKEN_ACHATS,
  SESSION_TOKEN_BANQUE_ACHATS,
  SESSION_TOKEN_COMPTABLE_ACHATS,
  SESSION_TOKEN_EDITEUR_ACHATS,
  SESSION_TOKEN_FREELANCE_ACHATS,
  SESSION_TOKEN_INTRUS,
  SESSION_TOKEN_LECTEUR_ACHATS,
  SESSION_TOKEN_SAISIE_ACHATS,
} from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { BANQUE, COMPTE_BANCAIRE_EXPIRE, COMPTES_BANCAIRES, COMPTES_BANCAIRES_BANQUE, COMPTES_LOT, TRANSACTION_EXPIREE } from "../donnees/lot-achats-banque.mjs";
import { id } from "../securite.mjs";
import { ORG, ORG_INTRUS, appelRest, connecteAchats, photo } from "../achats-banque.mjs";
import { ouvrirParametres } from "../authentification/outils-auth.mjs";

const ESPACE_BANQUE = id(COMPTES_LOT.banque.organisation);
const ESPACE_FREELANCE = id(COMPTES.freelanceAchats.organisation);
const notification = (page, texte) => page.locator("[data-sonner-toast]").filter({ hasText: texte });

/** Tout ce qu'une déconnexion doit laisser en place dans « Banque Test ». */
const TEMOINS_BANQUE = [
  ["transactions", { workspaceId: ESPACE_BANQUE }],
  ["invoices", { _id: BANQUE.vente._id }],
  ["purchaseinvoices", { _id: BANQUE.achat._id }],
];
const photos = () => Promise.all(TEMOINS_BANQUE.map(photo));
const compteEnBase = async (compte) => (await base()).collection("accounts_bankings").findOne({ _id: compte._id });

test.describe("Banque : déconnecter garde les transactions et leurs justificatifs", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_BANQUE_ACHATS) });

  test("Déconnecter un compte puis « Tout supprimer » : comptes déconnectés, transactions, justificatifs, catégories, notes et rapprochements conservés", async ({ page }) => {
    const avant = await photos();
    const [justifiee] = [BANQUE.transactions.justifiee];

    await etape(page, "Corps { provider: \"manual\" } envoyé directement : rien n'est supprimé", async () => {
      await ouvrir(page, "/dashboard");
      const reponse = await appelRest(page, "POST", "/banking-connect/disconnect", { espace: ESPACE_BANQUE, corps: { provider: "manual" } });
      expect(reponse.statut, reponse.texte).toBe(200);
      expect(await photos(), "Des transactions ou des factures ont changé").toEqual(avant);
      expect((await compteEnBase(COMPTES_BANCAIRES_BANQUE.aDeconnecter)).status).toBe("active");
    });

    const contenu = await ouvrirParametres(page, "comptes-bancaires", { pret: (zone) => zone.getByText(COMPTES_BANCAIRES_BANQUE.aDeconnecter.name) });

    await etape(page, "« Déconnecter ce compte ? » annonce que les transactions sont conservées", async () => {
      const ligne = contenu.locator("div.group").filter({ hasText: COMPTES_BANCAIRES_BANQUE.aDeconnecter.name });
      await ligne.hover();
      await ligne.locator("button:has(svg.lucide-trash2)").click();
      const dialogue = fenetre(page, "Déconnecter ce compte ?");
      await expect(dialogue).toContainText("seront conservées");
      await dialogue.getByRole("button", { name: "Déconnecter" }).click();
      await expect(notification(page, "Compte bancaire déconnecté")).toBeVisible();
    }, { capture: "ecran" });

    await etape(page, "En base : le compte est déconnecté, l'autre banque reste active, les transactions n'ont pas bougé", async () => {
      await expect.poll(async () => (await compteEnBase(COMPTES_BANCAIRES_BANQUE.aDeconnecter)).status).toBe("disconnected");
      expect((await compteEnBase(COMPTES_BANCAIRES_BANQUE.restant)).status).toBe("active");
      const apres = await photos();
      expect(apres[0], "Transactions modifiées par la déconnexion (supprimées, justificatifs, catégories, notes ou liens perdus)").toBe(avant[0]);
      expect(apres[1], "La facture de vente rapprochée a changé").toBe(avant[1]);
      expect(apres[2], "La facture d'achat rapprochée a changé").toBe(avant[2]);
      const doc = await (await base()).collection("transactions").findOne({ _id: justifiee._id });
      expect({ justificatifs: doc.receiptFiles.length, categorie: doc.category, manuelle: doc.categoryIsManual, note: doc.metadata?.notes }).toEqual({
        justificatifs: 1,
        categorie: "bureau",
        manuelle: true,
        note: "Note conservée à la déconnexion",
      });
    });

    await etape(page, "« Tout supprimer » : la dernière banque est déconnectée, les transactions restent", async () => {
      await contenu.getByRole("button", { name: "Tout supprimer" }).click();
      const dialogue = fenetre(page, "Supprimer tous les comptes bancaires ?");
      await expect(dialogue).toContainText("conservées");
      await expect(dialogue, "Tiret cadratin dans le texte de la confirmation").not.toContainText("—");
      await dialogue.getByRole("button", { name: "Tout supprimer" }).click();
      await expect(notification(page, "Tous les comptes bancaires ont été supprimés")).toBeVisible();
      await expect.poll(async () => (await compteEnBase(COMPTES_BANCAIRES_BANQUE.restant)).status).toBe("disconnected");
      expect(await photos(), "Transactions ou factures modifiées par « Tout supprimer »").toEqual(avant);
    }, { capture: "ecran" });

    await etape(page, "Les transactions restent affichées dans la page Transactions", async () => {
      await ouvrir(page, `/dashboard/outils/transactions`, { pret: page.getByRole("tab", { name: /^Toutes/ }) });
      await attendreCalme(page);
      await expect(page.getByText(/papeterie/i).first(), "La transaction d'un compte déconnecté n'est plus listée").toBeVisible();
    });
  });
});

/**
 * Droits des routes bancaires appelées directement (jeton de la session) :
 * seul un rôle qui gère les applications et banques peut connecter,
 * reconnecter ou déconnecter une banque ; personne n'agit sur un autre espace.
 */
const ROUTES_GESTION = [
  ["Déconnecter une banque", "POST", "/banking-connect/disconnect", { accountId: id(COMPTES_BANCAIRES.achats) }],
  ["Connecter une banque", "GET", "/banking-connect/bridge/connect"],
  ["Reconnecter une banque (SCA)", "GET", "/banking-connect/bridge/reconnect?itemId=123456"],
  ["Supprimer l'accès bancaire de l'espace", "DELETE", "/banking/user"],
];
const TEMOINS_ACHATS = [
  ["accounts_bankings", { workspaceId: ORG }],
  ["transactions", { workspaceId: ORG }],
];

async function refusSansEffet(page, [nom, methode, chemin, corps], { espace = ORG, statuts = [403], jeton } = {}) {
  const avant = await Promise.all(TEMOINS_ACHATS.map(photo));
  const reponse = await appelRest(page, methode, chemin, { espace, corps, jeton });
  expect.soft(await Promise.all(TEMOINS_ACHATS.map(photo)), `${nom} : les comptes ou les transactions d'« Achats » ont changé`).toEqual(avant);
  expect(statuts, `${nom} : réponse ${reponse.statut} ${reponse.texte.slice(0, 200)}`).toContain(reponse.statut);
}

for (const [role, token] of [
  ["Membre", SESSION_TOKEN_LECTEUR_ACHATS],
  ["Éditeur", SESSION_TOKEN_EDITEUR_ACHATS],
  ["Comptable", SESSION_TOKEN_COMPTABLE_ACHATS],
]) {
  test.describe(`Banque : routes de l'API refusées au rôle « ${role} »`, () => {
    test.use({ storageState: connecte(token) });

    for (const route of ROUTES_GESTION) {
      test(`${route[0]} : refusé (403), rien ne change`, async ({ page }) => {
        await ouvrir(page, "/dashboard");
        await refusSansEffet(page, route);
      });
    }
  });
}

test.describe("Banque : routes de l'API refusées au Membre (synchronisation)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_LECTEUR_ACHATS) });

  test("Synchroniser toutes les transactions : refusé (403)", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await refusSansEffet(page, ["Synchroniser toutes les transactions", "POST", "/banking-sync/full", {}]);
  });
});

test.describe("Banque : une autre entreprise n'atteint rien par les routes de l'API", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_INTRUS) });

  for (const route of [...ROUTES_GESTION, ["Synchroniser toutes les transactions", "POST", "/banking-sync/full", {}], ["Vider le cache bancaire", "POST", "/banking-cache/invalidate", {}], ["Lire les comptes", "GET", "/banking/accounts"], ["Lire les transactions", "GET", "/banking/transactions"]]) {
    test(`${route[0]} en visant « Achats » : refusé (403)`, async ({ page }) => {
      await ouvrir(page, "/dashboard");
      await refusSansEffet(page, route);
    });
  }

  test("Déconnecter le compte d'« Achats » depuis son propre espace : compte introuvable, rien ne change", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await refusSansEffet(page, ["Déconnecter le compte des autres", "POST", "/banking-connect/disconnect", { accountId: id(COMPTES_BANCAIRES.achats) }], { espace: ORG_INTRUS, statuts: [404] });
    // Par la connexion (itemId) : l'appel ne touche que son propre espace.
    await refusSansEffet(page, ["Déconnecter la connexion des autres", "POST", "/banking-connect/disconnect", { itemId: "e2e-compte-1" }], { espace: ORG_INTRUS, statuts: [200, 400, 403, 404] });
    expect((await compteEnBase(COMPTES_BANCAIRES.achats)).status).toBe("active");
  });

  test("Comptes d'« Achats » avec son propre espace en en-tête et le leur en paramètre : rien des autres", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelRest(page, "GET", `/banking/accounts?workspaceId=${ORG}`, { espace: ORG_INTRUS });
    expect(reponse.texte, "Le compte d'« Achats » est renvoyé à une autre entreprise").not.toContain(COMPTES_BANCAIRES.achats.iban);
  });
});

test.describe("Banque : sans session, les routes de l'API refusent tout", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Gestion, synchronisation et lecture sans jeton : 401, rien ne change", async ({ page }) => {
    for (const route of [...ROUTES_GESTION, ["Synchroniser toutes les transactions", "POST", "/banking-sync/full", {}], ["Lire les comptes", "GET", "/banking/accounts"]]) {
      await refusSansEffet(page, route, { jeton: null, statuts: [401] });
    }
  });
});

test.describe("Banque : nombre de banques de l'offre tenu par l'API", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FREELANCE_ACHATS) });

  for (const [nom, chemin] of [
    ["depuis le site", "/banking-connect/bridge/connect"],
    ["depuis l'app mobile", "/banking-connect/bridge/connect?source=mobile"],
  ]) {
    test(`Offre d'entrée avec une banque connectée : une deuxième refusée ${nom} (403, avec la limite)`, async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const reponse = await appelRest(page, "GET", chemin, { espace: ESPACE_FREELANCE });
      expect(reponse.statut, reponse.texte.slice(0, 300)).toBe(403);
      expect(reponse.corps?.connectUrl ?? null, "Une adresse de connexion Bridge est renvoyée").toBeNull();
      expect(reponse.corps?.error || "").toMatch(/offre/i);
    });
  }
});

test.describe("Banque : reconnexion d'une banque et retour de Bridge", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_ACHATS) });

  test("Reconnexion avec un identifiant de connexion qui n'est pas un nombre : refusée (400)", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelRest(page, "GET", "/banking-connect/bridge/reconnect?itemId=12%26x%3D1", { espace: ORG });
    expect(reponse.statut, reponse.texte).toBe(400);
  });

  test("Retour de Bridge : l'identifiant de session ne peut pas ajouter de paramètre à l'adresse du site", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelRest(page, "GET", "/banking-connect/bridge/callback?session_id=x%26banking_error%3DCompte%2520suspendu", { jeton: null });
    expect([301, 302, 303, 307, 308]).toContain(reponse.statut);
    const destination = new URL(reponse.entetes.location, BASE_URL);
    expect(destination.searchParams.get("banking_error"), `Paramètre ajouté par l'identifiant de session : ${destination}`).toBeNull();
    expect(destination.searchParams.get("session_id")).toBe("x&banking_error=Compte%20suspendu");
  });
});

/** Statut simulé : une connexion dont la revalidation forte (SCA) a expiré. */
async function simulerSca(page) {
  await page.route("**/api/banking-connect/status**", (route) =>
    route.fulfill({
      status: 200,
      json: { isConnected: true, provider: "bridge", accountsCount: 1, hasAccounts: true, itemsNeedingAction: [{ itemId: "7001", status: 1010, bankName: "Banque Test" }], lastSync: null, bridge: null },
    }),
  );
}
const banniere = (page) => page.getByText("La connexion à Banque Test a expiré").filter({ visible: true }).first();

test.describe("Banque : bannière de reconnexion (SCA expirée)", () => {
  test.describe("propriétaire", () => {
    test.use({ storageState: connecteAchats(SESSION_TOKEN_ACHATS) });

    test("La bannière s'affiche et « Reconnecter ma banque » demande la reconnexion de cette connexion", async ({ page }) => {
      await simulerSca(page);
      let demande = null;
      await page.route("**/api/banking-connect/bridge/reconnect**", (route) => {
        demande = new URL(route.request().url());
        return route.fulfill({ status: 200, json: { connectUrl: `${BASE_URL}/dashboard?banque=reconnexion`, provider: "bridge" } });
      });
      await ouvrir(page, "/dashboard/outils/transactions", { pret: banniere(page) });
      await page.getByRole("button", { name: "Reconnecter ma banque" }).filter({ visible: true }).first().click();
      await expect(page).toHaveURL(/banque=reconnexion/);
      expect(demande?.searchParams.get("itemId")).toBe("7001");
    });
  });

  for (const [role, token] of [
    ["Membre", SESSION_TOKEN_LECTEUR_ACHATS],
    ["Comptable", SESSION_TOKEN_COMPTABLE_ACHATS],
  ]) {
    test.describe(role, () => {
      test.use({ storageState: connecteAchats(token) });

      test(`« Reconnecter ma banque » n'est pas proposé au ${role} (droit réservé à la gestion des banques)`, async ({ page }) => {
        await simulerSca(page);
        await ouvrir(page, "/dashboard/outils/transactions", { pret: banniere(page) });
        await attendreCalme(page);
        await expect(page.getByRole("button", { name: /Reconnecter/ }).filter({ visible: true })).toHaveCount(0);
      });
    });
  }
});


test.describe("Banque : déconnexion sans abonnement actif", () => {
  // Propriétaire de « Saisie Achats », aussi propriétaire d'« Achats Expiré » (abonnement échu).
  test.use({ storageState: connecte(SESSION_TOKEN_SAISIE_ACHATS) });

  test("Espace à l'abonnement échu : le propriétaire déconnecte sa banque depuis le site, ses transactions restent", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const transaction = ["transactions", { _id: TRANSACTION_EXPIREE._id }];
    const avant = await photo(transaction);
    const reponse = await page.request.post(`${BASE_URL}/api/banking-connect/disconnect`, {
      headers: { "x-workspace-id": id(COMPTES_LOT.expire.organisation), "content-type": "application/json" },
      data: { accountId: id(COMPTE_BANCAIRE_EXPIRE) },
      failOnStatusCode: false,
    });
    expect(reponse.status(), `Déconnexion refusée : ${await reponse.text()}`).toBe(200);
    expect((await compteEnBase(COMPTE_BANCAIRE_EXPIRE)).status).toBe("disconnected");
    expect(await photo(transaction)).toBe(avant);
  });
});
