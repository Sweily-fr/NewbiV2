/**
 * Espace gestionnaire : un cabinet n'atteint que les espaces de ses clients,
 * un client ne voit ni l'espace gestionnaire ni les autres clients du
 * cabinet, et personne d'autre n'y entre. Vérifié par les pages et par les
 * routes appelées directement (/api/gestionnaire/…, /api/invitations-gestionnaire/…),
 * comme le ferait quelqu'un qui contourne l'interface ; la base ne doit
 * jamais bouger après un refus.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { appelApi, verifierRefus, id } from "../securite.mjs";
import { connecte, SESSION_TOKEN_CABINET, SESSION_TOKEN_CLIENT_CABINET, SESSION_TOKEN_INTRUS, SESSION_TOKEN_PILOTAGE } from "../config.mjs";
import { COMPTES, MEMBRES } from "../donnees/base.mjs";
import { CABINET, ESPACES_LIBRES, FACTURE_ESPACE_LIBRE, FACTURES_BOULANGERIE, FACTURES_PILOTAGE, INVITATIONS, LIENS } from "../donnees/lot-pilotage.mjs";
import { photoGestion, REFUS_ROUTES, routeSite, ouvrirListe } from "./outils-gestionnaire.mjs";

const G = "/dashboard/gestionnaire";
const PAGES = ["", "/factures", "/devis", "/bons-commande", "/bons-de-livraison", "/avoirs", "/clients/inviter", "/clients/nouveau"];
const ORG_PILOTAGE = id(COMPTES.pilotage.organisation);
const ORG_BOULANGERIE = id(COMPTES.clientCabinet.organisation);
const ORG_LIBRE = id(ESPACES_LIBRES.traiteur);

/** Écritures de l'espace gestionnaire, appelées par quelqu'un qui n'en a pas le droit. */
const ECRITURES = [
  { nom: "Créer un client", methode: "POST", chemin: "/api/gestionnaire/clients", corps: { companyName: "Client pirate SARL", siret: "55210055400013", email: "pirate@e2e.test" } },
  { nom: "Inviter un client", methode: "POST", chemin: "/api/gestionnaire/invitations", corps: { email: MEMBRES.pilotageEditeur.utilisateur.email } },
  { nom: "Annuler une invitation du cabinet", methode: "DELETE", chemin: `/api/gestionnaire/invitations/${id(INVITATIONS.aAnnuler)}` },
  { nom: "Relancer une invitation du cabinet", methode: "POST", chemin: `/api/gestionnaire/invitations/${id(INVITATIONS.expiree)}/relancer` },
  { nom: "Renvoyer l'e-mail de bienvenue", methode: "POST", chemin: `/api/gestionnaire/clients/${id(LIENS.boulangerie)}/bienvenue` },
  { nom: "Changer le payeur d'un client", methode: "POST", chemin: `/api/gestionnaire/clients/${id(LIENS.boulangerie)}/payeur`, corps: { payer: "manager", plan: "pme", isAnnual: false } },
];
const LECTURES = [
  { nom: "Liste des clients du cabinet", chemin: "/api/gestionnaire/clients" },
  { nom: "Aperçu du payeur d'un client", chemin: `/api/gestionnaire/clients/${id(LIENS.boulangerie)}/payeur` },
  { nom: "Dépenses des clients", chemin: "/api/gestionnaire/depenses" },
];

for (const [qui, token, statutAttendu] of [
  ["Une entreprise qui n'est pas gestionnaire", SESSION_TOKEN_PILOTAGE, 403],
  ["Le client du cabinet", SESSION_TOKEN_CLIENT_CABINET, 403],
  ["Une autre entreprise (intrus)", SESSION_TOKEN_INTRUS, 403],
]) {
  test.describe(`Espace gestionnaire : ${qui} n'y entre pas`, () => {
    test.use({ storageState: connecte(token), erreursConsoleAutorisees: REFUS_ROUTES });

    test("Chaque page de l'espace renvoie à l'accueil", async ({ page }) => {
      for (const p of PAGES) {
        await page.goto(`${G}${p}`);
        await expect.soft(page, `${G}${p} doit renvoyer à l'accueil`).toHaveURL(/\/dashboard$/);
      }
    });

    test("Lectures des routes du cabinet refusées", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      for (const l of LECTURES) {
        const r = await routeSite(page, l.chemin);
        expect.soft(r.statut, `${l.nom} : statut ${r.statut} (${r.texte})`).toBe(statutAttendu);
        expect.soft(JSON.stringify(r.corps ?? {}), `${l.nom} : un client du cabinet est renvoyé`).not.toContain(ORG_BOULANGERIE);
      }
      const moi = await routeSite(page, "/api/gestionnaire/me");
      expect(moi.corps?.isManager, "/api/gestionnaire/me le présente comme gestionnaire").toBe(false);
    });

    for (const e of ECRITURES) {
      test(`${e.nom} : refusé, rien ne change`, async ({ page }) => {
        await ouvrir(page, "/dashboard");
        const avant = await photoGestion();
        const r = await routeSite(page, e.chemin, { method: e.methode, corps: e.corps });
        expect(r.statut, `Statut ${r.statut} (${r.texte})`).toBe(statutAttendu);
        expect(await photoGestion(), "La base a changé malgré le refus").toBe(avant);
      });
    }
  });
}

test.describe("Espace gestionnaire : sans session, rien", () => {
  test.use({ storageState: { cookies: [], origins: [] }, erreursConsoleAutorisees: REFUS_ROUTES });

  test("Les pages renvoient vers la connexion", async ({ page }) => {
    for (const p of PAGES) {
      await page.goto(`${G}${p}`);
      await expect.soft(page, `${G}${p}`).toHaveURL(/\/auth\/login/);
    }
  });

  test("Les routes refusent (401), rien ne change", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    const avant = await photoGestion();
    for (const l of [...LECTURES, { nom: "Moi", chemin: "/api/gestionnaire/me" }, { nom: "Invitations reçues", chemin: "/api/invitations-gestionnaire" }]) {
      const r = await routeSite(page, l.chemin);
      expect.soft(r.statut, `${l.nom} : statut ${r.statut}`).toBe(401);
    }
    for (const e of [...ECRITURES, { nom: "Accepter une invitation", methode: "POST", chemin: `/api/invitations-gestionnaire/${id(INVITATIONS.aAccepter)}`, corps: { action: "accept", organizationIds: [id(ESPACES_LIBRES.epicerie)] } }]) {
      const r = await routeSite(page, e.chemin, { method: e.methode, corps: e.corps });
      expect.soft(r.statut, `${e.nom} : statut ${r.statut}`).toBe(401);
    }
    expect(await photoGestion(), "La base a changé sans session").toBe(avant);
  });
});

test.describe("Espace gestionnaire : le cabinet n'atteint que ses clients", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_CABINET), erreursConsoleAutorisees: REFUS_ROUTES });

  test("Sa liste de clients : seulement ses fiches, jamais celles d'un autre cabinet", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const r = await routeSite(page, "/api/gestionnaire/clients");
    expect(r.statut).toBe(200);
    const recus = r.corps.clients.map((c) => c.id).sort();
    const attendus = (await (await base()).collection("managedclients").find({ managerId: CABINET._id, status: { $ne: "canceled" } }).toArray()).map((l) => String(l._id)).sort();
    expect(recus, "Fiches renvoyées au cabinet").toEqual(attendus);
    expect(JSON.stringify(r.corps), "L'invitation du cabinet fantôme est renvoyée").not.toContain(id(INVITATIONS.fantome));
    expect(JSON.stringify(r.corps), "Un espace libre (non confié) est renvoyé").not.toContain(ORG_LIBRE);
  });

  for (const [nom, methode, chemin] of [
    ["Retirer l'invitation d'un autre cabinet", "DELETE", `/api/gestionnaire/invitations/${id(INVITATIONS.fantome)}`],
    ["Relancer l'invitation d'un autre cabinet", "POST", `/api/gestionnaire/invitations/${id(INVITATIONS.fantome)}/relancer`],
    ["Renvoyer l'e-mail de bienvenue à un client qu'il n'a pas créé", "POST", `/api/gestionnaire/clients/${id(LIENS.pilotage)}/bienvenue`],
    ["Renvoyer l'e-mail de bienvenue sur la fiche d'un autre cabinet", "POST", `/api/gestionnaire/clients/${id(INVITATIONS.fantome)}/bienvenue`],
  ]) {
    test(`${nom} : refusé, rien ne change`, async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const avant = await photoGestion();
      const r = await routeSite(page, chemin, { method: methode });
      expect(r.statut, `Statut ${r.statut} (${r.texte})`).toBeGreaterThanOrEqual(400);
      expect(r.statut, `Statut ${r.statut} (${r.texte})`).toBeLessThan(500);
      expect(await photoGestion(), "La base a changé malgré le refus").toBe(avant);
    });
  }

  test("Factures d'un espace non confié : jamais dans ses listes, même en le demandant", async ({ page }) => {
    const reference = `${FACTURE_ESPACE_LIBRE.prefix}-${FACTURE_ESPACE_LIBRE.number}`;
    for (const url of [`${G}/factures`, `${G}/factures?dossier=${ORG_LIBRE}`, `${G}/factures?q=${encodeURIComponent(reference)}`]) {
      await ouvrirListe(page, url);
      await etape(page, url, async () => {
        await expect(page.locator("main table"), `${url} : la facture d'un espace non confié est listée`).not.toContainText(reference);
        await expect(page.locator("main table")).not.toContainText(ESPACES_LIBRES.traiteur.name);
      });
    }
    await expect(page.getByRole("combobox", { name: "Client" })).not.toContainText(ESPACES_LIBRES.traiteur.name);
  });

  test("GraphQL : aucun accès à un espace non confié", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const liste = await appelApi(page, `query($w: ID!) { invoices(workspaceId: $w, page: 1, limit: 50) { invoices { id number } } }`, { w: ORG_LIBRE }, { organisation: ORG_LIBRE });
    verifierRefus(liste, "invoices", "Factures d'un espace non confié");
    const une = await appelApi(page, `query($id: ID!, $w: ID!) { invoice(id: $id, workspaceId: $w) { id number } }`, { id: id(FACTURE_ESPACE_LIBRE), w: ORG_LIBRE }, { organisation: ORG_LIBRE });
    verifierRefus(une, "invoice", "Une facture d'un espace non confié");
    // Depuis l'espace d'un client, avec l'identifiant de la facture de l'espace non confié
    const detour = await appelApi(page, `query($id: ID!, $w: ID!) { invoice(id: $id, workspaceId: $w) { id number } }`, { id: id(FACTURE_ESPACE_LIBRE), w: ORG_BOULANGERIE }, { organisation: ORG_BOULANGERIE });
    expect(JSON.stringify(detour.data ?? {}), "Facture d'un espace non confié renvoyée depuis l'espace d'un client").not.toContain(id(FACTURE_ESPACE_LIBRE));
  });

  test("Chez ses clients, droits du Comptable : supprimer une facture est refusé", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const facture = FACTURES_PILOTAGE.brouillon;
    const avant = await (await base()).collection("invoices").findOne({ _id: facture._id });
    const r = await appelApi(page, `mutation($id: ID!, $w: ID!) { deleteInvoice(id: $id, workspaceId: $w) }`, { id: id(facture), w: ORG_PILOTAGE }, { organisation: ORG_PILOTAGE });
    verifierRefus(r, "deleteInvoice", "Suppression d'une facture par le cabinet (Comptable)");
    expect(await (await base()).collection("invoices").findOne({ _id: facture._id }), "La facture a été supprimée").toEqual(avant);
  });
});

test.describe("Espace gestionnaire : un client ne voit pas les autres clients du cabinet", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_CLIENT_CABINET) });

  test("GraphQL : les données de « Pilotage » (autre client du même cabinet) sont refusées", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const liste = await appelApi(page, `query($w: ID!) { invoices(workspaceId: $w, page: 1, limit: 50) { invoices { id number } } }`, { w: ORG_PILOTAGE }, { organisation: ORG_PILOTAGE });
    verifierRefus(liste, "invoices", "Factures d'un autre client du cabinet");
    const mois = await appelApi(page, `query($w: ID!) { dashboardBillingMonth(workspaceId: $w) { sales { total } } }`, { w: ORG_PILOTAGE }, { organisation: ORG_PILOTAGE });
    verifierRefus(mois, "dashboardBillingMonth", "Chiffres du mois d'un autre client du cabinet");
  });

  test("Le sélecteur d'espaces ne propose que ses propres espaces", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await page.locator("main > header").first().locator("button:has(svg.lucide-boxes)").click();
    const menu = page.getByRole("menu").last();
    await expect(menu).toBeVisible();
    await expect(menu, "Un autre client du cabinet est proposé").not.toContainText(COMPTES.pilotage.organisation.name);
    await expect(menu, "L'espace gestionnaire est proposé à un client").not.toContainText("Espace gestionnaire");
  });

  test("Ses propres factures restent visibles (contrôle)", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const r = await appelApi(page, `query($w: ID!) { invoices(workspaceId: $w, page: 1, limit: 5) { totalCount } }`, { w: ORG_BOULANGERIE }, { organisation: ORG_BOULANGERIE });
    expect(r.errors).toEqual([]);
    expect(r.data.invoices.totalCount).toBe(FACTURES_BOULANGERIE.length);
  });
});

test.describe("Invitation d'un cabinet : seul le destinataire y répond", () => {
  test.describe(() => {
    test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE), erreursConsoleAutorisees: REFUS_ROUTES });

    test("Ouverte par un autre compte : « Invitation introuvable », rien n'est montré", async ({ page }) => {
      await ouvrir(page, `/invitation-gestionnaire/${id(INVITATIONS.aAccepter)}`, { pret: page.getByRole("heading", { name: "Invitation introuvable" }) });
      await expect(page.locator("body")).not.toContainText(CABINET.name);
      await expect(page.locator("body")).not.toContainText(ESPACES_LIBRES.epicerie.name);
    });

    test("Acceptée par un autre compte, avec son propre espace : refusé, rien ne change", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const avant = await photoGestion();
      const r = await routeSite(page, `/api/invitations-gestionnaire/${id(INVITATIONS.aAccepter)}`, { method: "POST", corps: { action: "accept", organizationIds: [ORG_PILOTAGE] } });
      expect(r.statut, `Statut ${r.statut} (${r.texte})`).toBe(404);
      expect(await photoGestion(), "La base a changé").toBe(avant);
    });
  });

  test.describe(() => {
    test.use({ storageState: connecte(SESSION_TOKEN_CLIENT_CABINET), erreursConsoleAutorisees: REFUS_ROUTES });

    for (const [nom, invitation, espaces] of [
      ["avec un espace dont il n'est pas super admin", INVITATIONS.fantome, [ORG_PILOTAGE]],
      ["avec un espace déjà suivi par le cabinet", INVITATIONS.fantome, [ORG_BOULANGERIE]],
      ["avec un identifiant inventé", INVITATIONS.fantome, ["000000000000000000000000"]],
    ]) {
      test(`Accepter ${nom} : refusé, rien ne change`, async ({ page }) => {
        await ouvrir(page, "/dashboard");
        const avant = await photoGestion();
        const r = await routeSite(page, `/api/invitations-gestionnaire/${id(invitation)}`, { method: "POST", corps: { action: "accept", organizationIds: espaces } });
        expect(r.statut, `Statut ${r.statut} (${r.texte})`).toBe(400);
        expect(r.corps?.error, "Le refus doit être expliqué").toBeTruthy();
        expect(await photoGestion(), "La base a changé").toBe(avant);
      });
    }

    test("Liste de ses invitations : jamais celles adressées à d'autres", async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const r = await routeSite(page, "/api/invitations-gestionnaire");
      expect(r.statut).toBe(200);
      expect(JSON.stringify(r.corps), "Une invitation adressée à un autre compte est renvoyée").not.toContain(id(INVITATIONS.expiree));
      expect(JSON.stringify(r.corps)).not.toContain(id(INVITATIONS.aAnnuler));
    });
  });
});

test.describe("Espace gestionnaire : un texte piégé ne s'exécute jamais", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_CABINET) });

  test("Destinataire piégé dans la liste des factures : affiché comme du texte", async ({ page }) => {
    const piegee = FACTURES_BOULANGERIE.at(-1);
    await ouvrirListe(page, `${G}/factures?q=${encodeURIComponent(`${piegee.prefix}-${piegee.number}`)}`);
    await expect(page.locator("main table").getByText(/Traiteur <img/).first(), "Le nom piégé doit s'afficher tel quel").toBeVisible();
    await page.waitForTimeout(1_000);
    expect(await page.evaluate(() => window.__piege ?? null), "Le code du nom de client s'est exécuté").toBeNull();
  });
});
