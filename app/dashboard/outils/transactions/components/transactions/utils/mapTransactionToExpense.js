import { getTransactionCategory } from "@/lib/bank-categories-config";

// Mapping des noms de catégories (bank-categories-config) vers les clés (category-icons-config)
const categoryNameToKey = {
  // Alimentation
  Alimentation: "MEALS",
  Restaurants: "MEALS",
  Courses: "MEALS",

  // Transport
  Transport: "TRAVEL",
  Carburant: "TRAVEL",
  "Transports en commun": "TRAVEL",
  "Taxi/VTC": "TRAVEL",
  Parking: "TRAVEL",

  // Logement
  Logement: "ACCOMMODATION",
  Loyer: "RENT",
  Charges: "UTILITIES",
  "Assurance habitation": "INSURANCE",

  // Loisirs
  Loisirs: "OTHER",
  Sorties: "OTHER",
  Voyages: "TRAVEL",
  Sport: "OTHER",

  // Santé
  Santé: "SERVICES",
  Médecin: "SERVICES",
  Pharmacie: "SERVICES",
  Mutuelle: "INSURANCE",

  // Shopping
  Shopping: "OFFICE_SUPPLIES",
  Vêtements: "OTHER",
  "High-tech": "HARDWARE",
  Maison: "OFFICE_SUPPLIES",

  // Services
  Services: "SERVICES",
  "Téléphone/Internet": "SUBSCRIPTIONS",
  Abonnements: "SUBSCRIPTIONS",
  Banque: "SERVICES",

  // Impôts
  "Impôts & Taxes": "TAXES",
  "Impôt sur le revenu": "TAXES",
  "Taxe foncière": "TAXES",

  // Éducation
  Éducation: "TRAINING",
  Formation: "TRAINING",
  Livres: "TRAINING",

  // Revenus (pour les transactions positives)
  Salaire: "OTHER",
  Prime: "OTHER",
  Remboursement: "OTHER",
  "Revenus professionnels": "SERVICES",
  Facturation: "SERVICES",
  Honoraires: "SERVICES",
  "Aides & Allocations": "OTHER",
  CAF: "OTHER",
  "Pôle Emploi": "OTHER",
  Investissements: "OTHER",
  Dividendes: "OTHER",
  Intérêts: "OTHER",
  "Virements reçus": "OTHER",
  "Virement interne": "OTHER",
  "Autre revenu": "OTHER",

  // Autre
  Autre: "OTHER",
  "Non catégorisé": "OTHER",
};

// Clés de catégories valides (hors "OTHER")
const SPECIFIC_CATEGORY_KEYS = [
  "OFFICE_SUPPLIES",
  "TRAVEL",
  "MEALS",
  "ACCOMMODATION",
  "SOFTWARE",
  "HARDWARE",
  "SERVICES",
  "MARKETING",
  "TAXES",
  "RENT",
  "UTILITIES",
  "SALARIES",
  "INSURANCE",
  "MAINTENANCE",
  "TRAINING",
  "SUBSCRIPTIONS",
];

// Fonction pour obtenir la catégorie compatible avec category-icons-config
// Supporte les catégories larges API (TRAVEL) ET les sous-catégories fines (parking, carburant, etc.)
export const getSmartCategory = (transaction) => {
  // Si la catégorie est une valeur spécifique (pas "OTHER"/"other"/null)
  // getCategoryConfig supporte les deux formats (large et fine)
  if (
    transaction.category &&
    transaction.category !== "OTHER" &&
    transaction.category !== "other"
  ) {
    return transaction.category;
  }

  // Fallback: utiliser expenseCategory si spécifique
  if (
    transaction.expenseCategory &&
    SPECIFIC_CATEGORY_KEYS.includes(transaction.expenseCategory)
  ) {
    return transaction.expenseCategory;
  }
  if (
    transaction.metadata?.bridgeCategoryMapped &&
    SPECIFIC_CATEGORY_KEYS.includes(transaction.metadata.bridgeCategoryMapped)
  ) {
    return transaction.metadata.bridgeCategoryMapped;
  }

  // Si category est "OTHER" ou null, utiliser l'analyse intelligente basée sur la description
  const categoryInfo = getTransactionCategory(transaction);
  const categoryName = categoryInfo?.name || "Autre";
  return categoryNameToKey[categoryName] || "OTHER";
};

/**
 * Transforme une transaction (type GraphQL Transaction) vers le format
 * "expense" attendu par le tableau et les exports. Utilisé pour les items
 * de la page courante, l'export à la demande et le deep-link ?transactionId=.
 */
export const mapTransactionToExpense = (tx) => ({
  id: tx.id,
  type: tx.amount > 0 ? "INCOME" : "BANK_TRANSACTION",
  source: tx.provider === "manual" ? "MANUAL" : "BANK",
  title: tx.description,
  description: tx.description,
  // Libellé bancaire brut (conserve les références de virement que la
  // description Bridge tronque)
  reference: tx.reference || null,
  amount: tx.amount,
  currency: tx.currency,
  date: tx.processedAt || tx.date || tx.createdAt,
  category: getSmartCategory(tx),
  vendor: tx.metadata?.vendor || null,
  // N↔N : "a une facture liée" = array non vide (facture client OU facture
  // d'achat — le justificatif d'une facture d'achat liée vaut justification).
  hasReceipt:
    (Array.isArray(tx.receiptFiles) && tx.receiptFiles.length > 0) ||
    (tx.linkedInvoices?.length || 0) > 0 ||
    (tx.linkedPurchaseInvoices?.length || 0) > 0,
  receiptFiles: tx.receiptFiles || [],
  receiptRequired:
    tx.amount < 0 &&
    !(Array.isArray(tx.receiptFiles) && tx.receiptFiles.length > 0) &&
    (tx.linkedInvoices?.length || 0) === 0 &&
    (tx.linkedPurchaseInvoices?.length || 0) === 0,
  status: tx.status === "COMPLETED" ? "PAID" : tx.status?.toUpperCase(),
  paymentMethod:
    tx.metadata?.paymentMethod ||
    (tx.type === "DEBIT" ? "CARD" : "BANK_TRANSFER"),
  bankName: tx.metadata?.bankName || null,
  provider: tx.provider,
  originalTransaction: {
    id: tx.id,
    externalId: tx.externalId,
    provider: tx.provider,
    fromAccount: tx.fromAccount,
  },
  linkedInvoiceIds: tx.linkedInvoiceIds || [],
  linkedInvoices: tx.linkedInvoices || [],
  linkedPurchaseInvoiceIds: tx.linkedPurchaseInvoiceIds || [],
  linkedPurchaseInvoices: tx.linkedPurchaseInvoices || [],
  reconciliationStatus: tx.reconciliationStatus || null,
  reconciliationDate: tx.reconciliationDate || null,
  pcgAccount: tx.pcgAccount || null,
  metadata: tx.metadata || {},
  createdAt: tx.createdAt,
  updatedAt: tx.updatedAt,
});
