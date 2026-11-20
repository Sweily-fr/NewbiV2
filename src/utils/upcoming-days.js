import {
  APPOINTMENTS_SOURCE,
  EVENTS_SOURCE,
  LINKED_KINDS,
  isAppointmentEvent,
  isPlainInvoiceDueEvent,
} from "@/src/utils/calendar-linked-items";
import { addDaysToDay, dateToDay, dayToDate } from "@/src/utils/recurrenceDays";

/**
 * Accueil, cadre « Les 5 prochains jours » : événements du calendrier et
 * échéances des autres pages, jour par jour. Fonctions pures, sans rendu.
 * Mêmes sources que le calendrier, filtrées par le choix fait dans son menu
 * Filtres (gardé dans le navigateur).
 */

export const UPCOMING_DAY_COUNT = 5;

/** Jours AAAA-MM-JJ à partir d'aujourd'hui (heure locale). */
export function upcomingDays(now = new Date(), count = UPCOMING_DAY_COUNT) {
  const first = dateToDay(now);
  return Array.from({ length: count }, (_, index) =>
    addDaysToDay(first, index),
  );
}

const pad = (n) => String(n).padStart(2, "0");
const timeOf = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

// Ordre dans une journée : toute la journée, échéances fiscales, rendez-vous
// et événements à l'heure, puis les autres échéances dans l'ordre des sources
const RANK_ALL_DAY = 0;
const RANK_FISCAL = 1;
const RANK_TIMED = 2;
const RANK_LINKED = 3;

function eventEntries(event, day) {
  const start = new Date(event.start);
  const end = new Date(event.end ?? event.start);
  if (Number.isNaN(start.getTime())) return null;
  const dayStart = dayToDate(day);
  const dayEnd = dayToDate(addDaysToDay(day, 1));
  // Un événement qui finit pile à minuit n'occupe pas le jour suivant
  const endsBefore = event.allDay ? end < dayStart : end <= dayStart;
  if (start >= dayEnd || (endsBefore && start < dayStart)) return null;

  const startsToday = start >= dayStart;
  const timed = !event.allDay && startsToday;
  // « 14:00 – 15:30 », ou l'heure de début seule si la fin tombe un autre
  // jour ou n'est pas après le début
  const endsSameDay = end > start && end <= dayEnd;
  let detail = "Toute la journée";
  if (timed) {
    detail = endsSameDay
      ? `${timeOf(start)} – ${timeOf(end)}`
      : `À partir de ${timeOf(start)}`;
  } else if (!event.allDay && !startsToday) {
    detail = "Suite";
  }
  return {
    key: `event:${event.id}:${day}`,
    type: "event",
    day,
    // Heure de début seule, pour les étiquettes de l'accueil
    time: timed ? timeOf(start) : null,
    event,
    title: event.title || "Sans titre",
    detail,
    isAppointment: isAppointmentEvent(event),
    rank: timed ? RANK_TIMED : RANK_ALL_DAY,
    minutes: timed ? start.getHours() * 60 + start.getMinutes() : 0,
  };
}

/**
 * Entrées de chaque jour, triées.
 * - events : événements du calendrier (start, end, allDay, type…) ;
 * - linkedItems : échéances (calendarLinkedItems), `day` AAAA-MM-JJ ;
 * - hiddenSources : sources masquées dans le calendrier ;
 * - linkedUnavailable : échéances indisponibles, les copies de factures
 *   enregistrées comme événements restent alors affichées.
 * Les échéances réglées (facture payée, tâche terminée, déclaration
 * confirmée) ne sont pas reprises : le cadre montre ce qui reste à faire.
 */
export function buildUpcomingDays({
  days,
  events = [],
  linkedItems = [],
  hiddenSources = new Set(),
  linkedUnavailable = false,
}) {
  const showEvents = !hiddenSources.has(EVENTS_SOURCE);
  const showAppointments = !hiddenSources.has(APPOINTMENTS_SOURCE);
  const visibleEvents = events.filter((event) => {
    if (isAppointmentEvent(event)) return showAppointments;
    if (!linkedUnavailable && isPlainInvoiceDueEvent(event)) return false;
    return showEvents;
  });

  return days.map((day) => {
    const entries = [];
    for (const event of visibleEvents) {
      const entry = eventEntries(event, day);
      if (entry) entries.push(entry);
    }
    for (const item of linkedItems) {
      if (item.day !== day || item.state === "DONE") continue;
      if (hiddenSources.has(item.kind)) continue;
      entries.push({
        key: `linked:${item.id}`,
        type: "linked",
        day,
        item,
        title: item.title,
        rank: item.kind === "FISCAL" ? RANK_FISCAL : RANK_LINKED,
        minutes: LINKED_KINDS.indexOf(item.kind),
      });
    }
    entries.sort(
      (a, b) =>
        a.rank - b.rank ||
        a.minutes - b.minutes ||
        a.title.localeCompare(b.title, "fr"),
    );
    return { day, entries };
  });
}
