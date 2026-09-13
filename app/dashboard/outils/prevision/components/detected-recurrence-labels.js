// Libellés partagés entre la liste des récurrences détectées et le dialogue
// « Modifier la récurrence ».

export const CATEGORY_LABELS = {
  SALES: "Ventes",
  REFUNDS_RECEIVED: "Remboursements",
  OTHER_INCOME: "Autres revenus",
  RENT: "Loyer",
  SUBSCRIPTIONS: "Abonnements",
  OFFICE_SUPPLIES: "Fournitures",
  SERVICES: "Services",
  TRANSPORT: "Transport",
  MEALS: "Repas",
  TELECOMMUNICATIONS: "Télécom",
  INSURANCE: "Assurance",
  ENERGY: "Énergie",
  SOFTWARE: "Logiciels",
  HARDWARE: "Matériel",
  MARKETING: "Marketing",
  TRAINING: "Formation",
  MAINTENANCE: "Maintenance",
  TAXES: "Impôts & taxes",
  UTILITIES: "Charges",
  SALARIES: "Salaires",
  OTHER_EXPENSE: "Autres dépenses",
  // Catégories brutes des transactions bancaires (hors enum ForecastCategory)
  OTHER: "Autres dépenses",
  TRAVEL: "Déplacements",
  ACCOMMODATION: "Hébergement",
};

// Catégories proposées à la modification (même sens que la récurrence).
export const INCOME_CATEGORY_OPTIONS = [
  "SALES",
  "REFUNDS_RECEIVED",
  "OTHER_INCOME",
];
export const EXPENSE_CATEGORY_OPTIONS = [
  "RENT",
  "SUBSCRIPTIONS",
  "OFFICE_SUPPLIES",
  "SERVICES",
  "TRANSPORT",
  "MEALS",
  "TELECOMMUNICATIONS",
  "INSURANCE",
  "ENERGY",
  "SOFTWARE",
  "HARDWARE",
  "MARKETING",
  "TRAINING",
  "MAINTENANCE",
  "TAXES",
  "UTILITIES",
  "SALARIES",
  "OTHER_EXPENSE",
];

export const FREQUENCY_LABELS = {
  WEEKLY: "Hebdomadaire",
  BIWEEKLY: "Bi-mensuel",
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  SEMIANNUAL: "Semestriel",
  ANNUAL: "Annuel",
};

// Suffixe affiché après le montant (montant par occurrence).
export const FREQUENCY_SUFFIX = {
  WEEKLY: "/sem.",
  BIWEEKLY: "/2 sem.",
  MONTHLY: "/mois",
  QUARTERLY: "/trim.",
  SEMIANNUAL: "/semestre",
  ANNUAL: "/an",
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0);
