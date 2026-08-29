/**
 * URL canonique du site. Une seule source de vérité pour metadataBase, les
 * canonicals, le sitemap et les données structurées.
 *
 * Le site est servi sur www.newbi.fr (l'apex redirige vers www) : le fallback
 * doit donc être en www, sinon les canonicals pointent vers une URL en
 * redirection et Google reçoit deux signaux contradictoires.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  "https://www.newbi.fr"
).replace(/\/+$/, "");

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
