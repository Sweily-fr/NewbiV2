import {
  ArrowDownLeft,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  ChartSpline,
  CloudUpload,
  FileText,
  Repeat,
  SquareCheckBig,
  Truck,
} from "lucide-react";
import { EVENTS_SOURCE } from "@/src/utils/calendar-linked-items";

/**
 * Apparence des sources du calendrier. Chaque source a une icône propre et
 * un libellé visible : la couleur aide à repérer, elle ne porte jamais
 * seule l'information. Teintes validées (contraste, daltonisme) dans
 * l'ordre de LINKED_KINDS, avec leur variante pour le thème sombre.
 * Classes écrites en entier pour que Tailwind les génère.
 */
export const LINKED_SOURCE_META = {
  [EVENTS_SOURCE]: {
    label: "Événements",
    icon: CalendarDays,
    dot: "bg-muted-foreground/60",
    iconClass: "text-muted-foreground",
    accent: "bg-muted-foreground/40",
    tint: "bg-muted/60",
  },
  INVOICE: {
    label: "Encaissements",
    noun: "Facture de vente",
    description: "Paiement attendu du client",
    openLabel: "Ouvrir la facture",
    icon: ArrowDownLeft,
    hex: "#1baf7a",
    dot: "bg-[#1baf7a] dark:bg-[#199e70]",
    iconClass: "text-[#1baf7a] dark:text-[#199e70]",
    accent: "bg-[#1baf7a] dark:bg-[#199e70]",
    tint: "bg-[#1baf7a]/10 dark:bg-[#199e70]/15",
    states: {
      UPCOMING: "À encaisser",
      OVERDUE: "En retard",
      DONE: "Payée",
    },
  },
  PURCHASE_INVOICE: {
    label: "Paiements",
    noun: "Facture d'achat",
    description: "Paiement dû au fournisseur",
    openLabel: "Ouvrir la facture d'achat",
    icon: ArrowUpRight,
    hex: "#eb6834",
    dot: "bg-[#eb6834] dark:bg-[#d95926]",
    iconClass: "text-[#eb6834] dark:text-[#d95926]",
    accent: "bg-[#eb6834] dark:bg-[#d95926]",
    tint: "bg-[#eb6834]/10 dark:bg-[#d95926]/15",
    states: {
      UPCOMING: "À payer",
      OVERDUE: "En retard",
      DONE: "Payée",
    },
  },
  FORECAST: {
    label: "Prévisions",
    noun: "Prévision",
    description: "Mouvement attendu sur le compte",
    openLabel: "Ouvrir la prévision",
    icon: ChartSpline,
    // Neutre : une prévision est une estimation, la grille la dessine en
    // pointillés à la couleur du sens (rentrée ou sortie)
    hex: "#64748b",
    dot: "bg-slate-500 dark:bg-slate-400",
    iconClass: "text-slate-500 dark:text-slate-400",
    accent: "bg-slate-400 dark:bg-slate-500",
    tint: "bg-slate-500/10 dark:bg-slate-400/15",
    states: {
      UPCOMING: "Prévu",
      OVERDUE: "Prévu",
      DONE: "Date passée",
    },
  },
  QUOTE: {
    label: "Devis",
    noun: "Devis",
    alertLabel: "validité dépassée",
    description: "Fin de validité, devis sans réponse",
    openLabel: "Ouvrir le devis",
    icon: FileText,
    hex: "#6250d6",
    dot: "bg-[#6250d6] dark:bg-[#9085e9]",
    iconClass: "text-[#6250d6] dark:text-[#9085e9]",
    accent: "bg-[#6250d6] dark:bg-[#9085e9]",
    tint: "bg-[#6250d6]/10 dark:bg-[#9085e9]/15",
    states: {
      UPCOMING: "En attente de réponse",
      OVERDUE: "Validité dépassée",
      DONE: "Traité",
    },
  },
  REMINDER: {
    label: "Relances",
    noun: "Relance automatique",
    description: "Rappel de paiement envoyé au client",
    openLabel: "Ouvrir la facture",
    alertLabel: "en échec",
    icon: BellRing,
    hex: "#e87ba4",
    dot: "bg-[#e87ba4] dark:bg-[#d55181]",
    iconClass: "text-[#e87ba4] dark:text-[#d55181]",
    accent: "bg-[#e87ba4] dark:bg-[#d55181]",
    tint: "bg-[#e87ba4]/10 dark:bg-[#d55181]/15",
    states: {
      UPCOMING: "Envoi prévu",
      OVERDUE: "Échec de l'envoi",
      DONE: "Envoyée",
    },
  },
  RECURRING_INVOICE: {
    label: "Récurrences",
    noun: "Facture récurrente",
    description: "Émission et envoi automatiques",
    openLabel: "Voir la facture modèle",
    icon: Repeat,
    hex: "#eda100",
    dot: "bg-[#eda100] dark:bg-[#c98500]",
    iconClass: "text-[#eda100] dark:text-[#c98500]",
    accent: "bg-[#eda100] dark:bg-[#c98500]",
    tint: "bg-[#eda100]/10 dark:bg-[#c98500]/15",
    states: {
      UPCOMING: "Émission prévue",
      OVERDUE: "Émission en attente",
      DONE: "Émise",
    },
  },
  DELIVERY: {
    label: "Livraisons",
    noun: "Livraison",
    description: "Livraison prévue au client",
    openLabel: "Ouvrir le document",
    icon: Truck,
    hex: "#008300",
    dot: "bg-[#008300]",
    iconClass: "text-[#008300] dark:text-[#2ea043]",
    accent: "bg-[#008300]",
    tint: "bg-[#008300]/10 dark:bg-[#008300]/20",
    states: {
      UPCOMING: "À livrer",
      OVERDUE: "Livraison en retard",
      DONE: "Livrée",
    },
  },
  TASK: {
    label: "Tâches",
    noun: "Tâche",
    description: "Échéance dans un projet",
    openLabel: "Ouvrir la tâche",
    icon: SquareCheckBig,
    hex: "#2a78d6",
    dot: "bg-[#2a78d6] dark:bg-[#3987e5]",
    iconClass: "text-[#2a78d6] dark:text-[#3987e5]",
    accent: "bg-[#2a78d6] dark:bg-[#3987e5]",
    tint: "bg-[#2a78d6]/10 dark:bg-[#3987e5]/15",
    states: {
      UPCOMING: "À rendre",
      OVERDUE: "En retard",
      DONE: "Terminée",
    },
  },
  FILE_TRANSFER: {
    label: "Transferts",
    noun: "Transfert de fichiers",
    description: "Fin du lien de téléchargement",
    openLabel: "Ouvrir les transferts",
    icon: CloudUpload,
    hex: "#a0522d",
    dot: "bg-[#a0522d] dark:bg-[#b5653a]",
    iconClass: "text-[#a0522d] dark:text-[#b5653a]",
    accent: "bg-[#a0522d] dark:bg-[#b5653a]",
    tint: "bg-[#a0522d]/10 dark:bg-[#b5653a]/15",
    states: {
      UPCOMING: "Lien actif",
      OVERDUE: "Lien actif",
      DONE: "Expiré",
    },
  },
};

export const PRIORITY_LABELS = {
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

/**
 * État affiché : la colonne de la tâche tant qu'elle n'est ni terminée ni
 * en retard (« En cours », « En attente »…), sinon le libellé de la source.
 */
export function linkedStateLabel(item) {
  const meta = LINKED_SOURCE_META[item?.kind];
  if (item?.kind === "TASK" && item.state === "UPCOMING" && item.columnTitle) {
    return item.columnTitle;
  }
  if (item?.kind === "REMINDER" && item.reminderStatus === "NO_EMAIL") {
    return "Adresse e-mail manquante";
  }
  if (item?.kind === "FORECAST" && item.state !== "DONE") {
    return item.flowType === "INCOME" ? "Rentrée prévue" : "Sortie prévue";
  }
  return meta?.states?.[item?.state] || null;
}

// « Relance 1 », « Bon de livraison »… : précision sous le nom de la source
export function linkedKindDetail(item) {
  switch (item?.kind) {
    case "REMINDER":
      return item.reminderStep === 0
        ? "Relance manuelle"
        : item.reminderStep === 2
          ? "2e relance"
          : "1re relance";
    case "DELIVERY":
      return item.documentKind === "DELIVERY_NOTE"
        ? "Bon de livraison"
        : "Bon de commande";
    case "FORECAST":
      return item.forecastOrigin === "MANUAL"
        ? "Saisie de la Prévision"
        : "Récurrence détectée";
    default:
      return null;
  }
}
