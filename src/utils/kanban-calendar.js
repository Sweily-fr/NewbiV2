import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

// Semaines du lundi au dimanche, comme le Gantt
const WEEK_OPTIONS = { weekStartsOn: 1 };

// Heures posées quand une date est créée depuis le calendrier : mêmes valeurs
// par défaut que les sélecteurs de date de la modale de tâche
export const DEFAULT_START_TIME = [9, 0];
export const DEFAULT_DUE_TIME = [18, 0];

/**
 * Clé stable d'un jour (yyyy-MM-dd, heure locale)
 */
export function dayKey(date) {
  return format(date, "yyyy-MM-dd");
}

/**
 * Jour (minuit local) d'une clé yyyy-MM-dd
 */
export function parseDayKey(key) {
  return startOfDay(parseISO(key));
}

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : parseISO(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Jours couverts par une tâche dans le calendrier.
 * Début + échéance : de l'un à l'autre ; une seule date : ce jour-là ;
 * aucune date : null (la tâche va dans « Sans date »).
 * @param {{ startDate?: string|null, dueDate?: string|null }} dates
 * @returns {{ start: Date, end: Date } | null}
 */
export function getTaskDayRange(dates) {
  const start = toDate(dates?.startDate);
  const due = toDate(dates?.dueDate);
  if (!start && !due) return null;
  const a = startOfDay(start || due);
  const b = startOfDay(due || start);
  // Début saisi après l'échéance : on garde la plage dans le bon sens
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

/**
 * Semaines affichées : les semaines (lundi → dimanche) du mois civil (mode
 * mois), ou la semaine de la date de référence. `visible` borne les jours
 * réellement affichés : en mode mois, ceux du mois seulement (les cases des
 * mois voisins restent vides).
 * @param {Date} anchorDate
 * @param {"month"|"week"} mode
 * @returns {Array<{ start: Date, end: Date, days: Date[], visible: { start: Date, end: Date } }>}
 */
export function buildCalendarWeeks(anchorDate, mode = "month") {
  const rangeStart =
    mode === "week"
      ? startOfWeek(anchorDate, WEEK_OPTIONS)
      : startOfWeek(startOfMonth(anchorDate), WEEK_OPTIONS);
  const rangeEnd =
    mode === "week"
      ? endOfWeek(anchorDate, WEEK_OPTIONS)
      : endOfWeek(endOfMonth(anchorDate), WEEK_OPTIONS);

  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const monthStart = startOfMonth(anchorDate);
  const monthEnd = startOfDay(endOfMonth(anchorDate));
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    const weekDays = days.slice(i, i + 7);
    const start = weekDays[0];
    const end = weekDays[weekDays.length - 1];
    weeks.push({
      start,
      end,
      days: weekDays,
      visible:
        mode === "week"
          ? { start, end }
          : {
              start: start < monthStart ? monthStart : start,
              end: end > monthEnd ? monthEnd : end,
            },
    });
  }
  return weeks;
}

/**
 * Même jour `count` périodes plus tôt (négatif) ou plus tard : semaines
 * entières, ou mois civils (le 31 devient le dernier jour d'un mois plus
 * court). Toujours calculé depuis le jour de départ, pour que le 31 octobre
 * reculé de deux mois redonne le 31 août et pas le 30.
 * @param {Date} day
 * @param {"month"|"week"} mode
 * @param {number} count
 */
export function shiftDayByPeriods(day, mode, count) {
  return mode === "week" ? addDays(day, 7 * count) : addMonths(day, count);
}

/**
 * Ordre d'affichage : début le plus tôt, puis la plus longue (les barres
 * multi-jours restent en haut), puis l'ordre des colonnes et des cartes.
 */
export function compareCalendarItems(a, b) {
  const byStart = a.start - b.start;
  if (byStart !== 0) return byStart;
  const byLength = b.end - b.start - (a.end - a.start);
  if (byLength !== 0) return byLength;
  const byColumn = (a.columnIndex ?? 0) - (b.columnIndex ?? 0);
  if (byColumn !== 0) return byColumn;
  return (a.position ?? 0) - (b.position ?? 0);
}

/**
 * Découpe les tâches d'une semaine en segments et leur attribue une ligne
 * (« lane ») : chaque segment prend la première ligne libre sur toute sa
 * largeur, comme les agendas. Les segments sont coupés aux jours visibles
 * (`week.visible`, toute la semaine par défaut).
 * @param {{ start: Date, end: Date, visible?: { start: Date, end: Date } }} week
 * @param {Array<{ id: string, start: Date, end: Date }>} items - triés par compareCalendarItems
 * @returns {{ segments: Array<{ item, startCol: number, endCol: number, lane: number, continuesBefore: boolean, continuesAfter: boolean }>, laneCount: number }}
 */
export function layoutWeek(week, items) {
  const visible = week.visible || week;
  const laneEnds = []; // dernière colonne occupée par ligne
  const segments = [];

  items.forEach((item) => {
    if (item.end < visible.start || item.start > visible.end) return;
    const startCol = differenceInCalendarDays(
      item.start < visible.start ? visible.start : item.start,
      week.start,
    );
    const endCol = differenceInCalendarDays(
      item.end > visible.end ? visible.end : item.end,
      week.start,
    );

    let lane = laneEnds.findIndex((lastCol) => lastCol < startCol);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(endCol);
    } else {
      laneEnds[lane] = endCol;
    }

    segments.push({
      item,
      startCol,
      endCol,
      lane,
      continuesBefore: item.start < visible.start,
      continuesAfter: item.end > visible.end,
    });
  });

  return { segments, laneCount: laneEnds.length };
}

/**
 * Nombre de segments masqués par jour (index 0 à 6) quand seules les
 * `visibleLanes` premières lignes sont affichées.
 */
export function countHiddenByDay(segments, visibleLanes) {
  const hidden = [0, 0, 0, 0, 0, 0, 0];
  segments.forEach((segment) => {
    if (segment.lane < visibleLanes) return;
    for (let col = segment.startCol; col <= segment.endCol; col++) {
      hidden[col] += 1;
    }
  });
  return hidden;
}

// Pose le jour `day` en gardant l'heure de `source` (ou l'heure par défaut)
function onDay(day, source, [defaultHours, defaultMinutes]) {
  const result = new Date(day);
  if (source) {
    result.setHours(
      source.getHours(),
      source.getMinutes(),
      source.getSeconds(),
      source.getMilliseconds(),
    );
  } else {
    result.setHours(defaultHours, defaultMinutes, 0, 0);
  }
  return result;
}

/**
 * Décale les dates d'une tâche de `deltaDays` jours (glisser-déposer) :
 * durée et heures conservées, une date absente reste absente.
 */
export function shiftTaskDates(dates, deltaDays) {
  const start = toDate(dates?.startDate);
  const due = toDate(dates?.dueDate);
  return {
    startDate: start ? addDays(start, deltaDays).toISOString() : null,
    dueDate: due ? addDays(due, deltaDays).toISOString() : null,
  };
}

/**
 * Étire une tâche par un de ses bords jusqu'au jour `targetDay`.
 * Le début ne passe jamais après l'échéance (ni l'inverse) ; une tâche à une
 * seule date gagne l'autre borne, à l'heure par défaut de la modale.
 * @param {{ startDate?: string|null, dueDate?: string|null }} dates
 * @param {"start"|"end"} edge
 * @param {Date} targetDay
 */
export function resizeTaskDates(dates, edge, targetDay) {
  const start = toDate(dates?.startDate);
  const due = toDate(dates?.dueDate);
  const range = getTaskDayRange(dates);
  if (!range) return { startDate: null, dueDate: null };
  const day = startOfDay(targetDay);

  if (edge === "start") {
    const newDay = day > range.end ? range.end : day;
    return {
      startDate: onDay(newDay, start, DEFAULT_START_TIME).toISOString(),
      dueDate: (due || onDay(range.end, null, DEFAULT_DUE_TIME)).toISOString(),
    };
  }

  const newDay = day < range.start ? range.start : day;
  return {
    startDate: (
      start || onDay(range.start, null, DEFAULT_START_TIME)
    ).toISOString(),
    dueDate: onDay(newDay, due, DEFAULT_DUE_TIME).toISOString(),
  };
}

/**
 * Étirement par une poignée saisie le jour `anchorDay` et lâchée le jour
 * `targetDay` : la borne (début ou échéance) se pose sur le jour visé, y
 * compris depuis un bord coupé en fin de semaine ou de mois.
 * @returns {{ startDate: string|null, dueDate: string|null } | null} null si la poignée n'a pas changé de jour
 */
export function resizeTaskDatesFromHandle(dates, edge, anchorDay, targetDay) {
  if (!getTaskDayRange(dates)) return null;
  if (differenceInCalendarDays(targetDay, anchorDay) === 0) return null;
  return resizeTaskDates(dates, edge, targetDay);
}

/**
 * Dates d'une tâche posée sur un jour (création au clic, ou tâche « Sans
 * date » déposée sur le calendrier) : début 9 h, échéance 18 h.
 */
export function dayTaskDates(day) {
  return {
    startDate: onDay(startOfDay(day), null, DEFAULT_START_TIME).toISOString(),
    dueDate: onDay(startOfDay(day), null, DEFAULT_DUE_TIME).toISOString(),
  };
}

/**
 * Vrai si les deux jeux de dates désignent les mêmes instants
 */
export function sameTaskDates(a, b) {
  const same = (x, y) => {
    const dx = toDate(x);
    const dy = toDate(y);
    if (!dx || !dy) return !dx && !dy;
    return dx.getTime() === dy.getTime();
  };
  return same(a?.startDate, b?.startDate) && same(a?.dueDate, b?.dueDate);
}
