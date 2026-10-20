/**
 * Relevé des factures d'achat (E2E_INVENTAIRE=1 seulement) : liste, sélection,
 * fiche d'une facture (tiroir) et saisie manuelle, pour le propriétaire,
 * l'Éditeur et le Membre de l'organisation « Achats ». Ne vérifie rien.
 */
import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { relever, releverEtat } from "../releve.mjs";
import { connecte, SESSION_TOKEN_ACHATS, SESSION_TOKEN_EDITEUR_ACHATS, SESSION_TOKEN_LECTEUR_ACHATS } from "../config.mjs";
import { FACTURES_ACHAT } from "../donnees/lot-achats-banque.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

const id = (doc) => doc._id.toHexString();
const tiroir = (p) => p.getByRole("dialog").last();
const URL = "/dashboard/outils/factures-achat";
const ouvrirListe = (p) => ouvrir(p, URL, { pret: p.getByText(FACTURES_ACHAT.hotel.supplierName).first() });
const ouvrirFiche = (f) => async (p) => {
  await ouvrir(p, `${URL}?id=${id(f)}`, { pret: p.getByText(f.supplierName).first() });
  await p.waitForTimeout(1_000);
};

for (const [role, token] of [["proprietaire", SESSION_TOKEN_ACHATS], ["editeur", SESSION_TOKEN_EDITEUR_ACHATS], ["lecteur", SESSION_TOKEN_LECTEUR_ACHATS]]) {
  test.describe(`Relevé des factures d'achat (${role})`, () => {
    test.use({ storageState: connecte(token) });
    relever({ [`factures-achat-${role}`]: URL });
    releverEtat(`factures-achat-${role}-a-payer`, ouvrirFiche(FACTURES_ACHAT.hotel), { zone: tiroir });
    releverEtat(`factures-achat-${role}-payee-rapprochee`, ouvrirFiche(FACTURES_ACHAT.adobe), { zone: tiroir });
    releverEtat(`factures-achat-${role}-selection`, async (p) => {
      await ouvrirListe(p);
      await p.getByRole("checkbox").nth(1).check().catch(() => {});
      await p.waitForTimeout(500);
    });
  });
}

test.describe("Relevé des factures d'achat (propriétaire, autres états)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_ACHATS) });
  releverEtat("factures-achat-justificatif", ouvrirFiche(FACTURES_ACHAT.cafe), { zone: tiroir });
  releverEtat("factures-achat-plusieurs-taux", ouvrirFiche(FACTURES_ACHAT.imprimerie), { zone: tiroir });
  releverEtat("factures-achat-devise", ouvrirFiche(FACTURES_ACHAT.aws), { zone: tiroir });
  releverEtat("factures-achat-saisie", async (p) => {
    await ouvrirListe(p);
    await p.getByRole("button", { name: "Nouvelle facture" }).click();
    await p.getByRole("menuitem", { name: "Saisie manuelle" }).click();
    await p.waitForTimeout(1_000);
  }, { zone: tiroir });
  releverEtat("factures-achat-export", async (p) => {
    await ouvrirListe(p);
    await p.getByRole("button", { name: "Exporter" }).click();
    await p.waitForTimeout(800);
  }, { zone: tiroir });
});
