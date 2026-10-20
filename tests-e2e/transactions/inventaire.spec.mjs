/**
 * Relevé des transactions (E2E_INVENTAIRE=1 seulement) : liste, sélection et
 * tiroir d'une transaction (dépense sans justificatif, dépense rapprochée,
 * encaissement à rapprocher, dépense justifiée), pour le propriétaire,
 * l'Éditeur et le Membre de l'organisation « Achats ». Plus /banking-callback.
 */
import { test } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { releverEtat } from "../releve.mjs";
import { SESSION_TOKEN_ACHATS, SESSION_TOKEN_EDITEUR_ACHATS, SESSION_TOKEN_LECTEUR_ACHATS } from "../config.mjs";
import { connecteAchats } from "../achats-banque.mjs";
import { TRANSACTIONS } from "../donnees/lot-achats-banque.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

const id = (doc) => doc._id.toHexString();
// Tiroir maison (sans rôle de fenêtre) : volet fixe à droite, avec son titre.
const tiroir = (p) => p.locator("div.fixed.right-0").filter({ has: p.getByRole("heading", { level: 2 }) }).last();
const URL = "/dashboard/outils/transactions";
const ouvrirListe = (p) => ouvrir(p, URL, { pret: p.getByText("Spotify").first() });
const ouvrirTiroir = (t) => async (p) => {
  await ouvrir(p, `${URL}?transactionId=${id(t)}`, { pret: tiroir(p) });
  await p.waitForTimeout(1_200);
};

for (const [role, token] of [["proprietaire", SESSION_TOKEN_ACHATS], ["editeur", SESSION_TOKEN_EDITEUR_ACHATS], ["lecteur", SESSION_TOKEN_LECTEUR_ACHATS]]) {
  test.describe(`Relevé des transactions (${role})`, () => {
    test.use({ storageState: connecteAchats(token) });
    releverEtat(`transactions-${role}-depense`, ouvrirTiroir(TRANSACTIONS.carburant), { zone: tiroir });
  });
}

test.describe("Relevé des transactions (propriétaire, autres états)", () => {
  test.use({ storageState: connecteAchats(SESSION_TOKEN_ACHATS) });
  releverEtat("transactions-depense-rapprochee", ouvrirTiroir(TRANSACTIONS.adobe), { zone: tiroir });
  releverEtat("transactions-encaissement", ouvrirTiroir(TRANSACTIONS.virementDelta), { zone: tiroir });
  releverEtat("transactions-encaissement-rapproche", ouvrirTiroir(TRANSACTIONS.virementGamma), { zone: tiroir });
  releverEtat("transactions-justifiee", ouvrirTiroir(TRANSACTIONS.loyer), { zone: tiroir });
  releverEtat("transactions-ignoree", ouvrirTiroir(TRANSACTIONS.ignoree), { zone: tiroir });
});
