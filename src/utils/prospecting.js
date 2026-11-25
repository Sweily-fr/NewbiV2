/**
 * Prospection : un message de prospection à chaque prospect, envoyé depuis
 * la boîte Gmail ou Outlook du membre, au rythme de sa boîte. Statuts,
 * rythme d'envoi, libellés et contrôles de saisie : fonctions pures (aucune
 * dépendance React ni Apollo). L'API refait tous les contrôles : ici on
 * guide l'utilisateur, sans jamais bloquer ce qu'elle accepterait.
 */
import { DEFAULT_VARIABLES } from "@/src/utils/email-campaign-variables";
import { formatCount, formatDateTime } from "@/src/utils/email-campaigns";

export const PROSPECTING_URL = "/dashboard/outils/prospection";
export const prospectingUrl = (id) => `${PROSPECTING_URL}/${id}`;

export const PROSPECTING_TIMEZONE = "Europe/Paris";

/** Variables connues tant que l'API ne les a pas renvoyées (réglages). */
export const PROSPECTING_VARIABLES = [
  ...DEFAULT_VARIABLES,
  { key: "activite", label: "Activité", example: "Menuiserie" },
  { key: "site", label: "Site web", example: "www.atelier-durand.fr" },
];

// ── Statuts ──────────────────────────────────────────────────────────────

/** Libellé et ton (couleur du badge) de chaque statut d'une prospection. */
export const SEQUENCE_STATUS_META = {
  DRAFT: { label: "Brouillon", tone: "neutral" },
  ACTIVE: { label: "En cours", tone: "accent" },
  PAUSED: { label: "En pause", tone: "warning" },
  COMPLETED: { label: "Terminée", tone: "success" },
  CANCELED: { label: "Arrêtée", tone: "muted" },
};

export const MAILBOX_STATUS_META = {
  ACTIVE: { label: "Active", tone: "success" },
  EXPIRED: { label: "À reconnecter", tone: "danger" },
  PAUSED: { label: "En pause", tone: "warning" },
  DISCONNECTED: { label: "Déconnectée", tone: "muted" },
};

export const RECIPIENT_STATUS_META = {
  PENDING: { label: "En attente", tone: "muted" },
  SENT: { label: "Envoyé", tone: "neutral" },
  SIMULATED: { label: "Simulé", tone: "info" },
  REPLIED: { label: "A répondu", tone: "success" },
  BOUNCED: { label: "Rejeté", tone: "danger" },
  UNSUBSCRIBED: { label: "Désinscrit", tone: "warning" },
  FAILED: { label: "Échec", tone: "danger" },
  SKIPPED: { label: "Non envoyé", tone: "muted" },
};

const metaOf = (table, status) =>
  table[status] || { label: status || "", tone: "neutral" };
export const sequenceStatusMeta = (status) =>
  metaOf(SEQUENCE_STATUS_META, status);
export const mailboxStatusMeta = (status) =>
  metaOf(MAILBOX_STATUS_META, status);
export const recipientStatusMeta = (status) =>
  metaOf(RECIPIENT_STATUS_META, status);

/** Lancée (rapport) : tout sauf le brouillon. */
export const isLaunched = (status) => Boolean(status) && status !== "DRAFT";

/** Envoi en cours ou en pause : peut reprendre, être arrêtée. */
export const isLive = (status) => status === "ACTIVE" || status === "PAUSED";

/** Suppression proposée : jamais pendant un envoi ou une pause. */
export const canDeleteSequence = (status) =>
  ["DRAFT", "COMPLETED", "CANCELED"].includes(status);

/** Onglets de la liste (filtre côté site : la liste est courte). */
export const SEQUENCE_TABS = [
  { value: "all", label: "Toutes", statuses: null },
  { value: "drafts", label: "Brouillons", statuses: ["DRAFT"] },
  { value: "active", label: "En cours", statuses: ["ACTIVE"] },
  { value: "paused", label: "En pause", statuses: ["PAUSED"] },
  { value: "done", label: "Terminées", statuses: ["COMPLETED", "CANCELED"] },
];

export function filterSequences(sequences, tab) {
  const statuses = SEQUENCE_TABS.find((item) => item.value === tab)?.statuses;
  const list = sequences || [];
  return statuses
    ? list.filter((item) => statuses.includes(item.status))
    : list;
}

/** Nombre de prospections par onglet : { all: 4, drafts: 1, … }. */
export function countSequencesByTab(sequences) {
  return Object.fromEntries(
    SEQUENCE_TABS.map((tab) => [
      tab.value,
      filterSequences(sequences, tab.value).length,
    ]),
  );
}

// ── Avancement ───────────────────────────────────────────────────────────

/**
 * Avancement d'une prospection : destinataires traités (tout sauf « en
 * attente ») sur le total ; messages partis = traités, moins les échecs et
 * les non-envoyés (désinscrits ou déjà prospectés au moment de l'envoi).
 */
export function sequenceProgress(stats) {
  const s = stats || {};
  const total = Math.max(0, s.recipients || 0);
  const pending = Math.min(total, Math.max(0, s.pending || 0));
  const processed = total - pending;
  const sent = Math.max(0, processed - (s.failed || 0) - (s.skipped || 0));
  return {
    total,
    pending,
    processed,
    sent,
    ratio: total > 0 ? processed / total : 0,
  };
}

/** Part des messages partis qui ont reçu une réponse (marquée à la main). */
export function replyRate(stats) {
  const { sent } = sequenceProgress(stats);
  return sent > 0 ? (stats?.replied || 0) / sent : null;
}

/** Part des messages partis suivis d'une désinscription. */
export function unsubscribeRate(stats) {
  const { sent } = sequenceProgress(stats);
  return sent > 0 ? (stats?.unsubscribed || 0) / sent : null;
}

// ── Dates (heure de Paris) ───────────────────────────────────────────────

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** « AAAA-MM-JJ » → date à midi UTC : jamais décalée d'un jour à Paris. */
export function parseDay(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? "").trim());
  if (!match) return null;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

const parisYear = new Intl.DateTimeFormat("fr-FR", {
  timeZone: PROSPECTING_TIMEZONE,
  year: "numeric",
});
const weekdayDayMonth = new Intl.DateTimeFormat("fr-FR", {
  timeZone: PROSPECTING_TIMEZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const dayMonth = new Intl.DateTimeFormat("fr-FR", {
  timeZone: PROSPECTING_TIMEZONE,
  day: "numeric",
  month: "long",
});

// « 1 décembre » → « 1er décembre »
const firstOfMonth = (text) =>
  text.replace(/(^|\s)1(\s)/, (_, before, after) => `${before}1er${after}`);

/** « 2 décembre » (« 1er décembre », avec l'année si ce n'est pas celle-ci). */
export function formatDayMonth(value, now = new Date()) {
  const date = toDate(value);
  if (!date) return "";
  const text = firstOfMonth(dayMonth.format(date));
  return parisYear.format(date) === parisYear.format(now)
    ? text
    : `${text} ${parisYear.format(date)}`;
}

/** « vendredi 5 décembre » à partir de « AAAA-MM-JJ » (année si autre). */
export function formatEndDate(value, now = new Date()) {
  const date = parseDay(value);
  if (!date) return "";
  const text = firstOfMonth(weekdayDayMonth.format(date));
  return parisYear.format(date) === parisYear.format(now)
    ? text
    : `${text} ${parisYear.format(date)}`;
}

/** « Fin prévue le vendredi 5 décembre », ou null sans date. */
export function estimatedEndLabel(value, now = new Date()) {
  const text = formatEndDate(value, now);
  return text ? `Fin prévue le ${text}` : null;
}

/** « 4 jours d'envoi » (jours ouvrés prévus au rythme de la boîte). */
export function estimatedDaysLabel(days) {
  if (!Number.isFinite(days) || days <= 0) return null;
  return days === 1 ? "1 jour d'envoi" : `${formatCount(days)} jours d'envoi`;
}

/** Date qui compte pour la liste, selon le statut. */
export function sequenceDateLabel(sequence, now = new Date()) {
  if (!sequence) return "";
  const at = (value) => formatDateTime(value, now);
  switch (sequence.status) {
    case "ACTIVE":
      return sequence.startedAt
        ? `Lancée le ${at(sequence.startedAt)}`
        : `Modifiée le ${at(sequence.updatedAt)}`;
    case "PAUSED":
      return `En pause depuis le ${at(sequence.updatedAt)}`;
    case "COMPLETED":
      return `Terminée le ${at(sequence.completedAt || sequence.updatedAt)}`;
    case "CANCELED":
      return `Arrêtée le ${at(sequence.completedAt || sequence.updatedAt)}`;
    default:
      return `Modifiée le ${at(sequence.updatedAt || sequence.createdAt)}`;
  }
}

/** Nom proposé pour une nouvelle prospection : « Prospection du 25 novembre ». */
export function defaultSequenceName(now = new Date()) {
  return `Prospection du ${firstOfMonth(dayMonth.format(now))}`;
}

// ── Plage d'envoi ────────────────────────────────────────────────────────

/** Jours de la semaine (1 = lundi … 7 = dimanche, comme l'API). */
export const WEEK_DAYS = [
  { value: 1, short: "Lun", long: "lundi" },
  { value: 2, short: "Mar", long: "mardi" },
  { value: 3, short: "Mer", long: "mercredi" },
  { value: 4, short: "Jeu", long: "jeudi" },
  { value: 5, short: "Ven", long: "vendredi" },
  { value: 6, short: "Sam", long: "samedi" },
  { value: 7, short: "Dim", long: "dimanche" },
];

export const DEFAULT_SEND_WINDOW = Object.freeze({
  days: [1, 2, 3, 4, 5],
  startHour: 9,
  endHour: 18,
});

/** Heures proposées (début 6 h à 21 h, fin 7 h à 22 h, heure de Paris). */
export const START_HOURS = Array.from({ length: 16 }, (_, index) => index + 6);
export const END_HOURS = Array.from({ length: 16 }, (_, index) => index + 7);

/** Jours valides, triés, sans doublon. */
export function normalizeDays(days) {
  return [...new Set((days || []).map(Number))]
    .filter((day) => Number.isInteger(day) && day >= 1 && day <= 7)
    .sort((a, b) => a - b);
}

/** « 9 h » (espace insécable). */
export const formatHour = (hour) => `${hour} h`;

const dayName = (value) => WEEK_DAYS[value - 1]?.long || "";
const capitalize = (text) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

/**
 * Jours d'envoi en clair : « Du lundi au vendredi », « Tous les jours »,
 * « Lundi, mercredi et vendredi », « Le samedi ».
 */
export function formatDays(days) {
  const list = normalizeDays(days);
  if (!list.length) return "Aucun jour";
  if (list.length === 7) return "Tous les jours";
  const consecutive = list.every(
    (day, index) => index === 0 || day === list[index - 1] + 1,
  );
  if (consecutive && list.length >= 3) {
    return `Du ${dayName(list[0])} au ${dayName(list[list.length - 1])}`;
  }
  if (list.length === 1) return `Le ${dayName(list[0])}`;
  const names = list.map(dayName);
  return capitalize(
    `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`,
  );
}

/** « Du lundi au vendredi, de 9 h à 18 h » */
export function formatSendWindow(window) {
  if (!window) return "";
  return `${formatDays(window.days)}, de ${formatHour(window.startHour)} à ${formatHour(window.endHour)}`;
}

// ── Boîte d'envoi ────────────────────────────────────────────────────────

export const PROVIDERS = {
  GOOGLE: { key: "google", label: "Gmail" },
  MICROSOFT: { key: "microsoft", label: "Outlook" },
};

export const providerLabel = (provider) =>
  PROVIDERS[provider]?.label || provider || "";

/** Adresse de la route d'autorisation de l'API, ou null (fournisseur inconnu). */
export function mailboxAuthorizePath(provider) {
  const key = PROVIDERS[provider]?.key;
  return key ? `/mailbox-connect/${key}/authorize` : null;
}

/** URL complète de la route d'autorisation (API_URL sans « / » final). */
export function mailboxAuthorizeUrl(apiUrl, provider) {
  const path = mailboxAuthorizePath(provider);
  if (!path) return null;
  return `${String(apiUrl || "").replace(/\/+$/, "")}${path}`;
}

const RETURN_ERROR_MAX = 200;

/**
 * Retour de la connexion OAuth (paramètres posés par l'API sur la page) :
 * { kind: "connected" }, { kind: "error", message } ou null.
 */
export function readMailboxReturn(searchParams) {
  const get = (key) =>
    typeof searchParams?.get === "function" ? searchParams.get(key) : null;
  const error = get("boite_erreur");
  if (error !== null) {
    const message = String(error).trim().slice(0, RETURN_ERROR_MAX);
    return {
      kind: "error",
      message: message || "La connexion de la boîte n'a pas abouti.",
    };
  }
  if (get("boite") === "connectee") return { kind: "connected" };
  return null;
}

/** Adresse de la page sans les paramètres de retour (les autres gardés). */
export function cleanMailboxReturnUrl(href) {
  let url;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  url.searchParams.delete("boite");
  url.searchParams.delete("boite_erreur");
  return `${url.pathname}${url.search}${url.hash}`;
}

/** État de la boîte pour la carte : none, active, expired, paused. */
export function mailboxState(mailbox) {
  if (!mailbox || mailbox.status === "DISCONNECTED") return "none";
  if (mailbox.status === "EXPIRED") return "expired";
  if (mailbox.status === "PAUSED") return "paused";
  return "active";
}

/** « 3 / 10 envoyés aujourd'hui » */
export function sentTodayLabel(mailbox) {
  if (!mailbox) return "";
  return `${formatCount(mailbox.sentToday || 0)} / ${formatCount(mailbox.effectiveDailyLimit || 0)} envoyés aujourd'hui`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Montée progressive (comme l'API) : 10 e-mails par jour au plus les 7
 * premiers jours après la connexion, 20 du 8e au 14e jour, puis la limite
 * choisie. `lastDay` : dernier jour de la marche en cours.
 */
export function rampUp(connectedAt, dailyLimit, now = new Date()) {
  const start = toDate(connectedAt);
  const limit = Number(dailyLimit) || 0;
  if (!start) return { active: false, cap: null, limit };
  const elapsed = Math.floor((now.getTime() - start.getTime()) / DAY_MS);
  const day = (offset) => new Date(start.getTime() + offset * DAY_MS);
  if (elapsed < 7) {
    return {
      active: true,
      cap: 10,
      limit: Math.min(limit, 10),
      lastDay: day(6),
      nextLastDay: day(13),
    };
  }
  if (elapsed < 14) {
    return {
      active: true,
      cap: 20,
      limit: Math.min(limit, 20),
      lastDay: day(13),
      nextLastDay: null,
    };
  }
  return { active: false, cap: null, limit };
}

/** Phrase de la montée progressive en cours, ou null si elle ne bride rien. */
export function rampUpHint(connectedAt, dailyLimit, now = new Date()) {
  const ramp = rampUp(connectedAt, dailyLimit, now);
  const limit = Number(dailyLimit) || 0;
  if (!ramp.active || ramp.cap >= limit) return null;
  const until = formatDayMonth(ramp.lastDay, now);
  if (ramp.cap === 10 && limit > 20) {
    return `Montée progressive : 10 e-⁠mails par jour au plus jusqu'au ${until}, puis 20 jusqu'au ${formatDayMonth(ramp.nextLastDay, now)}.`;
  }
  return `Montée progressive : ${ramp.cap} e-⁠mails par jour au plus jusqu'au ${until}.`;
}

export const MIN_DAILY_LIMIT = 5;
export const RECOMMENDED_DAILY_LIMIT = 30;
export const NO_SIGNATURE = "none";

/** Formulaire des réglages à partir de la boîte (valeurs par défaut sinon). */
export function mailboxSettingsForm(mailbox, { defaultDailyLimit } = {}) {
  const window = mailbox?.sendWindow || DEFAULT_SEND_WINDOW;
  return {
    dailyLimit: String(
      mailbox?.dailyLimit ?? defaultDailyLimit ?? RECOMMENDED_DAILY_LIMIT,
    ),
    days: normalizeDays(window.days),
    startHour: Number(window.startHour ?? DEFAULT_SEND_WINDOW.startHour),
    endHour: Number(window.endHour ?? DEFAULT_SEND_WINDOW.endHour),
    signatureId: mailbox?.signatureId || NO_SIGNATURE,
  };
}

/** Erreurs de saisie des réglages : { dailyLimit, days, hours } (vide = bon). */
export function validateMailboxSettings(
  form,
  { maxDailyLimit = 50, minDailyLimit = MIN_DAILY_LIMIT } = {},
) {
  const errors = {};
  const text = String(form?.dailyLimit ?? "").trim();
  const limit = Number(text);
  if (
    !/^\d+$/.test(text) ||
    !Number.isInteger(limit) ||
    limit < minDailyLimit ||
    limit > maxDailyLimit
  ) {
    errors.dailyLimit = `Entre ${minDailyLimit} et ${maxDailyLimit} e-mails par jour.`;
  }
  if (!normalizeDays(form?.days).length) {
    errors.days = "Choisissez au moins un jour.";
  }
  const start = Number(form?.startHour);
  const end = Number(form?.endHour);
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end > 24 ||
    end <= start
  ) {
    errors.hours = "L'heure de fin doit venir après l'heure de début.";
  }
  return errors;
}

/** Variables de updateProspectingMailbox à partir du formulaire. */
export function mailboxSettingsInput(form) {
  return {
    dailyLimit: Number(String(form.dailyLimit).trim()),
    sendWindow: {
      days: normalizeDays(form.days),
      startHour: Number(form.startHour),
      endHour: Number(form.endHour),
    },
    signatureId:
      form.signatureId && form.signatureId !== NO_SIGNATURE
        ? form.signatureId
        : null,
  };
}

// ── Brouillon ────────────────────────────────────────────────────────────

/** Nouvelle prospection (bouton « Nouvelle prospection »). */
export function newSequenceInput({ signatureId, now = new Date() } = {}) {
  return {
    name: defaultSequenceName(now),
    ...(signatureId ? { signatureId } : {}),
  };
}

/**
 * Brouillon prêt à écrire aux prospects d'une liste (fin de « Générer des
 * prospects ») : la liste en destinataires, la signature de la boîte.
 */
export function sequenceFromListInput({
  listId,
  listName,
  signatureId,
  now = new Date(),
}) {
  const name = String(listName || "")
    .trim()
    .slice(0, 120);
  return {
    name: name || defaultSequenceName(now),
    audience: { mode: "LISTS", listIds: [listId], excludeListIds: [] },
    ...(signatureId ? { signatureId } : {}),
  };
}

const TAGS = /<[^>]*>/g;
const ENTITIES = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

/** Texte d'un message HTML, sur une ligne (résumé de l'étape). */
export function bodyText(html) {
  return String(html || "")
    .replace(/<\/(p|li)>|<br\s*\/?>/gi, " ")
    .replace(TAGS, "")
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity])
    .replace(/\s+/g, " ")
    .trim();
}

/** Début du message (résumé), coupé proprement. */
export function bodyExcerpt(html, max = 140) {
  const text = bodyText(html);
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/**
 * Étapes complètes du brouillon : boîte active, destinataires (au moins une
 * liste si « Des listes »), message (objet et texte).
 */
export function sequenceCompletion(sequence) {
  const audience = sequence?.audience || {};
  return {
    mailbox: sequence?.mailbox?.status === "ACTIVE",
    audience:
      audience.mode === "ALL" ||
      (audience.mode === "LISTS" && (audience.listIds || []).length > 0),
    message:
      Boolean(String(sequence?.subject || "").trim()) &&
      bodyText(sequence?.body).length > 0,
  };
}

// ── Destinataires ────────────────────────────────────────────────────────

/** Exclusions du décompte d'audience, dans l'ordre d'affichage. */
const EXCLUSIONS = [
  ["individuals", "fiche de particulier", "fiches de particuliers"],
  ["noEmail", "sans adresse e-mail", "sans adresse e-mail"],
  ["invalidEmail", "adresse invalide", "adresses invalides"],
  [
    "recentlyContacted",
    "déjà prospecté depuis moins de 30 jours",
    "déjà prospectés depuis moins de 30 jours",
  ],
  ["suppressed", "désinscrit ou exclu", "désinscrits ou exclus"],
  ["blocked", "contact bloqué", "contacts bloqués"],
  ["duplicates", "doublon", "doublons"],
  ["excludedByList", "dans une liste exclue", "dans une liste exclue"],
];

/** Exclusions non nulles : [{ key, count, label }]. */
export function prospectingExclusions(count) {
  if (!count) return [];
  return EXCLUSIONS.filter(([key]) => (count[key] || 0) > 0).map(
    ([key, one, many]) => ({
      key,
      count: count[key],
      label: count[key] >= 2 ? many : one,
    }),
  );
}

// Filtre du tableau → compteur des statistiques
const FILTER_STATS = {
  PENDING: "pending",
  SENT: "sent",
  SIMULATED: "simulated",
  REPLIED: "replied",
  UNSUBSCRIBED: "unsubscribed",
  BOUNCED: "bounced",
  FAILED: "failed",
  SKIPPED: "skipped",
};

export const RECIPIENT_FILTERS = [
  { value: "ALL", label: "Tous" },
  { value: "PENDING", label: "En attente" },
  { value: "SENT", label: "Envoyés" },
  { value: "SIMULATED", label: "Simulés" },
  { value: "REPLIED", label: "Ont répondu" },
  { value: "UNSUBSCRIBED", label: "Désinscrits" },
  { value: "BOUNCED", label: "Rejetés" },
  { value: "FAILED", label: "Échecs" },
  { value: "SKIPPED", label: "Non envoyés" },
];

/**
 * Filtres affichés : « Tous », ceux qui ont des destinataires, et le filtre
 * choisi (même vide). Chaque filtre porte son nombre (null pour « Tous »).
 */
export function recipientFilters(stats, active = "ALL") {
  return RECIPIENT_FILTERS.map((filter) => ({
    ...filter,
    count:
      filter.value === "ALL"
        ? (stats?.recipients ?? null)
        : stats?.[FILTER_STATS[filter.value]] || 0,
  })).filter(
    (filter) =>
      filter.value === "ALL" || filter.value === active || filter.count > 0,
  );
}

/** Statut demandé à l'API pour un filtre (null = tous). */
export const recipientStatusFilter = (filter) =>
  filter && filter !== "ALL" ? filter : null;

/**
 * Actions possibles sur un destinataire : « A répondu » une fois le
 * message parti, « Ne plus contacter » tant qu'il n'est ni désinscrit ni
 * écarté (un destinataire en attente passe alors en « Non envoyé »).
 */
export function recipientActions(recipient) {
  const status = recipient?.status;
  return {
    replied: status === "SENT" || status === "SIMULATED",
    doNotContact:
      Boolean(status) && status !== "UNSUBSCRIBED" && status !== "SKIPPED",
  };
}

/**
 * Ligne d'historique d'un envoi (fiche contact) : « Envoyé le 20 nov. à
 * 09:00 · réponse le 21 nov. à 10:15 », sinon l'état sans date.
 */
export function recipientHistoryLabel(recipient, now = new Date()) {
  if (!recipient) return "";
  const at = (value) => formatDateTime(value, now);
  const parts = [
    recipient.sentAt && `Envoyé le ${at(recipient.sentAt)}`,
    recipient.repliedAt && `réponse le ${at(recipient.repliedAt)}`,
    recipient.unsubscribedAt && `désinscrit le ${at(recipient.unsubscribedAt)}`,
    recipient.bouncedAt && `rejeté le ${at(recipient.bouncedAt)}`,
  ].filter(Boolean);
  if (parts.length) {
    const text = parts.join(" · ");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  const fallback = {
    PENDING: "En attente d'envoi",
    FAILED: "Envoi en échec",
    SKIPPED: "Non envoyé",
  };
  return fallback[recipient.status] || "";
}

/** Dernière date utile d'un destinataire, pour la fiche contact. */
export function recipientDate(recipient) {
  return (
    recipient?.repliedAt ||
    recipient?.unsubscribedAt ||
    recipient?.bouncedAt ||
    recipient?.sentAt ||
    null
  );
}

// ── Mode d'envoi du serveur ──────────────────────────────────────────────

/** Envois simulés ou restreints (tout sauf LIVE ; inconnu = rien à dire). */
export const isSimulatedSendMode = (sendMode) =>
  Boolean(sendMode) && sendMode !== "LIVE";

export const SIMULATED_SEND_NOTICE =
  "Envois simulés dans cet environnement : seules les adresses autorisées reçoivent vraiment les e-mails.";

/**
 * Titre du message après un envoi de test : l'API renvoie aussi les
 * adresses simulées, sans les distinguer.
 */
export const testSentTitle = (sendMode) =>
  isSimulatedSendMode(sendMode)
    ? "E-mail de test envoyé (ou simulé selon l'environnement)"
    : "E-mail de test envoyé";

// ── Vérification avant lancement ─────────────────────────────────────────

/**
 * Où corriger un contrôle de la vérification (identifiant ou catégorie de
 * l'API) : étape de la page ({ section }) ou paramètres de l'entreprise
 * ({ settings }). Inconnu : pas de lien.
 */
export function prospectingCheckTarget(check) {
  const keys = [check?.id, check?.category]
    .map((value) => String(value || "").toLowerCase())
    .filter(Boolean);
  for (const key of keys) {
    if (/^(legal|company|entreprise)/.test(key)) return { settings: true };
    if (/^(mailbox|boite|sender|window|plage)/.test(key))
      return { section: "boite" };
    if (/^(audience|recipient|destinataire)/.test(key))
      return { section: "destinataires" };
    if (
      /^(subject|body|content|message|variables|signature|objet|first_name|prenom)/.test(
        key,
      )
    )
      return { section: "message" };
  }
  return null;
}
