/**
 * Adresse d'envoi des campagnes e-mail : adresse Newbi par défaut
 * (« atelier-martin@envoi.newbi.fr ») ou domaine de l'entreprise connecté
 * (« Envoyer depuis votre adresse »), lignes DNS à ajouter chez son
 * hébergeur et messages des refus de l'API. Fonctions pures (aucune
 * dépendance React ni Apollo) : l'API refait tous les contrôles, ici on
 * guide l'utilisateur.
 */

import { apiRefusalMessage } from "@/src/graphql/mutationErrors";
import {
  CAMPAIGN_TIMEZONE,
  formatDateTime,
  isValidEmail,
} from "@/src/utils/email-campaigns";

const upper = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase();

// ── Adresse saisie ───────────────────────────────────────────────────────

/** Domaine d'une adresse, en minuscules (« » sans @). */
export function emailDomainOf(email) {
  const value = String(email ?? "")
    .trim()
    .toLowerCase();
  const at = value.lastIndexOf("@");
  return at > 0 ? value.slice(at + 1) : "";
}

/** Partie avant le @ (« contact » pour contact@atelier-martin.fr). */
export function emailLocalPart(email) {
  const value = String(email ?? "").trim();
  const at = value.lastIndexOf("@");
  return at > 0 ? value.slice(0, at) : "";
}

// Messageries gratuites : seul leur fournisseur peut authentifier leurs
// adresses (même liste que l'API ; elle reste seule juge)
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "ymail.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "orange.fr",
  "wanadoo.fr",
  "free.fr",
  "sfr.fr",
  "neuf.fr",
  "laposte.net",
  "bbox.fr",
  "numericable.fr",
  "club-internet.fr",
  "aliceadsl.fr",
  "proton.me",
  "protonmail.com",
  "mail.ru",
  "zoho.com",
]);
// Familles déclinées par pays : yahoo.fr, hotmail.co.uk, gmx.de…
const FREE_EMAIL_FAMILIES =
  /^(?:yahoo|hotmail|outlook|live|gmx|yandex)\.(?:[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})$/;

/** Domaine d'une messagerie gratuite (Gmail, Orange, Yahoo…). */
export function isFreeEmailDomain(domain) {
  const value = String(domain ?? "")
    .trim()
    .toLowerCase();
  return FREE_EMAIL_DOMAINS.has(value) || FREE_EMAIL_FAMILIES.test(value);
}

const NEWBI_DOMAINS = ["newbi.fr", "sweily.fr"];

/** Domaine de Newbi (ou sous-domaine) : jamais connectable par un client. */
export function isReservedSenderDomain(domain, newbiSenderEmail) {
  const value = String(domain ?? "")
    .trim()
    .toLowerCase();
  if (!value) return false;
  const roots = [...NEWBI_DOMAINS, emailDomainOf(newbiSenderEmail)].filter(
    Boolean,
  );
  return roots.some((root) => value === root || value.endsWith(`.${root}`));
}

/** Refus de l'API par code (`extensions.code`), en clair. */
export const SENDING_DOMAIN_ERRORS = {
  INVALID_SENDER_EMAIL:
    "Cette adresse n'est pas valide. Vérifiez-la, par exemple contact@votre-entreprise.fr.",
  FREE_EMAIL_PROVIDER:
    "Les adresses Gmail, Orange, Yahoo… ne peuvent pas être connectées : seul leur fournisseur peut les authentifier. Utilisez une adresse de votre propre domaine.",
  RESERVED_DOMAIN:
    "Cette adresse appartient à Newbi. Utilisez une adresse de votre propre domaine.",
  DOMAIN_ALREADY_CONNECTED:
    "Ce domaine est déjà connecté à un autre espace Newbi. S'il s'agit de l'un de vos espaces, déconnectez-le d'abord de celui-ci ; sinon, contactez le support.",
  SENDING_DOMAIN_EXISTS:
    "Un domaine est déjà connecté à cet espace. Déconnectez-le avant d'en connecter un autre.",
  SENDING_DOMAIN_IN_USE:
    "Une campagne en cours d'envoi ou programmée part de cette adresse. Attendez la fin de l'envoi ou annulez la programmation, puis réessayez.",
  NOT_FOUND: "Aucun domaine n'est connecté à cet espace.",
  FORBIDDEN:
    "Votre rôle ne permet pas de modifier l'adresse d'envoi. Demandez à un administrateur de l'espace.",
  SUBSCRIPTION_READ_ONLY:
    "Mode lecture seule : renouvelez votre abonnement pour modifier l'adresse d'envoi.",
};

/**
 * Adresse saisie pour la connexion : null si elle convient, sinon
 * { code, message } (mêmes codes que l'API, « EMPTY » si rien n'est saisi).
 */
export function checkSenderEmail(value, { newbiSenderEmail } = {}) {
  const email = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    return {
      code: "EMPTY",
      message:
        "Indiquez l'adresse d'envoi, par exemple contact@votre-entreprise.fr.",
    };
  }
  const reject = (code) => ({ code, message: SENDING_DOMAIN_ERRORS[code] });
  if (!isValidEmail(email)) return reject("INVALID_SENDER_EMAIL");
  const domain = emailDomainOf(email);
  if (isFreeEmailDomain(domain)) return reject("FREE_EMAIL_PROVIDER");
  if (isReservedSenderDomain(domain, newbiSenderEmail))
    return reject("RESERVED_DOMAIN");
  return null;
}

/**
 * Adresse proposée dans le champ : la première des candidates (e-mail de
 * l'entreprise, puis adresse de réponse) qui pourrait être connectée.
 */
export function suggestedSenderEmail(candidates, { newbiSenderEmail } = {}) {
  for (const candidate of candidates || []) {
    const email = String(candidate ?? "")
      .trim()
      .toLowerCase();
    if (email && !checkSenderEmail(email, { newbiSenderEmail })) return email;
  }
  return "";
}

// ── État du domaine ──────────────────────────────────────────────────────

export const SENDING_DOMAIN_STATUSES = [
  "NOT_STARTED",
  "PENDING",
  "VERIFIED",
  "PARTIALLY_VERIFIED",
  "PARTIALLY_FAILED",
  "TEMPORARY_FAILURE",
  "FAILED",
  "EXPIRED",
];

const FAILED_STATUSES = new Set([
  "FAILED",
  "PARTIALLY_FAILED",
  "TEMPORARY_FAILURE",
]);

/** Lignes DNS introuvables chez l'hébergeur. */
export const failedRecords = (domain) =>
  (domain?.records || []).filter((record) => upper(record.status) === "FAILED");

/**
 * État affiché : « none » (aucun domaine, ou retiré faute de validation),
 * « pending » (lignes à ajouter, vérification en attente), « verified »
 * (les campagnes partent de l'adresse de l'entreprise) ou « failed » (ligne
 * introuvable, vérification interrompue).
 */
export function sendingDomainState(domain) {
  if (!domain) return "none";
  const status = upper(domain.status);
  if (status === "EXPIRED") return "none";
  if (status === "VERIFIED") return "verified";
  if (FAILED_STATUSES.has(status) || failedRecords(domain).length > 0)
    return "failed";
  return "pending";
}

/** Domaine retiré automatiquement (7 jours sans validation). */
export const isExpiredSendingDomain = (domain) =>
  upper(domain?.status) === "EXPIRED";

/** Pastille du domaine : { label, tone } ; null sans domaine. */
export function sendingDomainBadge(domain) {
  const state = sendingDomainState(domain);
  if (state === "verified") return { label: "Connecté", tone: "success" };
  if (state === "pending")
    return { label: "En attente de validation", tone: "warning" };
  if (state === "failed") {
    if (upper(domain.status) === "TEMPORARY_FAILURE")
      return { label: "Vérification interrompue", tone: "warning" };
    const missing = failedRecords(domain).length;
    if (missing === 1) return { label: "Ligne introuvable", tone: "danger" };
    if (missing > 1) return { label: "Lignes introuvables", tone: "danger" };
    return { label: "Validation impossible", tone: "danger" };
  }
  return null;
}

/**
 * Ce qui bloque un domaine en échec : { title, text } ; null s'il n'est
 * pas en échec.
 */
export function sendingDomainProblem(domain) {
  if (sendingDomainState(domain) !== "failed") return null;
  if (upper(domain.status) === "TEMPORARY_FAILURE") {
    return {
      title: "La vérification n'a pas pu aboutir",
      text: "Le contrôle de votre domaine a été interrompu, le plus souvent par un incident passager. Réessayez dans quelques minutes.",
    };
  }
  const missing = failedRecords(domain).length;
  if (missing > 0) {
    return {
      title:
        missing === 1
          ? "1 ligne est introuvable chez votre hébergeur"
          : `${missing} lignes sont introuvables chez votre hébergeur`,
      text:
        missing === 1
          ? "Vérifiez qu'elle est ajoutée telle quelle (type, nom et valeur, sans espace en trop), puis cliquez sur Vérifier."
          : "Vérifiez qu'elles sont ajoutées telles quelles (type, nom et valeur, sans espace en trop), puis cliquez sur Vérifier.",
    };
  }
  return {
    title: "Votre domaine n'a pas pu être validé",
    text: "Vérifiez que toutes les lignes ci-dessous sont ajoutées chez votre hébergeur, puis cliquez sur Vérifier.",
  };
}

const RECORD_STATUS = {
  VERIFIED: { label: "Validée", tone: "success" },
  FAILED: { label: "Introuvable", tone: "danger" },
  TEMPORARY_FAILURE: { label: "À revérifier", tone: "warning" },
  PENDING: { label: "En attente", tone: "neutral" },
  NOT_STARTED: { label: "En attente", tone: "neutral" },
};

/** Libellé et ton de l'état d'une ligne DNS. */
export const recordStatusMeta = (status) =>
  RECORD_STATUS[upper(status)] || RECORD_STATUS.PENDING;

// ── Lignes DNS ───────────────────────────────────────────────────────────

/**
 * Nom à saisir chez l'hébergeur : relatif à la zone, tel que Resend le
 * donne (« @ » pour la zone elle-même), ou complet si l'hébergeur le
 * demande.
 */
export function recordDisplayName(record, { full = false } = {}) {
  const name = String(record?.name ?? "").trim();
  const fqdn = String(record?.fqdn ?? "").trim();
  if (full) return fqdn || name || "@";
  return name && name !== "@" ? name : "@";
}

/** Hébergeur détecté, sinon une désignation générique. */
export const hostLabel = (dnsProvider) =>
  String(dnsProvider ?? "").trim() || "votre hébergeur de domaine";

/**
 * Rappel du point final des cibles MX et CNAME (OVH ajoute sinon le
 * domaine à la fin) : { provider, example } avec l'exemple d'une valeur
 * qui n'en a pas, ou null si toutes en ont déjà un.
 */
export function trailingDotReminder(records, dnsProvider) {
  const record = (records || []).find(
    (item) =>
      ["MX", "CNAME"].includes(upper(item.type)) &&
      String(item.value ?? "").trim() &&
      !String(item.value).trim().endsWith("."),
  );
  if (!record) return null;
  return {
    ovh: upper(dnsProvider) === "OVH",
    example: `${String(record.value).trim()}.`,
  };
}

// ── Dates ────────────────────────────────────────────────────────────────

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const longDayFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: CAMPAIGN_TIMEZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const parisDayFormatter = new Intl.DateTimeFormat("fr-CA", {
  timeZone: CAMPAIGN_TIMEZONE,
});
const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: CAMPAIGN_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
});

/** « mardi 25 novembre » (heure de Paris). */
export function formatLongDay(value) {
  const date = toDate(value);
  return date ? longDayFormatter.format(date) : "";
}

/** « aujourd'hui à 14:32 », sinon « 18 nov. à 14:32 » (heure de Paris). */
export function formatCheckTime(value, now = new Date()) {
  const date = toDate(value);
  if (!date) return "";
  if (parisDayFormatter.format(date) === parisDayFormatter.format(now))
    return `aujourd'hui à ${timeFormatter.format(date)}`;
  return formatDateTime(date, now);
}

/** Retrait automatique d'un domaine non validé ; null sans date. */
export function expiryNotice(expiresAt) {
  const day = formatLongDay(expiresAt);
  return day
    ? `Sans validation d'ici le ${day}, le domaine sera retiré automatiquement : il suffira de le connecter de nouveau.`
    : null;
}

// ── Campagne ─────────────────────────────────────────────────────────────

/**
 * Adresse d'envoi d'une campagne : pour un brouillon, celle de l'espace
 * (elle suit le domaine connecté jusqu'au lancement) ; ensuite, celle que
 * l'API a figée dans la campagne.
 */
export function effectiveSenderEmail(campaign, settings) {
  const current = settings?.senderEmail || "";
  const own = campaign?.senderEmail || "";
  return campaign?.status === "DRAFT" ? current || own : own || current;
}

/**
 * Domaine pas encore validé : { domain, fallbackEmail, validating, text }
 * pour « Votre domaine X est en cours de validation : en attendant, vos
 * campagnes partent de Y. » ; null sans domaine, validé ou retiré.
 */
export function pendingDomainNotice(settings) {
  const domain = settings?.sendingDomain;
  const state = sendingDomainState(domain);
  if (state !== "pending" && state !== "failed") return null;
  const fallbackEmail =
    settings?.newbiSenderEmail || settings?.senderEmail || "l'adresse Newbi";
  const validating = state === "pending";
  return {
    domain: domain.domain,
    fallbackEmail,
    validating,
    text: `Votre domaine ${domain.domain} ${
      validating ? "est en cours de validation" : "n'est pas encore validé"
    } : en attendant, vos campagnes partent de ${fallbackEmail}.`,
  };
}

/** Lien de la section Expéditeur vers le panneau, selon l'état du domaine. */
export function senderPanelLinkLabel(domain) {
  const state = sendingDomainState(domain);
  if (state === "verified") return "Gérer l'adresse d'envoi";
  if (state === "pending") return "Suivre la validation";
  if (state === "failed") return "Voir ce qui manque";
  return "Envoyer depuis votre adresse";
}

// ── Refus de l'API ───────────────────────────────────────────────────────

const UNAVAILABLE = {
  connect:
    "Impossible de connecter un domaine pour le moment. Notre équipe a été prévenue.",
  verify:
    "Impossible de vérifier votre domaine pour le moment. Notre équipe a été prévenue.",
  update:
    "Impossible de modifier l'adresse pour le moment. Notre équipe a été prévenue.",
  disconnect:
    "Impossible de déconnecter le domaine pour le moment. Notre équipe a été prévenue.",
};

const FALLBACK = {
  connect:
    "Le domaine n'a pas pu être connecté. Réessayez dans quelques instants.",
  verify:
    "La vérification n'a pas pu être lancée. Réessayez dans quelques instants.",
  update:
    "L'adresse n'a pas pu être modifiée. Réessayez dans quelques instants.",
  disconnect:
    "Le domaine n'a pas pu être déconnecté. Réessayez dans quelques instants.",
  load: "L'adresse d'envoi n'a pas pu être chargée. Réessayez dans quelques instants.",
};

// Codes dont le message est technique (jamais montré tel quel)
const TECHNICAL_CODES = new Set([
  "INTERNAL_SERVER_ERROR",
  "INTERNAL_ERROR",
  "DATABASE_ERROR",
  "GRAPHQL_PARSE_FAILED",
  "GRAPHQL_VALIDATION_FAILED",
  "BAD_USER_INPUT",
  "UNAUTHENTICATED",
]);

/** Premier code d'erreur GraphQL (`extensions.code`), sinon null. */
export function apiErrorCode(error) {
  const first = error?.graphQLErrors?.[0] || error?.errors?.[0];
  return first?.extensions?.code || error?.extensions?.code || null;
}

/**
 * Message d'un refus de l'API pour `action` (connect, verify, update,
 * disconnect, load) : d'après son code, puis le message rédigé par l'API
 * pour les autres refus métier, sinon un message générique.
 */
export function sendingDomainErrorMessage(error, action = "connect") {
  if (!error) return null;
  const code = apiErrorCode(error);
  if (code === "SENDING_DOMAIN_UNAVAILABLE")
    return UNAVAILABLE[action] || UNAVAILABLE.connect;
  if (code && SENDING_DOMAIN_ERRORS[code]) return SENDING_DOMAIN_ERRORS[code];
  if (!code && error.networkError) {
    return "Connexion impossible avec le serveur. Vérifiez votre connexion, puis réessayez.";
  }
  const message = (error.graphQLErrors?.[0] || error.errors?.[0])?.message;
  if (code && message && !TECHNICAL_CODES.has(code)) {
    const clean = apiRefusalMessage({ message });
    if (clean) return clean;
  }
  return FALLBACK[action] || FALLBACK.connect;
}
