import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { dateToDay, dayToDate } from "@/src/utils/recurrenceDays";

/**
 * Échéances des autres pages affichées dans le calendrier (requête
 * calendarLinkedItems) : factures de vente et d'achat, devis en attente,
 * factures récurrentes et tâches. Fonctions pures, sans rendu.
 */

// Ordre de la barre des sources (palette validée dans cet ordre)
export const LINKED_KINDS = [
  "INVOICE",
  "PURCHASE_INVOICE",
  "FORECAST",
  "QUOTE",
  "REMINDER",
  "RECURRING_INVOICE",
  "DELIVERY",
  "TASK",
  "FILE_TRANSFER",
  "FISCAL",
];

// Clé des événements du calendrier dans la barre des sources
export const EVENTS_SOURCE = "EVENTS";

// Le calendrier commence la semaine le dimanche (vues mois et semaine)
const WEEK_OPTIONS = { weekStartsOn: 0 };

/**
 * Jours visibles d'une vue, bornes incluses, au format AAAA-MM-JJ.
 */
export function visibleRange(view, currentDate, agendaDays = 30) {
  switch (view) {
    case "semaine":
      return {
        from: dateToDay(startOfWeek(currentDate, WEEK_OPTIONS)),
        to: dateToDay(endOfWeek(currentDate, WEEK_OPTIONS)),
      };
    case "jour":
      return { from: dateToDay(currentDate), to: dateToDay(currentDate) };
    case "agenda":
      return {
        from: dateToDay(currentDate),
        to: dateToDay(addDays(currentDate, agendaDays - 1)),
      };
    default:
      return {
        from: dateToDay(startOfWeek(startOfMonth(currentDate), WEEK_OPTIONS)),
        to: dateToDay(endOfWeek(endOfMonth(currentDate), WEEK_OPTIONS)),
      };
  }
}

/**
 * Période des totaux : le mois en vue mois (sans les jours des mois
 * voisins affichés autour), sinon les jours visibles.
 */
export function summaryRange(view, currentDate, agendaDays = 30) {
  if (view === "mois") {
    return {
      from: dateToDay(startOfMonth(currentDate)),
      to: dateToDay(endOfMonth(currentDate)),
    };
  }
  return visibleRange(view, currentDate, agendaDays);
}

/**
 * Élément lié → événement journée entière du calendrier, en lecture seule.
 * `linked` garde l'élément complet pour le rendu et la fiche.
 */
export function linkedItemToEvent(item) {
  const date = dayToDate(item.day);
  return {
    id: item.id,
    title: item.title,
    start: date,
    end: date,
    allDay: true,
    isReadOnly: true,
    source: "newbi",
    type: `LINKED_${item.kind}`,
    linked: item,
  };
}

/**
 * Échéance de facture copiée dans les événements à la création de la
 * facture : remplacée par l'échéance relue dans la facture (statut à jour),
 * sauf si quelqu'un l'a enrichie (membres assignés, rappel par e-mail).
 */
export function isPlainInvoiceDueEvent(event) {
  return (
    event?.type === "INVOICE_DUE" &&
    !(event.assignedMembers?.length > 0) &&
    !event.emailReminder?.enabled
  );
}

const isEuro = (item) => !item.currency || item.currency === "EUR";

/**
 * Totaux par source sur [from, to] : montants en euros des éléments à
 * régler (en retard compris) et déjà réglés ; les montants dans une autre
 * devise sont comptés à part, jamais additionnés aux euros.
 */
export function summarizeLinkedItems(items, { from, to }) {
  const byKind = {};
  for (const kind of LINKED_KINDS) {
    byKind[kind] = {
      count: 0,
      openCount: 0,
      overdueCount: 0,
      doneCount: 0,
      openAmount: 0,
      overdueAmount: 0,
      doneAmount: 0,
      foreignCount: 0,
      // Prévisions : rentrées et sorties à venir, séparées
      incomeAmount: 0,
      expenseAmount: 0,
      incomeCount: 0,
      expenseCount: 0,
      // Relances prévues qui ne pourront pas partir (pas d'adresse e-mail)
      noEmailCount: 0,
    };
  }

  for (const item of items || []) {
    if (item.day < from || item.day > to) continue;
    const stats = byKind[item.kind];
    if (!stats) continue;
    stats.count += 1;
    const hasAmount = Number.isFinite(item.amount);
    if (hasAmount && !isEuro(item)) stats.foreignCount += 1;
    const amount = hasAmount && isEuro(item) ? item.amount : 0;
    if (item.state === "DONE") {
      stats.doneCount += 1;
      stats.doneAmount += amount;
    } else {
      stats.openCount += 1;
      stats.openAmount += amount;
      if (item.flowType === "INCOME") {
        stats.incomeAmount += amount;
        stats.incomeCount += 1;
      }
      if (item.flowType === "EXPENSE") {
        stats.expenseAmount += amount;
        stats.expenseCount += 1;
      }
      if (item.reminderStatus === "NO_EMAIL") stats.noEmailCount += 1;
      if (item.state === "OVERDUE") {
        stats.overdueCount += 1;
        stats.overdueAmount += amount;
      }
    }
  }

  return { byKind };
}

/**
 * Page qui ouvre l'élément (paramètres déjà lus par chaque page).
 */
export function linkedItemHref(item) {
  switch (item?.kind) {
    case "INVOICE":
      return `/dashboard/outils/factures?id=${item.entityId}`;
    case "RECURRING_INVOICE":
      return item.sourceInvoiceId
        ? `/dashboard/outils/factures?id=${item.sourceInvoiceId}`
        : "/dashboard/outils/factures";
    case "QUOTE":
      return `/dashboard/outils/devis?id=${item.entityId}`;
    case "PURCHASE_INVOICE":
      return `/dashboard/outils/factures-achat?id=${item.entityId}`;
    case "TASK":
      return item.boardId
        ? `/dashboard/outils/kanban/${item.boardId}?task=${item.entityId}`
        : "/dashboard/outils/kanban";
    // La relance ouvre sa facture
    case "REMINDER":
      return `/dashboard/outils/factures?id=${item.entityId}`;
    case "FORECAST":
      return "/dashboard/outils/prevision";
    case "DELIVERY":
      return item.documentKind === "DELIVERY_NOTE"
        ? `/dashboard/outils/bons-de-livraison?id=${item.entityId}`
        : `/dashboard/outils/bons-commande?id=${item.entityId}`;
    case "FILE_TRANSFER":
      return "/dashboard/outils/transferts-fichiers";
    default:
      return null;
  }
}

/**
 * « Aujourd'hui », « Demain », « Dans 3 jours », « Hier », « Il y a 5 jours »
 * (en retard : « En retard de 5 jours »).
 */
export function relativeDayLabel(day, state, today = new Date()) {
  const diff = differenceInCalendarDays(dayToDate(day), today);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  if (diff > 1) return `Dans ${diff} jours`;
  const days = -diff;
  if (state === "OVERDUE") {
    return days === 1 ? "En retard d'un jour" : `En retard de ${days} jours`;
  }
  return days === 1 ? "Hier" : `Il y a ${days} jours`;
}

const currencyFormatters = new Map();

/**
 * Montant en devise, arrondi à l'euro pour les puces (`compact`) ou au
 * centime pour la fiche.
 */
export function formatLinkedAmount(amount, currency = "EUR", { compact } = {}) {
  if (!Number.isFinite(amount)) return null;
  const key = `${currency}:${compact ? 0 : 2}`;
  let formatter = currencyFormatters.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: currency || "EUR",
        minimumFractionDigits: compact ? 0 : 2,
        maximumFractionDigits: compact ? 0 : 2,
      });
    } catch {
      // Code devise inconnu : montant seul suivi du code
      formatter = {
        format: (value) =>
          `${new Intl.NumberFormat("fr-FR", {
            maximumFractionDigits: compact ? 0 : 2,
          }).format(value)} ${currency}`,
      };
    }
    currencyFormatters.set(key, formatter);
  }
  return formatter.format(amount);
}

/**
 * Nom de la période résumée : `title` après le nom d'une source
 * (« Encaissements en octobre »), `of` après « Solde prévu » (« d'octobre »).
 */
export function periodNames(view, currentDate, agendaDays = 30) {
  switch (view) {
    case "semaine":
      return { title: "sur la semaine", of: "de la semaine" };
    case "jour":
      return { title: "ce jour-là", of: "du jour" };
    case "agenda":
      return {
        title: `sur ${agendaDays} jours`,
        of: `des ${agendaDays} jours`,
      };
    default: {
      const month = format(currentDate, "MMMM", { locale: fr });
      return {
        title: `en ${month}`,
        of: /^[aeiouyâàéèêîïôûœ]/i.test(month) ? `d'${month}` : `de ${month}`,
      };
    }
  }
}

const longDate = (day) =>
  format(dayToDate(day), "EEEE d MMMM yyyy", { locale: fr });

/**
 * Événement proposé par « Me rappeler » depuis la fiche d'une échéance :
 * titre d'action et rappel de la date et du montant.
 */
export function linkedReminderDraft(item) {
  const who = item.counterparty || item.title;
  const ref = item.reference ? ` (${item.reference})` : "";
  const amount = formatLinkedAmount(item.amount, item.currency || "EUR");
  const details = (label) =>
    [`${label} le ${longDate(item.day)}`, amount].filter(Boolean).join(" · ");
  switch (item.kind) {
    case "INVOICE":
    case "REMINDER":
      return {
        title: `Relancer ${who}${ref}`,
        description: details("Échéance de paiement"),
      };
    case "PURCHASE_INVOICE":
      return {
        title: `Payer ${who}${ref}`,
        description: details("Échéance de paiement"),
      };
    case "QUOTE":
      return {
        title: `Relancer ${who} pour le devis${ref}`,
        description: details("Fin de validité"),
      };
    case "RECURRING_INVOICE":
      return {
        title: `Vérifier la facture récurrente de ${who}`,
        description: details("Émission prévue"),
      };
    case "DELIVERY":
      return {
        title: `Préparer la livraison de ${who}${ref}`,
        description: details("Livraison prévue"),
      };
    case "FILE_TRANSFER":
      return {
        title: `Transfert « ${item.title} » : prolonger ou relancer`,
        description: details("Expiration du lien"),
      };
    case "FORECAST":
      return {
        title: `Vérifier : ${item.title}`,
        description: details("Mouvement prévu"),
      };
    case "FISCAL":
      return {
        title: `Préparer : ${item.title}${ref}`,
        description: details(
          item.isIndicative ? "Date limite indicative" : "Date limite",
        ),
      };
    case "TASK":
    default:
      return {
        title: `Suivre « ${item.title} »`,
        description: details("Échéance"),
      };
  }
}

/**
 * Échéance fiscale : page officielle à ouvrir dans un nouvel onglet. Seules
 * les adresses https sont gardées (lien externe affiché tel quel).
 */
export function linkedItemExternalUrl(item) {
  if (item?.kind !== "FISCAL" || typeof item.infoUrl !== "string") return null;
  try {
    const url = new URL(item.infoUrl);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Échéances fiscales masquées faute d'informations légales, sans doublon
 * (« TVA », « Impôt sur les sociétés »…). Liste vide quand rien ne manque.
 */
export function fiscalMissingConcerns(setup) {
  const concerns = [];
  for (const missing of setup?.missing || []) {
    for (const concern of missing.concerns || []) {
      if (!concerns.includes(concern)) concerns.push(concern);
    }
  }
  return concerns;
}
