/**
 * Produits liés du catalogue.
 *
 * Un produit peut déclarer d'autres produits du catalogue avec un rapport de
 * quantité : « quantity » produits liés pour « per » unités du produit
 * principal (ex. 1 pot de peinture pour 20 m²). Quand l'utilisateur
 * sélectionne ce produit dans une facture, un devis ou un bon de commande,
 * les produits liés sont ajoutés comme lignes supplémentaires et leur
 * quantité est recalculée à chaque changement de la quantité principale
 * (un seul niveau : les produits liés d'un produit lié ne sont pas propagés).
 *
 * Champs portés par les lignes de document :
 * - linkKey        : identifiant de la ligne (posé sur la ligne principale et
 *                    sur chaque ligne liée)
 * - linkedFromKey  : sur une ligne liée, linkKey de la ligne principale
 * - linkedQuantity / linkedPer / linkedRounding : règle de calcul
 */

export const LINKED_ROUNDING = {
  UP: "UP",
  DOWN: "DOWN",
  NONE: "NONE",
};

export const LINKED_ROUNDING_OPTIONS = [
  {
    value: LINKED_ROUNDING.UP,
    label: "Arrondir au supérieur",
    hint: "4,5 devient 5. Conseillé pour un produit qu'on ne coupe pas (un pot, un sac).",
  },
  {
    value: LINKED_ROUNDING.DOWN,
    label: "Arrondir à l'inférieur",
    hint: "4,5 devient 4, jamais moins de 1.",
  },
  {
    value: LINKED_ROUNDING.NONE,
    label: "Ne pas arrondir",
    hint: "4,5 reste 4,5. Pour des heures ou des mètres par exemple.",
  },
];

/** « unité » prend un s au pluriel ; les autres unités restent telles quelles. */
export function pluralUnit(unit, quantity) {
  const label = unit || "unité";
  return label === "unité" && Math.abs(Number(quantity)) > 1 ? "unités" : label;
}

export function formatQuantity(n) {
  const value = Number(n) || 0;
  return String(Math.round(value * 100) / 100).replace(".", ",");
}

/**
 * Phrase d'exemple pour une règle de produit lié, calculée sur une quantité
 * de démonstration : « Pour 90 m² de Peinture, vous obtenez 5 unités de Pot
 * de peinture (4,5 arrondi au supérieur). »
 */
export function linkedRuleExample(rule, { mainName, mainUnit, unit, sampleQuantity } = {}) {
  const per = Number(rule?.linkedPer ?? rule?.per) || 1;
  const quantity = Number(rule?.linkedQuantity ?? rule?.quantity) || 0;
  const rounding = rule?.linkedRounding ?? rule?.rounding ?? LINKED_ROUNDING.UP;
  // Quantité de démonstration : 4,5 × la base quand la base vaut au moins 2
  // (l'arrondi devient visible), sinon 10 × la base.
  const sample =
    sampleQuantity ?? Math.round(per * (per >= 2 ? 4.5 : 10) * 100) / 100;
  const raw = Math.round(((sample * quantity) / per) * 100) / 100;
  const result = computeLinkedQuantity(sample, { quantity, per, rounding });
  const mainLabel = `${formatQuantity(sample)} ${pluralUnit(mainUnit, sample)}${mainName ? ` de ${mainName}` : ""}`;
  const resultLabel = `${formatQuantity(result)} ${pluralUnit(unit, result)}`;
  let roundingNote = "";
  if (raw !== result) {
    roundingNote =
      rounding === LINKED_ROUNDING.UP
        ? ` (${formatQuantity(raw)} arrondi au supérieur)`
        : ` (${formatQuantity(raw)} arrondi à l'inférieur)`;
  }
  return `Pour ${mainLabel}, vous obtenez ${resultLabel}${roundingNote}.`;
}

/**
 * Explication d'une ligne liée dans un document :
 * « Calculée automatiquement : 1 unité pour 20 m² de Peinture ».
 */
export function linkedItemExplanation(item, parent) {
  const quantity = formatQuantity(item?.linkedQuantity ?? 1);
  const per = formatQuantity(item?.linkedPer ?? 1);
  const unit = pluralUnit(item?.unit, item?.linkedQuantity ?? 1);
  const mainUnit = pluralUnit(parent?.unit, item?.linkedPer ?? 1);
  const mainName = parent?.description ? ` de ${parent.description}` : "";
  return `Calculée automatiquement : ${quantity} ${unit} pour ${per} ${mainUnit}${mainName}`;
}

export function newLinkKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `lk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Quantité d'un produit lié pour une quantité donnée du produit principal.
 * Exemple : 1 pot pour 20 m², 90 m² → 4,5 → 5 (UP), 4 (DOWN), 4,5 (NONE).
 * L'arrondi à l'inférieur ne descend jamais sous 1 quand il en faut au moins un.
 */
export function computeLinkedQuantity(mainQuantity, rule) {
  const main = Math.abs(Number(mainQuantity)) || 0;
  const quantity = Number(rule?.linkedQuantity ?? rule?.quantity) || 0;
  const per = Number(rule?.linkedPer ?? rule?.per) || 1;
  const rounding = rule?.linkedRounding ?? rule?.rounding ?? LINKED_ROUNDING.UP;

  const raw = (main * quantity) / per;
  if (!(raw > 0)) return 0;

  // On neutralise le bruit flottant (ex. 100 × 0,1 / 1 = 10,000000000000002)
  const cleaned = Math.round(raw * 1e6) / 1e6;
  if (rounding === LINKED_ROUNDING.UP) return Math.ceil(cleaned);
  if (rounding === LINKED_ROUNDING.DOWN) return Math.max(1, Math.floor(cleaned));
  return Math.round(cleaned * 100) / 100;
}

/**
 * Transforme les produits liés d'un produit du catalogue en lignes de document,
 * calculées pour `mainQuantity` unités du produit principal et rattachées à
 * `parentKey`. Les liens dont le produit cible n'existe plus sont ignorés.
 */
export function buildLinkedItems(product, { mainQuantity = 1, parentKey } = {}) {
  const links = product?.linkedProducts || [];
  return links
    .filter((link) => link && link.product)
    .map((link) => {
      const target = link.product;
      const rule = {
        linkedQuantity: Number(link.quantity) > 0 ? Number(link.quantity) : 1,
        linkedPer: Number(link.per) > 0 ? Number(link.per) : 1,
        linkedRounding: link.rounding || LINKED_ROUNDING.UP,
      };
      return {
        description: target.name || "",
        details: target.description || "",
        quantity: computeLinkedQuantity(mainQuantity, rule),
        unitPrice: target.unitPrice || 0,
        vatRate:
          target.vatRate !== undefined && target.vatRate !== null
            ? target.vatRate
            : 20,
        unit: target.unit || "unité",
        productId: target.id,
        linkKey: newLinkKey(),
        linkedFromKey: parentKey,
        ...rule,
      };
    });
}

/**
 * Indices et nouvelles quantités des lignes liées à la ligne `parentKey`
 * quand la quantité principale devient `mainQuantity`.
 * `negative` : les quantités vivent en négatif (avoir).
 */
export function linkedQuantityUpdates(items, parentKey, mainQuantity, { negative = false } = {}) {
  if (!parentKey) return [];
  const updates = [];
  (items || []).forEach((item, index) => {
    if (!item || item.linkedFromKey !== parentKey) return;
    const quantity = computeLinkedQuantity(mainQuantity, item);
    updates.push({ index, quantity: negative ? -quantity : quantity });
  });
  return updates;
}

/**
 * Libellé de la règle d'un produit lié : « 1 pot pour 20 m² ».
 */
export function linkedRuleLabel(rule, { unit, mainUnit } = {}) {
  const quantity = Number(rule?.linkedQuantity ?? rule?.quantity) || 0;
  const per = Number(rule?.linkedPer ?? rule?.per) || 1;
  const fmt = (n) => String(n).replace(".", ",");
  const left = `${fmt(quantity)}${unit ? ` ${unit}` : ""}`;
  const right = `${fmt(per)}${mainUnit ? ` ${mainUnit}` : ""}`;
  return `${left} pour ${right}`;
}

/**
 * Champs de liaison à recopier d'une ligne vers une autre (chargement,
 * conversion devis → facture, modèles).
 */
export function pickLinkFields(item) {
  if (!item) return {};
  const out = {};
  if (item.linkKey) out.linkKey = item.linkKey;
  if (item.linkedFromKey) out.linkedFromKey = item.linkedFromKey;
  if (item.linkedQuantity !== undefined && item.linkedQuantity !== null) {
    out.linkedQuantity = item.linkedQuantity;
  }
  if (item.linkedPer !== undefined && item.linkedPer !== null) {
    out.linkedPer = item.linkedPer;
  }
  if (item.linkedRounding) out.linkedRounding = item.linkedRounding;
  return out;
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
