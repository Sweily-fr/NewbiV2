/**
 * Règles des posts réseaux sociaux programmés depuis le kanban.
 *
 * Fonctions pures (aucune dépendance React ni Apollo) : limites par réseau,
 * compteur de caractères, contrôles avant envoi, dates à l'heure de Paris et
 * libellés de statut. L'API refait tous ces contrôles : ici on guide
 * l'utilisateur avant l'envoi, sans jamais bloquer ce que l'API accepterait.
 */

export const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "linkedin",
  "twitter",
  "tiktok",
];

export const SOCIAL_TIMEZONE = "Europe/Paris";

// Délais imposés par l'API pour une publication programmée
export const MIN_SCHEDULE_DELAY_MS = 5 * 60 * 1000;
export const MAX_SCHEDULE_DELAY_MS = 365 * 24 * 60 * 60 * 1000;

// Poids accepté au téléversement (l'API recompresse ensuite chaque image)
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

// Lien raccourci par X : toute URL compte pour 23 caractères
const TWITTER_URL_LENGTH = 23;

/**
 * Limites par réseau (images seulement, pas de vidéo).
 * minRatio / maxRatio : largeur / hauteur acceptées (Instagram).
 * minWidth / minHeight : taille minimale (LinkedIn).
 */
export const PLATFORM_RULES = {
  instagram: {
    label: "Instagram",
    maxLength: 2200,
    maxImages: 10,
    imageRequired: true,
    minRatio: 0.5625,
    maxRatio: 1.91,
  },
  facebook: {
    label: "Facebook",
    maxLength: 63206,
    maxImages: 10,
    imageRequired: false,
  },
  linkedin: {
    label: "LinkedIn",
    maxLength: 3000,
    maxImages: 20,
    imageRequired: false,
    minWidth: 552,
    minHeight: 276,
  },
  twitter: {
    label: "X",
    maxLength: 280,
    maxImages: 4,
    imageRequired: false,
  },
  tiktok: {
    label: "TikTok",
    maxLength: 4000,
    maxImages: 35,
    imageRequired: true,
  },
};

// Sans réseau choisi, on garde la limite d'images la plus courante
const DEFAULT_MAX_IMAGES = 10;
// Petite tolérance d'arrondi sur le ratio (image 1080 × 1920 = 0,5625 pile)
const RATIO_TOLERANCE = 0.005;

export const TIKTOK_MUSIC_CONFIRMATION_URL =
  "https://www.tiktok.com/legal/page/global/music-usage-confirmation/fr";

/** Nom affiché d'un réseau (« X » pour twitter) */
export function getPlatformLabel(platform) {
  return PLATFORM_RULES[platform]?.label || platform || "ce réseau";
}

/** Liste lisible : « Instagram », « Instagram et X », « Instagram, X et TikTok » */
export function joinLabels(labels) {
  const list = (labels || []).filter(Boolean);
  if (list.length <= 1) return list[0] || "";
  return `${list.slice(0, -1).join(", ")} et ${list[list.length - 1]}`;
}

/** Réseaux distincts, dans l'ordre de SOCIAL_PLATFORMS */
export function uniquePlatforms(platforms) {
  const set = new Set(platforms || []);
  return SOCIAL_PLATFORMS.filter((p) => set.has(p));
}

// ── Compteur de caractères ────────────────────────────────────────────────

const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s]+/gi;
const EMOJI_PATTERN = /\p{Extended_Pictographic}/u;

// Caractères comptés 1 par X (latin, grec, cyrillique, ponctuation
// courante) ; les autres (CJK, emoji…) comptent 2
function twitterCodePointWeight(codePoint) {
  if (
    codePoint <= 4351 ||
    (codePoint >= 8192 && codePoint <= 8205) ||
    (codePoint >= 8208 && codePoint <= 8223) ||
    (codePoint >= 8242 && codePoint <= 8247)
  ) {
    return 1;
  }
  return 2;
}

function splitGraphemes(text) {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter("fr", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

function twitterTextWeight(text) {
  let total = 0;
  for (const grapheme of splitGraphemes(text)) {
    if (EMOJI_PATTERN.test(grapheme)) {
      total += 2;
      continue;
    }
    for (const char of grapheme) {
      total += twitterCodePointWeight(char.codePointAt(0));
    }
  }
  return total;
}

/**
 * Longueur du texte telle que le réseau la compte.
 * X : chaque lien vaut 23 caractères, emoji et CJK comptent double.
 * Autres réseaux : nombre de caractères (un emoji compte pour un).
 */
export function countPostLength(text, platform) {
  const value = text || "";
  if (platform !== "twitter") return Array.from(value).length;
  let total = 0;
  let lastIndex = 0;
  for (const match of value.matchAll(URL_PATTERN)) {
    total += twitterTextWeight(value.slice(lastIndex, match.index));
    total += TWITTER_URL_LENGTH;
    lastIndex = match.index + match[0].length;
  }
  total += twitterTextWeight(value.slice(lastIndex));
  return total;
}

/**
 * Compteur du réseau le plus contraint parmi ceux choisis : celui à qui il
 * reste le moins de caractères (ex. « 245 / 280 (X) »).
 * @returns {{ platform: string, label: string, count: number, max: number, remaining: number, over: boolean } | null}
 */
export function getTextLimit(text, platforms) {
  let worst = null;
  for (const platform of uniquePlatforms(platforms)) {
    const rules = PLATFORM_RULES[platform];
    const count = countPostLength(text, platform);
    const remaining = rules.maxLength - count;
    if (!worst || remaining < worst.remaining) {
      worst = {
        platform,
        label: rules.label,
        count,
        max: rules.maxLength,
        remaining,
        over: remaining < 0,
      };
    }
  }
  return worst;
}

/**
 * Nombre d'images maximum : le plus petit des réseaux choisis.
 * @returns {{ max: number, label: string | null }}
 */
export function getMaxImages(platforms) {
  let best = null;
  for (const platform of uniquePlatforms(platforms)) {
    const rules = PLATFORM_RULES[platform];
    if (!best || rules.maxImages < best.max) {
      best = { max: rules.maxImages, label: rules.label };
    }
  }
  return best || { max: DEFAULT_MAX_IMAGES, label: null };
}

/** Réseaux choisis qui exigent au moins une image */
export function getPlatformsRequiringImage(platforms) {
  return uniquePlatforms(platforms).filter(
    (p) => PLATFORM_RULES[p].imageRequired,
  );
}

/**
 * Ratio accepté par Instagram (largeur / hauteur entre 9:16 et 1,91:1).
 * Dimensions inconnues : on laisse l'API trancher.
 */
export function isInstagramRatioValid(width, height) {
  if (!width || !height) return true;
  const { minRatio, maxRatio } = PLATFORM_RULES.instagram;
  const ratio = width / height;
  return (
    ratio >= minRatio - RATIO_TOLERANCE && ratio <= maxRatio + RATIO_TOLERANCE
  );
}

/** Taille minimale LinkedIn (dimensions inconnues : acceptée) */
export function isLinkedInSizeValid(width, height) {
  if (!width || !height) return true;
  const { minWidth, minHeight } = PLATFORM_RULES.linkedin;
  return width >= minWidth && height >= minHeight;
}

function imagePositions(media, predicate) {
  const positions = [];
  (media || []).forEach((item, index) => {
    if (!predicate(item)) positions.push(index + 1);
  });
  return positions;
}

function formatPositions(positions) {
  if (positions.length === 1) return `image ${positions[0]}`;
  return `images ${joinLabels(positions.map(String))}`;
}

/**
 * Contrôles avant envoi. Chaque erreur est rattachée à une partie du
 * formulaire (`field`) pour être affichée au bon endroit.
 *
 * @param {object} input
 * @param {string[]} input.platforms réseaux des comptes choisis
 * @param {number} input.accountCount nombre de comptes choisis
 * @param {string} input.content
 * @param {Array<{ width?: number, height?: number }>} input.media images téléversées
 * @param {boolean} [input.publishNow]
 * @param {string|null} [input.scheduledFor] ISO UTC
 * @param {Date} [input.now]
 * @param {{ privacyLevel?: string, consentGiven?: boolean, canPostMore?: boolean }} [input.tiktok]
 * @returns {Array<{ field: "accounts"|"content"|"media"|"when"|"tiktok", code: string, message: string }>}
 */
export function validateSocialPost({
  platforms = [],
  accountCount,
  content = "",
  media = [],
  publishNow = false,
  scheduledFor = null,
  now = new Date(),
  tiktok = {},
}) {
  const errors = [];
  const selected = uniquePlatforms(platforms);
  const count = accountCount ?? platforms.length;

  if (count === 0) {
    errors.push({
      field: "accounts",
      code: "no_account",
      message: "Choisissez au moins un compte.",
    });
  }

  const hasText = (content || "").trim().length > 0;
  const imageCount = media.length;

  if (!hasText && imageCount === 0) {
    errors.push({
      field: "content",
      code: "empty",
      message: "Écrivez un texte ou ajoutez une image.",
    });
  }

  const textLimit = getTextLimit(content, selected);
  if (textLimit?.over) {
    errors.push({
      field: "content",
      code: "text_too_long",
      message: `Le texte dépasse la limite de ${textLimit.label} (${textLimit.count} / ${textLimit.max}).`,
    });
  }

  if (selected.length > 0) {
    const { max, label } = getMaxImages(selected);
    if (imageCount > max) {
      errors.push({
        field: "media",
        code: "too_many_images",
        message: `${label} accepte ${max} images au maximum.`,
      });
    }
  }

  const requiring = getPlatformsRequiringImage(selected);
  if (requiring.length > 0 && imageCount === 0) {
    const labels = joinLabels(requiring.map(getPlatformLabel));
    errors.push({
      field: "media",
      code: "image_required",
      message: `${labels} ${requiring.length > 1 ? "demandent" : "demande"} au moins une image.`,
    });
  }

  if (selected.includes("instagram")) {
    const invalid = imagePositions(media, (m) =>
      isInstagramRatioValid(m?.width, m?.height),
    );
    if (invalid.length > 0) {
      errors.push({
        field: "media",
        code: "instagram_ratio",
        message:
          invalid.length === 1
            ? `Image ${invalid[0]} trop allongée pour Instagram : recadrez-la entre le format portrait 9:16 et le format paysage 1,91:1.`
            : `Images ${joinLabels(invalid.map(String))} trop allongées pour Instagram : recadrez-les entre le format portrait 9:16 et le format paysage 1,91:1.`,
      });
    }
  }

  if (selected.includes("linkedin")) {
    const invalid = imagePositions(media, (m) =>
      isLinkedInSizeValid(m?.width, m?.height),
    );
    if (invalid.length > 0) {
      errors.push({
        field: "media",
        code: "linkedin_size",
        message: `LinkedIn demande des images d'au moins 552 × 276 pixels (${formatPositions(invalid)}).`,
      });
    }
  }

  if (!publishNow) {
    const when = scheduledFor ? new Date(scheduledFor) : null;
    if (!when || Number.isNaN(when.getTime())) {
      errors.push({
        field: "when",
        code: "when_missing",
        message: "Choisissez la date et l'heure de publication.",
      });
    } else if (when.getTime() < now.getTime() + MIN_SCHEDULE_DELAY_MS) {
      errors.push({
        field: "when",
        code: "when_too_soon",
        message:
          "La date de publication doit être au moins 5 minutes dans le futur.",
      });
    } else if (when.getTime() > now.getTime() + MAX_SCHEDULE_DELAY_MS) {
      errors.push({
        field: "when",
        code: "when_too_far",
        message: "La date de publication ne peut pas dépasser un an.",
      });
    }
  }

  if (selected.includes("tiktok")) {
    if (tiktok.canPostMore === false) {
      errors.push({
        field: "tiktok",
        code: "tiktok_quota",
        message:
          "Ce compte TikTok ne peut plus publier pour le moment. Réessayez plus tard.",
      });
    }
    if (!tiktok.privacyLevel) {
      errors.push({
        field: "tiktok",
        code: "tiktok_privacy",
        message: "Choisissez qui peut voir le post sur TikTok.",
      });
    }
    if (!tiktok.consentGiven) {
      errors.push({
        field: "tiktok",
        code: "tiktok_consent",
        message:
          "Acceptez la confirmation d'utilisation de la musique de TikTok.",
      });
    }
  }

  return errors;
}

// ── Dates à l'heure de Paris ─────────────────────────────────────────────

const partsFormatterCache = new Map();
function getPartsFormatter(timeZone) {
  if (!partsFormatterCache.has(timeZone)) {
    partsFormatterCache.set(
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
  return partsFormatterCache.get(timeZone);
}

function zonedParts(date, timeZone = SOCIAL_TIMEZONE) {
  const out = {};
  for (const part of getPartsFormatter(timeZone).formatToParts(date)) {
    if (part.type !== "literal") out[part.type] = Number(part.value);
  }
  return out;
}

// Décalage (ms) entre l'heure du fuseau et UTC à cet instant
function zoneOffsetMs(date, timeZone = SOCIAL_TIMEZONE) {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

const pad = (n) => String(n).padStart(2, "0");

/**
 * Date (yyyy-MM-dd) et heure (HH:mm) saisies à l'heure de Paris → ISO UTC.
 * Indépendant du fuseau du navigateur. Heure inexistante (passage à l'heure
 * d'été) : décalée d'une heure, comme le fait l'horloge.
 */
export function parisPartsToIso(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = timeStr.split(":").map(Number);
  if ([y, m, d, h, min].some((n) => !Number.isFinite(n))) return null;
  const wall = Date.UTC(y, m - 1, d, h, min);
  const firstOffset = zoneOffsetMs(new Date(wall));
  let ts = wall - firstOffset;
  const secondOffset = zoneOffsetMs(new Date(ts));
  if (secondOffset !== firstOffset) ts = wall - secondOffset;
  return new Date(ts).toISOString();
}

/** ISO UTC → { date: "yyyy-MM-dd", time: "HH:mm" } à l'heure de Paris */
export function isoToParisParts(iso) {
  const date = iso instanceof Date ? iso : new Date(iso);
  if (!iso || Number.isNaN(date.getTime())) return { date: "", time: "" };
  const p = zonedParts(date);
  return {
    date: `${p.year}-${pad(p.month)}-${pad(p.day)}`,
    time: `${pad(p.hour)}:${pad(p.minute)}`,
  };
}

/** Même mois civil, heure de Paris */
export function isSameParisMonth(a, b) {
  const monthA = isoToParisParts(a).date.slice(0, 7);
  return !!monthA && monthA === isoToParisParts(b).date.slice(0, 7);
}

/**
 * Mention de la limite mensuelle de posts X sous les comptes choisis (chaque
 * envoi à X est facturé à Sweily). `extra` : envois à X que ce post ajoute ;
 * `at` : date de publication (ISO, null = maintenant). null : rien à dire.
 */
export function getXQuotaNote({ quota, extra, at, now = new Date() }) {
  if (!quota || !extra || extra <= 0) return null;
  if (!isSameParisMonth(at || now, now)) {
    return {
      tone: "muted",
      message: `X : ${quota.monthlyQuota} posts par mois avec votre offre.`,
    };
  }
  const s = quota.remaining > 1 ? "s" : "";
  if (quota.remaining >= extra) {
    return {
      tone: "muted",
      message: `X : ${quota.remaining} post${s} restant${s} ce mois-ci sur ${quota.monthlyQuota} avec votre offre.`,
    };
  }
  if (quota.remaining === 0) {
    return {
      tone: "warning",
      message: `Limite de posts X atteinte ce mois-ci (${quota.monthlyQuota} avec votre offre). Le compteur repart à zéro le 1er du mois prochain.`,
    };
  }
  return {
    tone: "warning",
    message: `Il reste ${quota.remaining} post${s} X ce mois-ci (${quota.monthlyQuota} avec votre offre) : retirez un compte X.`,
  };
}

/** Programmation proposée par défaut : demain 9:00, heure de Paris */
export function getDefaultScheduleParts(now = new Date()) {
  const p = zonedParts(now);
  const tomorrow = new Date(Date.UTC(p.year, p.month - 1, p.day + 1));
  return {
    date: `${tomorrow.getUTCFullYear()}-${pad(tomorrow.getUTCMonth() + 1)}-${pad(tomorrow.getUTCDate())}`,
    time: "09:00",
  };
}

/** Jour (yyyy-MM-dd, heure de Paris) d'aujourd'hui */
export function getParisToday(now = new Date()) {
  return isoToParisParts(now).date;
}

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: SOCIAL_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
});
const longDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: SOCIAL_TIMEZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: SOCIAL_TIMEZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});

function toValidDate(iso) {
  if (!iso) return null;
  const date = iso instanceof Date ? iso : new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** « 14:30 » (heure de Paris) */
export function formatParisTime(iso) {
  const date = toValidDate(iso);
  return date ? timeFormatter.format(date) : "";
}

/** « jeudi 29 octobre à 14:30 » (heure de Paris) */
export function formatParisDateTime(iso) {
  const date = toValidDate(iso);
  if (!date) return "";
  return `${longDateFormatter.format(date)} à ${timeFormatter.format(date)}`;
}

/** « jeu. 29 oct. à 14:30 » (heure de Paris) */
export function formatParisShortDateTime(iso) {
  const date = toValidDate(iso);
  if (!date) return "";
  return `${shortDateFormatter.format(date)} à ${timeFormatter.format(date)}`;
}

// ── Statuts ──────────────────────────────────────────────────────────────

/**
 * Libellé et ton du statut global d'un post.
 * tone : scheduled | progress | success | warning | error | muted
 */
export function getPostStatusInfo(status, scheduledFor) {
  switch (status) {
    case "scheduled": {
      const time = formatParisTime(scheduledFor);
      return {
        label: time ? `Programmé · ${time}` : "Programmé",
        tone: "scheduled",
      };
    }
    case "publishing":
      return { label: "Publication…", tone: "progress" };
    case "published":
      return { label: "Publié", tone: "success" };
    case "partial":
      return { label: "Partiel", tone: "warning" };
    case "failed":
      return { label: "Échec", tone: "error" };
    case "cancelled":
      return { label: "Annulé", tone: "muted" };
    default:
      return { label: "Programmé", tone: "scheduled" };
  }
}

/** Libellé et ton du statut d'un réseau (cible) du post */
export function getTargetStatusInfo(status) {
  switch (status) {
    case "published":
      return { label: "Publié", tone: "success" };
    case "publishing":
    case "processing":
    case "uploading":
      return { label: "Publication…", tone: "progress" };
    case "failed":
      return { label: "Échec", tone: "error" };
    case "cancelled":
      return { label: "Annulé", tone: "muted" };
    default:
      return { label: "En attente", tone: "scheduled" };
  }
}

const POLL_WINDOW_MS = 15 * 60 * 1000;
const TIKTOK_URL_WAIT_MS = 60 * 60 * 1000;

/**
 * Faut-il rafraîchir les posts du tableau ? Oui tant qu'un post est en
 * cours de publication, programmé dans moins de 15 minutes (ou en retard),
 * ou publié sur TikTok depuis moins d'une heure sans lien (TikTok le donne
 * quelques minutes après).
 */
export function shouldPollSocialPosts(posts, now = new Date()) {
  const nowMs = now.getTime();
  return (posts || []).some((post) => {
    if (!post) return false;
    if (post.status === "publishing") return true;
    if (post.status === "scheduled") {
      const at = toValidDate(post.scheduledFor);
      return !!at && at.getTime() - nowMs <= POLL_WINDOW_MS;
    }
    if (post.status === "published" || post.status === "partial") {
      return (post.targets || []).some((t) => {
        if (t?.platform !== "tiktok" || t.status !== "published") return false;
        if (t.platformPostUrl) return false;
        const at = toValidDate(t.publishedAt) || toValidDate(post.scheduledFor);
        return !!at && nowMs - at.getTime() <= TIKTOK_URL_WAIT_MS;
      });
    }
    return false;
  });
}

// ── Connexion des comptes ────────────────────────────────────────────────

/**
 * Message du retour de connexion en échec (?social_error=<code>).
 * Code inconnu : message générique (Zernio ajoute des codes sans prévenir).
 */
export function getSocialConnectErrorMessage(code, platform) {
  const label = PLATFORM_RULES[platform]?.label || "ce réseau";
  switch (code) {
    case "oauth_denied":
    case "access_denied":
    case "cancelled":
      return `Connexion à ${label} annulée.`;
    case "no_facebook_pages":
      return "Aucune page Facebook n'a été choisie. Recommencez en cochant la page à utiliser.";
    case "payment_required":
    case "PAYMENT_REQUIRED":
      return "Connexion momentanément indisponible, contactez le support Newbi.";
    case "account_mismatch":
      return `Ce compte ${label} ne correspond pas à celui attendu. Reconnectez le bon compte.`;
    case "forbidden":
      return "Votre rôle ne permet pas de connecter un réseau social.";
    case "invalid_state":
      return "Le lien de connexion a expiré. Recommencez la connexion.";
    default:
      return `La connexion à ${label} a échoué. Réessayez.`;
  }
}

const SAFE_DASHBOARD_PATH = /^\/dashboard\/[^/]/;

/**
 * Chemin de retour après la connexion lancée depuis le kanban : la page
 * courante avec ?socialPost=new pour rouvrir la fenêtre de programmation.
 */
export function buildComposerReturnTo(pathname) {
  const path = SAFE_DASHBOARD_PATH.test(pathname || "")
    ? pathname
    : "/dashboard/outils/kanban";
  return `${path}?socialPost=new`;
}

/**
 * Chemin de retour après une connexion lancée depuis les paramètres : la
 * page courante, paramètres rouverts sur les applications. L'API n'accepte
 * que « /dashboard » et les chemins en dessous.
 */
export function buildSettingsReturnTo(pathname) {
  const path = SAFE_DASHBOARD_PATH.test(pathname || "")
    ? pathname
    : "/dashboard";
  return `${path}?openSettings=true&settingsTab=applications`;
}
