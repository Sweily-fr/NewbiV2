/**
 * Utilitaires pour formater les dates en français
 */

/**
 * Formate une date au format YYYY-MM-DD en utilisant le fuseau horaire local.
 * Remplace le pattern `date.toISOString().split("T")[0]` qui convertit en UTC
 * et décale la date d'un jour entre minuit et 1h du matin (UTC+1).
 * @param {Date} [date=new Date()] - La date à formater
 * @returns {string} - Date formatée en YYYY-MM-DD (timezone locale)
 */
export const formatLocalDate = (date = new Date()) => {
  const d = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Recale les dates d'un brouillon repris ultérieurement.
 *
 * Un brouillon (devis / facture / bon de commande) créé un mois antérieur garde
 * sa date d'émission d'origine, qui devient antérieure à aujourd'hui et bloque
 * alors l'envoi ou la finalisation (validation `issueDate < today`). Si la date
 * d'émission est dans le passé, on la ramène à aujourd'hui et on décale la
 * seconde date (validité / échéance) du même délai, afin de conserver le délai
 * de validité d'origine (30 jours par défaut). Les dates au présent ou au futur
 * sont laissées telles quelles, et une seconde date absente n'est jamais
 * inventée.
 *
 * @param {string} issueDate - Date d'émission au format YYYY-MM-DD
 * @param {string} [secondDate] - validUntil / dueDate au format YYYY-MM-DD
 * @returns {{ issueDate: string, secondDate: string, changed: boolean }}
 */
export const refreshDraftDates = (issueDate, secondDate) => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parse = (s) =>
    typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s)
      ? new Date(`${s}T00:00:00`)
      : null;

  const prevIssue = parse(issueDate);
  // Rien à faire si la date d'émission est absente ou déjà >= aujourd'hui.
  if (!prevIssue || prevIssue.getTime() >= today.getTime()) {
    return { issueDate, secondDate, changed: false };
  }

  const prevSecond = parse(secondDate);
  // Conserver le délai d'origine entre émission et 2e date (sinon 30 jours).
  const gapDays =
    prevSecond && prevSecond > prevIssue
      ? Math.round((prevSecond.getTime() - prevIssue.getTime()) / DAY_MS)
      : 30;

  const newIssue = formatLocalDate(today);
  const newSecond = prevSecond
    ? formatLocalDate(new Date(today.getTime() + gapDays * DAY_MS))
    : secondDate;

  return { issueDate: newIssue, secondDate: newSecond, changed: true };
};

/**
 * Variante d'affichage de {@link refreshDraftDates} pour les vues en lecture
 * seule (aperçu / sidebar). Accepte tout format de date (Date, timestamp en
 * ms, ISO, YYYY-MM-DD) et renvoie, pour chaque date, la valeur « effective »
 * (recalée si l'émission est passée) ET la valeur d'origine, afin d'afficher
 * la date du jour avec l'ancienne date entre parenthèses.
 *
 * @param {*} issueDate - Date d'émission (tout format parsable)
 * @param {*} [secondDate] - validUntil / dueDate (tout format parsable)
 * @returns {{
 *   changed: boolean,
 *   issue: { effective: Date|null, original: Date|null },
 *   second: { effective: Date|null, original: Date|null },
 * }}
 */
export const getDraftEffectiveDates = (issueDate, secondDate) => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const toDate = (v) => {
    if (v === null || v === undefined || v === "") return null;
    let d;
    if (v instanceof Date) d = v;
    else if (typeof v === "number") d = new Date(v);
    else if (typeof v === "string" && /^\d+$/.test(v))
      d = new Date(parseInt(v, 10));
    else d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  const issueOrig = toDate(issueDate);
  const secondOrig = toDate(secondDate);

  // Pas de recalage si l'émission est absente ou déjà >= aujourd'hui.
  if (!issueOrig || issueOrig.getTime() >= today.getTime()) {
    return {
      changed: false,
      issue: { effective: issueOrig, original: issueOrig },
      second: { effective: secondOrig, original: secondOrig },
    };
  }

  const gapDays =
    secondOrig && secondOrig > issueOrig
      ? Math.round((secondOrig.getTime() - issueOrig.getTime()) / DAY_MS)
      : 30;

  return {
    changed: true,
    issue: { effective: today, original: issueOrig },
    second: {
      effective: secondOrig
        ? new Date(today.getTime() + gapDays * DAY_MS)
        : null,
      original: secondOrig,
    },
  };
};

/**
 * Formate une date en format français court (jj/mm/aaaa)
 * @param {string|number|Date} dateValue - La date à formater
 * @returns {string} - Date formatée en français (ex: 15/01/2024)
 */
export const formatDateToFrench = (dateValue) => {
  if (!dateValue) return "";

  let date;

  // Si c'est un timestamp
  if (
    typeof dateValue === "number" ||
    (typeof dateValue === "string" && /^\d{10,13}$/.test(dateValue))
  ) {
    date = new Date(Number(dateValue));
  }
  // Si c'est une string au format YYYY-MM-DD
  else if (
    typeof dateValue === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
  ) {
    date = new Date(dateValue + "T12:00:00.000Z");
  }
  // Si c'est déjà un objet Date
  else if (dateValue instanceof Date) {
    date = dateValue;
  }
  // Autres cas
  else {
    date = new Date(dateValue);
  }

  // Vérifier si la date est valide
  if (isNaN(date.getTime())) {
    return dateValue; // Retourner la valeur originale si invalide
  }

  // Formater en français : jj/mm/aaaa
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Formate une date en format français long (jj mois aaaa)
 * @param {string|number|Date} dateValue - La date à formater
 * @returns {string} - Date formatée en français (ex: 15 janvier 2024)
 */
export const formatDateToFrenchLong = (dateValue) => {
  if (!dateValue) return "Date non disponible";

  let date;

  // Gérer différents types d'entrée
  if (typeof dateValue === "string") {
    // Cas spécial pour les chaînes vides ou "Invalid Date"
    if (dateValue === "" || dateValue === "Invalid Date") {
      return "Date non disponible";
    }

    // Si c'est une date au format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      date = new Date(dateValue + "T12:00:00.000Z");
    }
    // Si c'est un timestamp en string
    else if (/^\d{10,13}$/.test(dateValue)) {
      date = new Date(parseInt(dateValue));
    }
    // Autres formats de string
    else {
      date = new Date(dateValue);
    }
  }
  // Si c'est un nombre (timestamp)
  else if (typeof dateValue === "number") {
    date = new Date(dateValue);
  }
  // Si c'est déjà un objet Date
  else if (dateValue instanceof Date) {
    date = dateValue;
  }
  // Autres cas
  else {
    return "Format de date non supporté";
  }

  // Vérifier si la date est valide
  if (isNaN(date.getTime())) {
    return "Date invalide";
  }

  // Formater en français long : jj mois aaaa
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Formate une date avec heure en format français
 * @param {string|number|Date} dateValue - La date à formater
 * @returns {string} - Date et heure formatées en français (ex: 15/01/2024 14:30)
 */
export const formatDateTimeToFrench = (dateValue) => {
  if (!dateValue) return "Date non disponible";

  let date;

  if (typeof dateValue === "string") {
    if (dateValue === "" || dateValue === "Invalid Date") {
      return "Date non disponible";
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      date = new Date(dateValue + "T12:00:00.000Z");
    } else if (/^\d{10,13}$/.test(dateValue)) {
      date = new Date(parseInt(dateValue));
    } else {
      date = new Date(dateValue);
    }
  } else if (typeof dateValue === "number") {
    date = new Date(dateValue);
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else {
    return "Format de date non supporté";
  }

  if (isNaN(date.getTime())) {
    return "Date invalide";
  }

  const dateStr = date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const timeStr = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${dateStr} ${timeStr}`;
};
