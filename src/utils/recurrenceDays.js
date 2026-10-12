/**
 * Jours calendaires « AAAA-MM-JJ » des factures récurrentes. Miroir de
 * newbi-api/src/utils/invoiceRecurrenceSchedule.js : l'aperçu « prochaine
 * facture le … » doit tomber sur le même jour que le cron.
 */

const pad = (n) => String(n).padStart(2, "0");

/** Date locale → « AAAA-MM-JJ » (sans passer par l'UTC) */
export const dateToDay = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** « AAAA-MM-JJ » → Date locale à minuit */
export const dayToDate = (day) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const todayDay = () => dateToDay(new Date());

export const addDaysToDay = (day, days) => {
  const date = dayToDate(day);
  date.setDate(date.getDate() + days);
  return dateToDay(date);
};

/** Ajoute des mois en restant sur le jour d'ancrage, ou le dernier du mois */
export const addMonthsToDay = (day, months) => {
  const [y, m, d] = day.split("-").map(Number);
  const target = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  target.setDate(Math.min(d, lastDay));
  return dateToDay(target);
};

export const occurrenceDay = ({ startDate, frequency, interval = 1 }, k) => {
  const step = Math.max(1, interval || 1) * k;
  if (frequency === "DAILY") return addDaysToDay(startDate, step);
  if (frequency === "WEEKLY") return addDaysToDay(startDate, 7 * step);
  return addMonthsToDay(startDate, step);
};

/**
 * Prochaine échéance d'une récurrence existante à partir d'aujourd'hui (une
 * échéance du jour déjà traitée est sautée), ou null après la date de fin.
 */
export function nextRecurrenceDay(recurrence, today = todayDay()) {
  if (!recurrence?.startDate) return null;
  const from = recurrence.startDate > today ? recurrence.startDate : today;
  const strict = from === today && recurrence.lastRunDate === today;
  let k = 0;
  let candidate = occurrenceDay(recurrence, k);
  while ((candidate < from || (strict && candidate === from)) && k < 100000) {
    k += 1;
    candidate = occurrenceDay(recurrence, k);
  }
  if (recurrence.endDate && candidate > recurrence.endDate) return null;
  return candidate;
}
