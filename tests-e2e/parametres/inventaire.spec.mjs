/**
 * Relevé de la fenêtre des Paramètres (E2E_INVENTAIRE=1 seulement) : chaque
 * onglet, vu par chaque rôle de l'espace « Paramètres ». Point de départ des
 * descriptions de boutons.spec.mjs.
 */
import { test } from "../outils.mjs";
import { releverEtat } from "../releve.mjs";
import {
  connecte,
  SESSION_TOKEN_PARAMETRES,
  SESSION_TOKEN_ADMIN_PARAMETRES,
  SESSION_TOKEN_EDITEUR_PARAMETRES,
  SESSION_TOKEN_MEMBRE_PARAMETRES,
  SESSION_TOKEN_COMPTABLE_PARAMETRES,
  SESSION_TOKEN_RECRUTEUR_PARAMETRES,
} from "../config.mjs";
import { ONGLETS, ouvrirParametres, contenuParametres, menuParametres } from "../authentification/outils-auth.mjs";

test.skip(process.env.E2E_INVENTAIRE !== "1", "Relevé des pages : E2E_INVENTAIRE=1");

const TOUS = Object.keys(ONGLETS);
const ROLES = [
  ["proprietaire", SESSION_TOKEN_PARAMETRES, TOUS],
  ["editeur", SESSION_TOKEN_EDITEUR_PARAMETRES, TOUS],
  ["membre", SESSION_TOKEN_MEMBRE_PARAMETRES, TOUS],
  ["admin", SESSION_TOKEN_ADMIN_PARAMETRES, ["espaces", "roles", "generale", "securite", "subscription"]],
  ["comptable", SESSION_TOKEN_COMPTABLE_PARAMETRES, ["espaces", "generale"]],
  ["recruteur", SESSION_TOKEN_RECRUTEUR_PARAMETRES, ["espaces", "roles", "generale"]],
];

for (const [role, token, onglets] of ROLES) {
  test.describe(`Relevé des Paramètres (${role})`, () => {
    test.use({ storageState: connecte(token) });
    releverEtat(`parametres-${role}-menu`, (p) => ouvrirParametres(p, "notifications"), { zone: menuParametres });
    for (const onglet of onglets) {
      releverEtat(`parametres-${role}-${onglet}`, (p) => ouvrirParametres(p, onglet), { zone: contenuParametres });
    }
  });
}
