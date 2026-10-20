/**
 * Espace gestionnaire, page Clients : ce que la liste affiche comparé à la
 * base (clients suivis, invitations), recherche, ouverture de l'espace d'un
 * client, et chaque action sur une invitation vérifiée en base (annuler,
 * retirer, relancer). Une invitation par action (donnees/lot-pilotage.mjs) ;
 * une invitation créée par un test est retirée à la fin du test.
 */
import { test, expect, etape, fenetre } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { base } from "../base.mjs";
import { id } from "../securite.mjs";
import { connecte, SESSION_TOKEN_CABINET } from "../config.mjs";
import { COMPTES, MEMBRES } from "../donnees/base.mjs";
import { CABINET, INVITATIONS } from "../donnees/lot-pilotage.mjs";
import { fiche, remettreEspace, routeSite } from "./outils-gestionnaire.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_CABINET) });

const G = "/dashboard/gestionnaire";
const ligne = (page, ...textes) => textes.reduce((l, t) => l.filter({ hasText: t }), page.locator("main table tbody tr"));
const notification = (page, texte) => page.locator("[data-sonner-toast]").filter({ hasText: texte });

async function ouvrirClients(page) {
  await ouvrir(page, G, { pret: page.getByRole("heading", { name: "Clients" }) });
}

/** Fiches du cabinet visibles dans sa liste (toutes sauf les invitations retirées). */
const fichesVisibles = async () => (await base()).collection("managedclients").find({ managerId: CABINET._id, status: { $ne: "canceled" } }).toArray();

/** Retire les invitations en attente créées par un test pour cet utilisateur (remise en état). */
async function retirerInvitationsEnAttente(page, utilisateurId) {
  const enAttente = await (await base()).collection("managedclients").find({ managerId: CABINET._id, invitedUserId: utilisateurId, status: "pending", expiresAt: { $gt: new Date() } }).toArray();
  for (const inv of enAttente) await routeSite(page, `/api/gestionnaire/invitations/${inv._id}`, { method: "DELETE" });
}

test.describe("Gestionnaire : liste des clients", () => {
  test("Une ligne par client suivi et par invitation, comme en base", async ({ page }) => {
    const attendues = await fichesVisibles();
    await ouvrirClients(page);
    await expect(page.locator("main table tbody tr")).toHaveCount(attendues.length);
    const texte = (await page.locator("main table tbody").innerText()).replace(/\s+/g, " ");
    for (const f of attendues) {
      if (f.organizationId) {
        const org = await (await base()).collection("organization").findOne({ _id: f.organizationId });
        expect.soft(texte, `Client suivi « ${org.companyName} »`).toContain(org.companyName);
      } else {
        expect.soft(texte, `Invitation à ${f.invitedEmail}`).toContain(f.invitedEmail);
      }
    }
    expect(texte, "Invitation du cabinet fantôme affichée").not.toContain("Cabinet Fantôme");
  });

  test("Le nombre de clients suivis annoncé est celui des fiches actives", async ({ page }) => {
    const actives = (await fichesVisibles()).filter((f) => f.status === "active").length;
    await ouvrirClients(page);
    await expect(page.getByText(new RegExp(`^${actives} clients? suivis? par ${CABINET.name}$`))).toBeVisible();
  });

  test("Recherche par nom d'entreprise, sans majuscules ni accents", async ({ page }) => {
    await ouvrirClients(page);
    await page.getByRole("textbox", { name: "Rechercher un client" }).fill("boulangerie cliente");
    await expect(page.locator("main table tbody tr")).toHaveCount(1);
    await expect(ligne(page, COMPTES.clientCabinet.organisation.name)).toHaveCount(1);
  });

  test("Recherche exacte (bouton « Aa ») : les majuscules comptent", async ({ page }) => {
    await ouvrirClients(page);
    await page.getByRole("button", { name: "Respecter les majuscules et les accents" }).click();
    await page.getByRole("textbox", { name: "Rechercher un client" }).fill("BOULANGERIE");
    await expect(page.getByText("Aucun client ne correspond à la recherche.")).toBeVisible();
  });

  test("Recherche par e-mail du dirigeant invité", async ({ page }) => {
    await ouvrirClients(page);
    await page.getByRole("textbox", { name: "Rechercher un client" }).fill("prospect-annule@e2e.test");
    await expect(page.locator("main table tbody tr")).toHaveCount(1);
  });
});

test.describe("Gestionnaire : ouvrir l'espace d'un client", () => {
  test("« Ouvrir » entre dans l'espace du client, avec le bandeau du cabinet", async ({ page }) => {
    try {
      await ouvrirClients(page);
      await cliquer(page, ligne(page, COMPTES.pilotage.organisation.name).getByRole("button", { name: "Ouvrir" }));
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
      await etape(
        page,
        "Espace du client ouvert",
        async () => {
          await expect(page.getByText(/Vous êtes dans l.espace de/)).toBeVisible();
          await expect(page.getByText(/Vous êtes dans l.espace de/).locator("xpath=..")).toContainText(COMPTES.pilotage.organisation.name);
        },
        { capture: "ecran" },
      );
      const session = await (await base()).collection("session").findOne({ token: SESSION_TOKEN_CABINET });
      expect(session.activeOrganizationId, "Espace actif de la session").toBe(id(COMPTES.pilotage.organisation));
    } finally {
      await remettreEspace(SESSION_TOKEN_CABINET, COMPTES.clientCabinet.organisation._id);
    }
  });
});

test.describe("Gestionnaire : actions sur les invitations", () => {
  test("Annuler une invitation en attente : confirmation, puis invitation retirée", async ({ page }) => {
    await ouvrirClients(page);
    await cliquer(page, ligne(page, INVITATIONS.aAnnuler.invitedEmail).getByRole("button", { name: "Annuler l'invitation" }));
    const confirmation = fenetre(page, "Annuler l'invitation ?");
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole("button", { name: "Annuler l'invitation" }).click();
    await expect(notification(page, "Invitation annulée")).toBeVisible();
    expect((await fiche(INVITATIONS.aAnnuler._id)).status).toBe("canceled");
    await expect(ligne(page, INVITATIONS.aAnnuler.invitedEmail)).toHaveCount(0);
  });

  test("« Garder l'invitation » ne change rien", async ({ page }) => {
    await ouvrirClients(page);
    await cliquer(page, ligne(page, INVITATIONS.aGarder.invitedEmail).getByRole("button", { name: "Annuler l'invitation" }));
    await fenetre(page, "Annuler l'invitation ?").getByRole("button", { name: "Garder l'invitation" }).click();
    await expect(fenetre(page, "Annuler l'invitation ?")).toBeHidden();
    expect((await fiche(INVITATIONS.aGarder._id)).status).toBe("pending");
  });

  test("Retirer une invitation refusée : elle disparaît de la liste", async ({ page }) => {
    await ouvrirClients(page);
    await cliquer(page, ligne(page, INVITATIONS.refuseeARetirer.invitedEmail).getByRole("button", { name: "Retirer" }));
    await expect(notification(page, "Invitation retirée")).toBeVisible();
    expect((await fiche(INVITATIONS.refuseeARetirer._id)).status).toBe("canceled");
  });

  test("Relancer une invitation refusée : nouvelle invitation, l'ancienne retirée", async ({ page }) => {
    const utilisateur = MEMBRES.pilotageEditeur.utilisateur;
    try {
      await ouvrirClients(page);
      await cliquer(page, ligne(page, utilisateur.email, "Invitation refusée").getByRole("button", { name: "Relancer" }));
      // E-mails coupés en CI : le site doit le dire, l'invitation reste visible dans les notifications du client
      await expect(notification(page, /Invitation relancée|Nouvelle invitation envoyée/)).toBeVisible();
      expect((await fiche(INVITATIONS.refuseeARelancer._id)).status, "L'ancienne invitation doit être retirée").toBe("canceled");
      const nouvelle = await (await base()).collection("managedclients").findOne({ managerId: CABINET._id, invitedUserId: utilisateur._id, status: "pending", expiresAt: { $gt: new Date() } });
      expect(nouvelle, "Aucune nouvelle invitation en base").not.toBeNull();
      expect(nouvelle.organizationId).toBeNull();
    } finally {
      await retirerInvitationsEnAttente(page, utilisateur._id);
    }
  });

  test.describe(() => {
    // Relance refusée par la route (404) : le navigateur l'écrit dans la console
    test.use({ erreursConsoleAutorisees: /status of 404/ });
    test("Relancer une invitation dont le compte n'existe plus : refus expliqué, rien ne change", async ({ page }) => {
      await ouvrirClients(page);
      const avant = await fiche(INVITATIONS.refuseeSansCompte._id);
      await cliquer(page, ligne(page, INVITATIONS.refuseeSansCompte.invitedEmail).getByRole("button", { name: "Relancer" }));
      await expect(page.locator("[data-sonner-toast]").filter({ hasText: /Aucun compte Newbi|introuvable|Impossible de relancer/ })).toBeVisible();
      expect(await fiche(INVITATIONS.refuseeSansCompte._id)).toEqual(avant);
    });
  });
});

