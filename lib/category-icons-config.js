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
  OTHER: {
    label: "Autre",
    icon: MoreHorizontal,
    color: "#9ca3af", // Gray-400
    bgColor: "#f3f4f6", // Gray-100
  },
};

/**
 * Obtient la configuration d'une catégorie
 * @param {string} category - Code de la catégorie
 * @returns {object} - Configuration de la catégorie
 */
export function getCategoryConfig(category) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.OTHER;
}
