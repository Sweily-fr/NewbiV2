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

/** Documents d'une collection (invoices, quotes…) qui contiennent un article portant ce nom. */
export async function documentsAvecArticle(collection, nomArticle) {
  return (await base()).collection(collection).find({ "items.description": nomArticle }).toArray();
}

export const facturesAvecArticle = (nomArticle) => documentsAvecArticle("invoices", nomArticle);
