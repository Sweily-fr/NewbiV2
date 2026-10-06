/**
 * Image d'une ligne de document (facture, devis, BC, avoir, BL), recopiée
 * depuis la fiche produit du catalogue au moment où le produit est choisi,
 * avec son choix d'affichage (`showImage`, absent = affichée).
 * À transporter partout où une ligne est recopiée (chargement, conversion
 * devis → facture, modèles, enregistrement).
 */
export function pickItemImage(item) {
  if (!item?.imageUrl) return {};
  return {
    imageUrl: item.imageUrl,
    ...(typeof item.showImage === "boolean" && { showImage: item.showImage }),
  };
}

/**
 * Image à recopier sur une ligne quand on choisit un produit du catalogue.
 * L'image suit toujours la ligne ; « Afficher sur les documents » de la fiche
 * produit ne fait que régler son affichage par défaut, modifiable ligne par
 * ligne dans le document.
 */
export function productItemImage(product) {
  if (!product?.imageUrl) return {};
  return {
    imageUrl: product.imageUrl,
    showImage: product.showImageOnDocuments !== false,
  };
}

/**
 * Image à imprimer sur l'aperçu et le PDF : aucune si la ligne l'a masquée.
 */
export function visibleItemImage(item) {
  return item?.imageUrl && item.showImage !== false ? item.imageUrl : null;
}
