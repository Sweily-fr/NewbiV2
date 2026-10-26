/**
 * Relevé du catalogue (E2E_INVENTAIRE=1 seulement) : page, fenêtres et
 * sélection, pour le propriétaire, l'Éditeur et le Membre de l'organisation
 * « Achats ». Sert à écrire boutons.spec.mjs ; ne vérifie rien.
 */
import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { releverEtat } from "../releve.mjs";
import { SESSION_TOKEN_ACHATS, SESSION_TOKEN_EDITEUR_ACHATS } from "../config.mjs";
import { connecteAchats } from "../achats-banque.mjs";
import { PRODUITS } from "../donnees/lot-achats-banque.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

const fenetre = (p) => p.getByRole("dialog").last();
const ouvrirCatalogue = (p) => ouvrir(p, "/dashboard/catalogues", { pret: p.getByRole("row").filter({ hasText: PRODUITS.audit.name }) });
const ouvrirFiche = (nom) => async (p) => {
  await ouvrirCatalogue(p);
  await p.getByRole("row").filter({ hasText: nom }).getByRole("button", { name: "Actions du produit" }).click({ timeout: 10_000 });
  await p.getByRole("menuitem", { name: /Modifier/ }).click({ timeout: 10_000 });
  await p.waitForTimeout(800);
};

// Deuxième relevé : fiche d'un produit lié (le premier a buté sur les cartes de rapprochement).
for (const [role, token] of [["proprietaire", SESSION_TOKEN_ACHATS], ["editeur", SESSION_TOKEN_EDITEUR_ACHATS]]) {
  test.describe(`Relevé du catalogue (${role})`, () => {
    test.use({ storageState: connecteAchats(token) });
    releverEtat(`catalogue-${role}-fiche`, ouvrirFiche(PRODUITS.pose.name), { zone: fenetre });
  });
}
