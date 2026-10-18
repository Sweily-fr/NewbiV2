/**
 * Erreurs de saisie dans l'éditeur de devis (cas communs : ../erreurs.mjs).
 */
import { erreursDeSaisie } from "../erreurs.mjs";

erreursDeSaisie({
  describe: "Devis : erreurs de saisie",
  editeur: "/dashboard/outils/devis/new",
  collection: "quotes",
  boutonCreer: "Créer le devis",
  nom: "le devis",
  messageSansArticle: "Veuillez ajouter au moins un article au devis",
  messageBrouillonRefuse: "Le brouillon n'a pas pu être enregistré",
});
