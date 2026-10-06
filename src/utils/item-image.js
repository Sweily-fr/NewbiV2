/**
 * Image d'une ligne de document (facture, devis, BC, avoir, BL), recopiée
 * depuis la fiche produit du catalogue au moment où le produit est choisi.
 * À transporter partout où une ligne est recopiée (chargement, conversion
 * devis → facture, modèles, enregistrement).
 */
export function pickItemImage(item) {
  return item?.imageUrl ? { imageUrl: item.imageUrl } : {};
}

/**
 * Image à recopier sur une ligne quand on choisit un produit du catalogue :
 * aucune si la fiche produit a désactivé « Afficher sur les documents ».
 */
export function documentImageUrl(product) {
  if (!product?.imageUrl || product.showImageOnDocuments === false) {
    return undefined;
  }
  return product.imageUrl;
}
