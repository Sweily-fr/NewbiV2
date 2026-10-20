/**
 * Bons de commande : tous les champs de l'éditeur (article et paramètres),
 * organisation « Atelier » (même formulaire que les devis, voir
 * ../devis/champs-editeur.mjs).
 */
import { champsDeLArticle, champsDesParametres } from "../devis/champs-editeur.mjs";

const BON = {
  nom: "Nouveau bon de commande",
  editeur: "/dashboard/outils/bons-commande/new",
  liste: "/dashboard/outils/bons-commande",
  collection: "purchaseorders",
  boutonCreer: "Créer le bon de commande",
  appliquer: "Appliquer à ce bon de commande",
};

champsDeLArticle(BON);
champsDesParametres(BON);
