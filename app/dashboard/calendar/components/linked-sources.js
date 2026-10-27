import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  FileText,
  Repeat,
  SquareCheckBig,
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
  return meta?.states?.[item?.state] || null;
}
