/**
 * Relevé du catalogue (E2E_INVENTAIRE=1 seulement) : page, fenêtres et
 * sélection, pour le propriétaire, l'Éditeur et le Membre de l'organisation
 * « Achats ». Sert à écrire boutons.spec.mjs ; ne vérifie rien.
 */
import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { relever, releverEtat } from "../releve.mjs";
import { connecte, SESSION_TOKEN_ACHATS, SESSION_TOKEN_EDITEUR_ACHATS, SESSION_TOKEN_LECTEUR_ACHATS } from "../config.mjs";
import { PRODUITS } from "../donnees/lot-achats-banque.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

const fenetre = (p) => p.getByRole("dialog").last();
const ouvrirCatalogue = (p) => ouvrir(p, "/dashboard/catalogues", { pret: p.getByRole("row").filter({ hasText: PRODUITS.audit.name }) });
const ouvrirFiche = (nom) => async (p) => {
  await ouvrirCatalogue(p);
  await p.getByRole("row").filter({ hasText: nom }).getByRole("button", { name: "Actions du produit" }).click();
  await p.getByRole("menuitem", { name: /Modifier/ }).click().catch(() => {});
  await p.waitForTimeout(800);
};

for (const [role, token] of [["proprietaire", SESSION_TOKEN_ACHATS], ["editeur", SESSION_TOKEN_EDITEUR_ACHATS], ["lecteur", SESSION_TOKEN_LECTEUR_ACHATS]]) {
  test.describe(`Relevé du catalogue (${role})`, () => {
    test.use({ storageState: connecte(token) });
    relever({ [`catalogue-${role}`]: "/dashboard/catalogues" });
    releverEtat(`catalogue-${role}-fiche`, ouvrirFiche(PRODUITS.pose.name), { zone: fenetre });
    releverEtat(`catalogue-${role}-selection`, async (p) => {
      await ouvrirCatalogue(p);
      await p.getByRole("checkbox", { name: "Select row" }).first().check().catch(() => {});
      await p.waitForTimeout(500);
    });
  });
}

test.describe("Relevé du catalogue (propriétaire, fenêtres)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_ACHATS) });
  releverEtat("catalogue-nouveau-produit", async (p) => {
    await ouvrirCatalogue(p);
    await p.getByRole("button", { name: "Ajouter un produit" }).click();
    await p.waitForTimeout(800);
  }, { zone: fenetre });
  releverEtat("catalogue-champs", async (p) => {
    await ouvrirCatalogue(p);
    await p.getByRole("button", { name: "Champs" }).click();
    await p.waitForTimeout(800);
  }, { zone: fenetre });
  releverEtat("catalogue-import", async (p) => {
    await ouvrirCatalogue(p);
    await p.getByRole("button", { name: "Importer" }).click();
    await p.waitForTimeout(800);
  }, { zone: fenetre });
});
