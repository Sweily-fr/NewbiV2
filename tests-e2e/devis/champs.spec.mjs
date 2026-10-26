/**
 * Devis : tous les champs de l'éditeur (article et paramètres), organisation
 * « Atelier » (voir champs-editeur.mjs).
 */
import { champsDeLArticle, champsDesParametres } from "./champs-editeur.mjs";

const DEVIS = {
  nom: "Nouveau devis",
  editeur: "/dashboard/outils/devis/new",
  liste: "/dashboard/outils/devis",
  collection: "quotes",
  boutonCreer: "Créer le devis",
  appliquer: "Appliquer à ce devis",
};

champsDeLArticle(DEVIS);
champsDesParametres(DEVIS);
