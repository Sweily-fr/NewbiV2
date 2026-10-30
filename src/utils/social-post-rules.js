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

// Vidéo : une seule par post, jamais avec des photos. Formats et poids
// acceptés à l'envoi ; le serveur la prépare ensuite (MP4 H.264). Envoi
// plafonné à 500 Mo binaires, poids par réseau en unités décimales
// (« 300 Mo » chez Meta), comme l'API.
const MB = 1024 * 1024;
const DECIMAL_KB = 1000;
const DECIMAL_MB = 1000 * 1000;
const DECIMAL_GB = 1000 * 1000 * 1000;
export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-m4v",
  "video/webm",
];
const VIDEO_TYPES_BY_EXTENSION = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  webm: "video/webm",
};
export const MAX_VIDEO_UPLOAD_BYTES = 500 * MB;
export const MIN_VIDEO_DURATION_MS = 3 * 1000;
export const MAX_VIDEO_DURATION_MS = 10 * 60 * 1000;

// Lien raccourci par X : toute URL compte pour 23 caractères
const TWITTER_URL_LENGTH = 23;

/**
 * Limites par réseau.
 * minRatio / maxRatio : largeur / hauteur acceptées (images Instagram).
 * minWidth / minHeight : taille minimale (images LinkedIn).
 * video : durées (ms) et poids (octets, après préparation par le serveur).
 * story.video : mêmes limites pour une story (Instagram et Facebook).
 * La durée maximale TikTok dépend du compte (creator_info).
 */
export const PLATFORM_RULES = {
  instagram: {
    label: "Instagram",
    maxLength: 2200,
    maxImages: 10,
    imageRequired: true,
    minRatio: 0.5625,
    maxRatio: 1.91,
    video: {
      minDurationMs: MIN_VIDEO_DURATION_MS,
      maxDurationMs: MAX_VIDEO_DURATION_MS,
      maxBytes: 300 * DECIMAL_MB,
    },
    story: {
      video: {
        minDurationMs: MIN_VIDEO_DURATION_MS,
        maxDurationMs: 60 * 1000,
        maxBytes: 100 * DECIMAL_MB,
      },
    },
  },
  facebook: {
    label: "Facebook",
    maxLength: 63206,
    maxImages: 10,
    imageRequired: false,
    video: { maxDurationMs: MAX_VIDEO_DURATION_MS, maxBytes: DECIMAL_GB },
    // Pas de poids publié pour une story : on garde celui de la vidéo de page
    story: {
      video: {
        minDurationMs: MIN_VIDEO_DURATION_MS,
        maxDurationMs: 60 * 1000,
        maxBytes: DECIMAL_GB,
      },
    },
  },
  linkedin: {
    label: "LinkedIn",
    maxLength: 3000,
    maxImages: 20,
    imageRequired: false,
    minWidth: 552,
    minHeight: 276,
    video: {
      minDurationMs: MIN_VIDEO_DURATION_MS,
      maxDurationMs: MAX_VIDEO_DURATION_MS,
      minBytes: 75 * DECIMAL_KB,
      maxBytes: 500 * DECIMAL_MB,
    },
  },
  twitter: {
    label: "X",
    maxLength: 280,
    maxImages: 4,
    imageRequired: false,
    // Limite des comptes X non Premium
    video: { maxDurationMs: 140 * 1000, maxBytes: 512 * DECIMAL_MB },
  },
  tiktok: {
    label: "TikTok",
    maxLength: 4000,
    maxImages: 35,
    imageRequired: true,
    // Titre d'une vidéo : 2 200 caractères comptés en UTF-16
    video: {
      maxLength: 2200,
      minDurationMs: MIN_VIDEO_DURATION_MS,
      maxBytes: 4 * DECIMAL_GB,
    },
  },
};

// Sans réseau choisi, on garde la limite d'images la plus courante
const DEFAULT_MAX_IMAGES = 10;
// Petite tolérance d'arrondi sur le ratio (image 1080 × 1920 = 0,5625 pile)
const RATIO_TOLERANCE = 0.005;

export const TIKTOK_MUSIC_CONFIRMATION_URL =
  "https://www.tiktok.com/legal/page/global/music-usage-confirmation/fr";
export const TIKTOK_BRANDED_CONTENT_POLICY_URL =
  "https://www.tiktok.com/legal/page/global/bc-policy/fr";

// Stories : Instagram et Facebook seulement (aucune API ailleurs)
export const STORY_PLATFORMS = ["instagram", "facebook"];
// Son tendance : Instagram (comptes connectés via Facebook, Reel) et TikTok
// (comptes TikTok Business, publication directe)
export const SOUND_PLATFORMS = ["instagram", "tiktok"];
// Volumes proposés à l'ajout d'un son (exemple de la doc Meta, proche des
// 50/50 par défaut de l'appli TikTok)
export const DEFAULT_SOUND_VOLUME = 80;
export const DEFAULT_VIDEO_SOUND_VOLUME = 50;
export const TIKTOK_PUBLIC_PRIVACY = "PUBLIC_TO_EVERYONE";

export const STORY_UNAVAILABLE_MESSAGE =
  "Les stories ne sont disponibles que pour les comptes connectés directement.";
export const TIKTOK_DRAFT_RECONNECT_MESSAGE =
  "Reconnectez votre compte TikTok pour envoyer en brouillon.";

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

// ── Format, son et brouillon ─────────────────────────────────────────────

/**
 * Format d'un réseau pour tout le post : "story" (Instagram et Facebook
 * seulement) ou "post" (défaut).
 * @param {{ instagram?: string, facebook?: string }} formats
 */
export function getPostFormat(formats, platform) {
  return STORY_PLATFORMS.includes(platform) && formats?.[platform] === "story"
    ? "story"
    : "post";
}

export function isStoryFormat(formats, platform) {
  return getPostFormat(formats, platform) === "story";
}

/**
 * Réseaux dont le texte est publié, donc compté : ni une story (les API
 * n'ont pas de légende pour les stories), ni TikTok pour une vidéo envoyée
 * en brouillon (le texte n'est pas transmis, le client l'écrit dans TikTok).
 */
export function getTextPlatforms(
  platforms,
  { formats, tiktokMode, video = false } = {},
) {
  return uniquePlatforms(platforms).filter((platform) => {
    if (isStoryFormat(formats, platform)) return false;
    return !(platform === "tiktok" && tiktokMode === "draft" && video);
  });
}

/** Compte qui peut publier des stories (Instagram et Facebook en direct) */
export function canAccountPostStory(account) {
  return !!account?.capabilities?.stories;
}

/** Compte qui accepte un son tendance (Instagram via Facebook, TikTok Business) */
export function canAccountUseSound(account) {
  return !!account?.capabilities?.sounds;
}

/** Compte TikTok connecté par TikTok Business */
export function isTikTokBusinessAccount(account) {
  return account?.platform === "tiktok" && account?.connector === "business";
}

/**
 * Le média et le format permettent-ils un son tendance sur ce réseau ?
 * Instagram : un Reel (une vidéo, format « Publication »), ni photo, ni
 * carrousel, ni story. TikTok : vidéo ou photos en publication directe (en
 * brouillon, le client choisit le son dans TikTok).
 */
export function isSoundAllowed(
  platform,
  { media = [], formats, tiktokMode } = {},
) {
  const videos = (media || []).filter(isVideoMedia).length;
  const images = (media || []).length - videos;
  if (platform === "instagram") {
    return !isStoryFormat(formats, "instagram") && videos === 1 && !images;
  }
  if (platform === "tiktok") {
    return tiktokMode !== "draft" && videos + images > 0;
  }
  return false;
}

/**
 * Réseaux du post où un son tendance est possible : au moins un compte
 * compatible choisi et un média qui s'y prête. `account` : compte dont on
 * lit les sons ; `partial` : d'autres comptes du réseau publieront sans son.
 * @returns {Array<{ platform: string, account: object, partial: boolean }>}
 */
export function getSoundTargets(accounts, options = {}) {
  return SOUND_PLATFORMS.flatMap((platform) => {
    const list = (accounts || []).filter((a) => a?.platform === platform);
    const compatible = list.filter(canAccountUseSound);
    if (compatible.length === 0 || !isSoundAllowed(platform, options)) {
      return [];
    }
    return [
      {
        platform,
        account: compatible[0],
        partial: compatible.length < list.length,
      },
    ];
  });
}

/** Mention quand d'autres comptes du réseau publieront sans le son */
export const SOUND_PARTIAL_MESSAGES = {
  instagram:
    "Le son sera ajouté uniquement aux comptes connectés via Facebook.",
  tiktok: "Le son sera ajouté uniquement aux comptes TikTok Business.",
};

/**
 * Envoi TikTok en brouillon pour les comptes choisis. `available` : chaque
 * compte TikTok a l'autorisation (video.upload) ; `needsReconnect` : un
 * compte l'aurait après une reconnexion ; `offered` : choix à montrer.
 */
export function getTikTokDraftAvailability(accounts) {
  const tiktok = (accounts || []).filter((a) => a?.platform === "tiktok");
  const ready = tiktok.filter((a) => a.capabilities?.drafts);
  const needsReconnect = tiktok.some(
    (a) => !a.capabilities?.drafts && a.capabilities?.draftsNeedReconnect,
  );
  return {
    available: tiktok.length > 0 && ready.length === tiktok.length,
    needsReconnect,
    offered: ready.length > 0 || needsReconnect,
  };
}

// Tolérance d'arrondi du format vertical (1080 × 1920 = 0,5625 pile)
const STORY_RATIO_TOLERANCE = 0.02;

/** Média vertical au format d'une story (9:16, ou plus haut) ; inconnu : oui */
export function isStoryRatio(width, height) {
  if (!width || !height) return true;
  return width / height <= 9 / 16 + STORY_RATIO_TOLERANCE;
}

/** Conseils d'une story (jamais bloquants), dans l'ordre d'affichage */
export function getStoryHints(media = []) {
  const hints = ["Le texte n'apparaît pas dans une story."];
  const images = (media || []).filter((m) => !isVideoMedia(m));
  if (images.length > 1) {
    hints.push("Plusieurs photos donnent plusieurs stories à la suite.");
  }
  if ((media || []).some((m) => !isStoryRatio(m?.width, m?.height))) {
    hints.push("Format vertical 9:16 conseillé.");
  }
  return hints;
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
 * Titre d'une vidéo TikTok : unités UTF-16 (un emoji compte souvent deux).
 * Autres réseaux : nombre de caractères (un emoji compte pour un).
 */
export function countPostLength(text, platform, { video = false } = {}) {
  const value = text || "";
  if (platform === "tiktok" && video) return value.length;
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
 * reste le moins de caractères (ex. « 245 / 280 (X) »). `video` : le post
 * contient une vidéo (titre TikTok limité à 2 200 caractères).
 * @returns {{ platform: string, label: string, count: number, max: number, remaining: number, over: boolean } | null}
 */
export function getTextLimit(text, platforms, { video = false } = {}) {
  let worst = null;
  for (const platform of uniquePlatforms(platforms)) {
    const rules = PLATFORM_RULES[platform];
    const max = (video && rules.video?.maxLength) || rules.maxLength;
    const count = countPostLength(text, platform, { video });
    const remaining = max - count;
    if (!worst || remaining < worst.remaining) {
      worst = {
        platform,
        label: rules.label,
        count,
        max,
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

// ── Vidéo ────────────────────────────────────────────────────────────────

/** Média vidéo (les images n'ont pas de `kind` ou valent "image") */
export function isVideoMedia(item) {
  return item?.kind === "video";
}

function fileExtension(name) {
  const match = /\.([a-z0-9]+)$/i.exec(name || "");
  return match ? match[1].toLowerCase() : "";
}

/** Le fichier ressemble-t-il à une vidéo (pour trier un glisser-déposer) ? */
export function isVideoFile(file) {
  const type = (file?.type || "").toLowerCase();
  return (
    type.startsWith("video/") ||
    !!VIDEO_TYPES_BY_EXTENSION[fileExtension(file?.name)]
  );
}

/**
 * Type MIME accepté pour l'envoi (d'après le type du navigateur, sinon
 * l'extension), ou null si le format n'est pas accepté.
 */
export function getVideoContentType(file) {
  const type = (file?.type || "").toLowerCase().split(";")[0].trim();
  if (ACCEPTED_VIDEO_TYPES.includes(type)) return type;
  // Type absent ou générique (certains navigateurs) : l'extension tranche
  if (type && type !== "application/octet-stream") return null;
  return VIDEO_TYPES_BY_EXTENSION[fileExtension(file?.name)] || null;
}

/**
 * Durée lisible : « 45 s », « 2 min 20 », « 3 min 05 », « 10 min ».
 * `round` : "up" pour une durée trop longue (2 min 20,4 → 2 min 21),
 * "down" pour une durée trop courte (2,9 s → 2 s).
 */
export function formatVideoDuration(ms, { round = "up" } = {}) {
  if (!Number.isFinite(ms) || ms < 0) return "";
  const totalSeconds =
    round === "down" ? Math.floor(ms / 1000) : Math.ceil(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds} s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds ? `${minutes} min ${pad(seconds)}` : `${minutes} min`;
}

/** Poids lisible en unités décimales : « 75 Ko », « 300 Mo », « 1 Go », « 1,5 Go » */
export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  const format = (value) =>
    String(Math.round(value * 10) / 10).replace(".", ",");
  if (bytes >= DECIMAL_GB) return `${format(bytes / DECIMAL_GB)} Go`;
  if (bytes >= DECIMAL_MB) return `${format(bytes / DECIMAL_MB)} Mo`;
  return `${Math.max(1, Math.ceil(bytes / DECIMAL_KB))} Ko`;
}

function globalDurationError(durationMs) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return null;
  if (durationMs < MIN_VIDEO_DURATION_MS) {
    return {
      code: "video_too_short",
      message: `La vidéo doit durer au moins 3 secondes (elle dure ${formatVideoDuration(durationMs, { round: "down" })}).`,
    };
  }
  if (durationMs > MAX_VIDEO_DURATION_MS) {
    return {
      code: "video_too_long",
      message: `La vidéo doit durer 10 minutes au maximum (elle dure ${formatVideoDuration(durationMs)}).`,
    };
  }
  return null;
}

/**
 * Contrôles d'un fichier vidéo avant son envoi : format, poids (500 Mo) et
 * durée (3 secondes à 10 minutes) quand le navigateur a pu la lire.
 * @returns {string|null} message à afficher, ou null
 */
export function checkVideoFile(file, { durationMs } = {}) {
  const name = file?.name || "La vidéo";
  if (!getVideoContentType(file)) {
    return `« ${name} » n'est pas une vidéo MP4, MOV, M4V ou WebM.`;
  }
  if (!file.size) return `« ${name} » est vide.`;
  if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
    return `« ${name} » dépasse 500 Mo.`;
  }
  return globalDurationError(durationMs)?.message || null;
}

/**
 * Limites de la vidéo pour les réseaux choisis. La durée est connue dès la
 * lecture du fichier ; le poids n'est contrôlé qu'une fois la vidéo
 * préparée par le serveur (`status` "ready"), c'est lui que reçoit le réseau.
 * @param {{ durationMs?: number, size?: number, status?: string }} video
 * @param {string[]} platforms
 * @param {{ tiktokMaxDurationSec?: number|null, formats?: object }} [options]
 *   durée maximale du compte TikTok (creator_info, null si inconnue) et
 *   format par réseau (limites d'une story pour Instagram et Facebook)
 * @returns {Array<{ code: string, message: string }>}
 */
export function getVideoErrors(
  video,
  platforms,
  { tiktokMaxDurationSec, formats } = {},
) {
  const errors = [];
  if (!video) return errors;
  const selected = uniquePlatforms(platforms);
  const durationMs = Number(video.durationMs);
  const knownDuration = Number.isFinite(durationMs) && durationMs > 0;
  const limitsFor = (platform) => {
    const rules = PLATFORM_RULES[platform];
    return (
      (isStoryFormat(formats, platform) ? rules.story?.video : rules.video) ||
      {}
    );
  };

  const globalError = knownDuration ? globalDurationError(durationMs) : null;
  if (globalError) {
    errors.push(globalError);
  } else if (knownDuration) {
    for (const platform of selected) {
      const rules = PLATFORM_RULES[platform];
      const story = isStoryFormat(formats, platform);
      const limits = limitsFor(platform);
      const max =
        platform === "tiktok" && tiktokMaxDurationSec > 0
          ? tiktokMaxDurationSec * 1000
          : limits.maxDurationMs;
      if (max && durationMs > max) {
        let message = `${rules.label} accepte des vidéos de ${formatVideoDuration(max)} au maximum (cette vidéo dure ${formatVideoDuration(durationMs)}).`;
        if (platform === "tiktok") {
          message = `TikTok accepte des vidéos de ${formatVideoDuration(max)} au maximum pour ce compte (cette vidéo dure ${formatVideoDuration(durationMs)}).`;
        } else if (story) {
          // « 60 s » plutôt que « 1 min » (limite annoncée par les réseaux)
          message = `${rules.label} accepte des stories vidéo de ${Math.round(max / 1000)} s au maximum (cette vidéo dure ${formatVideoDuration(durationMs)}).`;
        }
        errors.push({ code: "video_too_long", message });
      } else if (limits.minDurationMs && durationMs < limits.minDurationMs) {
        errors.push({
          code: "video_too_short",
          message: `${rules.label} exige une vidéo d'au moins ${formatVideoDuration(limits.minDurationMs, { round: "down" })}.`,
        });
      }
    }
  }

  const size = Number(video.size);
  if (video.status === "ready" && Number.isFinite(size) && size > 0) {
    for (const platform of selected) {
      const rules = PLATFORM_RULES[platform];
      const { maxBytes, minBytes } = limitsFor(platform);
      if (maxBytes && size > maxBytes) {
        const target = isStoryFormat(formats, platform)
          ? `une story ${rules.label}`
          : rules.label;
        errors.push({
          code: "video_too_heavy",
          message: `La vidéo est trop lourde pour ${target} (${formatFileSize(maxBytes)} maximum après préparation).`,
        });
      } else if (minBytes && size < minBytes) {
        errors.push({
          code: "video_too_light",
          message: `La vidéo est trop légère pour ${rules.label} (${formatFileSize(minBytes)} minimum).`,
        });
      }
    }
  }
  return errors;
}

export const VIDEO_NOT_READY_MESSAGE =
  "La vidéo est encore en préparation. Patientez quelques instants.";
export const VIDEO_FAILED_MESSAGE =
  "La vidéo n'a pas pu être préparée. Retirez-la et réessayez.";

/**
 * Contrôles avant envoi. Chaque erreur est rattachée à une partie du
 * formulaire (`field`) pour être affichée au bon endroit.
 *
 * @param {object} input
 * @param {string[]} input.platforms réseaux des comptes choisis
 * @param {Array<{ platform: string, connector?: string|null, capabilities?: object }>} [input.accounts]
 *   comptes choisis : stories, brouillons et TikTok Business contrôlés
 *   seulement quand ils sont fournis
 * @param {number} input.accountCount nombre de comptes choisis
 * @param {string} input.content
 * @param {Array<{ kind?: string, status?: string, width?: number, height?: number, durationMs?: number, size?: number, errorMessage?: string }>} input.media
 *   images téléversées, ou une vidéo (`kind` "video", même en cours
 *   d'envoi ou de préparation : `status` autre que "ready")
 * @param {{ instagram?: string, facebook?: string }} [input.formats]
 *   "post" (défaut) ou "story" par réseau
 * @param {boolean} [input.publishNow]
 * @param {string|null} [input.scheduledFor] ISO UTC
 * @param {Date} [input.now]
 * @param {{ mode?: string, privacyLevel?: string, canPostMore?: boolean, commercial?: boolean, brandOrganic?: boolean, brandContent?: boolean, maxVideoDurationSec?: number|null }} [input.tiktok]
 *   (l'accord à la confirmation d'utilisation de la musique est donné en
 *   publiant : phrase de déclaration au-dessus du bouton, exigée par TikTok ;
 *   en brouillon, TikTok demande tout dans l'appli)
 * @returns {Array<{ field: "accounts"|"format"|"content"|"media"|"when"|"tiktok", code: string, message: string }>}
 */
export function validateSocialPost({
  platforms = [],
  accounts,
  accountCount,
  content = "",
  media = [],
  formats = {},
  publishNow = false,
  scheduledFor = null,
  now = new Date(),
  tiktok = {},
}) {
  const errors = [];
  const selected = uniquePlatforms(platforms);
  const count = accountCount ?? platforms.length;
  const stories = selected.filter((p) => isStoryFormat(formats, p));
  const tiktokDraft = tiktok.mode === "draft";

  if (count === 0) {
    errors.push({
      field: "accounts",
      code: "no_account",
      message: "Choisissez au moins un compte.",
    });
  }

  const hasText = (content || "").trim().length > 0;
  const videos = media.filter(isVideoMedia);
  const images = media.filter((item) => !isVideoMedia(item));
  const imageCount = images.length;

  if (!hasText && media.length === 0) {
    errors.push({
      field: "content",
      code: "empty",
      message: "Écrivez un texte ou ajoutez une image.",
    });
  }

  // Story (pas de texte affiché) et vidéo TikTok en brouillon (texte non
  // transmis) : pas de limite pour ce réseau
  const textLimit = getTextLimit(
    content,
    getTextPlatforms(selected, {
      formats,
      tiktokMode: tiktok.mode,
      video: videos.length > 0,
    }),
    { video: videos.length > 0 },
  );
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

  if (videos.length > 0 && imageCount > 0) {
    errors.push({
      field: "media",
      code: "media_mixed",
      message:
        "Un post contient soit des photos, soit une vidéo, pas les deux.",
    });
  } else if (videos.length > 1) {
    errors.push({
      field: "media",
      code: "too_many_videos",
      message: "Une seule vidéo par post.",
    });
  }

  // Story : message propre au réseau (« Une story Instagram exige… »)
  const requiring = getPlatformsRequiringImage(selected).filter(
    (p) => !stories.includes(p),
  );
  if (requiring.length > 0 && media.length === 0) {
    const labels = joinLabels(requiring.map(getPlatformLabel));
    errors.push({
      field: "media",
      code: "image_required",
      message: `${labels} ${requiring.length > 1 ? "exigent" : "exige"} une image ou une vidéo.`,
    });
  }
  if (media.length === 0) {
    for (const platform of stories) {
      errors.push({
        field: "media",
        code: "story_media_required",
        message: `Une story ${getPlatformLabel(platform)} exige une photo ou une vidéo.`,
      });
    }
  }

  // Story visée sur un compte qui ne la permet pas (compte Zernio)
  if (
    accounts &&
    stories.some((platform) =>
      accounts.some((a) => a?.platform === platform && !canAccountPostStory(a)),
    )
  ) {
    errors.push({
      field: "format",
      code: "story_unavailable",
      message: STORY_UNAVAILABLE_MESSAGE,
    });
  }

  const video = videos[0];
  if (video?.status === "failed") {
    errors.push({
      field: "media",
      code: "video_failed",
      message: video.errorMessage || VIDEO_FAILED_MESSAGE,
    });
  } else if (video) {
    // En brouillon, la durée maximale du compte (creator_info) ne compte pas
    for (const error of getVideoErrors(video, selected, {
      tiktokMaxDurationSec: tiktokDraft ? null : tiktok.maxVideoDurationSec,
      formats,
    })) {
      errors.push({ field: "media", ...error });
    }
    // Envoi ou préparation en cours : le bouton attend la vidéo prête
    if (video.status && video.status !== "ready") {
      errors.push({
        field: "media",
        code: "video_not_ready",
        message: VIDEO_NOT_READY_MESSAGE,
      });
    }
  }

  // Story : pas de contrôle du format des photos (9:16 seulement conseillé)
  if (selected.includes("instagram") && !stories.includes("instagram")) {
    const invalid = imagePositions(images, (m) =>
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
    const invalid = imagePositions(images, (m) =>
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

  // Brouillon : confidentialité, interactions et divulgation se choisissent
  // dans l'appli TikTok, seule l'autorisation d'envoi compte
  if (selected.includes("tiktok") && tiktokDraft) {
    if (accounts && !getTikTokDraftAvailability(accounts).available) {
      errors.push({
        field: "tiktok",
        code: "tiktok_draft_unavailable",
        message: TIKTOK_DRAFT_RECONNECT_MESSAGE,
      });
    }
  } else if (selected.includes("tiktok")) {
    // L'API Business n'a pas de confidentialité pour une vidéo : publique
    if (
      videos.length > 0 &&
      tiktok.privacyLevel &&
      tiktok.privacyLevel !== TIKTOK_PUBLIC_PRIVACY &&
      (accounts || []).some(isTikTokBusinessAccount)
    ) {
      errors.push({
        field: "tiktok",
        code: "tiktok_business_public",
        message:
          "Avec un compte TikTok Business, une vidéo est toujours publique : choisissez « Tout le monde ».",
      });
    }
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
    // Divulgation du contenu commercial (consignes TikTok) : au moins une
    // case une fois activée, et pas de contenu de marque privé
    if (tiktok.commercial && !tiktok.brandOrganic && !tiktok.brandContent) {
      errors.push({
        field: "tiktok",
        code: "tiktok_commercial",
        message:
          "Indiquez si le post fait la promotion de votre marque, d'un tiers, ou des deux.",
      });
    }
    if (
      tiktok.commercial &&
      tiktok.brandContent &&
      tiktok.privacyLevel === "SELF_ONLY"
    ) {
      errors.push({
        field: "tiktok",
        code: "tiktok_branded_private",
        message:
          "Le contenu de marque ne peut pas être visible par vous seul sur TikTok.",
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

export const TIKTOK_DRAFT_DELIVERED_LABEL = "Envoyé en brouillon TikTok";

/** Cible terminée par un envoi dans les brouillons TikTok */
export function isDeliveredAsDraft(target) {
  return target?.deliveredAs === "draft";
}

/**
 * Libellé et ton du statut global d'un post. `targets` : un post dont toutes
 * les cibles sont parties en brouillon TikTok n'est pas « Publié ».
 * tone : scheduled | progress | success | warning | error | muted
 */
export function getPostStatusInfo(status, scheduledFor, targets) {
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
      if (targets?.length > 0 && targets.every(isDeliveredAsDraft)) {
        return { label: TIKTOK_DRAFT_DELIVERED_LABEL, tone: "success" };
      }
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
export function getTargetStatusInfo(status, target) {
  switch (status) {
    case "published":
      return isDeliveredAsDraft(target)
        ? { label: TIKTOK_DRAFT_DELIVERED_LABEL, tone: "success" }
        : { label: "Publié", tone: "success" };
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

/**
 * Mention du format d'une cible : « Story », « 3 stories » (stories déjà
 * publiées), null pour une publication.
 */
export function getTargetFormatLabel(post, target) {
  const settings =
    target?.platform === "instagram"
      ? post?.instagramSettings
      : target?.platform === "facebook"
        ? post?.facebookSettings
        : null;
  if (settings?.format !== "story") return null;
  return target.storyCount > 1 ? `${target.storyCount} stories` : "Story";
}

/** Son choisi pour un réseau du post (Instagram ou TikTok), null sinon */
export function getPostSound(post, platform) {
  if (platform === "instagram") return post?.instagramSettings?.sound || null;
  if (platform === "tiktok") return post?.tiktokSettings?.sound || null;
  return null;
}

/** « Titre · Artiste » (artiste absent : le titre seul) */
export function formatSoundLabel(sound) {
  if (!sound?.title) return "";
  return sound.artist ? `${sound.title} · ${sound.artist}` : sound.title;
}

const POLL_WINDOW_MS = 15 * 60 * 1000;
const TIKTOK_URL_WAIT_MS = 60 * 60 * 1000;

/**
 * Faut-il rafraîchir les posts du tableau ? Oui tant qu'un post est en
 * cours de publication, programmé dans moins de 15 minutes (ou en retard),
 * ou publié sur TikTok depuis moins d'une heure sans lien (TikTok le donne
 * quelques minutes après ; un brouillon n'en a jamais).
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
        if (t.platformPostUrl || isDeliveredAsDraft(t)) return false;
        const at = toValidDate(t.publishedAt) || toValidDate(post.scheduledFor);
        return !!at && nowMs - at.getTime() <= TIKTOK_URL_WAIT_MS;
      });
    }
    return false;
  });
}

// ── Connexion des comptes ────────────────────────────────────────────────

/**
 * Connexions autres que celle habituelle du réseau (clé de SocialConnector).
 * connector : valeur de SocialAccount.connector ; mention : affichée à côté
 * du compte ; description : aide du bouton (texte du cahier des charges,
 * prioritaire sur celui de l'API).
 */
const SOCIAL_CONNECTORS = {
  instagram_facebook: {
    platform: "instagram",
    connector: "facebook",
    label: "Instagram via Facebook",
    mention: "via Facebook",
    description:
      "Permet d'ajouter un son tendance aux Reels. Le compte doit être relié à une Page Facebook.",
  },
  tiktok_business: {
    platform: "tiktok",
    connector: "business",
    label: "TikTok Business",
    mention: "Business",
    description: "Permet d'ajouter un son tendance.",
  },
};

/** Réseau d'une clé de connecteur (« tiktok_business » → « tiktok ») */
export function getConnectorPlatform(key) {
  return SOCIAL_CONNECTORS[key]?.platform || key || null;
}

/** Libellé d'une clé de connecteur ou d'un réseau */
export function getConnectorLabel(key) {
  return (
    SOCIAL_CONNECTORS[key]?.label || getPlatformLabel(getConnectorPlatform(key))
  );
}

/** Phrase d'aide d'un connecteur, null s'il n'en a pas */
export function getConnectorDescription(connector) {
  return (
    SOCIAL_CONNECTORS[connector?.key]?.description ||
    connector?.description ||
    null
  );
}

function connectorEntryOf(account) {
  return Object.entries(SOCIAL_CONNECTORS).find(
    ([, entry]) =>
      entry.platform === account?.platform &&
      entry.connector === account?.connector,
  );
}

/** Clé du connecteur d'un compte, pour le reconnecter par le même chemin */
export function getAccountConnectorKey(account) {
  return connectorEntryOf(account)?.[0] || account?.platform || null;
}

/** Mention du mode de connexion d'un compte : « via Facebook », « Business » */
export function getAccountConnectorMention(account) {
  return connectorEntryOf(account)?.[1].mention || null;
}

/**
 * Connecteurs proposés (socialPublishingStatus.connectors), dans l'ordre
 * des réseaux. API sans connecteurs : un par réseau connectable.
 * @returns {Array<{ key: string, platform: string, label: string, description: string|null }>}
 */
export function normalizeConnectors(connectors, platforms) {
  if (!Array.isArray(connectors)) {
    return uniquePlatforms(platforms).map((platform) => ({
      key: platform,
      platform,
      label: getPlatformLabel(platform),
      description: null,
    }));
  }
  const valid = connectors.filter(
    (c) => c?.key && SOCIAL_PLATFORMS.includes(c.platform),
  );
  return SOCIAL_PLATFORMS.flatMap((platform) =>
    valid
      .filter((c) => c.platform === platform)
      .map((c) => ({
        key: c.key,
        platform,
        label: c.label || getConnectorLabel(c.key),
        description: getConnectorDescription(c),
      })),
  );
}

/**
 * Message du retour de connexion en échec (?social_error=<code>).
 * Code inconnu : message générique (Zernio ajoute des codes sans prévenir).
 * `platform` : réseau ou clé de connecteur.
 */
export function getSocialConnectErrorMessage(code, platform) {
  const label =
    PLATFORM_RULES[getConnectorPlatform(platform)]?.label || "ce réseau";
  switch (code) {
    case "no_instagram_account":
      return "Aucun compte Instagram professionnel n'est relié à vos Pages Facebook.";
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
    case "no_account":
      return `Aucun compte ${label} n'a été autorisé. Recommencez en choisissant le compte à utiliser.`;
    case "account_in_use":
      return `Ce compte ${label} est déjà connecté à un autre espace Newbi. Déconnectez-le de cet espace d'abord.`;
    case "unavailable":
      return `La connexion à ${label} n'est pas disponible pour le moment.`;
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
