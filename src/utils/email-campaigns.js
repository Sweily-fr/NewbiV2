/**
 * Campagnes e-mail : statuts, statistiques, libellés et contrôles de saisie.
 * Fonctions pures (aucune dépendance React ni Apollo). L'API refait tous les
 * contrôles : ici on guide l'utilisateur, sans jamais bloquer ce qu'elle
 * accepterait.
 */

export const CAMPAIGN_TIMEZONE = "Europe/Paris";

export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "SENDING",
  "PAUSED",
  "SENT",
  "CANCELED",
];

/** Libellé et ton (couleur du badge) de chaque statut. */
export const STATUS_META = {
  DRAFT: { label: "Brouillon", tone: "neutral" },
  SCHEDULED: { label: "Programmée", tone: "info" },
  SENDING: { label: "En cours d'envoi", tone: "accent" },
  PAUSED: { label: "En pause", tone: "warning" },
  SENT: { label: "Envoyée", tone: "success" },
  CANCELED: { label: "Annulée", tone: "muted" },
};

export const statusLabel = (status) => STATUS_META[status]?.label || status;

/** Onglets de la liste : filtre de statut de la requête (null = toutes). */
export const LIST_TABS = [
  { value: "all", label: "Toutes", status: null },
  { value: "drafts", label: "Brouillons", status: "DRAFT" },
  { value: "scheduled", label: "Programmées", status: "SCHEDULED" },
  { value: "sending", label: "En cours", status: "SENDING" },
  { value: "paused", label: "En pause", status: "PAUSED" },
  { value: "sent", label: "Envoyées", status: "SENT" },
];

/** Modifiable (contenu, réglages) : brouillon seulement. */
export const isDraft = (status) => status === "DRAFT";

/** Page de la campagne affichée en rapport (envoi lancé ou terminé). */
export const isReportStatus = (status) =>
  ["SENDING", "PAUSED", "SENT", "CANCELED"].includes(status);

/** Suppression permise par l'API (pas pendant un envoi ou une pause). */
export const canDeleteStatus = (status) =>
  !["SENDING", "PAUSED"].includes(status);

// ── Nombres ──────────────────────────────────────────────────────────────

const countFormatter = new Intl.NumberFormat("fr-FR");
const percentFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

/** « 1 240 » (espace fine insécable des milliers). */
export const formatCount = (value) =>
  countFormatter.format(Number.isFinite(value) ? value : 0);

/** « 42,5 % » à partir d'un ratio (0,425) ; null = pas de taux. */
export function formatPercent(ratio) {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio))
    return null;
  return `${percentFormatter.format(Math.round(ratio * 1000) / 10)} %`;
}

/** « 1 contact », « 12 contacts » (pluriel simple). */
export const plural = (count, singular, pluralForm = `${singular}s`) =>
  `${formatCount(count)} ${Math.abs(count) >= 2 ? pluralForm : singular}`;

const ratio = (part, total) => (total > 0 ? part / total : null);

/**
 * Taux de la campagne. Base = e-mails partis (réels ou simulés) moins les
 * rejets : en local (simulé), aucun accusé de remise n'arrive, la base
 * reste juste. Ouvertures et clics = destinataires uniques.
 */
export function campaignRates(stats) {
  const s = stats || {};
  const sent = (s.sent || 0) + (s.simulated || 0);
  const reached = Math.max(0, sent - (s.bounced || 0));
  return {
    sent,
    reached,
    openRate: ratio(s.opened || 0, reached),
    clickRate: ratio(s.clicked || 0, reached),
    clickToOpenRate: ratio(s.clicked || 0, s.opened || 0),
    bounceRate: ratio(s.bounced || 0, sent),
    unsubscribeRate: ratio(s.unsubscribed || 0, reached),
    complaintRate: ratio(s.complained || 0, reached),
  };
}

/**
 * Avancement de l'envoi : destinataires traités (partis, simulés, en échec
 * ou rejetés à l'envoi) sur le total.
 */
export function sendProgress(stats) {
  const s = stats || {};
  const total = s.recipients || 0;
  const processed = Math.min(
    total,
    (s.sent || 0) + (s.simulated || 0) + (s.failed || 0),
  );
  return {
    total,
    processed,
    remaining: Math.max(0, total - processed),
    ratio: total > 0 ? processed / total : 0,
  };
}

// ── Dates (heure de Paris) ───────────────────────────────────────────────

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dayFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: CAMPAIGN_TIMEZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});
const shortDayFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: CAMPAIGN_TIMEZONE,
  day: "numeric",
  month: "short",
});
const yearFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: CAMPAIGN_TIMEZONE,
  year: "numeric",
});
const longDayFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: CAMPAIGN_TIMEZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: CAMPAIGN_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
});

/** Jour : « 12 nov. », avec l'année si ce n'est pas l'année en cours. */
function dayLabel(date, now) {
  return yearFormatter.format(date) === yearFormatter.format(now)
    ? shortDayFormatter.format(date)
    : dayFormatter.format(date);
}

/** « 12 nov. à 14:30 » (« 12 nov. 2025 à 14:30 » une autre année). */
export function formatDateTime(value, now = new Date()) {
  const date = toDate(value);
  if (!date) return "";
  return `${dayLabel(date, now)} à ${timeFormatter.format(date)}`;
}

/** « jeudi 20 novembre à 09:00 » */
export function formatLongDateTime(value) {
  const date = toDate(value);
  if (!date) return "";
  return `${longDayFormatter.format(date)} à ${timeFormatter.format(date)}`;
}

/** « 12 nov. » (avec l'année si ce n'est pas l'année en cours). */
export function formatDay(value, now = new Date()) {
  const date = toDate(value);
  return date ? dayLabel(date, now) : "";
}

/** Date qui compte pour la liste, selon le statut. */
export function campaignDateLabel(campaign, now = new Date()) {
  if (!campaign) return "";
  const { status } = campaign;
  const at = (value) => formatDateTime(value, now);
  if (status === "SCHEDULED" && campaign.scheduledAt)
    return `Prévue le ${at(campaign.scheduledAt)}`;
  if (status === "SENDING" && campaign.startedAt)
    return `Démarrée le ${at(campaign.startedAt)}`;
  if (status === "SENT")
    return `Envoyée le ${at(campaign.completedAt || campaign.startedAt || campaign.updatedAt)}`;
  if (status === "PAUSED")
    return `En pause depuis le ${at(campaign.updatedAt)}`;
  if (status === "CANCELED")
    return `Annulée le ${at(campaign.completedAt || campaign.updatedAt)}`;
  return `Modifiée le ${at(campaign.updatedAt || campaign.createdAt)}`;
}

/** Nom proposé pour une nouvelle campagne : « Campagne du 16 novembre ». */
export function defaultCampaignName(now = new Date()) {
  const day = new Intl.DateTimeFormat("fr-FR", {
    timeZone: CAMPAIGN_TIMEZONE,
    day: "numeric",
    month: "long",
  }).format(now);
  return `Campagne du ${day}`;
}

// ── Saisie ───────────────────────────────────────────────────────────────

const EMAIL_PATTERN =
  /^[^\s@<>(),;:"[\]]+@[^\s@<>(),;:"[\]]+\.[^\s@<>(),;:"[\]]{2,}$/;

export const isValidEmail = (value) =>
  EMAIL_PATTERN.test(String(value ?? "").trim());

/**
 * Adresses saisies (séparées par virgules, points-virgules, espaces ou
 * retours à la ligne) : valides sans doublon, en minuscules, et invalides.
 */
export function parseEmailList(text) {
  const valid = [];
  const invalid = [];
  for (const piece of String(text ?? "").split(/[\s,;]+/)) {
    const email = piece.trim().toLowerCase();
    if (!email) continue;
    if (!isValidEmail(email)) {
      if (!invalid.includes(piece.trim())) invalid.push(piece.trim());
    } else if (!valid.includes(email)) {
      valid.push(email);
    }
  }
  return { valid, invalid };
}

const SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "goo.gl",
  "t.co",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "cutt.ly",
  "shorturl.at",
  "rebrand.ly",
  "tiny.cc",
  "rb.gy",
];

/**
 * Lien d'un bouton ou d'une image : { level: "error" | "warning" | null,
 * message }. Mêmes règles que la vérification avant envoi de l'API
 * (raccourcisseurs et adresses IP refusés, http déconseillé).
 */
export function checkLink(url, { required = false } = {}) {
  const value = String(url ?? "").trim();
  if (!value || value === "https://" || value === "http://") {
    return required
      ? { level: "error", message: "Ajoutez l'adresse du lien." }
      : { level: null, message: null };
  }
  if (/^(mailto|tel):/i.test(value)) return { level: null, message: null };
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return {
      level: "error",
      message: "Adresse invalide : elle doit commencer par https://",
    };
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    !parsed.hostname.includes(".")
  ) {
    return {
      level: "error",
      message: "Adresse invalide : elle doit commencer par https://",
    };
  }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[")) {
    return {
      level: "error",
      message:
        "Un lien vers une adresse IP envoie l'e-mail en spam : utilisez un nom de domaine.",
    };
  }
  if (SHORTENERS.includes(host)) {
    return {
      level: "error",
      message:
        "Les liens raccourcis (bit.ly…) envoient l'e-mail en spam : mettez l'adresse complète.",
    };
  }
  if (parsed.protocol === "http:") {
    return {
      level: "warning",
      message: "Lien non sécurisé : préférez une adresse en https://",
    };
  }
  return { level: null, message: null };
}

// ── Destinataires ────────────────────────────────────────────────────────

/** Exclusions du décompte d'audience, dans l'ordre d'affichage. */
const EXCLUSIONS = [
  ["noEmail", "sans adresse e-mail", "sans adresse e-mail"],
  ["invalidEmail", "adresse invalide", "adresses invalides"],
  ["blocked", "contact bloqué", "contacts bloqués"],
  ["suppressed", "désinscrit ou exclu", "désinscrits ou exclus"],
  ["duplicates", "doublon", "doublons"],
  ["excludedByList", "dans une liste exclue", "dans une liste exclue"],
];

/** Exclusions non nulles : [{ key, count, label }]. */
export function audienceExclusions(count) {
  if (!count) return [];
  return EXCLUSIONS.filter(([key]) => (count[key] || 0) > 0).map(
    ([key, one, many]) => ({
      key,
      count: count[key],
      label: count[key] >= 2 ? many : one,
    }),
  );
}

export const RECIPIENT_FILTERS = [
  { value: "ALL", label: "Tous" },
  { value: "OPENED", label: "Ont ouvert" },
  { value: "CLICKED", label: "Ont cliqué" },
  { value: "NOT_OPENED", label: "N'ont pas ouvert" },
  { value: "BOUNCED", label: "Rejetés" },
  { value: "UNSUBSCRIBED", label: "Désinscrits" },
  { value: "FAILED", label: "Échecs" },
];

const RECIPIENT_STATUS = {
  PENDING: { label: "En attente", tone: "muted" },
  SENT: { label: "Envoyé", tone: "neutral" },
  DELIVERED: { label: "Remis", tone: "neutral" },
  SIMULATED: { label: "Simulé", tone: "neutral" },
  BOUNCED: { label: "Rejeté", tone: "danger" },
  COMPLAINED: { label: "Signalé en spam", tone: "danger" },
  FAILED: { label: "Échec", tone: "danger" },
  SKIPPED: { label: "Non envoyé", tone: "muted" },
};

/**
 * Ce qu'on retient d'un destinataire, du plus parlant au moins parlant :
 * désinscrit, a cliqué, a ouvert, sinon son statut d'envoi.
 */
export function recipientActivity(recipient) {
  if (!recipient) return { label: "", tone: "muted" };
  if (recipient.status === "COMPLAINED" || recipient.complainedAt)
    return RECIPIENT_STATUS.COMPLAINED;
  if (recipient.status === "BOUNCED") return RECIPIENT_STATUS.BOUNCED;
  if (recipient.unsubscribedAt) return { label: "Désinscrit", tone: "warning" };
  if (recipient.clickedAt || recipient.clickCount > 0)
    return { label: "A cliqué", tone: "success" };
  if (recipient.openedAt || recipient.openCount > 0)
    return { label: "A ouvert", tone: "accent" };
  return (
    RECIPIENT_STATUS[recipient.status] || {
      label: recipient.status,
      tone: "muted",
    }
  );
}

/** Dernière date connue d'un destinataire (activité la plus récente). */
export function recipientLastActivity(recipient) {
  const dates = [
    recipient?.unsubscribedAt,
    recipient?.complainedAt,
    recipient?.clickedAt,
    recipient?.openedAt,
    recipient?.bouncedAt,
    recipient?.deliveredAt,
    recipient?.sentAt,
  ]
    .map(toDate)
    .filter(Boolean);
  if (!dates.length) return null;
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

// ── Vérification avant envoi ─────────────────────────────────────────────

export const CHECK_LEVEL_ORDER = { ERROR: 0, WARNING: 1, INFO: 2, OK: 3 };

/** Contrôles du plus grave au moins grave (ordre de l'API gardé à égalité). */
export function sortChecks(checks) {
  return [...(checks || [])]
    .map((check, index) => ({ check, index }))
    .sort(
      (a, b) =>
        (CHECK_LEVEL_ORDER[a.check.level] ?? 9) -
          (CHECK_LEVEL_ORDER[b.check.level] ?? 9) || a.index - b.index,
    )
    .map(({ check }) => check);
}

/**
 * Où corriger un contrôle (identifiants de newbi-api, deliverability.js :
 * « subject_length », « links_shortener »…) : étape de la page
 * ({ section }), éditeur ({ editor }) ou paramètres de l'entreprise
 * ({ settings }). Le domaine d'envoi relève de Newbi : rien à corriger.
 */
export function checkTarget(id) {
  const key = String(id || "");
  if (key.startsWith("sender_domain")) return null;
  if (key === "reply_to" || key === "from_name")
    return { section: "expediteur" };
  if (key.startsWith("subject") || key === "preheader")
    return { section: "objet" };
  if (key.startsWith("audience")) return { section: "destinataires" };
  if (key.startsWith("legal")) return { settings: true };
  if (/^(content|images|links|html_size|variables)/.test(key))
    return { editor: true };
  return null;
}

/** Nombre de contrôles par niveau : { ERROR: 1, WARNING: 2, … }. */
export function countChecks(checks) {
  const counts = { ERROR: 0, WARNING: 0, INFO: 0, OK: 0 };
  for (const check of checks || []) {
    if (check.level in counts) counts[check.level] += 1;
  }
  return counts;
}

/** Ton de la note sur 10 : « good » (≥ 8), « fair » (≥ 5), « poor ». */
export const scoreTone = (score) =>
  score >= 8 ? "good" : score >= 5 ? "fair" : "poor";

/** « 8,5 » (au demi-point, comme l'API). */
export const formatScore = (score) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(
    Math.round((Number(score) || 0) * 2) / 2,
  );

// ── Étapes de la page de campagne ────────────────────────────────────────

/**
 * Étapes complètes de la campagne : expéditeur (nom et réponse), audience
 * (au moins une liste si « Des listes »), objet, contenu (au moins un bloc).
 */
export function campaignCompletion(campaign) {
  const audience = campaign?.audience || {};
  return {
    sender: Boolean(
      String(campaign?.fromName || "").trim() &&
      isValidEmail(campaign?.replyTo),
    ),
    audience:
      audience.mode === "ALL" ||
      (audience.mode === "LISTS" && (audience.listIds || []).length > 0),
    subject: Boolean(String(campaign?.subject || "").trim()),
    content: (campaign?.design?.blocks || []).length > 0,
  };
}

/** Quota du mois : « 1 240 / 2 500 e-mails ce mois-ci » et ton. */
export function quotaSummary(quota) {
  if (!quota) return null;
  const used = quota.usedThisMonth || 0;
  const limit = quota.monthlyLimit || 0;
  const share = limit > 0 ? used / limit : 0;
  return {
    used,
    limit,
    remaining: Math.max(0, quota.remaining ?? limit - used),
    share: Math.min(1, share),
    tone: share >= 1 ? "danger" : share >= 0.8 ? "warning" : "normal",
    label: `${formatCount(used)} / ${formatCount(limit)} e-mails ce mois-ci`,
  };
}

/** Raison d'une suppression (désinscription, rejet…) en clair. */
export const SUPPRESSION_REASONS = {
  UNSUBSCRIBED: "Désinscription",
  BOUNCED: "Adresse rejetée",
  COMPLAINED: "Signalé en spam",
  MANUAL: "Exclusion manuelle",
};

export const suppressionReasonLabel = (reason) =>
  SUPPRESSION_REASONS[reason] || reason;

// ─── Suivi des ouvertures et des clics ───────────────────────────────────
// Coupé par défaut (recommandation CNIL sur les pixels de suivi : accord
// préalable de chaque destinataire). Activé, l'envoi demande une
// attestation et l'API l'annonce dans le pied de l'e-mail.

/** La campagne suit-elle les ouvertures ou les clics ? */
export const isCampaignTracked = (campaign) =>
  Boolean(campaign?.trackOpens || campaign?.trackClicks);

/**
 * Phrase ajoutée par l'API au pied des e-mails d'une campagne suivie (même
 * texte que services/emailCampaigns/render.js), ou null sans suivi.
 */
export function trackingNoticeSentence(
  companyName,
  { opens = false, clicks = false } = {},
) {
  if (!opens && !clicks) return null;
  const measured =
    opens && clicks
      ? "l'ouverture de cet e-mail et les clics sur ses liens"
      : opens
        ? "l'ouverture de cet e-mail"
        : "les clics sur les liens de cet e-mail";
  return `${companyName || "l'expéditeur"} mesure ${measured}. Pour refuser ce suivi, répondez à cet e-mail.`;
}

/**
 * Ce que le rapport peut montrer par destinataire : ouvertures et clics
 * seulement s'ils ont été suivis et pas encore effacés (13 mois).
 */
export function recipientTracking(campaign) {
  const purged = Boolean(campaign?.trackingPurgedAt);
  return {
    opens: Boolean(campaign?.trackOpens) && !purged,
    clicks: Boolean(campaign?.trackClicks) && !purged,
    purged,
  };
}

/** Filtres du tableau des destinataires utiles pour cette campagne. */
export function recipientFiltersFor(campaign) {
  const { opens, clicks } = recipientTracking(campaign);
  return RECIPIENT_FILTERS.filter((item) => {
    if (item.value === "OPENED" || item.value === "NOT_OPENED") return opens;
    if (item.value === "CLICKED") return clicks;
    return true;
  });
}

/** Attestation demandée à l'envoi d'une campagne suivie. */
export function trackingConsentLabel(campaign) {
  const opens = Boolean(campaign?.trackOpens);
  const clicks = Boolean(campaign?.trackClicks);
  const measured =
    opens && clicks
      ? "l'ouverture de mes e-mails et les clics sur leurs liens"
      : opens
        ? "l'ouverture de mes e-mails"
        : "les clics sur les liens de mes e-mails";
  return `Mes destinataires ont accepté que je mesure ${measured}.`;
}

/**
 * Lien vers une politique de confidentialité : message d'erreur, ou null
 * (vide permis). L'API n'accepte qu'une adresse web.
 */
export function privacyPolicyUrlError(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (
      ["http:", "https:"].includes(url.protocol) &&
      url.hostname.includes(".")
    ) {
      return null;
    }
  } catch {
    // Adresse illisible : même message
  }
  return "Adresse invalide : elle doit commencer par https://";
}
