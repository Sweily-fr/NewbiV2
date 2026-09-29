/**
 * Vérifications légères des liens et adresses saisis, pour prévenir avant
 * d'installer une signature aux liens cassés. Rien n'est bloqué : le
 * message s'affiche sous le champ.
 */

/** Domaines acceptés pour chaque réseau (le premier sert d'exemple). */
const NETWORK_HOSTS = {
  linkedin: ["linkedin.com", "lnkd.in"],
  x: ["x.com", "twitter.com"],
  instagram: ["instagram.com", "instagr.am"],
  facebook: ["facebook.com", "fb.com", "fb.me"],
  youtube: ["youtube.com", "youtu.be"],
  tiktok: ["tiktok.com"],
  github: ["github.com"],
  whatsapp: ["wa.me", "whatsapp.com"],
  pinterest: ["pinterest.com", "pinterest.fr", "pin.it"],
  threads: ["threads.net", "threads.com"],
  telegram: ["t.me", "telegram.me"],
  malt: ["malt.fr", "malt.com"],
  calendly: ["calendly.com"],
  dribbble: ["dribbble.com"],
  behance: ["behance.net"],
  medium: ["medium.com"],
};

function hostOf(value) {
  const v = String(value || "").trim();
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
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

/** Problème d'un lien de réseau social (lien incomplet ou autre site). */
export function networkLinkProblem(value, network, label) {
  const basic = linkProblem(value);
  if (basic) return basic;
  const hosts = NETWORK_HOSTS[network];
  const host = hostOf(value);
  if (!hosts || !host) return null;
  const ok = hosts.some((h) => host === h || host.endsWith(`.${h}`));
  return ok
    ? null
    : `Ce lien ne ressemble pas à un profil ${label} (${hosts[0]}/…).`;
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

/** Bouton d'action activé sans lien valide : il n'apparaît pas. */
export function ctaLinkProblem(cta) {
  if (!cta?.enabled) return linkProblem(cta?.url);
  if (!String(cta.url || "").trim()) {
    return "Ajoutez un lien : sans lui, le bouton n'apparaît pas.";
  }
  return linkProblem(cta.url);
}
