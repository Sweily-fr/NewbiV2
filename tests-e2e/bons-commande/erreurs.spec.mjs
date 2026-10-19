/**
 * Erreurs de saisie dans l'éditeur de bons de commande (cas communs : ../erreurs.mjs).
 */
import { erreursDeSaisie } from "../erreurs.mjs";

erreursDeSaisie({
  describe: "Bons de commande : erreurs de saisie",
  editeur: "/dashboard/outils/bons-commande/new",
  collection: "purchaseorders",
  boutonCreer: "Créer le bon de commande",
  nom: "le bon de commande",
  messageSansArticle: "Veuillez ajouter au moins un article au bon de commande",
  messageBrouillonRefuse: "Le brouillon n'a pas pu être enregistré",
});
