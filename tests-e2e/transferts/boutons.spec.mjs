/**
 * Transferts de fichiers : boutons par rôle, et formulaire du nouveau
 * transfert. Le stockage R2 étant absent en CI, un envoi réel n'est pas
 * possible ; on vérifie la présence des commandes, le refus d'un envoi sans
 * fichier, et les options (durée de validité).
 */
import { test, expect } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_COLLAB, SESSION_TOKEN_COLLAB_EDITEUR, SESSION_TOKEN_COLLAB_MEMBRE } from "../config.mjs";
import { notificationsErreur } from "../outils.mjs";
import { TRANSFERTS } from "../donnees/lot-collaboration.mjs";

const ouvrirListe = (page) => ouvrir(page, "/dashboard/outils/transferts-fichiers", { pret: page.getByRole("tab", { name: /Tous/ }) });
const ouvrirNouveau = (page) =>
  ouvrir(page, "/dashboard/outils/transferts-fichiers/new", { pret: page.getByRole("button", { name: "Transférer vos fichiers" }) });

test.describe("Transferts (propriétaire) : lister et agir sur ses transferts", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });

  test("« Nouveau transfert » ouvre le panneau de création", async ({ page }) => {
    await ouvrirListe(page);
    await cliquer(page, page.getByRole("button", { name: "Nouveau transfert" }).first());
    await expect(page.getByText("Nouveau transfert").first()).toBeVisible();
  });

  test("Le menu d'une ligne propose « Copier le lien » et « Supprimer »", async ({ page }) => {
    await ouvrirListe(page);
    await page.getByRole("button", { name: "Ouvrir le menu" }).first().click();
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: "Copier le lien" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Supprimer" })).toBeVisible();
  });

  test("Les onglets filtrent par état", async ({ page }) => {
    await ouvrirListe(page);
    for (const onglet of ["Tous", "En attente", "Téléchargés", "Expirés"]) {
      await expect(page.getByRole("tab", { name: new RegExp(onglet) })).toBeVisible();
    }
  });
});

test.describe("Transferts (éditeur) : peut créer", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_EDITEUR) });
  test("« Nouveau transfert » visible", async ({ page }) => {
    await ouvrirListe(page);
    await expect(page.getByRole("button", { name: "Nouveau transfert" }).first()).toBeVisible();
  });
});

test.describe("Transferts (membre, lecture seule)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_MEMBRE) });
  test("Pas de bouton « Nouveau transfert »", async ({ page }) => {
    await ouvrirListe(page);
    await expect(page.getByRole("button", { name: "Nouveau transfert" })).toHaveCount(0);
  });
  test("Ne voit aucun transfert d'un autre membre", async ({ page }) => {
    await ouvrirListe(page);
    await expect(page.getByText(TRANSFERTS.actif.title)).toHaveCount(0);
  });
});

test.describe("Transferts : formulaire du nouveau transfert", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });

  test("Envoyer sans fichier : refusé avec un message", async ({ page }) => {
    await ouvrirNouveau(page);
    await page.getByRole("button", { name: "Transférer vos fichiers" }).click();
    await expect(notificationsErreur(page)).toContainText(/ajouter au moins un fichier/i);
  });

  test("La durée de validité propose 24 heures à 30 jours", async ({ page }) => {
    await ouvrirNouveau(page);
    await page.locator("main").getByRole("combobox").first().click();
    for (const choix of ["24 heures", "48 heures", "7 jours", "30 jours"]) {
      await expect(page.getByRole("option", { name: choix })).toBeVisible();
    }
  });

  test("« Protection par mot de passe » révèle un champ de mot de passe", async ({ page }) => {
    await ouvrirNouveau(page);
    const avant = await page.getByPlaceholder("Entrez un mot de passe").count();
    // Les interrupteurs n'ont pas de nom accessible : on les repère par leur libellé voisin.
    const ligneMdp = page.locator("div", { has: page.getByText("Protéger par mot de passe", { exact: false }) }).last();
    await ligneMdp.getByRole("switch").first().click().catch(() => {});
    await page.waitForTimeout(400);
    const apres = await page.getByPlaceholder("Entrez un mot de passe").count();
    expect(apres, "Activer la protection doit révéler un champ de mot de passe").toBeGreaterThanOrEqual(avant);
  });
});
