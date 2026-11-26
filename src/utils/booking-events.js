/**
 * Billetterie : un type de rendez-vous « Événement » (kind EVENT) a une date
 * précise, des places, un prix éventuel et des billets à QR code. Logique
 * pure partagée par le tableau de bord et les pages publiques.
 *
 * Montants TOUJOURS en centimes côté API ; saisis en euros dans le site.
 * Dates en UTC côté API ; saisies dans le fuseau de la page.
 */
import {
  BOOKING_COLORS,
  DEFAULT_TIME_ZONE,
  isValidBookingSlug,
  longDateLabel,
  timeInZone,
} from "./booking";

export const EVENT_KIND = "EVENT";
export const SLOT_KIND = "SLOT";

export const EVENT_LIMITS = {
  name: 120,
  description: 1000,
  details: 10000,
  capacityMax: 100000,
  maxPerOrderMax: 10,
  defaultMaxPerOrder: 5,
  // 0,50 € à 10 000 €
  minPriceCents: 50,
  maxPriceCents: 1000000,
  maxDurationDays: 30,
  imageMaxBytes: 5 * 1024 * 1024,
};

export const EVENT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

/** Lieux permis pour un événement en V1 : adresse ou lien. */
export const EVENT_LOCATION_KINDS = ["IN_PERSON", "CUSTOM_LINK"];

export const isEventType = (type) => type?.kind === EVENT_KIND;

// --- Montants -------------------------------------------------------------

/**
 * Saisie en euros → centimes entiers. « 15 », « 15,5 », « 15.50 »,
 * « 1 500,00 € » sont acceptés. Vide → 0 (gratuit). Saisie illisible ou
 * plus de deux décimales → NaN.
 */
export function eurosToCents(text) {
  const raw = String(text ?? "")
    .replace(/[\s  €]/g, "")
    .replace(",", ".");
  if (raw === "") return 0;
  if (!/^\d+(\.\d{0,2})?$/.test(raw)) return Number.NaN;
  const [units, decimals = ""] = raw.split(".");
  return Number(units) * 100 + Number(decimals.padEnd(2, "0"));
}

/** Centimes → texte du champ (« 15 », « 15,50 », vide si gratuit). */
export function centsToEurosInput(cents) {
  const value = Number(cents) || 0;
  if (value <= 0) return "";
  const units = Math.floor(value / 100);
  const rest = value % 100;
  return rest ? `${units},${String(rest).padStart(2, "0")}` : String(units);
}

/** Centimes → « 15,00 € ». */
export function formatCents(cents, currency = "EUR") {
  const value = (Number(cents) || 0) / 100;
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "EUR",
    }).format(value);
  } catch {
    return `${value.toFixed(2).replace(".", ",")} €`;
  }
}

/** Prix d'un événement : « Gratuit » ou « 15,00 € ». */
export function eventPriceLabel(price) {
  if (!price || !(Number(price.amount) > 0)) return "Gratuit";
  return formatCents(price.amount, price.currency);
}

export const isPaidEvent = (price) => Boolean(price && price.amount > 0);

// --- Mode de paiement d'un événement payant ---------------------------------

/**
 * ONLINE : tout payé en ligne à l'inscription ; DEPOSIT : acompte en ligne,
 * le reste sur place ; ON_SITE : tout sur place, le jour de l'événement.
 */
export const EVENT_PAYMENT_MODES = ["ONLINE", "DEPOSIT", "ON_SITE"];

/**
 * Mode effectif d'un type ou d'un événement public ({ price, paymentMode }) :
 * null si gratuit, ONLINE si le champ manque (événements d'avant le choix).
 */
export function eventPaymentMode(source) {
  if (!isPaidEvent(source?.price)) return null;
  return EVENT_PAYMENT_MODES.includes(source?.paymentMode)
    ? source.paymentMode
    : "ONLINE";
}

/** Acompte par place (centimes), seulement en mode DEPOSIT, sinon 0. */
export function eventDepositAmount(source) {
  if (eventPaymentMode(source) !== "DEPOSIT") return 0;
  const deposit = Number(source?.depositAmount) || 0;
  return deposit > 0 && deposit < source.price.amount ? deposit : 0;
}

/** Montants d'une commande de `quantity` places : en ligne et sur place. */
export function eventOrderAmounts(source, quantity = 1) {
  const mode = eventPaymentMode(source);
  const count = Math.max(1, Number(quantity) || 1);
  if (!mode) return { mode, total: 0, online: 0, onSite: 0 };
  const total = source.price.amount * count;
  if (mode === "ON_SITE") return { mode, total, online: 0, onSite: total };
  if (mode === "DEPOSIT") {
    const online = eventDepositAmount(source) * count;
    return { mode, total, online, onSite: total - online };
  }
  return { mode, total, online: total, onSite: 0 };
}

/** L'inscription passe par un paiement en ligne (ONLINE ou DEPOSIT). */
export const eventNeedsOnlinePayment = (source) =>
  ["ONLINE", "DEPOSIT"].includes(eventPaymentMode(source));

/** « 5 € » ou « 5,50 € » : montant court (cartes). */
export function compactCents(cents, currency = "EUR") {
  const value = Number(cents) || 0;
  if (value % 100 !== 0) return formatCents(value, currency);
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value / 100);
  } catch {
    return `${value / 100} €`;
  }
}

/** Mention courte de la carte d'un type : « acompte 5 € », « sur place ». */
export function eventPaymentShortLabel(type) {
  const mode = eventPaymentMode(type);
  if (mode === "ON_SITE") return "sur place";
  if (mode === "DEPOSIT") {
    return `acompte ${compactCents(eventDepositAmount(type), type.price.currency)}`;
  }
  return null;
}

/**
 * Phrase de la page publique sous le prix ; null en ligne ou gratuit.
 * « Paiement sur place le jour de l'événement » ; « Acompte de 5,00 € par
 * place à la réservation, reste 15,00 € sur place ».
 */
export function eventPaymentNotice(event) {
  const mode = eventPaymentMode(event);
  if (mode === "ON_SITE") return "Paiement sur place le jour de l'événement";
  if (mode === "DEPOSIT") {
    const deposit = eventDepositAmount(event);
    const currency = event.price.currency;
    return `Acompte de ${formatCents(deposit, currency)} par place à la réservation, reste ${formatCents(event.price.amount - deposit, currency)} sur place`;
  }
  return null;
}

/** Libellé du bouton d'inscription selon le mode et la quantité. */
export function registrationSubmitLabel(event, quantity = 1) {
  const { mode, online } = eventOrderAmounts(event, quantity);
  const currency = event?.price?.currency;
  if (mode === "ONLINE") return `Payer ${formatCents(online, currency)}`;
  if (mode === "DEPOSIT")
    return `Payer l'acompte ${formatCents(online, currency)}`;
  return quantity > 1 ? `Réserver ${quantity} places` : "Je m'inscris";
}

/**
 * Montants d'une inscription, avec repli pour celles d'avant le choix du
 * mode : payé en ligne = total si un prestataire est connu, reste dû = 0.
 */
export function registrationPayment(registration) {
  const amount = Number(registration?.amount) || 0;
  if (amount <= 0) {
    return {
      mode: null,
      amount: 0,
      online: 0,
      dueOnSite: 0,
      paidOnSite: false,
    };
  }
  const mode = EVENT_PAYMENT_MODES.includes(registration.paymentMode)
    ? registration.paymentMode
    : "ONLINE";
  const online =
    registration.amountOnline ??
    (mode === "ONLINE" ? amount : registration.paymentProvider ? amount : 0);
  const dueOnSite = Number(registration.amountDueOnSite) || 0;
  return {
    mode,
    amount,
    online: Number(online) || 0,
    dueOnSite,
    paidOnSite: Boolean(registration.onSitePaidAt),
  };
}

/** Reste à encaisser sur place (0 s'il n'y en a pas ou s'il est réglé). */
export function registrationDueOnSite(registration) {
  const { dueOnSite, paidOnSite } = registrationPayment(registration);
  return paidOnSite ? 0 : dueOnSite;
}

/**
 * Ligne de paiement d'une inscription (confirmation, page de l'inscription,
 * billet), comme dans les e-mails : « Payé en ligne : 10,00 € » ;
 * « Acompte payé : 5,00 €. Reste à régler sur place : 15,00 € » ;
 * « À régler sur place : 20,00 € ». Gratuit : « Gratuit ».
 * `paid` : le paiement en ligne a eu lieu (inscription confirmée ou
 * paiement reçu puis remboursé).
 */
export function registrationPaymentLine(registration) {
  const payment = registrationPayment(registration);
  const currency = registration?.currency;
  const money = (cents) => formatCents(cents, currency);
  if (!payment.mode) return "Gratuit";
  const paid =
    registration.status === "CONFIRMED" ||
    ["REFUNDED", "MANUAL"].includes(registration.refundStatus);
  const rest = payment.paidOnSite
    ? `${payment.mode === "DEPOSIT" ? "Reste réglé" : "Réglé"} sur place : ${money(payment.dueOnSite)}`
    : `${payment.mode === "DEPOSIT" ? "Reste à régler" : "À régler"} sur place : ${money(payment.dueOnSite)}`;
  if (payment.mode === "ON_SITE") return rest;
  if (payment.mode === "DEPOSIT") {
    const deposit = paid
      ? `Acompte payé : ${money(payment.online)}`
      : `Acompte à payer en ligne : ${money(payment.online)}`;
    return payment.dueOnSite > 0 ? `${deposit}. ${rest}` : deposit;
  }
  return paid
    ? `Payé en ligne : ${money(payment.online)}`
    : `À payer en ligne : ${money(payment.online)}`;
}

// --- Dates dans le fuseau de la page ---------------------------------------

const zonedPartsFormatters = new Map();
function zonedParts(date, timeZone) {
  if (!zonedPartsFormatters.has(timeZone)) {
    zonedPartsFormatters.set(
      timeZone,
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
  }
  return Object.fromEntries(
    zonedPartsFormatters
      .get(timeZone)
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
}

/** Décalage du fuseau (ms) à un instant UTC donné. */
function zoneOffsetMs(utcMs, timeZone) {
  const parts = zonedParts(new Date(utcMs), timeZone);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

const LOCAL_INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/**
 * Valeur d'un champ datetime-local (« 2026-12-12T19:00 »), lue dans le
 * fuseau de la page → ISO UTC. null si vide ou illisible.
 */
export function zonedInputToIso(value, timeZone = DEFAULT_TIME_ZONE) {
  const match = LOCAL_INPUT.exec(String(value || ""));
  if (!match) return null;
  const [, y, m, d, hh, mm] = match.map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  let utc = wall - zoneOffsetMs(wall, timeZone);
  // Changement d'heure entre l'estimation et le résultat : second passage
  const corrected = wall - zoneOffsetMs(utc, timeZone);
  if (corrected !== utc) utc = corrected;
  return new Date(utc).toISOString();
}

/** Instant ISO → valeur d'un champ datetime-local dans le fuseau donné. */
export function isoToZonedInput(iso, timeZone = DEFAULT_TIME_ZONE) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = zonedParts(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}T${String(Number(parts.hour) % 24).padStart(2, "0")}:${parts.minute}`;
}

/** Valeur datetime-local décalée de n minutes (calcul sur l'horloge murale). */
export function addMinutesToInput(value, minutes) {
  const match = LOCAL_INPUT.exec(String(value || ""));
  if (!match) return "";
  const [, y, m, d, hh, mm] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, hh, mm + minutes));
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

const lowerFirst = (text) =>
  text ? text.charAt(0).toLowerCase() + text.slice(1) : text;

const sameDay = (a, b, timeZone) =>
  longDateLabel(a, timeZone) === longDateLabel(b, timeZone);

/**
 * Date et heure d'un événement dans un fuseau :
 * même jour → { date: « Samedi 12 décembre 2026 », time: « 19:00 - 22:00 » } ;
 * sur plusieurs jours → { date: « Du samedi 12 décembre 2026 à 19:00 »,
 * time: « au dimanche 13 décembre 2026 à 02:00 » }.
 */
export function eventScheduleLabel(
  startAt,
  endAt,
  timeZone = DEFAULT_TIME_ZONE,
) {
  if (!startAt) return { date: "", time: "" };
  if (!endAt || sameDay(startAt, endAt, timeZone)) {
    return {
      date: longDateLabel(startAt, timeZone),
      time: endAt
        ? `${timeInZone(startAt, timeZone)} - ${timeInZone(endAt, timeZone)}`
        : timeInZone(startAt, timeZone),
    };
  }
  return {
    date: `Du ${lowerFirst(longDateLabel(startAt, timeZone))} à ${timeInZone(startAt, timeZone)}`,
    time: `au ${lowerFirst(longDateLabel(endAt, timeZone))} à ${timeInZone(endAt, timeZone)}`,
  };
}

/** « 12 déc. 2026, 19:00 » : date courte (cartes, listes). */
export function shortDateTimeLabel(iso, timeZone = DEFAULT_TIME_ZONE) {
  if (!iso) return "";
  const date = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
  return `${date}, ${timeInZone(iso, timeZone)}`;
}

/** « le 12/12/2026 à 19:42 » : date d'un passage au contrôle. */
export function checkInDateLabel(iso, timeZone = DEFAULT_TIME_ZONE) {
  if (!iso) return "";
  const date = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
  return `le ${date} à ${timeInZone(iso, timeZone)}`;
}

// --- Places ----------------------------------------------------------------

/** « 12 / 50 places » ; sans limite : « 12 inscrits » (billets). */
export function seatsLabel({ seatsTaken = 0, capacity = null } = {}) {
  const taken = Number(seatsTaken) || 0;
  if (capacity == null) {
    return `${taken} place${taken > 1 ? "s" : ""} prise${taken > 1 ? "s" : ""}`;
  }
  return `${taken} / ${capacity} places`;
}

/** Places restantes pour le public : « Complet », « 3 places restantes ». */
export function seatsLeftLabel(seatsLeft) {
  if (seatsLeft == null) return null;
  if (seatsLeft <= 0) return "Complet";
  return seatsLeft === 1 ? "Dernière place" : `${seatsLeft} places restantes`;
}

/** Quantités proposées : 1 à min(max par commande, places restantes). */
export function quantityChoices(maxPerOrder, seatsLeft = null) {
  const max = Math.max(
    0,
    Math.min(
      Number(maxPerOrder) || 1,
      seatsLeft == null ? Infinity : Number(seatsLeft),
    ),
  );
  return Array.from({ length: max }, (_, i) => i + 1);
}

// --- Inscriptions ------------------------------------------------------------

export const REGISTRATION_STATUS_LABELS = {
  CONFIRMED: "Confirmée",
  PENDING_PAYMENT: "En attente de paiement",
  CANCELLED: "Annulée",
  EXPIRED: "Expirée",
};

export function registrationStatusLabel(status) {
  return REGISTRATION_STATUS_LABELS[status] || status || "";
}

/** Nom de fichier de l'export : « inscrits-soiree-de-lancement.csv ». */
export function registrationsCsvFileName(eventName) {
  const base = String(eventName || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `inscrits-${base || "evenement"}.csv`;
}

// --- Billets et contrôle -----------------------------------------------------

const TICKET_TOKEN = /^[A-Za-z0-9_-]{43}$/;

/**
 * Contenu lu dans un QR code ou saisi à la main → code à envoyer à
 * checkInTicket. Le QR porte l'URL du billet (…/rdv/billet/<jeton>) : on
 * n'envoie que le jeton. Saisie : « EVT-7K3M9Q », « 7k3m 9q »… → « EVT-7K3M9Q ».
 * null : rien d'exploitable (QR d'un autre site, texte quelconque).
 */
export function parseTicketCode(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const fromUrl = /\/rdv\/billet\/([^/?#\s]+)/.exec(text);
  if (fromUrl) {
    return TICKET_TOKEN.test(fromUrl[1])
      ? { kind: "token", code: fromUrl[1] }
      : null;
  }
  if (TICKET_TOKEN.test(text)) return { kind: "token", code: text };
  const compact = text.toUpperCase().replace(/[\s-]/g, "").replace(/^EVT/, "");
  if (/^[A-Z0-9]{4,12}$/.test(compact)) {
    return { kind: "number", code: `EVT-${compact}` };
  }
  return null;
}

/**
 * Résultat d'un contrôle → ton (vert, orange, rouge) et textes. Billet
 * valable d'une inscription avec un reste dû non réglé : `dueOnSite`
 * (centimes), `currency` et `registrationId` pour « Marquer comme réglé ».
 */
export function checkInOutcome(checkIn, options = {}) {
  const outcome = baseCheckInOutcome(checkIn, options);
  const registration = checkIn?.registration;
  if (
    ["VALID", "ALREADY_CHECKED_IN"].includes(checkIn?.result) &&
    registration?.status === "CONFIRMED"
  ) {
    const due = registrationDueOnSite(registration);
    if (due > 0) {
      return {
        ...outcome,
        dueOnSite: due,
        currency: registration.currency || "EUR",
        registrationId: registration.id,
      };
    }
  }
  return outcome;
}

/** Texte du reste dû d'un contrôle : « Reste à régler sur place : 15,00 € ». */
export const dueOnSiteLabel = (cents, currency) =>
  `Reste à régler sur place : ${formatCents(cents, currency)}`;

function baseCheckInOutcome(checkIn, { timeZone } = {}) {
  const result = checkIn?.result || "UNKNOWN";
  const ticket = checkIn?.ticket;
  const name = ticket?.attendeeName || "";
  const number = ticket?.number ? `Billet ${ticket.number}` : "";
  switch (result) {
    case "VALID":
      return {
        tone: "success",
        title: "Valide",
        name,
        detail: number,
      };
    case "ALREADY_CHECKED_IN":
      return {
        tone: "warning",
        title: "Déjà scanné",
        name,
        detail: [
          ticket?.checkedInAt
            ? `Passage ${checkInDateLabel(ticket.checkedInAt, timeZone)}`
            : "",
          number,
        ]
          .filter(Boolean)
          .join(" · "),
      };
    case "CANCELLED":
      return {
        tone: "error",
        title: "Billet annulé",
        name,
        detail: number || "Inscription annulée ou expirée",
      };
    case "NOT_PAID":
      return {
        tone: "error",
        title: "Non payé",
        name,
        detail: number || "Le paiement de cette inscription n'a pas abouti",
      };
    case "OTHER_EVENT":
      return {
        tone: "error",
        title: "Autre événement",
        name: "",
        detail: checkIn?.otherEventName
          ? `Billet pour « ${checkIn.otherEventName} »`
          : "Ce billet est pour un autre événement",
      };
    default:
      return {
        tone: "error",
        title: "Billet inconnu",
        name: "",
        detail: "Ce code ne correspond à aucun billet de cet événement",
      };
  }
}

// --- Formulaire de l'organisateur ----------------------------------------------

/** Prix, mode et acompte d'un type → champs du formulaire (euros). */
export function pricingToForm(type) {
  return {
    priceText: centsToEurosInput(type?.price?.amount),
    paymentMode: eventPaymentMode(type) || "ONLINE",
    depositText: centsToEurosInput(eventDepositAmount(type)),
  };
}

/** Type événement (ou nouveau) → valeurs du formulaire, dates dans le fuseau. */
export function eventTypeToForm(type, { timeZone = DEFAULT_TIME_ZONE } = {}) {
  const kind = EVENT_LOCATION_KINDS.includes(type?.location?.kind)
    ? type.location.kind
    : "IN_PERSON";
  const startAt = isoToZonedInput(type?.startAt, timeZone);
  const closesAt = type?.registrationClosesAt
    ? isoToZonedInput(type.registrationClosesAt, timeZone)
    : "";
  return {
    name: type?.name || "",
    slug: type?.slug || "",
    description: type?.description || "",
    details: type?.details || "",
    startAt,
    endAt: isoToZonedInput(type?.endAt, timeZone),
    // Clôture égale au début : rien à afficher (valeur par défaut de l'API)
    registrationClosesAt: closesAt && closesAt !== startAt ? closesAt : "",
    coverImageUrl: type?.coverImageUrl || null,
    imageUrl: type?.imageUrl || null,
    capacity: type?.capacity ?? null,
    maxPerOrder: type?.maxPerOrder ?? EVENT_LIMITS.defaultMaxPerOrder,
    ...pricingToForm(type),
    locationKind: kind,
    locationValue: type?.location?.value || "",
    color: type?.color || BOOKING_COLORS[0],
    isActive: type?.isActive ?? true,
    requirePhone: type?.requirePhone ?? false,
  };
}

const inRange = (value, min, max) =>
  Number.isInteger(value) && value >= min && value <= max;

/**
 * Erreurs du prix, du mode de paiement et de l'acompte d'un formulaire
 * (événement : par place ; créneau : `perSeat` faux). {} si tout est bon.
 */
export function pricingFormErrors(form, { perSeat = true } = {}) {
  const errors = {};
  const cents = eurosToCents(form.priceText);
  if (Number.isNaN(cents))
    errors.price = "Montant invalide, par exemple 15 ou 12,50";
  else if (cents > 0 && cents < EVENT_LIMITS.minPriceCents)
    errors.price = perSeat
      ? "0,50 € minimum, ou laissez vide pour un événement gratuit"
      : "0,50 € minimum, ou laissez vide pour un rendez-vous gratuit";
  else if (cents > EVENT_LIMITS.maxPriceCents)
    errors.price = "10 000 € au maximum";

  if (cents > 0 && !Number.isNaN(cents)) {
    const mode = form.paymentMode || "ONLINE";
    if (!EVENT_PAYMENT_MODES.includes(mode))
      errors.paymentMode = "Choisissez comment le prix est réglé";
    else if (mode === "DEPOSIT") {
      const deposit = eurosToCents(form.depositText);
      if (Number.isNaN(deposit))
        errors.deposit = "Montant invalide, par exemple 5 ou 7,50";
      else if (deposit <= 0)
        errors.deposit = "Indiquez le montant de l'acompte";
      else if (deposit < EVENT_LIMITS.minPriceCents)
        errors.deposit = "0,50 € minimum";
      else if (deposit >= cents)
        errors.deposit = perSeat
          ? "L'acompte doit être inférieur au prix par place"
          : "L'acompte doit être inférieur au prix";
    }
  }
  return errors;
}

/**
 * Erreurs du formulaire d'événement ({} si tout est bon). `isCreation` :
 * le début doit être dans le futur. `seatsTaken` : places déjà prises.
 */
export function eventFormErrors(
  form,
  {
    timeZone = DEFAULT_TIME_ZONE,
    isCreation = false,
    now = new Date(),
    seatsTaken = 0,
  } = {},
) {
  const errors = {};
  const name = String(form.name || "").trim();
  if (!name) errors.name = "Donnez un titre à l'événement";
  else if (name.length > EVENT_LIMITS.name)
    errors.name = `${EVENT_LIMITS.name} caractères au maximum`;

  if (!isValidBookingSlug(form.slug))
    errors.slug = "3 à 40 caractères : lettres minuscules, chiffres et tirets";

  if (String(form.description || "").length > EVENT_LIMITS.description)
    errors.description = "1000 caractères au maximum";
  if (String(form.details || "").length > EVENT_LIMITS.details)
    errors.details = "10 000 caractères au maximum";

  const start = zonedInputToIso(form.startAt, timeZone);
  const end = zonedInputToIso(form.endAt, timeZone);
  if (!start) errors.startAt = "Indiquez la date et l'heure de début";
  else if (isCreation && new Date(start) <= now)
    errors.startAt = "Le début doit être dans le futur";
  if (!end) errors.endAt = "Indiquez la date et l'heure de fin";
  else if (start && new Date(end) <= new Date(start))
    errors.endAt = "La fin doit suivre le début";
  else if (
    start &&
    new Date(end) - new Date(start) >
      EVENT_LIMITS.maxDurationDays * 24 * 60 * 60 * 1000
  )
    errors.endAt = "30 jours au maximum";

  if (form.registrationClosesAt) {
    const closes = zonedInputToIso(form.registrationClosesAt, timeZone);
    if (!closes) errors.registrationClosesAt = "Date invalide";
    else if (start && new Date(closes) > new Date(start))
      errors.registrationClosesAt = "Au plus tard au début de l'événement";
  }

  if (form.capacity !== null && form.capacity !== undefined) {
    if (!inRange(form.capacity, 1, EVENT_LIMITS.capacityMax))
      errors.capacity = "Entre 1 et 100 000, ou laissez vide";
    else if (form.capacity < seatsTaken)
      errors.capacity = `Déjà ${seatsTaken} places prises`;
  }
  if (!inRange(form.maxPerOrder, 1, EVENT_LIMITS.maxPerOrderMax))
    errors.maxPerOrder = "Entre 1 et 10";

  Object.assign(errors, pricingFormErrors(form));

  const value = String(form.locationValue || "").trim();
  if (form.locationKind === "CUSTOM_LINK") {
    let valid = false;
    try {
      valid = new URL(value).protocol === "https:";
    } catch {
      valid = false;
    }
    if (!valid) errors.locationValue = "Indiquez un lien complet en https://";
  } else if (form.locationKind === "IN_PERSON") {
    if (!value) errors.locationValue = "Indiquez l'adresse de l'événement";
  } else {
    errors.locationValue = "Choisissez une adresse ou un lien";
  }

  return errors;
}

/** Prix, mode et acompte du formulaire tels que l'API les enregistre. */
export function pricingFormToInput(form) {
  const cents = eurosToCents(form.priceText);
  if (!(cents > 0))
    return { price: null, paymentMode: null, depositAmount: null };
  const paymentMode = EVENT_PAYMENT_MODES.includes(form.paymentMode)
    ? form.paymentMode
    : "ONLINE";
  return {
    price: { amount: cents, currency: "EUR" },
    paymentMode,
    depositAmount:
      paymentMode === "DEPOSIT" ? eurosToCents(form.depositText) : null,
  };
}

/**
 * Prix, mode et acompte à envoyer : les trois ensemble si l'un d'eux change
 * par rapport à `initial` (le type enregistré : { price, paymentMode,
 * depositAmount }), sinon {} (rien n'est réécrit). `always` : création.
 */
export function pricingInputIfChanged(form, initial, { always = false } = {}) {
  const pricing = pricingFormToInput(form);
  const initialSource = {
    price: { amount: Number(initial?.price?.amount) || 0 },
    paymentMode: initial?.paymentMode ?? null,
    depositAmount: initial?.depositAmount ?? null,
  };
  const changed =
    always ||
    (pricing.price?.amount || 0) !== initialSource.price.amount ||
    pricing.paymentMode !== eventPaymentMode(initialSource) ||
    (pricing.depositAmount || 0) !== eventDepositAmount(initialSource);
  return changed ? pricing : {};
}

/**
 * Formulaire → AppointmentTypeInput. `kind` n'est envoyé qu'à la
 * création (l'API refuse de le changer ensuite). Modification : prix, mode
 * de paiement et acompte ne sont envoyés que si l'un d'eux change, et alors
 * ensemble (`initialPriceCents`, `initialPaymentMode`,
 * `initialDepositAmount` : valeurs enregistrées).
 */
export function eventFormToInput(
  form,
  {
    timeZone = DEFAULT_TIME_ZONE,
    isCreation = false,
    initialPriceCents = 0,
    initialPaymentMode = null,
    initialDepositAmount = null,
  } = {},
) {
  const pricing = pricingInputIfChanged(
    form,
    {
      price: { amount: initialPriceCents },
      paymentMode: initialPaymentMode,
      depositAmount: initialDepositAmount,
    },
    { always: isCreation },
  );
  const location = String(form.locationValue || "").trim();
  return {
    ...(isCreation ? { kind: EVENT_KIND } : {}),
    name: String(form.name || "").trim(),
    slug: form.slug,
    description: String(form.description || "").trim() || null,
    details: String(form.details || "").trim() || null,
    startAt: zonedInputToIso(form.startAt, timeZone),
    endAt: zonedInputToIso(form.endAt, timeZone),
    registrationClosesAt: form.registrationClosesAt
      ? zonedInputToIso(form.registrationClosesAt, timeZone)
      : null,
    coverImageUrl: form.coverImageUrl || null,
    imageUrl: form.imageUrl || null,
    capacity: form.capacity ?? null,
    maxPerOrder: form.maxPerOrder,
    ...pricing,
    location: { kind: form.locationKind, value: location },
    color: form.color,
    isActive: form.isActive,
    requirePhone: Boolean(form.requirePhone),
  };
}

/** Contrôle local d'une image avant envoi (format, 5 Mo). */
export function eventImageError(file) {
  if (!file) return "Aucun fichier";
  const type = String(file.type || "").toLowerCase();
  const byName = /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || "");
  if (type ? !EVENT_IMAGE_TYPES.includes(type) : !byName)
    return "Format accepté : JPG, PNG, WebP ou HEIC";
  if (file.size > EVENT_LIMITS.imageMaxBytes) return "5 Mo au maximum";
  return null;
}

// --- Inscription publique -----------------------------------------------------

export const PAYMENT_PROVIDER_LABELS = {
  stripe: "Carte bancaire",
  sumup: "Carte bancaire avec SumUp",
  paypal: "PayPal",
};

/** Moyens proposés, dans un ordre stable (carte d'abord). */
export function orderedPaymentMethods(methods) {
  return ["stripe", "sumup", "paypal"].filter((method) =>
    (methods || []).includes(method),
  );
}

/** Corps de POST /:slug/:typeSlug/register, champs nettoyés. */
export function buildRegistrationPayload(
  values,
  { quantity, timezone, provider = null, turnstileToken = "", website = "" },
) {
  const clean = (value) => String(value || "").trim();
  return {
    buyer: {
      firstName: clean(values.firstName),
      lastName: clean(values.lastName),
      email: clean(values.email).toLowerCase(),
      phone: clean(values.phone) || null,
    },
    quantity,
    timezone,
    ...(provider ? { provider } : {}),
    turnstileToken,
    website,
  };
}

/**
 * Refus 400 VALIDATION d'une inscription : erreurs des champs du formulaire
 * (prénom, nom, e-mail, téléphone, quantité) et message général.
 */
export function registrationValidationOutcome(fields) {
  const inputs = {};
  let message = "Certaines informations sont à corriger.";
  for (const [key, value] of Object.entries(fields || {})) {
    const name = key.replace(/^buyer\./, "");
    const text = typeof value === "string" && value ? value : "Valeur invalide";
    if (
      ["firstName", "lastName", "email", "phone", "quantity"].includes(name)
    ) {
      inputs[name] = text;
    } else if (name === "turnstileToken" || name === "provider") {
      message = text;
    } else if (!Object.keys(inputs).length) {
      message = text;
    }
  }
  return { inputs, message };
}

/**
 * Paramètres de l'adresse de retour du paiement → corps de
 * POST /registrations/return. null si le jeton de retour manque.
 */
export function returnRequestFromParams(params) {
  const get = (key) => {
    const value =
      typeof params?.get === "function" ? params.get(key) : params?.[key];
    return Array.isArray(value) ? value[0] : value || null;
  };
  const returnToken = get("rt");
  if (!returnToken) return null;
  return {
    returnToken,
    provider: get("provider"),
    sessionId: get("session_id"),
    // PayPal ajoute « token » (identifiant de la commande)
    orderId: get("token"),
    canceled: get("canceled") === "1",
  };
}

// Paiement en confirmation chez le prestataire (ou API saturée, 429) :
// nouvelle vérification après 3 s, 6 s, 10 s, puis toutes les 15 s, trois
// minutes au plus
const RETURN_POLL_DELAYS_MS = [3000, 6000, 10000];
const RETURN_POLL_EVERY_MS = 15000;
export const RETURN_POLL_MAX_MS = 3 * 60 * 1000;

/**
 * Délai avant la vérification suivante du retour de paiement (`attempt` :
 * vérifications déjà faites, à partir de 1 ; `elapsedMs` : temps écoulé
 * depuis la première). null : on arrête d'attendre.
 */
export function nextReturnPollDelay(attempt, elapsedMs) {
  const delay = RETURN_POLL_DELAYS_MS[attempt - 1] ?? RETURN_POLL_EVERY_MS;
  return elapsedMs + delay > RETURN_POLL_MAX_MS ? null : delay;
}

/**
 * Inscription non confirmée → titre et texte justes selon le paiement et
 * son remboursement (`refundStatus` de l'API : NONE | REFUNDED | MANUAL).
 * `canceledByPayer` : le payeur a annulé chez le prestataire.
 * `restart` : proposer de recommencer l'inscription.
 */
export function unconfirmedRegistrationMessage({
  registration,
  paymentStatus = null,
  refundStatus = null,
  canceledByPayer = false,
  organizerName = "",
} = {}) {
  const refund = refundStatus || registration?.refundStatus || "NONE";
  const organizer = organizerName || "l'organisateur";
  if (refund === "REFUNDED") {
    return {
      title: "Paiement remboursé",
      text: "Votre paiement est arrivé alors que les places n'étaient plus disponibles : il vous a été remboursé automatiquement. Aucun billet n'a été émis.",
      restart: true,
    };
  }
  if (refund === "MANUAL") {
    return {
      title: "Paiement reçu, inscription non confirmée",
      text: `Votre paiement a bien été reçu, mais l'inscription n'a pas pu être confirmée et aucun billet n'a été émis. Contactez ${organizer} pour être remboursé, en indiquant l'adresse e-mail utilisée.`,
      restart: false,
    };
  }
  if (
    paymentStatus === "pending" ||
    registration?.status === "PENDING_PAYMENT"
  ) {
    return {
      title: "Paiement en attente de confirmation",
      text: "Vous recevrez vos billets par e-mail dès la confirmation du paiement.",
      restart: false,
    };
  }
  if (registration?.status === "CANCELLED") {
    return {
      title: "Inscription annulée",
      text: "Cette inscription a été annulée. Ses billets ne sont plus valables.",
      restart: true,
    };
  }
  if (canceledByPayer) {
    return {
      title: "Paiement annulé",
      text: "Vous avez annulé le paiement : rien n'a été prélevé, votre inscription n'est pas enregistrée et les places ont été libérées.",
      restart: true,
    };
  }
  return {
    title: "Paiement non effectué",
    text: "Le paiement n'a pas abouti : rien n'a été prélevé et aucun billet n'a été émis. Vous pouvez recommencer.",
    restart: true,
  };
}
