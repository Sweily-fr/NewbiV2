/**
 * Produits liés du catalogue.
 *
 * Un produit peut déclarer d'autres produits du catalogue avec une quantité.
 * Quand l'utilisateur sélectionne ce produit dans une facture, un devis ou un
 * bon de commande, les produits liés sont ajoutés comme lignes supplémentaires
 * avec la quantité paramétrée (un seul niveau : les produits liés d'un produit
 * lié ne sont pas propagés).
 */

/**
 * Transforme les produits liés d'un produit du catalogue en lignes de document.
 * Les liens dont le produit cible n'existe plus sont ignorés.
 *
 * @param {object} product - produit tel que renvoyé par GET_PRODUCTS
 * @returns {Array<object>} lignes prêtes pour addItem()
 */
export function buildLinkedItems(product) {
  const links = product?.linkedProducts || [];
  return links
    .filter((link) => link && link.product)
    .map((link) => {
      const target = link.product;
      return {
        description: target.name || "",
        details: target.description || "",
        quantity: Number(link.quantity) > 0 ? Number(link.quantity) : 1,
        unitPrice: target.unitPrice || 0,
        vatRate: target.vatRate !== undefined && target.vatRate !== null ? target.vatRate : 20,
        unit: target.unit || "unité",
        productId: target.id,
      };
    });
}

/**
 * Message de confirmation après ajout automatique des produits liés.
 */
export function linkedItemsAddedMessage(count, parentName) {
  const plural = count > 1;
  const base = plural
    ? `${count} produits liés ajoutés`
    : "1 produit lié ajouté";
  return parentName ? `${base} avec « ${parentName} »` : base;
}
