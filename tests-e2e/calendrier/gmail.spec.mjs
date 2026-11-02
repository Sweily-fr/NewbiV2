/**
 * Connexion Gmail (import des factures d'achat reçues par e-mail), espace
 * « Agenda » de lot-calendrier.mjs. Appels directs à l'API :
 *   - la boîte d'un autre membre est introuvable : ni déconnectée, ni
 *     analysée, ni réglée ;
 *   - le rôle « Membre » (lecture seule) ne lance pas d'analyse de sa propre
 *     boîte (elle crée des factures d'achat), mais peut la déconnecter ;
 *   - sans session, rien ;
 *   - autorisation Google : refusée sans session.
 * Les retours OAuth (state fabriqué, expiré, rejoué) sont vérifiés par les
 * tests de l'API (gmail-oauth-state.test.js).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { API_URL, connecte } from "../config.mjs";
import { base } from "../base.mjs";
import { appelApi, id } from "../securite.mjs";
import { photo, verifierRefusCollab, sansFuite } from "../securite-collaboration.mjs";
import { AGENDA, MEMBRES_AGENDA, GMAIL } from "../donnees/lot-calendrier.mjs";
import { appelRoute, surLeSite } from "./outils-agenda.mjs";

const ORG = id(AGENDA.organisation);

const OPERATIONS = [
  ["Déconnecter", "disconnectGmail", `mutation($c: ID!){ disconnectGmail(connectionId:$c){ id status } }`, (c) => ({ c })],
  ["Analyser la boîte", "triggerGmailSync", `mutation($c: ID!){ triggerGmailSync(connectionId:$c){ success message } }`, (c) => ({ c })],
  ["Régler la période", "updateGmailScanPeriod", `mutation($c: ID!){ updateGmailScanPeriod(connectionId:$c,scanPeriodMonths:12){ id scanPeriodMonths } }`, (c) => ({ c })],
];

test.describe("Gmail : la boîte d'un autre membre est introuvable", () => {
  test.use({ storageState: connecte(MEMBRES_AGENDA.editeur.token) });
  test.beforeEach(async ({ page }) => surLeSite(page));

  for (const [nom, champ, requete, variables] of OPERATIONS) {
    test(`${nom} la boîte du gérant : introuvable, rien ne change`, async ({ page }) => {
      const temoin = ["gmailconnections", { _id: GMAIL.proprietaire._id }];
      const avant = await photo(...temoin);
      const reponse = await appelApi(page, requete, variables(id(GMAIL.proprietaire)), { organisation: ORG, delai: 15_000 });
      verifierRefusCollab(reponse, champ, `${nom} (Éditeur, boîte du gérant)`);
      sansFuite(reponse, [GMAIL.proprietaire.accountEmail], `${nom} (Éditeur)`);
      expect(await photo(...temoin), "La boîte du gérant a changé").toBe(avant);
    });
  }

  test("La boîte de l'espace lue par l'Éditeur n'est pas celle du gérant", async ({ page }) => {
    const reponse = await appelApi(page, `query($w: ID!){ gmailConnection(workspaceId:$w){ id accountEmail } }`, { w: ORG }, { organisation: ORG });
    sansFuite(reponse, [GMAIL.proprietaire.accountEmail, GMAIL.proprietaire.accessToken, GMAIL.proprietaire.refreshToken], "gmailConnection (Éditeur)");
  });
});

test.describe("Gmail : le rôle « Membre » ne lance pas d'analyse", () => {
  test.use({ storageState: connecte(MEMBRES_AGENDA.membre.token) });
  test.beforeEach(async ({ page }) => surLeSite(page));

  for (const [nom, champ, requete, variables] of OPERATIONS.slice(1)) {
    test(`${nom} de sa propre boîte : refusé (factures d'achat en lecture seule)`, async ({ page }) => {
      const temoin = ["gmailconnections", { _id: GMAIL.membre._id }];
      const avant = await photo(...temoin);
      const reponse = await appelApi(page, requete, variables(id(GMAIL.membre)), { organisation: ORG, delai: 15_000 });
      verifierRefusCollab(reponse, champ, `${nom} (Membre)`);
      expect(await photo(...temoin), "Sa boîte a changé malgré le refus").toBe(avant);
    });
  }

  test("Déconnecter sa propre boîte reste permis, jetons effacés", async ({ page }) => {
    const reponse = await appelApi(page, OPERATIONS[0][2], { c: id(GMAIL.membre) }, { organisation: ORG, delai: 15_000 });
    expect(reponse.errors.map((e) => e.message)).toEqual([]);
    expect(reponse.data?.disconnectGmail?.status).toBe("disconnected");
    await etape(page, "En base : déconnectée, sans jeton", async () => {
      const doc = await (await base()).collection("gmailconnections").findOne({ _id: GMAIL.membre._id });
      expect(doc.status).toBe("disconnected");
      expect(doc.accessToken ?? null).toBeNull();
      expect(doc.refreshToken ?? null).toBeNull();
    });
  });
});

test.describe("Gmail : sans session, rien", () => {
  test.use({ storageState: { cookies: [], origins: [] }, erreursConsoleAutorisees: /401.*\/api\/auth\/token/ });

  test("Opérations et autorisation Google refusées", async ({ page }) => {
    await ouvrir(page, "/auth/login");
    for (const [nom, champ, requete, variables] of OPERATIONS) {
      const temoin = ["gmailconnections", { _id: GMAIL.proprietaire._id }];
      const avant = await photo(...temoin);
      const reponse = await appelApi(page, requete, variables(id(GMAIL.proprietaire)), { organisation: ORG });
      expect.soft(reponse.data?.[champ] ?? null, `${nom} : accepté sans session`).toBeNull();
      expect.soft(await photo(...temoin), `${nom} : la base a changé sans session`).toBe(avant);
    }
    const autorisation = await appelRoute(page, `${API_URL}/gmail-connect/authorize`, { entetes: { "x-workspace-id": ORG } });
    expect(autorisation.statut, "Autorisation Google sans session").toBeGreaterThanOrEqual(400);
    expect(autorisation.entetes.location || "", "Redirection vers Google sans session").not.toMatch(/accounts\.google\.com/);
  });
});
