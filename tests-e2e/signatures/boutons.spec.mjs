/**
 * Signatures de mail : boutons par rôle et création. L'aperçu d'une signature
 * est rendu dans une iframe sandbox sans « allow-scripts » : le navigateur
 * journalise « Blocked script execution in 'about:srcdoc' » (c'est le bac à
 * sable qui fait son travail) ; les icônes pointent vers un hôte absent en CI.
 * Ces messages de console sont donc attendus.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { base } from "../base.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { connecte, SESSION_TOKEN_COLLAB, SESSION_TOKEN_COLLAB_EDITEUR, SESSION_TOKEN_COLLAB_MEMBRE } from "../config.mjs";
import { SIGNATURES } from "../donnees/lot-collaboration.mjs";

const BRUIT = /about:srcdoc|Failed to load resource|Content Security Policy|fichiers\.e2e\.invalid|127\.0\.0\.1:9|ERR_|net::/;
const COLLAB = COMPTES.collab.organisation._id;
const ouvrirSignatures = (page) =>
  ouvrir(page, "/dashboard/outils/signatures-mail", { pret: page.getByRole("heading", { name: /Signatures/ }) });

test.describe("Signatures (propriétaire) : liste et actions", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB), erreursConsoleAutorisees: BRUIT });

  test("« Nouvelle signature » est proposée", async ({ page }) => {
    await ouvrirSignatures(page);
    await expect(page.getByRole("button", { name: "Nouvelle signature" })).toBeVisible();
  });

  test("Le menu « Actions » d'une signature propose défaut, duplication et suppression", async ({ page }) => {
    await ouvrirSignatures(page);
    await page.getByRole("button", { name: "Actions" }).first().click();
    const menu = page.getByRole("menu");
    for (const item of ["Définir par défaut", "Dupliquer", "Supprimer"]) {
      await expect(menu.getByRole("menuitem", { name: item })).toBeVisible();
    }
  });
});

test.describe("Signatures (éditeur) : peut créer les siennes", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_EDITEUR), erreursConsoleAutorisees: BRUIT });
  test("« Nouvelle signature » proposée, et ne voit que les siennes", async ({ page }) => {
    await ouvrirSignatures(page);
    await expect(page.getByRole("button", { name: "Nouvelle signature" })).toBeVisible();
    await expect(page.getByText(SIGNATURES.proprietaire.name), "L'éditeur voit la signature du propriétaire").toHaveCount(0);
  });
});

test.describe("Signatures (membre, lecture seule)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB_MEMBRE), erreursConsoleAutorisees: BRUIT });
  test("Pas de création, et aucune signature d'un autre membre", async ({ page }) => {
    await ouvrirSignatures(page);
    await expect(page.getByRole("button", { name: "Nouvelle signature" })).toHaveCount(0);
    await expect(page.getByText(SIGNATURES.proprietaire.name)).toHaveCount(0);
  });
});

test.describe("Signatures : création", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_COLLAB), erreursConsoleAutorisees: BRUIT });
  test("« Nouvelle signature » crée une signature et ouvre l'éditeur", async ({ page }) => {
    const compter = () => base().then((db) => db.collection("emailsignaturev2").countDocuments({ workspaceId: COLLAB, createdBy: COMPTES.collab.utilisateur._id }));
    const avant = await compter();
    await ouvrirSignatures(page);
    await etape(
      page,
      "Créer une nouvelle signature",
      async () => {
        await cliquer(page, page.getByRole("button", { name: "Nouvelle signature" }));
        await expect(page).toHaveURL(/\/dashboard\/outils\/signatures-mail\/[0-9a-f]{24}/, { timeout: 30_000 });
      },
      { capture: "ecran" },
    );
    await expect.poll(compter, { timeout: 10_000 }).toBeGreaterThan(avant);
  });
});
