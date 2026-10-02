/**
 * Vérifications légères des liens et adresses saisis, pour prévenir avant
 * d'installer une signature aux liens cassés. Rien n'est bloqué : le
 * message s'affiche sous le champ. Les conversions (nom de compte, numéro
 * WhatsApp, appel ou e-mail du bouton) sont celles du rendu de l'API
 * (signatureRenderer/primitives.js) : le lien affiché sous un champ est
 * celui qui partira dans les e-mails.
 */

/**
 * Réseaux : domaines acceptés (le premier sert d'exemple), exemple de
 * saisie, et lien d'un profil d'après son nom de compte ({h}) quand le nom
 * seul suffit (ni LinkedIn ni Malt, où il est ambigu, ni WhatsApp, qui
 * attend un numéro).
 */
const NETWORKS = {
  linkedin: {
    hosts: ["linkedin.com", "lnkd.in"],
    example: "linkedin.com/in/votre-nom",
  },
  x: {
    hosts: ["x.com", "twitter.com"],
    example: "@votre-compte",
    handle: "https://x.com/{h}",
  },
  instagram: {
    hosts: ["instagram.com", "instagr.am"],
    example: "@votre-compte",
    handle: "https://www.instagram.com/{h}",
  },
  facebook: {
    hosts: ["facebook.com", "fb.com", "fb.me"],
    example: "facebook.com/votre-page",
    handle: "https://www.facebook.com/{h}",
  },
  youtube: {
    hosts: ["youtube.com", "youtu.be"],
    example: "youtube.com/@votre-chaine",
    handle: "https://www.youtube.com/@{h}",
  },
  tiktok: {
    hosts: ["tiktok.com"],
    example: "@votre-compte",
    handle: "https://www.tiktok.com/@{h}",
  },
  github: {
    hosts: ["github.com"],
    example: "github.com/votre-compte",
    handle: "https://github.com/{h}",
  },
  whatsapp: { hosts: ["wa.me", "whatsapp.com"], example: "06 12 34 56 78" },
  pinterest: {
    hosts: ["pinterest.com", "pinterest.fr", "pin.it"],
    example: "pinterest.com/votre-compte",
    handle: "https://www.pinterest.com/{h}",
  },
  threads: {
    hosts: ["threads.net", "threads.com"],
    example: "@votre-compte",
    handle: "https://www.threads.net/@{h}",
  },
  telegram: {
    hosts: ["t.me", "telegram.me"],
    example: "@votre-compte",
    handle: "https://t.me/{h}",
  },
  malt: { hosts: ["malt.fr", "malt.com"], example: "malt.fr/profile/votre-nom" },
  calendly: {
    hosts: ["calendly.com"],
    example: "calendly.com/votre-nom",
    handle: "https://calendly.com/{h}",
  },
  dribbble: {
    hosts: ["dribbble.com"],
    example: "dribbble.com/votre-compte",
    handle: "https://dribbble.com/{h}",
  },
  behance: {
    hosts: ["behance.net"],
    example: "behance.net/votre-compte",
    handle: "https://www.behance.net/{h}",
  },
  medium: {
    hosts: ["medium.com"],
    example: "medium.com/@votre-compte",
    handle: "https://medium.com/@{h}",
  },
};

/** Domaine d'une adresse saisie, sans « www. » ; vide si illisible. */
export function hostOf(value) {
  const v = String(value || "").trim();
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function pathOf(value) {
  const v = String(value || "").trim();
  try {
    return new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`).pathname;
  } catch {
    return "";
  }
}

/** Complète une adresse saisie sans protocole, comme le rendu. */
function normalizeUrl(value) {
  const url = String(value || "").trim();
  if (!url || url === "#" || /^javascript:/i.test(url)) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return `https://${url}`;
}

/**
 * Numéros nationaux des pays proposés pour l'espace : indicatif et forme
 * d'un numéro complet, comme le rendu.
 */
const NATIONAL_NUMBERS = {
  FR: { code: "33", form: /^0[1-9]\d{8}$/ },
  BE: { code: "32", form: /^0(?:[1-9]\d{7}|4[5-9]\d{7})$/ },
  CH: { code: "41", form: /^0[1-9]\d{8}$/ },
  LU: { code: "352", form: /^(?:6[2-9][18]\d{6}|2\d{7})$/ },
};

/** Pays de l'espace (en toutes lettres) → région des numéros, ou "". */
export function phoneRegion(country) {
  const key = String(country || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  const REGIONS = {
    france: "FR",
    fr: "FR",
    belgique: "BE",
    belgium: "BE",
    be: "BE",
    suisse: "CH",
    switzerland: "CH",
    ch: "CH",
    luxembourg: "LU",
    lu: "LU",
  };
  return REGIONS[key] || "";
}

/**
 * Numéro composé par un lien d'appel : du premier chiffre au premier mot
 * (« poste 12 »), sans « (0) » après l'indicatif, « 00 » → « + », numéro
 * national en international selon la région.
 */
function telNumber(value, region = "") {
  const raw = String(value || "");
  const start = raw.search(/[+\d]/);
  if (start < 0) return "";
  let v = raw.slice(start);
  const stop = v.search(/[A-Za-zÀ-ÿ#;,]/);
  if (stop >= 0) v = v.slice(0, stop);
  v = v.replace(/^(\+|00)\s*(\d{1,3})\s*\(0\)/, "$1$2");
  const digits = v.replace(/[^\d+]/g, "");
  const cleaned = digits.charAt(0) + digits.slice(1).replace(/\+/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  const n = NATIONAL_NUMBERS[region];
  return n && n.form.test(cleaned)
    ? `+${n.code}${cleaned.replace(/^0/, "")}`
    : cleaned;
}

/** Valeur saisie qui est un numéro de téléphone (6 chiffres au moins). */
export function isPhoneNumber(value) {
  const v = String(value || "").trim();
  if (!/^\+?[\d\s.\-()]+$/.test(v)) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v)) return false;
  return v.replace(/\D/g, "").length >= 6;
}

const EMAIL_ADDRESS = /^[^\s@/:]+@[^\s@/]+\.[^\s@/]+$/;
const HANDLE = /^@([A-Za-z0-9._-]+)$|^([A-Za-z0-9_-]+)$/;
const WHATSAPP_NUMBER =
  /^(?:https?:\/\/)?(?:www\.)?wa\.me\/(\+?[\d\s.\-()]+)(\?.*)?$/i;
const LINKEDIN_PROFILE = /^\/(in|company|school|showcase|pub)\/[^/]+/i;

/** Lien d'un réseau tel que le rendu l'écrira (nom de compte, numéro…). */
export function socialLink(network, value, region = "") {
  const v = String(value || "").trim();
  if (!v) return "";
  if (network === "whatsapp") {
    const wa = v.match(WHATSAPP_NUMBER);
    if (wa || isPhoneNumber(v)) {
      const number = wa ? wa[1] : v;
      let tel = telNumber(number, region);
      if (!tel.startsWith("+")) tel = telNumber(number, "FR");
      const digits = tel.replace(/^\+/, "");
      return digits ? `https://wa.me/${digits}${wa?.[2] || ""}` : "";
    }
  }
  const handle = v.match(HANDLE);
  const pattern = NETWORKS[network]?.handle;
  if (handle && pattern) return pattern.replace("{h}", handle[1] || handle[2]);
  return normalizeUrl(v);
}

/**
 * Lien réellement produit, quand il diffère de ce qui a été saisi (nom de
 * compte, numéro WhatsApp) : affiché sous le champ, sans « https:// ».
 */
export function socialLinkPreview(network, value, region = "") {
  const v = String(value || "").trim();
  const href = socialLink(network, v, region);
  if (!href || href === normalizeUrl(v)) return null;
  return href.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
}

/** Exemple de saisie d'un réseau, pour son champ. */
export function networkExample(network) {
  return NETWORKS[network]?.example || "votre-profil";
}

/** Numéro WhatsApp national : le pays de l'espace est supposé. */
export function whatsappNational(value) {
  const v = String(value || "").trim();
  const wa = v.match(WHATSAPP_NUMBER);
  const number = wa ? wa[1] : isPhoneNumber(v) ? v : "";
  return Boolean(number) && !/^\s*(\+|00)/.test(number);
}

/** Problème d'un lien web, ou null. `required` : un lien vide est signalé. */
export function linkProblem(value, { required = false } = {}) {
  const v = String(value || "").trim();
  if (!v) return required ? "Ajoutez un lien." : null;
  if (/\s/.test(v)) return "Un lien ne contient pas d'espace.";
  const host = hostOf(v);
  if (!host || !host.includes(".") || host.endsWith(".")) {
    return "Ce lien semble incomplet (exemple : votre-site.fr).";
  }
  return null;
}

/**
 * Problème d'un lien de réseau social : adresse incomplète, autre site,
 * nom de compte mal saisi, lien LinkedIn ou TikTok qui ne mène à aucun
 * profil. Un nom de compte (« @atelier ») ou un numéro WhatsApp est
 * accepté : le rendu en fait le lien du profil.
 */
export function networkLinkProblem(value, network, label) {
  const v = String(value || "").trim();
  if (!v) return null;
  const n = NETWORKS[network];
  if (!n) return linkProblem(v);
  if (network === "whatsapp" && (v.match(WHATSAPP_NUMBER) || isPhoneNumber(v))) {
    return v.replace(/\D/g, "").length < 8 ? "Ce numéro semble incomplet." : null;
  }
  if (n.handle && HANDLE.test(v)) return null;
  const host = hostOf(v);
  if (
    /\s/.test(v) ||
    v.startsWith("@") ||
    !host ||
    !host.includes(".") ||
    host.endsWith(".")
  ) {
    if (network === "whatsapp") {
      return "Saisissez votre numéro ou un lien wa.me/…";
    }
    if (!n.handle) {
      return `Collez l'adresse de votre profil (exemple : ${n.example}).`;
    }
    return /\s/.test(v)
      ? "Un lien ne contient pas d'espace."
      : `Ce lien semble incomplet (exemple : ${n.example}).`;
  }
  if (!n.hosts.some((h) => host === h || host.endsWith(`.${h}`))) {
    // « atelier.nord » : un nom de compte à point, pas une adresse
    if (n.handle && /^[A-Za-z0-9._-]+$/.test(v)) {
      return `Pour un nom de compte, ajoutez @ devant (@${v}) ou collez le lien du profil.`;
    }
    if (network === "whatsapp") {
      return "Saisissez votre numéro ou un lien wa.me/…";
    }
    return `Ce lien ne ressemble pas à un profil ${label} (${n.hosts[0]}/…).`;
  }
  if (
    network === "linkedin" &&
    host !== "lnkd.in" &&
    !LINKEDIN_PROFILE.test(pathOf(v))
  ) {
    return "Un profil LinkedIn commence par linkedin.com/in/ (ou /company/ pour une page entreprise) : copiez le lien depuis votre profil.";
  }
  if (network === "tiktok" && /^\/[^@/][^/]*\/?$/.test(pathOf(v))) {
    return "Un profil TikTok s'écrit tiktok.com/@votre-compte.";
  }
  return null;
}

export function emailProblem(value) {
  const v = String(value || "").trim();
  if (!v) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    ? null
    : "Cette adresse e-mail semble incomplète.";
}

/** Bouton d'action activé sans texte : il n'apparaît pas. */
export function ctaLabelProblem(cta) {
  return cta?.enabled && !String(cta.label || "").trim()
    ? "Ajoutez le texte du bouton : sans lui, le bouton n'apparaît pas."
    : null;
}

/**
 * Ce que fera le bouton, comme le rendu : « tel » (un numéro lance un
 * appel), « mailto » (une adresse ouvre un e-mail) ou « web ».
 */
export function ctaLinkKind(url) {
  const v = String(url || "").trim();
  if (/^(tel|sms):/i.test(v) || isPhoneNumber(v)) return "tel";
  if (/^mailto:/i.test(v) || EMAIL_ADDRESS.test(v)) return "mailto";
  return "web";
}

/** Aide sous le lien du bouton : ce qu'il fera, ou ce qu'on peut saisir. */
export function ctaLinkHint(url) {
  const v = String(url || "").trim();
  if (!v) return "Une page web, un numéro de téléphone ou une adresse e-mail.";
  const shown = v.replace(/^(tel|sms|mailto):/i, "");
  const kind = ctaLinkKind(v);
  if (kind === "tel") return `Le bouton lancera un appel vers ${shown}.`;
  if (kind === "mailto") return `Le bouton ouvrira un e-mail vers ${shown}.`;
  return null;
}

/** Bouton d'action activé sans lien valide : il n'apparaît pas. */
export function ctaLinkProblem(cta) {
  const url = String(cta?.url || "").trim();
  if (!url) {
    return cta?.enabled
      ? "Ajoutez un lien : sans lui, le bouton n'apparaît pas."
      : null;
  }
  const kind = ctaLinkKind(url);
  if (kind === "tel") {
    return url.replace(/\D/g, "").length < 6
      ? "Ce numéro semble incomplet."
      : null;
  }
  if (kind === "mailto") {
    return emailProblem(url.replace(/^mailto:/i, "").split("?")[0]);
  }
  return linkProblem(url);
}

/**
 * Texte de remplacement automatique d'une bannière cliquable, comme le
 * rendu : « Bannière : » et le domaine de son lien.
 */
export function bannerAltFallback(url) {
  const v = String(url || "").trim();
  if (!v) return "";
  if (/^mailto:/i.test(v)) return `Bannière : ${v.slice(7).split("?")[0]}`;
  const host = /^[a-z][a-z0-9+.-]*:/i.test(v) && !/^https?:/i.test(v)
    ? ""
    : hostOf(v);
  return host ? `Bannière : ${host}` : "Bannière";
}
