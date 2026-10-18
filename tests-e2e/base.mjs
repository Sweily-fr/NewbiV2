/**
 * Accès des tests à la base en mémoire, pour vérifier ce qui est réellement
 * enregistré (statut, numéro, totaux) et pas seulement ce qui s'affiche.
 * L'adresse est publiée par serveur.mjs dans FICHIER_ETAT.
 */
import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";
import { BASE_DE_DONNEES, FICHIER_ETAT } from "./config.mjs";

let connexion = null;

export async function base() {
  if (!connexion) {
    const { uri } = JSON.parse(readFileSync(FICHIER_ETAT, "utf8"));
    connexion = new MongoClient(uri).connect();
  }
  return (await connexion).db(BASE_DE_DONNEES);
}

/** Factures d'une organisation qui contiennent un article portant ce nom. */
export async function facturesAvecArticle(nomArticle) {
  return (await base()).collection("invoices").find({ "items.description": nomArticle }).toArray();
}
