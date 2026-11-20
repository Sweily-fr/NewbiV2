import { addDays, differenceInCalendarDays } from "date-fns";

import { dateToDay, dayToDate } from "@/src/utils/recurrenceDays";

/**
 * Vue mois du calendrier : disposition d'une semaine. Les événements sur
 * plusieurs jours sont des barres d'un seul tenant, chacune dans un couloir
 * (une ligne) gardé du premier au dernier jour de la semaine ; les cases
 * réservent la place des couloirs, puis listent leurs autres éléments.
 * Fonctions pures, sans rendu.
 */

const isMidnight = (date) =>
  date.getHours() === 0 &&
  date.getMinutes() === 0 &&
  date.getSeconds() === 0 &&
  date.getMilliseconds() === 0;

/**
 * Dernier jour occupé (AAAA-MM-JJ) : une fin pile à minuit appartient à la
 * veille (fin exclusive des journées entières, réunion jusqu'à minuit).
 */
export function lastDayOf(event) {
  const start = new Date(event.start);
  const end = new Date(event.end ?? event.start);
  if (Number.isNaN(end.getTime()) || end < start) return dateToDay(start);
  if (end > start && isMidnight(end)) return dateToDay(addDays(end, -1));
  return dateToDay(end);
}

/** Événement dessiné en barre : il occupe au moins deux jours. */
export function spansSeveralDays(event) {
  return lastDayOf(event) > dateToDay(new Date(event.start));
}

/**
 * Barres d'une semaine (weekDays : ses 7 dates, lundi en premier).
 * Chaque barre : { event, lane, from, to, startsHere, endsHere }
 * - from / to : colonnes occupées (0 = lundi) ;
 * - startsHere / endsHere : la barre commence / finit dans les jours
 *   affichés (bouts arrondis), sinon elle continue au-delà.
 * - visible : jours affichés { from, to } (AAAA-MM-JJ) ; les jours des mois
 *   voisins restent vides, la barre s'arrête au bord du mois.
 * Les plus anciennes, puis les plus longues, prennent les premiers couloirs.
 */
export function layoutWeekBars(weekDays, events, visible = {}) {
  const weekFirst = dateToDay(weekDays[0]);
  const weekLast = dateToDay(weekDays[weekDays.length - 1]);
  const first =
    visible.from && visible.from > weekFirst ? visible.from : weekFirst;
  const last = visible.to && visible.to < weekLast ? visible.to : weekLast;
  const column = (day) => differenceInCalendarDays(dayToDate(day), weekDays[0]);

  const bars = events
    .filter(spansSeveralDays)
    .map((event) => ({
      event,
      startDay: dateToDay(new Date(event.start)),
      endDay: lastDayOf(event),
    }))
    .filter((bar) => bar.endDay >= first && bar.startDay <= last)
    .sort(
      (a, b) =>
        a.startDay.localeCompare(b.startDay) ||
        b.endDay.localeCompare(a.endDay) ||
        String(a.event.title ?? "").localeCompare(
          String(b.event.title ?? ""),
          "fr",
        ),
    );

  // Dernière colonne occupée de chaque couloir
  const laneEnds = [];
  const placed = bars.map((bar) => {
    const from = Math.max(column(first), column(bar.startDay));
    const to = Math.min(column(last), column(bar.endDay));
    let lane = laneEnds.findIndex((end) => end < from);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(to);
    } else {
      laneEnds[lane] = to;
    }
    return {
      event: bar.event,
      lane,
      from,
      to,
      startsHere: bar.startDay >= first,
      endsHere: bar.endDay <= last,
    };
  });

  return { bars: placed, laneCount: laneEnds.length };
}

// Couloirs d'une colonne : la barre de chaque couloir, ou null (place
// gardée pour l'alignement), sans les couloirs vides du bas
function laneSlotsOf(bars, column, laneLimit) {
  const slots = Array.from({ length: laneLimit }, () => null);
  for (const bar of bars) {
    if (bar.lane < laneLimit && bar.from <= column && column <= bar.to) {
      slots[bar.lane] = bar;
    }
  }
  while (slots.length && !slots[slots.length - 1]) slots.pop();
  return slots;
}

/**
 * Ce qui tient dans les cases d'une semaine.
 * - layout : résultat de layoutWeekBars ;
 * - singlesByColumn : autres éléments de chaque jour (7 listes) ;
 * - capacity : lignes qui tiennent dans une case (Infinity tant qu'elle
 *   n'est pas mesurée).
 * Renvoie { barLanes, cells } : barLanes = couloirs dessinés (les barres au
 * delà sont comptées dans « + N ») ; pour chaque case { laneSlots, singles,
 * hiddenCount }.
 */
export function fitWeek({ layout, singlesByColumn, capacity }) {
  const { bars, laneCount } = layout;
  const columns = singlesByColumn.length;

  // Tous les couloirs si chaque case tient ; sinon une ligne est laissée
  // à « + N »
  const overflows = singlesByColumn.some(
    (singles, column) =>
      laneSlotsOf(bars, column, laneCount).length + singles.length > capacity,
  );
  const barLanes = overflows
    ? Math.min(laneCount, Math.max(capacity - 1, 0))
    : laneCount;

  const cells = Array.from({ length: columns }, (_, column) => {
    const singles = singlesByColumn[column];
    const laneSlots = laneSlotsOf(bars, column, barLanes);
    const hiddenBars = bars.filter(
      (bar) => bar.lane >= barLanes && bar.from <= column && column <= bar.to,
    ).length;
    const room = capacity - laneSlots.length;
    const needMore = hiddenBars > 0 || singles.length > room;
    const shown = needMore ? Math.max(room - 1, 0) : singles.length;
    return {
      laneSlots,
      singles: singles.slice(0, shown),
      hiddenCount:
        hiddenBars + singles.length - Math.min(shown, singles.length),
    };
  });

  return { barLanes, cells };
}
