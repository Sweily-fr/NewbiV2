import { addDays } from "date-fns";
import { dateToDay } from "@/src/utils/recurrenceDays";

/**
 * Jours fériés légaux en France métropolitaine (code du travail,
 * art. L. 3133-1), lundi de Pentecôte compris. Affichés discrètement dans
 * le calendrier : ils expliquent un jour sans activité ou une échéance
 * reportée. Pas les fériés propres à l'Alsace-Moselle ni aux outre-mer.
 */

// Dimanche de Pâques (algorithme de Meeus, Jones et Butcher)
export function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

const cache = new Map();

/** Jours fériés d'une année : Map « AAAA-MM-JJ » → nom. */
export function frenchHolidays(year) {
  if (cache.has(year)) return cache.get(year);
  const easter = easterSunday(year);
  const fixed = (month, day) => new Date(year, month - 1, day);
  const holidays = new Map(
    [
      [fixed(1, 1), "Jour de l'an"],
      [addDays(easter, 1), "Lundi de Pâques"],
      [fixed(5, 1), "Fête du travail"],
      [fixed(5, 8), "Victoire 1945"],
      [addDays(easter, 39), "Ascension"],
      [addDays(easter, 50), "Lundi de Pentecôte"],
      [fixed(7, 14), "Fête nationale"],
      [fixed(8, 15), "Assomption"],
      [fixed(11, 1), "Toussaint"],
      [fixed(11, 11), "Armistice 1918"],
      [fixed(12, 25), "Noël"],
    ].map(([date, name]) => [dateToDay(date), name]),
  );
  cache.set(year, holidays);
  return holidays;
}

/** Nom du jour férié tombant ce jour-là (date locale), sinon null. */
export function frenchHolidayName(date) {
  return frenchHolidays(date.getFullYear()).get(dateToDay(date)) || null;
}
