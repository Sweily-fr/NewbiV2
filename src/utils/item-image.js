/**
 * Image d'une ligne de document (facture, devis, BC, avoir, BL), recopiée
 * depuis la fiche produit du catalogue au moment où le produit est choisi.
 * À transporter partout où une ligne est recopiée (chargement, conversion
 * devis → facture, modèles, enregistrement).
 */
export function pickItemImage(item) {
  return item?.imageUrl ? { imageUrl: item.imageUrl } : {};
}
