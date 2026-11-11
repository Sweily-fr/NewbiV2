/**
 * Prise de rendez-vous : fonctions pures partagées par le tableau de bord
 * (Communication > Prise de rendez-vous) et les pages publiques /rdv.
 * Les créneaux arrivent de l'API en UTC ; tout l'affichage passe par Intl
 * dans le fuseau de l'invité (jamais de calcul « +1 h » à la main).
 */

// Même règle que l'API : 3 à 40 caractères, minuscules, chiffres et tirets,
// ni au début ni à la fin
export const BOOKING_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export const DEFAULT_TIME_ZONE = "Europe/Paris";

// Couleur des rendez-vous dans le Calendrier (prune). Validée par le script
// dataviz (daltonisme deutan/protan/tritan) contre Encaissements #1baf7a,
// Paiements #eb6834, Devis #6250d6, Récurrences #eda100 et Tâches #2a78d6 :
// écart CVD >= 13 et vision normale >= 17, en clair comme en sombre, sans
// bleu ni violet voisin. Une seule teinte pour les deux thèmes (les
// événements du calendrier n'ont qu'une couleur).
export const APPOINTMENT_COLOR = "#9f2a85";
export const DEFAULT_ACCENT_COLOR = "#5a50ff";

export const LOCATION_KIND_LABELS = {
  GOOGLE_MEET: "Google Meet",
  TEAMS: "Microsoft Teams",
  CUSTOM_LINK: "Visioconférence",
  PHONE: "Appel téléphonique",
  IN_PERSON: "En personne",
};

// Lieux qui donnent un lien de visio à l'invité
export const VIDEO_LOCATION_KINDS = ["GOOGLE_MEET", "TEAMS", "CUSTOM_LINK"];

export const SLOT_INTERVAL_OPTIONS = [5, 10, 15, 20, 30, 60];

// Jours ISO (1 = lundi), dans l'ordre de l'éditeur des disponibilités
export const WEEK_DAYS = [
  { dayOfWeek: 1, label: "Lundi", short: "Lun" },
  { dayOfWeek: 2, label: "Mardi", short: "Mar" },
  { dayOfWeek: 3, label: "Mercredi", short: "Mer" },
  { dayOfWeek: 4, label: "Jeudi", short: "Jeu" },
  { dayOfWeek: 5, label: "Vendredi", short: "Ven" },
  { dayOfWeek: 6, label: "Samedi", short: "Sam" },
  { dayOfWeek: 7, label: "Dimanche", short: "Dim" },
];

// --- Adresse de la page ---------------------------------------------------

export function isValidBookingSlug(slug) {
  return typeof slug === "string" && BOOKING_SLUG_PATTERN.test(slug);
}

/**
 * Texte libre → adresse de page (« Élodie Martin » → « elodie-martin »).
 * Renvoie une chaîne vide si rien d'utilisable ne reste (moins de 3
 * caractères).
 */
export function slugifyBookingName(text) {
  const slug = String(text || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return isValidBookingSlug(slug) ? slug : "";
}

/**
 * Adresse proposée à la première visite : prénom-nom, sinon le début de
 * l'e-mail, sinon le nom de l'entreprise.
 */
export function suggestBookingSlug({
  firstName,
  lastName,
  email,
  company,
} = {}) {
  const fullName = [firstName, lastName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    // « Élodie Martin » + « Martin » : pas deux fois le nom
    .filter((part, index, parts) => index === 0 || !parts[0].includes(part))
    .join(" ");
  return (
    slugifyBookingName(fullName) ||
    slugifyBookingName(String(email || "").split("@")[0]) ||
    slugifyBookingName(company) ||
    ""
  );
}

// --- Jours et fuseaux -----------------------------------------------------

const pad = (n) => String(n).padStart(2, "0");

const dayFormatters = new Map();
function dayFormatter(timeZone) {
  if (!dayFormatters.has(timeZone)) {
    dayFormatters.set(
      timeZone,
      new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    );
  }
  return dayFormatters.get(timeZone);
}

/** Jour « AAAA-MM-JJ » d'un instant dans un fuseau. */
export function dayKeyInZone(date, timeZone = DEFAULT_TIME_ZONE) {
  const parts = Object.fromEntries(
    dayFormatter(timeZone)
      .formatToParts(new Date(date))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Heure « HH:mm » (24 h) d'un instant dans un fuseau. */
export function timeInZone(date, timeZone = DEFAULT_TIME_ZONE) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("fr-FR", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(date))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.hour}:${parts.minute}`;
}

/** « AAAA-MM-JJ » décalé de n jours (calcul sur le calendrier, sans fuseau). */
export function addDaysToKey(key, days) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Date locale (grille du calendrier) → « AAAA-MM-JJ ». */
export function localDateToKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** « AAAA-MM-JJ » → Date locale à minuit (grille du calendrier). */
export function keyToLocalDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Créneaux rangés par jour dans le fuseau de l'invité :
 * { "AAAA-MM-JJ": [{ start, end, time }] }, jours et heures triés.
 */
export function groupSlotsByDay(slots, timeZone = DEFAULT_TIME_ZONE) {
  const sorted = [...(slots || [])].sort(
    (a, b) => new Date(a.start) - new Date(b.start),
  );
  const byDay = {};
  for (const slot of sorted) {
    const key = dayKeyInZone(slot.start, timeZone);
    (byDay[key] ||= []).push({
      start: slot.start,
      end: slot.end,
      time: timeInZone(slot.start, timeZone),
    });
  }
  return byDay;
}

/**
 * Jours à demander à l'API pour afficher un mois (« AAAA-MM ») dans le
 * fuseau de l'invité : le mois, plus un jour de chaque côté (les dates sont
 * lues dans le fuseau de la page, qui peut avoir un jour d'écart), borné
 * par aujourd'hui (fuseau de la page) et le dernier jour réservable.
 * `null` si le mois est entièrement hors de la plage.
 */
export function monthFetchRange(month, { today, lastDay = null } = {}) {
  const [y, m] = month.split("-").map(Number);
  const first = `${y}-${pad(m)}-01`;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const last = `${y}-${pad(m)}-${pad(daysInMonth)}`;
  let from = addDaysToKey(first, -1);
  let to = addDaysToKey(last, 1);
  if (today && from < today) from = today;
  if (lastDay && to > lastDay) to = lastDay;
  if (from > to) return null;
  return { from, to };
}

/** Dernier jour réservable : aujourd'hui (fuseau de la page) + horizon. */
export function lastBookableDay(now, { timeZone, maxDaysAhead }) {
  const today = dayKeyInZone(now, timeZone);
  return Number.isFinite(maxDaysAhead)
    ? addDaysToKey(today, maxDaysAhead)
    : null;
}

/**
 * « UTC+1 », « UTC-4 », « UTC+5:30 » : décalage d'un fuseau à un instant
 * donné (heure d'été comprise).
 */
export function timeZoneOffsetLabel(timeZone, date = new Date()) {
  try {
    const part = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    })
      .formatToParts(new Date(date))
      .find((p) => p.type === "timeZoneName");
    const value = (part?.value || "GMT").replace(/^(GMT|UTC)/, "");
    // « GMT », « GMT+0 » ou « UTC » selon le navigateur : même fuseau
    return !value || /^[+-]0$/.test(value) ? "UTC" : `UTC${value}`;
  } catch {
    return "";
  }
}

/** « Europe/Paris » → « Paris (UTC+1) ». */
export function timeZoneLabel(timeZone, date = new Date()) {
  const city = String(timeZone || "")
    .split("/")
    .pop()
    .replace(/_/g, " ");
  const offset = timeZoneOffsetLabel(timeZone, date);
  return offset ? `${city} (${offset})` : city;
}

export function isValidTimeZone(timeZone) {
  if (!timeZone || typeof timeZone !== "string") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Fuseau du navigateur, Paris à défaut. */
export function detectTimeZone() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidTimeZone(zone) ? zone : DEFAULT_TIME_ZONE;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

const FALLBACK_TIME_ZONES = [
  "Europe/Paris",
  "Europe/Brussels",
  "Europe/Luxembourg",
  "Europe/Zurich",
  "Europe/London",
  "Europe/Lisbon",
  "Europe/Madrid",
  "Europe/Berlin",
  "Europe/Rome",
  "Africa/Casablanca",
  "Africa/Algiers",
  "Africa/Tunis",
  "Africa/Dakar",
  "Africa/Abidjan",
  "Indian/Reunion",
  "Indian/Mayotte",
  "America/Martinique",
  "America/Guadeloupe",
  "America/Cayenne",
  "America/Montreal",
  "America/New_York",
  "America/Los_Angeles",
  "Pacific/Noumea",
  "Pacific/Tahiti",
  "Asia/Dubai",
  "Asia/Tokyo",
  "UTC",
];

/** Fuseaux proposés à l'invité (tous ceux du navigateur s'il les liste). */
export function listTimeZones(extra = []) {
  let zones = FALLBACK_TIME_ZONES;
  try {
    if (typeof Intl.supportedValuesOf === "function") {
      const supported = Intl.supportedValuesOf("timeZone");
      if (supported?.length) zones = supported;
    }
  } catch {
    // Liste de repli
  }
  return [...new Set([...extra.filter(isValidTimeZone), ...zones])].sort();
}

// --- Libellés -------------------------------------------------------------

/** 30 → « 30 min », 60 → « 1 h », 90 → « 1 h 30 ». */
export function durationLabel(minutes) {
  const total = Number(minutes) || 0;
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest ? `${hours} h ${pad(rest)}` : `${hours} h`;
}

const capitalize = (text) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

/** « Lundi 3 novembre 2026 » dans le fuseau donné. */
export function longDateLabel(date, timeZone = DEFAULT_TIME_ZONE) {
  return capitalize(
    new Intl.DateTimeFormat("fr-FR", {
      timeZone,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(date)),
  );
}

/** « AAAA-MM-JJ » → « Lundi 3 novembre » (jour de la grille, sans fuseau). */
export function dayKeyLabel(key) {
  const [y, m, d] = key.split("-").map(Number);
  return capitalize(
    new Intl.DateTimeFormat("fr-FR", {
      timeZone: "UTC",
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date(Date.UTC(y, m - 1, d))),
  );
}

/** « 09:00 - 09:30 » dans le fuseau donné. */
export function timeRangeLabel(start, end, timeZone = DEFAULT_TIME_ZONE) {
  return `${timeInZone(start, timeZone)} - ${timeInZone(end, timeZone)}`;
}

export function locationKindLabel(kind) {
  return LOCATION_KIND_LABELS[kind] || "Rendez-vous";
}

// --- Couleur d'accent de la page -----------------------------------------

/** Couleur d'accent sûre (hex à 6 chiffres), sinon celle de Newbi. */
export function safeAccentColor(color) {
  return typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color)
    ? color
    : DEFAULT_ACCENT_COLOR;
}

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((i) => {
    const value = parseInt(hex.slice(i, i + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/**
 * Texte lisible sur la couleur d'accent : blanc, ou encre sombre quand la
 * couleur est claire (jaune, vert d'eau…). Choix au meilleur contraste.
 */
export function readableTextColor(color) {
  const luminance = relativeLuminance(safeAccentColor(color));
  const onWhite = 1.05 / (luminance + 0.05);
  const onInk = (luminance + 0.05) / (0.0137 + 0.05); // #171717
  return onWhite >= onInk ? "#ffffff" : "#171717";
}

// --- Formulaire de réservation -------------------------------------------

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const BOOKING_FORM_LIMITS = {
  firstName: 100,
  lastName: 100,
  email: 254,
  phone: 30,
  message: 2000,
};

/** Le téléphone est demandé : type qui l'exige, ou rendez-vous par appel. */
export function isPhoneRequired({ requirePhone, locationKind } = {}) {
  return Boolean(requirePhone) || locationKind === "PHONE";
}

/**
 * Erreurs du formulaire invité, champ par champ ({} si tout est bon).
 * Les mêmes règles sont revérifiées par l'API.
 */
export function validateBookingForm(
  values = {},
  { phoneRequired = false } = {},
) {
  const errors = {};
  const firstName = String(values.firstName || "").trim();
  const lastName = String(values.lastName || "").trim();
  const email = String(values.email || "").trim();
  const phone = String(values.phone || "").trim();
  const message = String(values.message || "");

  if (!firstName) errors.firstName = "Indiquez votre prénom";
  else if (firstName.length > BOOKING_FORM_LIMITS.firstName)
    errors.firstName = "Prénom trop long";

  if (!lastName) errors.lastName = "Indiquez votre nom";
  else if (lastName.length > BOOKING_FORM_LIMITS.lastName)
    errors.lastName = "Nom trop long";

  if (!email) errors.email = "Indiquez votre adresse e-mail";
  else if (
    email.length > BOOKING_FORM_LIMITS.email ||
    !EMAIL_PATTERN.test(email)
  )
    errors.email = "Adresse e-mail invalide";

  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (
      phone.length > BOOKING_FORM_LIMITS.phone ||
      !/^\+?[\d\s().-]+$/.test(phone) ||
      digits.length < 6 ||
      digits.length > 15
    ) {
      errors.phone = "Numéro de téléphone invalide";
    }
  } else if (phoneRequired) {
    errors.phone = "Indiquez votre numéro de téléphone";
  }

  if (message.length > BOOKING_FORM_LIMITS.message)
    errors.message = `${BOOKING_FORM_LIMITS.message} caractères au maximum`;

  return errors;
}

/** Corps de POST /book, champs nettoyés. */
export function buildBookingPayload(
  values,
  { start, timezone, turnstileToken = "", website = "" },
) {
  const clean = (value) => String(value || "").trim();
  return {
    start,
    guest: {
      firstName: clean(values.firstName),
      lastName: clean(values.lastName),
      email: clean(values.email).toLowerCase(),
      phone: clean(values.phone) || null,
      message: clean(values.message) || null,
    },
    timezone,
    turnstileToken,
    website,
  };
}

/**
 * Erreurs de champ renvoyées par l'API (400 VALIDATION) → clés du
 * formulaire (« guest.email » ou « email » → « email »).
 */
export function mapApiFieldErrors(fields) {
  const errors = {};
  if (!fields || typeof fields !== "object") return errors;
  for (const [key, value] of Object.entries(fields)) {
    const name = key.replace(/^guest\./, "");
    errors[name] =
      typeof value === "string" && value ? value : "Valeur invalide";
  }
  return errors;
}

/**
 * Refus 400 VALIDATION de l'API : erreurs des champs du formulaire, et
 * message général (anti-robot refusé, créneau invalide…). Les clés de
 * l'API sont à plat : start, firstName, lastName, email, phone, message,
 * timezone, turnstileToken.
 */
export function bookingValidationOutcome(fields) {
  const { turnstileToken, start, timezone, ...inputs } =
    mapApiFieldErrors(fields);
  let message = "Certaines informations sont à corriger.";
  if (turnstileToken) message = turnstileToken;
  else if (start)
    message = "Ce créneau n'est plus réservable. Choisissez-en un autre.";
  else if (!Object.keys(inputs).length && timezone) message = timezone;
  return { inputs, message, slotInvalid: Boolean(start) };
}

// --- Ajout à un agenda ----------------------------------------------------

// 2026-11-03T09:00:00.000Z → 20261103T090000Z
const compactUtc = (date) =>
  new Date(date)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

/** Lien « Ajouter à Google Agenda » (création d'événement pré-remplie). */
export function googleCalendarUrl({
  title,
  start,
  end,
  details = "",
  location = "",
}) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title || "Rendez-vous",
    dates: `${compactUtc(start)}/${compactUtc(end)}`,
  });
  if (details) params.set("details", details);
  if (location) params.set("location", location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Lien « Ajouter à Outlook » (Outlook sur le web). */
export function outlookCalendarUrl({
  title,
  start,
  end,
  details = "",
  location = "",
}) {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title || "Rendez-vous",
    startdt: new Date(start).toISOString(),
    enddt: new Date(end).toISOString(),
  });
  if (details) params.set("body", details);
  if (location) params.set("location", location);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

// --- Tableau de bord ------------------------------------------------------

/** Onglet de la liste des réservations → variables de la requête. */
export function bookingListVariables(tab) {
  switch (tab) {
    case "past":
      return { scope: "past", status: "CONFIRMED" };
    case "cancelled":
      return { scope: "all", status: "CANCELLED" };
    default:
      return { scope: "upcoming", status: "CONFIRMED" };
  }
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Plages d'une journée : heures valides, début avant fin, sans
 * chevauchement. Renvoie le message d'erreur, ou null.
 */
export function intervalsError(intervals) {
  const list = intervals || [];
  for (const { start, end } of list) {
    if (!TIME_PATTERN.test(start || "") || !TIME_PATTERN.test(end || ""))
      return "Heure invalide";
    if (start >= end) return "La fin doit être après le début";
  }
  const sorted = [...list].sort((a, b) => (a.start < b.start ? -1 : 1));
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].start < sorted[i - 1].end) return "Les plages se chevauchent";
  }
  return null;
}

/** Plages triées par heure de début (forme attendue par l'API). */
export function sortIntervals(intervals) {
  return [...(intervals || [])]
    .map(({ start, end }) => ({ start, end }))
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
}

/**
 * Plage suivante proposée par « Ajouter une plage » : une heure après la
 * dernière, bornée à la journée.
 */
export function nextIntervalAfter(intervals) {
  const sorted = sortIntervals(intervals);
  const last = sorted[sorted.length - 1];
  if (!last) return { start: "09:00", end: "17:00" };
  const [h, m] = last.end.split(":").map(Number);
  const startMinutes = Math.min(h * 60 + m + 60, 22 * 60);
  const endMinutes = Math.min(startMinutes + 60, 23 * 60 + 59);
  const toTime = (minutes) =>
    `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  return { start: toTime(startMinutes), end: toTime(endMinutes) };
}

/** Code d'intégration de la page sur un site (mode intégré, sans en-tête). */
export function embedSnippet(publicUrl) {
  const separator = String(publicUrl).includes("?") ? "&" : "?";
  return `<iframe src="${publicUrl}${separator}embed=1" title="Prise de rendez-vous" style="width:100%;min-height:720px;border:0" loading="lazy"></iframe>`;
}

// --- Types de rendez-vous (tiroir de création / édition) -------------------

export const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

// Préavis minimum proposé (minutes)
export const MIN_NOTICE_OPTIONS = [0, 60, 120, 240, 720, 1440, 2880];

// Couleurs proposées pour les types et la page (teintes du calendrier)
export const BOOKING_COLORS = [
  "#5a50ff",
  "#2a78d6",
  "#1baf7a",
  "#eda100",
  "#eb6834",
  "#e87ba4",
  "#9f2a85",
  "#64748b",
];

/** Fournisseurs d'agenda connectés et actifs (google, microsoft, apple). */
export function activeCalendarProviders(connections) {
  return new Set(
    (connections || [])
      .filter((connection) => connection.status === "active")
      .map((connection) => connection.provider),
  );
}

/**
 * Lieux proposés à la création d'un type : Meet seulement avec un agenda
 * Google actif, Teams avec un agenda Microsoft actif (lien généré avec le
 * compte de l'utilisateur).
 */
export function locationOptions(connections) {
  const providers = activeCalendarProviders(connections);
  return [
    {
      kind: "GOOGLE_MEET",
      available: providers.has("google"),
      hint: "Lien Meet créé avec votre agenda Google",
    },
    {
      kind: "TEAMS",
      available: providers.has("microsoft"),
      hint: "Lien Teams créé avec votre compte Microsoft",
    },
    {
      kind: "CUSTOM_LINK",
      available: true,
      hint: "Votre propre lien de visio",
    },
    { kind: "PHONE", available: true, hint: "Vous appelez l'invité" },
    { kind: "IN_PERSON", available: true, hint: "À une adresse" },
  ];
}

/** Lieu par défaut, comme l'API : Meet, sinon Teams, sinon téléphone. */
export function defaultLocationKind(connections) {
  const providers = activeCalendarProviders(connections);
  if (providers.has("google")) return "GOOGLE_MEET";
  if (providers.has("microsoft")) return "TEAMS";
  return "PHONE";
}

/** Type existant (ou nouveau) → valeurs du formulaire. */
export function appointmentTypeToForm(type, { connections } = {}) {
  return {
    name: type?.name || "",
    slug: type?.slug || "",
    description: type?.description || "",
    durationMinutes: type?.durationMinutes ?? 30,
    slotIntervalMinutes: type?.slotIntervalMinutes ?? 30,
    locationKind: type?.location?.kind || defaultLocationKind(connections),
    locationValue: type?.location?.value || "",
    bufferBeforeMinutes: type?.bufferBeforeMinutes ?? 0,
    bufferAfterMinutes: type?.bufferAfterMinutes ?? 0,
    minNoticeMinutes: type?.minNoticeMinutes ?? 240,
    maxDaysAhead: type?.maxDaysAhead ?? 60,
    maxPerDay: type?.maxPerDay ?? null,
    color: type?.color || BOOKING_COLORS[0],
    isActive: type?.isActive ?? true,
    requirePhone: type?.requirePhone ?? false,
  };
}

const inRange = (value, min, max) =>
  Number.isInteger(value) && value >= min && value <= max;

/** Erreurs du formulaire de type, champ par champ ({} si tout est bon). */
export function appointmentTypeFormErrors(form) {
  const errors = {};
  const name = String(form.name || "").trim();
  if (!name) errors.name = "Donnez un nom à ce rendez-vous";
  else if (name.length > 120) errors.name = "120 caractères au maximum";

  if (!isValidBookingSlug(form.slug))
    errors.slug = "3 à 40 caractères : lettres minuscules, chiffres et tirets";

  if (String(form.description || "").length > 1000)
    errors.description = "1000 caractères au maximum";

  if (!inRange(form.durationMinutes, 5, 480))
    errors.durationMinutes = "Entre 5 et 480 minutes";

  if (!SLOT_INTERVAL_OPTIONS.includes(form.slotIntervalMinutes))
    errors.slotIntervalMinutes = "Intervalle invalide";

  const value = String(form.locationValue || "").trim();
  if (form.locationKind === "CUSTOM_LINK") {
    let valid = false;
    try {
      valid = new URL(value).protocol === "https:";
    } catch {
      valid = false;
    }
    if (!valid) errors.locationValue = "Indiquez un lien complet en https://";
  }
  if (form.locationKind === "IN_PERSON" && !value)
    errors.locationValue = "Indiquez l'adresse du rendez-vous";

  if (!inRange(form.bufferBeforeMinutes, 0, 240))
    errors.bufferBeforeMinutes = "Entre 0 et 240 minutes";
  if (!inRange(form.bufferAfterMinutes, 0, 240))
    errors.bufferAfterMinutes = "Entre 0 et 240 minutes";
  if (!inRange(form.minNoticeMinutes, 0, 525600))
    errors.minNoticeMinutes = "Préavis invalide";
  if (!inRange(form.maxDaysAhead, 1, 365))
    errors.maxDaysAhead = "Entre 1 et 365 jours";
  if (form.maxPerDay !== null && !inRange(form.maxPerDay, 1, 100))
    errors.maxPerDay = "Entre 1 et 100, ou laissez vide";

  return errors;
}

/** Formulaire → AppointmentTypeInput de l'API. */
export function appointmentTypeFormToInput(form) {
  const kind = form.locationKind;
  const value = String(form.locationValue || "").trim();
  return {
    name: String(form.name || "").trim(),
    slug: form.slug,
    description: String(form.description || "").trim() || null,
    durationMinutes: form.durationMinutes,
    slotIntervalMinutes: form.slotIntervalMinutes,
    location: {
      kind,
      // Meet, Teams et téléphone : rien à saisir
      value: kind === "CUSTOM_LINK" || kind === "IN_PERSON" ? value : null,
    },
    bufferBeforeMinutes: form.bufferBeforeMinutes,
    bufferAfterMinutes: form.bufferAfterMinutes,
    minNoticeMinutes: form.minNoticeMinutes,
    maxDaysAhead: form.maxDaysAhead,
    maxPerDay: form.maxPerDay,
    color: form.color,
    isActive: form.isActive,
    // Rendez-vous par téléphone : le numéro de l'invité est indispensable
    requirePhone: kind === "PHONE" ? true : Boolean(form.requirePhone),
  };
}

/** Adresse de type libre à côté de celles déjà prises sur la page. */
export function uniqueTypeSlug(name, takenSlugs = []) {
  const base = slugifyBookingName(name) || "rendez-vous";
  const taken = new Set(takenSlugs);
  if (!taken.has(base)) return base;
  for (let i = 2; i < 100; i += 1) {
    const suffix = `-${i}`;
    const candidate = `${base.slice(0, 40 - suffix.length).replace(/-+$/, "")}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
  return base;
}

/** « 4 h », « 1 jour », « 2 jours » : préavis lisible. */
export function noticeLabel(minutes) {
  if (!minutes) return "Aucun";
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} jour${days > 1 ? "s" : ""}`;
  }
  return durationLabel(minutes);
}

// --- Disponibilités (éditeur hebdomadaire) --------------------------------

const DEFAULT_DAY_INTERVALS = [
  { start: "09:00", end: "12:00" },
  { start: "14:00", end: "18:00" },
];

/**
 * Disponibilités de l'API → les 7 jours de l'éditeur, lundi d'abord
 * (jour sans plage = fermé).
 */
export function availabilityToDraft(availability) {
  const byDay = new Map(
    (availability || []).map((day) => [day.dayOfWeek, day.intervals || []]),
  );
  return WEEK_DAYS.map(({ dayOfWeek }) => {
    const intervals = sortIntervals(byDay.get(dayOfWeek) || []);
    return { dayOfWeek, enabled: intervals.length > 0, intervals };
  });
}

/** Éditeur → AvailabilityDayInput (jours ouverts seulement, plages triées). */
export function draftToAvailability(draft) {
  return draft
    .filter((day) => day.enabled && day.intervals.length > 0)
    .map((day) => ({
      dayOfWeek: day.dayOfWeek,
      intervals: sortIntervals(day.intervals),
    }));
}

/** Plages proposées quand on rouvre un jour fermé. */
export function defaultDayIntervals() {
  return DEFAULT_DAY_INTERVALS.map((interval) => ({ ...interval }));
}

/** Exceptions triées par date, plages triées (forme de l'API). */
export function normalizeOverrides(overrides) {
  return [...(overrides || [])]
    .map((override) => ({
      date: override.date,
      intervals: sortIntervals(override.intervals),
    }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Première erreur de l'éditeur (jours puis exceptions), ou null. */
export function availabilityDraftError(draft, overrides) {
  for (const day of draft) {
    if (!day.enabled) continue;
    const error = intervalsError(day.intervals);
    if (error) {
      const label = WEEK_DAYS.find((d) => d.dayOfWeek === day.dayOfWeek)?.label;
      return `${label} : ${error.charAt(0).toLowerCase()}${error.slice(1)}`;
    }
  }
  for (const override of overrides || []) {
    const error = intervalsError(override.intervals);
    if (error) {
      return `${dayKeyLabel(override.date)} : ${error.charAt(0).toLowerCase()}${error.slice(1)}`;
    }
  }
  return null;
}
