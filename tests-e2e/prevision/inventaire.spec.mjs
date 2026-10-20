/**
 * Relevé de la prévision de trésorerie (E2E_INVENTAIRE=1 seulement) : page,
 * scénario « Optimiste », fenêtres de saisie et détail d'un mois, pour le
 * propriétaire, l'Éditeur et le Membre de l'organisation « Achats ».
 */
import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { relever, releverEtat } from "../releve.mjs";
import { connecte, SESSION_TOKEN_ACHATS, SESSION_TOKEN_EDITEUR_ACHATS, SESSION_TOKEN_LECTEUR_ACHATS } from "../config.mjs";
import { SAISIES } from "../donnees/lot-achats-banque.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

const fenetre = (p) => p.getByRole("dialog").last();
const URL = "/dashboard/outils/prevision";
const ouvrirPrevision = (p) => ouvrir(p, URL, { pret: p.getByRole("button", { name: "Ajouter une prévision" }).or(p.getByText(SAISIES.loyer.name).first()).first() });

for (const [role, token] of [["proprietaire", SESSION_TOKEN_ACHATS], ["editeur", SESSION_TOKEN_EDITEUR_ACHATS], ["lecteur", SESSION_TOKEN_LECTEUR_ACHATS]]) {
  test.describe(`Relevé de la prévision (${role})`, () => {
    test.use({ storageState: connecte(token) });
    relever({ [`prevision-${role}`]: URL });
    releverEtat(`prevision-${role}-mois`, async (p) => {
      await ouvrirPrevision(p);
      await p.locator("main button").filter({ hasText: /^[A-ZÉÛ][a-zéû]{2}\.\d{2}$/ }).nth(1).click();
      await p.waitForTimeout(1_000);
    }, { zone: fenetre });
  });
}

test.describe("Relevé de la prévision (propriétaire, autres états)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_ACHATS) });
  releverEtat("prevision-scenario", async (p) => {
    await ouvrirPrevision(p);
    await p.getByRole("button", { name: "Base" }).click();
    await p.getByRole("menuitem", { name: /Optimiste/ }).click().catch(() => {});
    await p.waitForTimeout(1_000);
  });
  releverEtat("prevision-saisie", async (p) => {
    await ouvrirPrevision(p);
    await p.getByRole("button", { name: "Ajouter une prévision" }).click();
    await p.waitForTimeout(800);
  }, { zone: fenetre });
  releverEtat("prevision-nouveau-scenario", async (p) => {
    await ouvrirPrevision(p);
    await p.getByRole("button", { name: "Base" }).click();
    await p.getByRole("menuitem", { name: "Nouveau scénario" }).click();
    await p.waitForTimeout(800);
  }, { zone: fenetre });
});
