// Libellés de périodicité partagés entre la liste des récurrences détectées
// et le dialogue « Modifier la récurrence ».

// Les libellés de catégorie viennent de lib/category-icons-config.js
// (getCategoryLabel), même source que les pages Transactions et Factures
// d'achat.

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
