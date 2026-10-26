/**
 * Espace gestionnaire, formulaires « Nouveau client » et « Inviter un
 * client » : chaque champ refusé avec un message (natif du navigateur pour
 * un champ obligatoire vide, sinon celui du serveur) et rien d'enregistré ;
 * les cas réels (e-mail déjà inscrit, entreprise déjà sur Newbi, compte sans
 * espace à confier, invitation déjà en attente) expliqués ; l'invitation
 * valide enregistrée en base (puis retirée en fin de test).
 *
 * Non testable en CI : la création réussie d'un client (le SIRET est vérifié
 * au registre des entreprises, sur Internet, depuis le serveur).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte, SESSION_TOKEN_CABINET } from "../config.mjs";
import { COMPTES, MEMBRES } from "../donnees/base.mjs";
import { CABINET } from "../donnees/lot-pilotage.mjs";
import { photoGestion, REFUS_ROUTES, routeSite } from "./outils-gestionnaire.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_CABINET), erreursConsoleAutorisees: REFUS_ROUTES });

const G = "/dashboard/gestionnaire";
const alerte = (page) => page.locator("main [role=alert]");

/** Message de validation du navigateur sur un champ (bulle « Veuillez renseigner ce champ »). */
const messageNatif = (champ) => champ.evaluate((e) => e.validationMessage);

// --- Nouveau client ---------------------------------------------------------------

const CLIENT_JUSTE = { companyName: "Atelier Nouveau SARL", siret: "55210055400013", firstName: "Zoé", lastName: "Lefèvre", email: "atelier-nouveau@e2e.test" };

async function remplirClient(page, valeurs) {
  await ouvrir(page, `${G}/clients/nouveau`, { pret: page.getByRole("button", { name: "Créer le client" }) });
  const v = { ...CLIENT_JUSTE, ...valeurs };
  await page.getByLabel("Entreprise", { exact: true }).fill(v.companyName);
  await page.getByLabel("SIRET", { exact: true }).fill(v.siret);
  await page.getByLabel("Prénom du dirigeant", { exact: true }).fill(v.firstName);
  await page.getByLabel("Nom du dirigeant", { exact: true }).fill(v.lastName);
  await page.getByLabel("E-mail du dirigeant", { exact: true }).fill(v.email);
  return v;
}

const clientCree = async (email) => (await base()).collection("user").findOne({ email: email.toLowerCase() });

test.describe("Nouveau client : champs refusés", () => {
  for (const [cas, champ, valeurs] of [
    ["Entreprise vide", "Entreprise", { companyName: "" }],
    ["SIRET vide", "SIRET", { siret: "" }],
    ["E-mail vide", "E-mail du dirigeant", { email: "" }],
    ["E-mail sans arobase", "E-mail du dirigeant", { email: "dirigeant.entreprise.fr" }],
  ]) {
    test(`${cas} : le navigateur l'empêche avec un message, rien n'est créé`, async ({ page }) => {
      const v = await remplirClient(page, { ...valeurs, email: valeurs.email ?? `refus-${cas.length}@e2e.test` });
      const avant = await photoGestion();
      await page.getByRole("button", { name: "Créer le client" }).click();
      expect(await messageNatif(page.getByLabel(champ, { exact: true })), `${cas} : aucun message`).not.toBe("");
      expect(await photoGestion(), "Quelque chose a été créé").toBe(avant);
      expect(v).toBeTruthy();
    });
  }

  for (const [cas, valeurs, message] of [
    ["Entreprise remplie d'espaces", { companyName: "   ", email: "espaces@e2e.test" }, /nom de l'entreprise est obligatoire/],
    ["SIRET de 13 chiffres", { siret: "5521005540001", email: "siret13@e2e.test" }, /14 chiffres/],
    ["SIRET avec des lettres", { siret: "55210055400A13", email: "siret-lettres@e2e.test" }, /14 chiffres/],
    ["E-mail sans extension (dirigeant@entreprise)", { email: "dirigeant@entreprise" }, /e-mail .*invalide/i],
    ["E-mail déjà inscrit sur Newbi", { email: COMPTES.pilotage.utilisateur.email }, /déjà un compte Newbi/],
    ["Entreprise déjà sur Newbi (même SIRET)", { siret: COMPTES.pilotage.organisation.siret, email: "meme-siret@e2e.test" }, /déjà un espace Newbi/],
  ]) {
    test(`${cas} : refusé avec un message, rien n'est créé`, async ({ page }) => {
      const v = await remplirClient(page, valeurs);
      const avant = await photoGestion();
      await cliquer(page, page.getByRole("button", { name: "Créer le client" }));
      await etape(page, "Message affiché", () => expect(alerte(page)).toContainText(message), { capture: "ecran" });
      expect(await photoGestion(), "Quelque chose a été créé").toBe(avant);
      if (v.email !== COMPTES.pilotage.utilisateur.email) expect(await clientCree(v.email)).toBeNull();
    });
  }

  test("E-mail déjà inscrit : le message propose d'inviter ce client à la place", async ({ page }) => {
    await remplirClient(page, { email: COMPTES.pilotage.utilisateur.email });
    await cliquer(page, page.getByRole("button", { name: "Créer le client" }));
    const lien = alerte(page).getByRole("link", { name: "Inviter ce client" });
    await expect(lien).toBeVisible();
    await cliquer(page, lien);
    await expect(page).toHaveURL(new RegExp(`/clients/inviter\\?email=${encodeURIComponent(COMPTES.pilotage.utilisateur.email)}`));
    await expect(page.getByLabel("E-mail du dirigeant", { exact: true })).toHaveValue(COMPTES.pilotage.utilisateur.email);
  });

  test("Les valeurs réelles passent les contrôles de saisie (accents, apostrophe, SIRET avec espaces)", async ({ page }) => {
    const v = await remplirClient(page, { companyName: "L’Œuf d’Or SARL", siret: "552 100 554 00013", firstName: "Anaïs", lastName: "Lecœur", email: "oeuf-dor@e2e.test" });
    await cliquer(page, page.getByRole("button", { name: "Créer le client" }));
    // Le SIRET part ensuite au registre des entreprises (sur Internet) : créé, ou refusé par le registre, mais jamais pour la forme de la saisie
    await expect(async () => {
      const texte = (await alerte(page).count()) ? await alerte(page).innerText() : "";
      const cree = await clientCree(v.email);
      expect(cree !== null || texte !== "", "Ni création ni message").toBe(true);
      expect(texte, "La saisie a été refusée pour sa forme").not.toMatch(/14 chiffres|obligatoire|e-mail .*invalide/i);
    }).toPass({ timeout: 30_000 });
  });

  test("« Annuler » revient à la liste sans rien créer", async ({ page }) => {
    await remplirClient(page, { email: "annule@e2e.test" });
    const avant = await photoGestion();
    await cliquer(page, page.getByRole("button", { name: "Annuler" }));
    await expect(page).toHaveURL(/\/dashboard\/gestionnaire$/);
    expect(await photoGestion()).toBe(avant);
  });
});

// --- Inviter un client -------------------------------------------------------------

const EDITEUR = MEMBRES.pilotageEditeur.utilisateur;

async function inviter(page, email) {
  await ouvrir(page, `${G}/clients/inviter`, { pret: page.getByRole("button", { name: "Envoyer l'invitation" }) });
  await page.getByLabel("E-mail du dirigeant", { exact: true }).fill(email);
  await cliquer(page, page.getByRole("button", { name: "Envoyer l'invitation" }));
}

const invitationsEnAttente = async (utilisateurId) =>
  (await base()).collection("managedclients").find({ managerId: CABINET._id, invitedUserId: utilisateurId, status: "pending", expiresAt: { $gt: new Date() } }).toArray();

async function retirerInvitations(page, utilisateurId) {
  for (const inv of await invitationsEnAttente(utilisateurId)) await routeSite(page, `/api/gestionnaire/invitations/${inv._id}`, { method: "DELETE" });
}

test.describe("Inviter un client", () => {
  test("E-mail vide : le navigateur l'empêche avec un message", async ({ page }) => {
    await ouvrir(page, `${G}/clients/inviter`, { pret: page.getByRole("button", { name: "Envoyer l'invitation" }) });
    const avant = await photoGestion();
    await page.getByRole("button", { name: "Envoyer l'invitation" }).click();
    expect(await messageNatif(page.getByLabel("E-mail du dirigeant", { exact: true }))).not.toBe("");
    expect(await photoGestion()).toBe(avant);
  });

  for (const [cas, email, message] of [
    ["Adresse sans compte Newbi", "inconnu-total@e2e.test", /Aucun compte Newbi/],
    ["Sa propre adresse", MEMBRES.cabinet.utilisateur.email, /vous inviter vous-même/],
    ["Compte sans espace à confier (simple membre)", MEMBRES.pilotageMembre.utilisateur.email, /aucun espace à confier/],
    ["Adresse sans extension", "dirigeant@entreprise", /invalide/i],
  ]) {
    test(`${cas} : refusé avec un message, rien n'est créé`, async ({ page }) => {
      const avant = await photoGestion();
      await inviter(page, email);
      await etape(page, "Message affiché", () => expect(alerte(page)).toContainText(message), { capture: "ecran" });
      expect(await photoGestion(), "Une invitation a été créée").toBe(avant);
    });
  }

  test("Invitation déjà en attente : refusée avec un message, pas de doublon", async ({ page }) => {
    try {
      await ouvrir(page, "/dashboard");
      await routeSite(page, "/api/gestionnaire/invitations", { method: "POST", corps: { email: EDITEUR.email } });
      expect((await invitationsEnAttente(EDITEUR._id)).length, "Données de départ : une invitation en attente").toBe(1);
      await inviter(page, EDITEUR.email);
      await expect(alerte(page)).toContainText(/déjà en attente/);
      expect((await invitationsEnAttente(EDITEUR._id)).length, "Une seconde invitation a été créée").toBe(1);
    } finally {
      await retirerInvitations(page, EDITEUR._id);
    }
  });

  test("Adresse d'un super admin d'espace libre : invitation enregistrée, retour à la liste", async ({ page }) => {
    try {
      await inviter(page, `  ${EDITEUR.email.toUpperCase()}  `);
      await expect(page).toHaveURL(/\/dashboard\/gestionnaire$/, { timeout: 30_000 });
      await expect(page.locator("[data-sonner-toast]").filter({ hasText: new RegExp(`Invitation (envoyée|enregistrée).*${EDITEUR.email}`) })).toBeVisible();
      const [inv] = await invitationsEnAttente(EDITEUR._id);
      expect(inv, "Invitation absente de la base").toBeTruthy();
      expect(inv.invitedEmail, "Adresse enregistrée en minuscules, sans espaces").toBe(EDITEUR.email);
      expect(inv.organizationId).toBeNull();
      expect(inv.expiresAt.getTime() - Date.now(), "Valable 14 jours").toBeGreaterThan(13 * 86_400_000);
    } finally {
      await retirerInvitations(page, EDITEUR._id);
    }
  });
});
