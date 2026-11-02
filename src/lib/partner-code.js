/**
 * Code partenaire (?partner=) : gardé dans le navigateur de l'arrivée sur
 * le site jusqu'à l'inscription (90 jours), puis envoyé avec l'inscription.
 * Le serveur ne le garde que s'il appartient à un partenaire.
 */
const PARTNER_CODE_RE = /^[A-Za-z0-9_-]{4,64}$/;

export function normalizePartnerCode(raw) {
  if (typeof raw !== "string") return null;
  const code = raw.trim();
  return PARTNER_CODE_RE.test(code) ? code : null;
}

export const PARTNER_STORAGE_KEY = "newbi_partner_code";
const PARTNER_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

export function rememberPartnerCodeFromLocation() {
  if (typeof window === "undefined") return;
  const code = normalizePartnerCode(
    new URLSearchParams(window.location.search).get("partner"),
  );
  if (!code) return;
  try {
    localStorage.setItem(
      PARTNER_STORAGE_KEY,
      JSON.stringify({ code, capturedAt: Date.now() }),
    );
  } catch {
    // stockage indisponible
  }
}

export function readStoredPartnerCode() {
  if (typeof window === "undefined") return null;
  try {
    const data = JSON.parse(localStorage.getItem(PARTNER_STORAGE_KEY));
    if (
      !data?.capturedAt ||
      Date.now() - data.capturedAt > PARTNER_MAX_AGE_MS
    ) {
      localStorage.removeItem(PARTNER_STORAGE_KEY);
      return null;
    }
    return normalizePartnerCode(data.code);
  } catch {
    return null;
  }
}
