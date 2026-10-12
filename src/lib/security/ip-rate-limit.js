/**
 * Limitation simple du nombre de requêtes par adresse IP, en mémoire (même
 * principe que la vérification du mot de passe d'un transfert côté API :
 * fenêtre glissante, N essais par IP).
 *
 * En mémoire = par instance serverless : c'est un frein, pas une garantie
 * absolue. Il suffit à rendre coûteuse l'énumération en masse.
 *
 * @param {{ windowMs: number, max: number }} options
 * @returns {(request: Request) => boolean} vrai si la requête dépasse la limite
 */
export function createIpRateLimiter({ windowMs, max }) {
  const hits = new Map();

  return function isRateLimited(request) {
    const ip = clientIp(request);
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      hits.set(ip, recent);
      return true;
    }
    recent.push(now);
    hits.set(ip, recent);

    // Ménage occasionnel des IP inactives
    if (hits.size > 5000) {
      for (const [key, times] of hits) {
        if (!times.some((t) => now - t < windowMs)) hits.delete(key);
      }
    }
    return false;
  };
}

/** Adresse IP du client (premier saut de x-forwarded-for, posé par Vercel). */
export function clientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
