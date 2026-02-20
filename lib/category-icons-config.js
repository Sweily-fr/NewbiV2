import {
  ShoppingBag,
  Plane,
  UtensilsCrossed,
  Hotel,
  Code,
  Laptop,
  Briefcase,
  Megaphone,
  Receipt,
  Home,
  Zap,
  Users,
  Shield,
  Wrench,
  GraduationCap,
  CreditCard,
  MoreHorizontal,
  FileText,
  Percent,
  RotateCcw,
  Phone,
  Flame,
  Truck,
} from "lucide-react";

// Configuration des catégories avec icônes et couleurs
export const CATEGORY_CONFIG = {
  OFFICE_SUPPLIES: {
    label: "Fournitures",
    icon: ShoppingBag,
    color: "#eab308", // Yellow-500
    bgColor: "#fef9c3", // Yellow-100
  },
  TRAVEL: {
    label: "Transport",
    icon: Plane,
    color: "#8b5cf6", // Violet-500
    bgColor: "#ede9fe", // Violet-100
  },
  MEALS: {
    label: "Repas",
    icon: UtensilsCrossed,
    color: "#f97316", // Orange-500
    bgColor: "#ffedd5", // Orange-100
  },
  ACCOMMODATION: {
    label: "Hébergement",
    icon: Hotel,
    color: "#06b6d4", // Cyan-500
    bgColor: "#cffafe", // Cyan-100
  },
  SOFTWARE: {
    label: "Logiciels",
    icon: Code,
    color: "#3b82f6", // Blue-500
    bgColor: "#dbeafe", // Blue-100
  },
  HARDWARE: {
    label: "Matériel",
    icon: Laptop,
    color: "#64748b", // Slate-500
    bgColor: "#f1f5f9", // Slate-100
  },
  SERVICES: {
    label: "Services",
    icon: Briefcase,
    color: "#8b5cf6", // Violet-500
    bgColor: "#ede9fe", // Violet-100
  },
  MARKETING: {
    label: "Marketing",
    icon: Megaphone,
    color: "#ec4899", // Pink-500
    bgColor: "#fce7f3", // Pink-100
  },
  TAXES: {
    label: "Taxes",
    icon: Receipt,
    color: "#a855f7", // Purple-500
    bgColor: "#f3e8ff", // Purple-100
  },
  RENT: {
    label: "Loyer",
    icon: Home,
    color: "#ef4444", // Red-500
    bgColor: "#fee2e2", // Red-100
  },
  UTILITIES: {
    label: "Charges",
    icon: Zap,
    color: "#14b8a6", // Teal-500
    bgColor: "#ccfbf1", // Teal-100
  },
  SALARIES: {
    label: "Salaires",
    icon: Users,
    color: "#f59e0b", // Amber-500
    bgColor: "#fef3c7", // Amber-100
  },
  INSURANCE: {
    label: "Assurance",
    icon: Shield,
    color: "#6366f1", // Indigo-500
    bgColor: "#e0e7ff", // Indigo-100
  },
  MAINTENANCE: {
    label: "Maintenance",
    icon: Wrench,
    color: "#84cc16", // Lime-500
    bgColor: "#ecfccb", // Lime-100
  },
  TRAINING: {
    label: "Formation",
    icon: GraduationCap,
    color: "#10b981", // Emerald-500
    bgColor: "#d1fae5", // Emerald-100
  },
  SUBSCRIPTIONS: {
    label: "Abonnements",
    icon: CreditCard,
    color: "#0ea5e9", // Sky-500
    bgColor: "#e0f2fe", // Sky-100
  },
  TAXES_DUTIES: {
    label: "Impôts et taxes",
    icon: FileText,
    color: "#dc2626", // Red-600
    bgColor: "#fee2e2", // Red-100
  },
  VAT: {
    label: "TVA",
    icon: Percent,
    color: "#7c3aed", // Violet-600
    bgColor: "#ede9fe", // Violet-100
  },
  REFUNDS: {
    label: "Avoirs / Remboursement",
    icon: RotateCcw,
    color: "#059669", // Emerald-600
    bgColor: "#d1fae5", // Emerald-100
  },
  TELECOMMUNICATIONS: {
    label: "Télécom",
    icon: Phone,
    color: "#14b8a6", // Teal-500
    bgColor: "#ccfbf1", // Teal-100
  },
  ENERGY: {
    label: "Énergie",
    icon: Flame,
    color: "#eab308", // Yellow-500
    bgColor: "#fef9c3", // Yellow-100
  },
  TRANSPORT: {
    label: "Transport",
    icon: Truck,
    color: "#8b5cf6", // Violet-500
    bgColor: "#ede9fe", // Violet-100
  },
  OTHER: {
    label: "Autre",
    icon: MoreHorizontal,
    color: "#9ca3af", // Gray-400
    bgColor: "#f3f4f6", // Gray-100
  },
};

// Mapping des sous-catégories fines vers les catégories larges (pour l'affichage icône/couleur)
const SUBCATEGORY_TO_CATEGORY = {
  bureau: "OFFICE_SUPPLIES", materiel: "HARDWARE", mobilier: "OFFICE_SUPPLIES", equipement: "HARDWARE",
  transport: "TRAVEL", carburant: "TRAVEL", parking: "TRAVEL", peage: "TRAVEL",
  taxi: "TRAVEL", train: "TRAVEL", avion: "TRAVEL", location_vehicule: "TRAVEL",
  repas: "MEALS", restaurant: "MEALS", hotel: "ACCOMMODATION",
  marketing: "MARKETING", publicite: "MARKETING", communication: "MARKETING",
  telephone: "UTILITIES", internet: "UTILITIES", site_web: "SOFTWARE", reseaux_sociaux: "MARKETING",
  formation: "TRAINING", conference: "TRAINING", livres: "TRAINING", abonnement: "SUBSCRIPTIONS",
  comptabilite: "SERVICES", juridique: "SERVICES", assurance: "INSURANCE",
  banque: "SERVICES", conseil: "SERVICES", sous_traitance: "SERVICES",
  loyer: "RENT", electricite: "UTILITIES", eau: "UTILITIES", chauffage: "UTILITIES", entretien: "MAINTENANCE",
  logiciel: "SOFTWARE", saas: "SOFTWARE", licence: "SOFTWARE",
  salaire: "SALARIES", charges_sociales: "SALARIES", recrutement: "SERVICES",
  impots_taxes: "TAXES", tva: "TAXES", avoirs_remboursement: "OTHER",
  cadeaux: "OTHER", representation: "OTHER", poste: "OFFICE_SUPPLIES", impression: "OFFICE_SUPPLIES",
  autre: "OTHER",
  // Revenus
  ventes: "SALES", services: "SERVICES", honoraires: "SERVICES", commissions: "SERVICES",
  consulting: "SERVICES", abonnements_revenus: "SUBSCRIPTIONS", licences_revenus: "SOFTWARE",
  royalties: "OTHER", loyers_revenus: "RENT", interets: "OTHER", dividendes: "OTHER",
  plus_values: "OTHER", subventions: "OTHER", remboursements_revenus: "OTHER",
  indemnites: "OTHER", cadeaux_recus: "OTHER", autre_revenu: "OTHER",
};

// Labels pour les sous-catégories fines
const SUBCATEGORY_LABELS = {
  bureau: "Fournitures de bureau", materiel: "Matériel informatique", mobilier: "Mobilier", equipement: "Équipement",
  transport: "Transport", carburant: "Carburant", parking: "Parking", peage: "Péage",
  taxi: "Taxi / VTC", train: "Train", avion: "Avion", location_vehicule: "Location véhicule",
  repas: "Repas d'affaires", restaurant: "Restaurant", hotel: "Hébergement",
  marketing: "Marketing", publicite: "Publicité", communication: "Communication",
  telephone: "Téléphone", internet: "Internet", site_web: "Site web", reseaux_sociaux: "Réseaux sociaux",
  formation: "Formation", conference: "Conférence", livres: "Livres", abonnement: "Abonnements",
  comptabilite: "Comptabilité", juridique: "Services juridiques", assurance: "Assurance",
  banque: "Frais bancaires", conseil: "Conseil", sous_traitance: "Sous-traitance",
  loyer: "Loyer", electricite: "Électricité", eau: "Eau", chauffage: "Chauffage", entretien: "Entretien",
  logiciel: "Logiciels", saas: "SaaS", licence: "Licences",
  salaire: "Salaires", charges_sociales: "Charges sociales", recrutement: "Recrutement",
  impots_taxes: "Impôts et taxes", tva: "TVA", avoirs_remboursement: "Avoirs",
  cadeaux: "Cadeaux clients", representation: "Frais de représentation", poste: "Frais postaux", impression: "Impression",
  autre: "Autre",
  ventes: "Ventes", services: "Services", honoraires: "Honoraires", commissions: "Commissions",
  consulting: "Consulting", abonnements_revenus: "Abonnements", licences_revenus: "Licences",
  royalties: "Royalties", loyers_revenus: "Loyers perçus", interets: "Intérêts", dividendes: "Dividendes",
  plus_values: "Plus-values", subventions: "Subventions", remboursements_revenus: "Remboursements",
  indemnites: "Indemnités", cadeaux_recus: "Cadeaux reçus", autre_revenu: "Autre revenu",
};

/**
 * Obtient la configuration d'une catégorie (supporte les catégories larges ET les sous-catégories fines)
 * @param {string} category - Code de la catégorie (ex: "TRAVEL" ou "parking")
 * @returns {object} - Configuration de la catégorie avec icône, couleur et label
 */
export function getCategoryConfig(category) {
  // D'abord chercher dans les catégories larges
  if (CATEGORY_CONFIG[category]) {
    return CATEGORY_CONFIG[category];
  }

  // Sinon c'est une sous-catégorie fine → résoudre vers la catégorie large
  const parentCategory = SUBCATEGORY_TO_CATEGORY[category];
  if (parentCategory && CATEGORY_CONFIG[parentCategory]) {
    const parentConfig = CATEGORY_CONFIG[parentCategory];
    const subcategoryLabel = SUBCATEGORY_LABELS[category];
    return {
      ...parentConfig,
      label: subcategoryLabel || parentConfig.label,
    };
  }

  return CATEGORY_CONFIG.OTHER;
}
